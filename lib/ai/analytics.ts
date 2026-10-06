import { formatVnd } from "@/lib/format";
import {
  aiToolUsage,
  categorySales,
  conversionPercent,
  dailySales,
  daysOfStock,
  getPeak,
  getTotals,
  pharmacistHandoffs,
  reportPeriod,
  resolveProductSales,
  resolveStockAlerts,
} from "@/lib/data/sales";
import { thinkingDelay } from "./engine";

/**
 * Tầng "AI phân tích doanh số".
 *
 * Nguyên tắc quan trọng nhất của file này: MỌI con số trong câu nhận xét đều được
 * tính từ `lib/data/sales.ts`, không có số nào viết tay trong chuỗi. Một trang phân
 * tích mà câu nhận xét nói "tăng 19%" trong khi bảng bên dưới nói 17% thì người đọc
 * mất niềm tin vào cả hai, và họ không có cách nào biết bên nào sai.
 *
 * Vì thế mỗi `Insight` mang kèm `evidence`: đúng những con số AI đã dùng để viết ra
 * câu đó. Người quản lý đối chiếu được ngay, không phải tin suông.
 *
 * Đây là phân tích MÔ TẢ, không phải dự báo. AI không nói "tháng sau sẽ tăng" — dữ
 * liệu 14 ngày không đủ để nói câu đó, và một câu dự báo sai làm người ta nhập hàng sai.
 */

export type InsightKind = "tang-truong" | "canh-bao" | "van-hanh" | "an-toan";

export type Insight = {
  kind: InsightKind;
  title: string;
  body: string;
  /** Các con số AI đã dùng, để người đọc đối chiếu với bảng. */
  evidence: string[];
  /** Việc cụ thể nên làm. Không có thì để trống, không bịa cho đủ. */
  action?: string;
};

export type AnalyticsReport = {
  headline: string;
  insights: Insight[];
  confidence: number;
  limitations: string[];
};

function percentText(value: number) {
  // Dấu phẩy thập phân theo chuẩn Việt Nam, và luôn có dấu +/− để đọc nhanh.
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

function dayLabel(iso: string) {
  const [, month, day] = iso.split("-");
  return `${Number(day)}/${Number(month)}`;
}

export async function analyzeSales(): Promise<AnalyticsReport> {
  await thinkingDelay(1400);

  const totals = getTotals();
  const peak = getPeak();
  const topProducts = resolveProductSales();
  const alerts = resolveStockAlerts();

  const insights: Insight[] = [];

  // 1. Tăng trưởng tổng — luôn là nhận xét đầu tiên vì nó đặt bối cảnh cho phần còn lại.
  insights.push({
    kind: "tang-truong",
    title: `Doanh thu kỳ này ${percentText(totals.revenueChangePercent)} so với kỳ trước`,
    body: `Tổng ${formatVnd(totals.revenue)} từ ${totals.orders.toLocaleString("vi-VN")} đơn trong ${reportPeriod.days} ngày. Số đơn tăng ${percentText(totals.ordersChangePercent)}, chậm hơn mức tăng doanh thu — nghĩa là phần tăng đến từ giá trị mỗi đơn cao hơn, không chỉ từ việc có thêm đơn.`,
    evidence: [
      `Doanh thu ${formatVnd(totals.revenue)}`,
      `Đơn hàng ${totals.orders.toLocaleString("vi-VN")}`,
      `Trung bình mỗi đơn ${formatVnd(totals.averageOrderValue)}`,
    ],
  });

  // 2. Nhóm hàng dẫn dắt tăng trưởng.
  const leader = [...categorySales].sort((a, b) => b.changePercent - a.changePercent)[0];
  const falling = categorySales.filter((item) => item.changePercent < 0);
  insights.push({
    kind: "tang-truong",
    title: `“${leader.name}” là nhóm kéo tăng trưởng`,
    body: `Nhóm này đạt ${formatVnd(leader.revenue)} với ${leader.changePercent > 0 ? "mức tăng" : "mức giảm"} ${percentText(leader.changePercent)}. Đỉnh doanh thu rơi vào ngày ${dayLabel(peak.best.date)} (${formatVnd(peak.best.revenue)}), thấp nhất là ngày ${dayLabel(peak.worst.date)} (${formatVnd(peak.worst.revenue)}) — biên độ giữa hai ngày là ${percentText(((peak.best.revenue - peak.worst.revenue) / peak.worst.revenue) * 100)}.`,
    evidence: [
      `${leader.name}: ${formatVnd(leader.revenue)} · ${percentText(leader.changePercent)}`,
      `Ngày cao nhất ${dayLabel(peak.best.date)}: ${formatVnd(peak.best.revenue)}`,
      `Ngày thấp nhất ${dayLabel(peak.worst.date)}: ${formatVnd(peak.worst.revenue)}`,
    ],
    action: `Giữ đủ tồn cho nhóm ${leader.name.toLowerCase()} trong 2 tuần tới.`,
  });

  if (falling.length > 0) {
    insights.push({
      kind: "canh-bao",
      title: `${falling.length} nhóm hàng giảm so với kỳ trước`,
      body: `${falling
        .map((item) => `${item.name} ${percentText(item.changePercent)}`)
        .join(", ")}. Mức giảm này nhỏ và có thể chỉ là dao động theo mùa — AI không kết luận nguyên nhân, vì dữ liệu ${reportPeriod.days} ngày không tách được yếu tố mùa khỏi yếu tố giá.`,
      evidence: falling.map((item) => `${item.name}: ${formatVnd(item.revenue)} · ${percentText(item.changePercent)}`),
    });
  }

  // 3. Tồn kho — cảnh báo vận hành, xếp theo số ngày còn bán được.
  const urgent = alerts.filter((alert) => daysOfStock(alert) <= 3);
  if (urgent.length > 0) {
    insights.push({
      kind: "canh-bao",
      title: `${urgent.length} thuốc sắp hết trong 3 ngày`,
      body: urgent
        .map(
          (alert) =>
            `${alert.name} còn ${alert.remaining} đơn vị, bán trung bình ${alert.dailyRate.toLocaleString("vi-VN")} mỗi ngày — còn khoảng ${daysOfStock(alert)} ngày.`,
        )
        .join(" "),
      evidence: urgent.map(
        (alert) => `${alert.name}: còn ${alert.remaining}, ${daysOfStock(alert)} ngày`,
      ),
      action: "Đặt hàng bổ sung ngay hôm nay, ưu tiên thuốc còn ít ngày nhất.",
    });
  }

  // 4. Xem nhiều nhưng mua ít — chỉ nêu khi khoảng cách đủ lớn để đáng xử lý.
  const lowConversion = topProducts
    .filter((item) => !item.prescriptionRequired && item.views >= 2_000)
    .sort((a, b) => conversionPercent(a) - conversionPercent(b))[0];
  const highConversion = [...topProducts]
    .filter((item) => !item.prescriptionRequired)
    .sort((a, b) => conversionPercent(b) - conversionPercent(a))[0];

  if (lowConversion && highConversion && lowConversion.productId !== highConversion.productId) {
    insights.push({
      kind: "van-hanh",
      title: `“${lowConversion.name}” được xem nhiều nhưng mua ít`,
      body: `${lowConversion.views.toLocaleString("vi-VN")} lượt xem chỉ ra ${lowConversion.unitsSold} đơn vị bán, tỉ lệ ${conversionPercent(lowConversion).toLocaleString("vi-VN")}%. Cùng kỳ, ${highConversion.name} đạt ${conversionPercent(highConversion).toLocaleString("vi-VN")}%. Khoảng cách này thường do giá, thông tin trên trang, hoặc tình trạng còn hàng — AI không xác định được nguyên nhân từ số liệu bán, cần người xem lại trang sản phẩm.`,
      evidence: [
        `${lowConversion.name}: ${lowConversion.views.toLocaleString("vi-VN")} xem → ${lowConversion.unitsSold} bán (${conversionPercent(lowConversion).toLocaleString("vi-VN")}%)`,
        `${highConversion.name}: ${conversionPercent(highConversion).toLocaleString("vi-VN")}%`,
      ],
      action: `Kiểm tra lại trang “${lowConversion.name}”: giá, ảnh, và phần mô tả liều dùng.`,
    });
  }

  // 5. Thuốc kê đơn được xem nhiều — đây là chỉ số cần đọc khác với thuốc thường.
  const prescription = topProducts.filter((item) => item.prescriptionRequired);
  if (prescription.length > 0) {
    insights.push({
      kind: "an-toan",
      title: "Thuốc kê đơn: lượt xem cao là bình thường, tỉ lệ mua thấp cũng vậy",
      body: `${prescription
        .map(
          (item) =>
            `${item.name} có ${item.views.toLocaleString("vi-VN")} lượt xem và ${item.unitsSold} đơn vị bán (${conversionPercent(item).toLocaleString("vi-VN")}%)`,
        )
        .join("; ")}. Tỉ lệ này thấp vì mỗi đơn phải có đơn thuốc hợp lệ và dược sĩ duyệt. Đừng tối ưu con số này bằng cách bỏ bước duyệt.`,
      evidence: prescription.map(
        (item) => `${item.name}: ${conversionPercent(item).toLocaleString("vi-VN")}% (có duyệt đơn)`,
      ),
    });
  }

  // 6. Công cụ AI: lượt dùng và tỉ lệ dẫn tới giỏ hàng.
  const usageSorted = [...aiToolUsage].sort((a, b) => b.uses - a.uses);
  const mostUsed = usageSorted[0];
  const bestConverting = [...aiToolUsage].sort((a, b) => b.toCartPercent - a.toCartPercent)[0];
  insights.push({
    kind: "van-hanh",
    title: `Công cụ AI được dùng nhiều nhất: ${mostUsed.label}`,
    body: `${mostUsed.uses.toLocaleString("vi-VN")} lượt dùng, ${mostUsed.toCartPercent.toLocaleString("vi-VN")}% dẫn tới thêm giỏ hàng. Nhưng công cụ đưa vào giỏ hiệu quả nhất lại là ${bestConverting.label} (${bestConverting.toCartPercent.toLocaleString("vi-VN")}%) — người dùng vào đó đã biết mình cần gì.`,
    evidence: usageSorted
      .slice(0, 3)
      .map((tool) => `${tool.label}: ${tool.uses.toLocaleString("vi-VN")} lượt · ${tool.toCartPercent.toLocaleString("vi-VN")}% vào giỏ`),
  });

  // 7. Chuyển dược sĩ — cố ý đặt CUỐI và đóng khung là chỉ số an toàn, không phải lỗi.
  insights.push({
    kind: "an-toan",
    title: `${pharmacistHandoffs.total.toLocaleString("vi-VN")} lượt chatbot chuyển sang dược sĩ thật`,
    body: `Chiếm ${pharmacistHandoffs.ofChatbotUses.toLocaleString("vi-VN")}% số lượt dùng chatbot. Đây là chỉ số ĐÚNG chứ không phải chỉ số cần giảm: bốn nhóm câu hỏi này được cài cứng để luôn chuyển người thật. Nếu con số này tụt xuống gần 0 thì phải kiểm tra ngay xem giới hạn còn hoạt động không.`,
    evidence: pharmacistHandoffs.byReason.map(
      (item) => `${item.reason}: ${item.count.toLocaleString("vi-VN")} lượt`,
    ),
  });

  return {
    headline: `${reportPeriod.label}: doanh thu ${formatVnd(totals.revenue)}, ${percentText(totals.revenueChangePercent)} so với ${reportPeriod.previousLabel}.`,
    insights,
    // Độ chắc cố định ở mức vừa phải: dữ liệu 14 ngày, một cửa hàng, không có yếu tố mùa.
    confidence: 74,
    limitations: [
      `Chỉ đọc ${reportPeriod.days} ngày (${reportPeriod.label}). Không đủ để tách yếu tố mùa hay đợt khuyến mãi.`,
      "Không có dữ liệu chi phí nhập hàng, nên không tính được lợi nhuận — chỉ có doanh thu.",
      "Không có dữ liệu khách quay lại, nên không nói được tăng trưởng đến từ khách mới hay khách cũ.",
      "AI mô tả những gì đã xảy ra. Trang này không dự báo doanh số kỳ sau.",
    ],
  };
}

/** Dữ liệu cho biểu đồ cột: chiều cao tính theo phần trăm của ngày cao nhất. */
export function getChartBars() {
  const max = Math.max(...dailySales.map((day) => day.revenue));
  return dailySales.map((day) => ({
    ...day,
    label: dayLabel(day.date),
    heightPercent: Math.round((day.revenue / max) * 100),
    isPeak: day.revenue === max,
  }));
}
