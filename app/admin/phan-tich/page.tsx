import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard, Th } from "@/components/admin/StatCard";
import { AiBlock } from "@/components/ai/AiBlock";
import { AiSkeleton } from "@/components/ai/AiSkeleton";
import { ConfidenceBadge } from "@/components/ai/ConfidenceBadge";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionHeading } from "@/components/ui/Card";
import { formatVnd, formatVndCompact } from "@/lib/format";
import {
  aiToolUsage,
  categorySales,
  conversionPercent,
  daysOfStock,
  getAverageRating,
  getRatingRows,
  getTotals,
  pharmacistHandoffs,
  reportPeriod,
  resolveProductSales,
  resolveStockAlerts,
} from "@/lib/data/sales";
import {
  getOrderStatusCounts,
  returnReasonStats,
  returnReasons,
} from "@/lib/data/orders";
import { analyzeSales, getChartBars, type Insight, type InsightKind } from "@/lib/ai/analytics";
import { AlertTriangle, ChartColumn, Info, ShieldCheck, TrendingDown, TrendingUp } from "@/lib/icons";

export const metadata: Metadata = {
  title: "AI phân tích doanh số",
  description:
    "Báo cáo doanh thu, nhóm hàng, tồn kho và mức sử dụng công cụ AI trong 14 ngày gần nhất.",
};

/**
 * Trang nhiều số nhất trong bốn trang quản trị; ba trang kia là đơn hàng, kho thuốc
 * và duyệt đơn thuốc. Cả bốn dùng chung `AdminShell` và `StatCard`.
 *
 * Cấu trúc cố ý: SỐ THẬT TRƯỚC, NHẬN XÉT CỦA AI SAU. Người quản lý phải đọc được
 * doanh thu và biểu đồ trước khi đọc câu AI viết — nếu đảo thứ tự, câu nhận xét trở
 * thành thứ định hình cách họ nhìn số liệu, thay vì ngược lại.
 *
 * Bảng số liệu KHÔNG nằm trong khối tím. Chỉ phần AI diễn giải mới tím, đúng luật
 * màu của cả site: tím là chữ của máy, không phải dữ liệu đã kiểm duyệt.
 */

const insightTone: Record<
  InsightKind,
  { icon: typeof TrendingUp; text: string; label: string }
> = {
  "tang-truong": { icon: TrendingUp, text: "text-trust-text", label: "Tăng trưởng" },
  "canh-bao": { icon: AlertTriangle, text: "text-danger", label: "Cảnh báo" },
  "van-hanh": { icon: Info, text: "text-ai-text", label: "Vận hành" },
  "an-toan": { icon: ShieldCheck, text: "text-trust-text", label: "An toàn" },
};

export default function AdminAnalyticsPage() {
  const totals = getTotals();
  const bars = getChartBars();
  const topProducts = resolveProductSales();
  const alerts = resolveStockAlerts();

  // Tỉ lệ hoàn trả lấy từ CÙNG nguồn đếm trạng thái của trang đơn hàng, không
  // tự cộng lại ở đây: hai trang nói hai tỉ lệ khác nhau là lỗi không ai thấy.
  const statusCounts = getOrderStatusCounts();
  const returnCount = statusCounts["hoan-tra"];
  const returnRate = Number(((returnCount / totals.orders) * 100).toFixed(1));
  const returnReasonLabel = Object.fromEntries(
    returnReasons.map((reason) => [reason.id, reason.label]),
  );
  const maxReturnReason = Math.max(...returnReasonStats.map((item) => item.count));

  // Điểm thấp lên trước. Chỉ năm dòng: đây là danh sách để soát, không phải bảng
  // xếp hạng — 24 dòng thì người quản lý không đọc.
  const lowestRated = getRatingRows().slice(0, 5);
  const maxHandoff = Math.max(...pharmacistHandoffs.byReason.map((item) => item.count));

  return (
    <AdminShell activeHref="/admin/phan-tich">
      <div className="flex flex-col gap-6">
        {/*
          Nhịp tiêu đề theo Stitch: tên trang, rồi một dòng trạng thái có chấm
          xanh. Bản Stitch còn có cụm chip chọn kỳ và nút "Xuất báo cáo" — bỏ
          cả hai: dữ liệu ở đây là 14 ngày cố định trong mã nguồn, nên chip đổi
          kỳ sẽ là nút bấm không đổi gì, và bản mẫu chưa có đường xuất tệp.
        */}
        <header>
          <h1 className="text-headline-xl text-ink">Phân tích doanh số</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-body-sm text-ink-muted">
            <span aria-hidden className="inline-block size-1.5 rounded-chip bg-trust" />
            Kỳ báo cáo {reportPeriod.label} · so với {reportPeriod.previousLabel}
          </p>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Số liệu {reportPeriod.days} ngày gần nhất. Toàn bộ con số trên trang lấy từ cùng
            một nguồn dữ liệu, kể cả phần AI diễn giải.
          </p>
        </header>

        {/* Bốn chỉ số tổng. Nền trắng, không tím: đây là số liệu, không phải nhận xét. */}
        <section aria-label="Chỉ số tổng" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Doanh thu" value={formatVnd(totals.revenue)}>
            <span className="inline-block">
              <ChangeChip value={totals.revenueChangePercent} withLabel />
            </span>
          </StatCard>
          <StatCard label="Số đơn" value={totals.orders.toLocaleString("vi-VN")}>
            <span className="inline-block">
              <ChangeChip value={totals.ordersChangePercent} withLabel />
            </span>
          </StatCard>
          <StatCard
            label="Trung bình mỗi đơn"
            value={formatVnd(totals.averageOrderValue)}
            hint="Doanh thu chia số đơn"
          />
          <StatCard
            label="Thuốc sắp hết"
            value={`${alerts.length} mặt hàng`}
            hint={`Ít nhất còn ${daysOfStock(alerts[0])} ngày`}
            danger
          />
        </section>

        {/*
          Hai khối cạnh nhau như Stitch: 8 cột biểu đồ đường, 4 cột tỉ trọng
          nhóm hàng. Trước đây là một biểu đồ cột chạy hết chiều ngang rồi một
          thẻ danh sách nhóm hàng nằm riêng bên dưới — đọc phải nhảy hai lần.

          Biểu đồ dựng bằng SVG viết tay, không thêm thư viện: 14 điểm dữ liệu
          thì một polyline là đủ. Kèm <table> ẩn cho trình đọc màn hình — SVG
          không có bản chữ là vô hình với screen reader.
        */}
        <div className="grid gap-4 xl:grid-cols-12">
          <Card className="p-4 md:p-5 xl:col-span-8">
            <SectionHeading title={`Doanh thu theo ngày — ${reportPeriod.label}`} />
            <RevenueChart bars={bars} />
          </Card>

          <Card className="flex flex-col p-4 md:p-5 xl:col-span-4">
            <SectionHeading title="Tỉ trọng nhóm hàng" />
            <CategoryDonut />
          </Card>
        </div>

        {/*
          Khối AI đặt SAU biểu đồ và bảng chỉ số, TRƯỚC các bảng chi tiết: người đọc
          đã thấy số tổng, giờ đọc diễn giải, rồi mới soi chi tiết nếu muốn.
        */}
        <Suspense fallback={<AiSkeleton message="AI đang đọc số liệu 14 ngày…" lines={5} />}>
          <AiInsights />
        </Suspense>

        <Card className="p-4 md:p-5">
          <SectionHeading title="Mức dùng công cụ AI" />
          {/* Sáu dòng chia hai cột: để một cột chạy hết bề ngang thì nhãn và số
              cách nhau cả gang tay, mắt phải quét ngang mới ghép được cặp. */}
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-x-8">
              {[...aiToolUsage]
                .sort((a, b) => b.uses - a.uses)
                .map((tool) => (
                  <li
                    key={tool.slug}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
                  >
                    <Link
                      href={tool.slug}
                      className="focus-ring rounded-chip text-label-md text-ink hover:text-trust-text"
                    >
                      {tool.label}
                    </Link>
                    <span className="text-body-sm text-ink-muted">
                      {tool.uses.toLocaleString("vi-VN")} lượt ·{" "}
                      <span className="text-ink">
                        {tool.toCartPercent.toLocaleString("vi-VN")}% vào giỏ
                      </span>
                    </span>
                  </li>
                ))}
          </ul>
          <p className="mt-4 border-t border-divider pt-3 text-body-sm text-ink-subtle">
            “Vào giỏ” là tỉ lệ lượt dùng công cụ dẫn tới thêm sản phẩm vào giỏ hàng. Công
            cụ tra cứu an toàn như cảnh báo tương tác có tỉ lệ thấp là đúng bản chất,
            không phải kém hiệu quả.
          </p>
        </Card>

        {/*
          Ba bảng vận hành: hoàn trả, đánh giá, chuyển dược sĩ. Đều là số thật nên
          nền trắng — không có bảng nào trong này do AI viết.
        */}
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="p-4 md:p-5">
            <SectionHeading
              title="Hoàn trả"
              action={
                <span className="text-body-sm text-ink-subtle">
                  {returnCount}/{totals.orders.toLocaleString("vi-VN")} đơn
                </span>
              }
            />
            <p className="mt-3 text-headline-lg tabular-nums text-ink">
              {returnRate.toLocaleString("vi-VN")}%
            </p>
            <p className="text-body-sm text-ink-muted">tỉ lệ hoàn trả trong kỳ</p>

            <ul className="mt-4 flex flex-col gap-3">
              {returnReasonStats.map((item) => (
                <li key={item.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-label-md text-ink">
                      {returnReasonLabel[item.id]}
                    </span>
                    <span className="text-body-sm tabular-nums text-ink">{item.count} đơn</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-chip bg-recessed">
                    <div
                      className="h-full rounded-chip bg-promo/60"
                      style={{ width: `${Math.round((item.count / maxReturnReason) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-body-sm text-ink-subtle">
              Ba lý do khách chọn được ở trang đổi trả. Đơn quản trị chuyển tay thì
              không nằm trong bảng này.
            </p>
          </Card>

          <Card className="p-4 md:p-5">
            <SectionHeading
              title="Điểm đánh giá thấp nhất"
              action={
                <span className="text-body-sm text-ink-subtle">
                  TB {getAverageRating().toLocaleString("vi-VN")}★
                </span>
              }
            />
            <ul className="mt-4 flex flex-col gap-2.5">
              {lowestRated.map((row) => (
                <li
                  key={row.productId}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
                >
                  <Link
                    href={`/thuoc/${row.slug}`}
                    className="focus-ring rounded-chip text-label-md text-ink hover:text-trust-text"
                  >
                    {row.name}
                  </Link>
                  <span className="text-body-sm tabular-nums text-ink">
                    {row.score.toLocaleString("vi-VN")}★
                    <span className="text-ink-subtle"> · {row.count} lượt</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-body-sm text-ink-subtle">
              Sắp thấp lên trước vì đây là danh sách để soát. Điểm trung bình tính
              theo số lượt, không phải trung bình cộng của các sản phẩm.
            </p>
          </Card>

          <Card className="p-4 md:p-5">
            <SectionHeading
              title="Chatbot chuyển dược sĩ"
              action={
                <span className="text-body-sm text-ink-subtle">
                  {pharmacistHandoffs.ofChatbotUses.toLocaleString("vi-VN")}% lượt chat
                </span>
              }
            />
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-headline-lg tabular-nums text-ink">
                {pharmacistHandoffs.total.toLocaleString("vi-VN")}
              </span>
              <span className="text-body-sm text-ink-muted">ca</span>
            </p>
            <p className="text-body-sm text-ink-muted">chuyển sang dược sĩ thật</p>

            <ul className="mt-4 flex flex-col gap-3">
              {pharmacistHandoffs.byReason.map((item) => (
                <li key={item.reason}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-label-md text-ink">{item.reason}</span>
                    <span className="text-body-sm tabular-nums text-ink">{item.count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-chip bg-recessed">
                    <div
                      className="h-full rounded-chip bg-trust/60"
                      style={{ width: `${Math.round((item.count / maxHandoff) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-body-sm text-ink-subtle">
              Chuyển dược sĩ là việc AI phải làm, không phải AI thất bại — bốn nhóm
              này đều nằm ngoài phạm vi được phép tự trả lời.
            </p>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading title="10 thuốc bán chạy nhất" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-t border-hairline text-left">
              <thead className="bg-recessed">
                <tr>
                  <Th>Thuốc</Th>
                  <Th align="right">Đã bán</Th>
                  <Th align="right">Doanh thu</Th>
                  <Th align="right">Lượt xem</Th>
                  <Th align="right">Xem → mua</Th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item) => (
                  <tr key={item.productId} className="border-t border-divider">
                    <td className="px-4 py-3">
                      <Link
                        href={`/thuoc/${item.slug}`}
                        className="focus-ring rounded-chip text-body-md text-ink hover:text-trust-text"
                      >
                        {item.name}
                      </Link>
                      {item.prescriptionRequired ? (
                        <span className="ml-2 inline-block align-middle">
                          <Badge tone="prescription">Kê đơn</Badge>
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right text-body-md text-ink">
                      {item.unitsSold.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right text-label-md text-ink">
                      {formatVnd(item.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-body-md text-ink-muted">
                      {item.views.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right text-body-md text-ink-muted">
                      {conversionPercent(item).toLocaleString("vi-VN")}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-hairline px-4 py-3 text-body-sm text-ink-subtle">
            Doanh thu tính theo giá đơn vị mặc định (hộp, chai) đang niêm yết trong danh
            mục, nhân số lượng đã bán — nên bảng này không bao giờ lệch với giá trên trang
            sản phẩm.
          </p>
        </Card>

        <Card className="border-danger/30 bg-danger-wash p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-headline-md text-danger">
            <AlertTriangle size={18} aria-hidden />
            Tồn kho cần đặt thêm
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {alerts.map((alert) => (
              <li key={alert.productId} className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/thuoc/${alert.slug}`}
                  className="focus-ring rounded-chip text-label-md text-ink hover:text-trust-text"
                >
                  {alert.name}
                </Link>
                <span className="text-body-sm text-ink-muted">
                  còn {alert.remaining} · bán {alert.dailyRate.toLocaleString("vi-VN")}/ngày ·{" "}
                  <strong className="font-medium text-danger">
                    ~{daysOfStock(alert)} ngày
                  </strong>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AdminShell>
  );
}

async function AiInsights() {
  const report = await analyzeSales();

  return (
    <AiBlock label="AI phân tích" note={`${report.insights.length} nhận xét`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-body-lg text-ink">{report.headline}</p>
        <ConfidenceBadge percent={report.confidence} />
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {report.insights.map((insight) => (
          <InsightCard key={insight.title} insight={insight} />
        ))}
      </ul>

      {/*
        Phần "AI chưa đọc được gì" nằm TRONG khối AI, không tách ra chân trang: giới
        hạn của một kết luận phải đi cùng kết luận đó, không nằm chỗ người ta có thể
        cuộn qua.
      */}
      <div className="mt-4 rounded-card border border-ai/25 bg-card p-4">
        <h3 className="flex items-center gap-2 text-label-md text-ink">
          <Info size={16} className="text-ai-text" aria-hidden />
          AI chưa đọc được gì
        </h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {report.limitations.map((item) => (
            <li key={item} className="flex gap-2 text-body-sm text-ink-muted">
              <span aria-hidden className="text-ai-text">
                •
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </AiBlock>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const tone = insightTone[insight.kind];
  const Icon = tone.icon;

  return (
    <li className="rounded-card border border-hairline bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Icon size={17} className={`shrink-0 ${tone.text}`} aria-hidden />
        <h3 className="text-label-md text-ink">{insight.title}</h3>
        <span className="text-label-sm text-ink-subtle">{tone.label}</span>
      </div>
      <p className="mt-2 text-body-md text-ink-muted">{insight.body}</p>

      {/* Con số AI đã dùng, hiện dạng chip mono để đối chiếu với bảng bên dưới. */}
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {insight.evidence.map((item) => (
          <li
            key={item}
            className="rounded-chip border border-hairline bg-recessed px-2.5 py-1 text-label-sm text-ink-muted"
          >
            {item}
          </li>
        ))}
      </ul>

      {insight.action ? (
        <p className="mt-3 flex items-start gap-2 text-body-sm text-ink">
          <ChartColumn size={15} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
          <span>
            <strong className="font-medium">Nên làm: </strong>
            {insight.action}
          </span>
        </p>
      ) : null}
    </li>
  );
}

/**
 * Biểu đồ đường doanh thu. `preserveAspectRatio="none"` để đường giãn theo bề
 * ngang khối: 14 điểm cố định trong một viewBox hẹp sẽ dồn cục ở giữa khi khối
 * rộng ra. Đổi lại, nét vẽ cũng bị giãn theo chiều ngang — chấp nhận được với
 * một đường xu hướng, không dùng cho hình cần đúng tỉ lệ.
 */
function RevenueChart({ bars }: { bars: ReturnType<typeof getChartBars> }) {
  const W = 700;
  const H = 200;
  const peakRevenue = Math.max(...bars.map((bar) => bar.revenue));
  const points = bars.map((bar, index) => ({
    bar,
    x: (index / (bars.length - 1)) * W,
    y: H - (bar.revenue / peakRevenue) * (H - 10),
  }));
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const peak = points.find((point) => point.bar.isPeak);

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        {/* Trục dọc: chỉ hai mốc, đủ để đọc độ cao tương đối. */}
        <div className="flex h-[180px] flex-col justify-between py-0.5 text-right text-label-sm tabular-nums text-ink-subtle">
          <span>{formatVndCompact(peakRevenue)}</span>
          <span>0</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-[180px]">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              aria-hidden
              className="h-full w-full overflow-visible"
            >
              <defs>
                <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" className="text-trust" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-trust" />
                </linearGradient>
              </defs>
              <path d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#revenue-fill)" />
              <path
                d={line}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-trust"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {peak ? (
              <span
                aria-hidden
                className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-chip border-2 border-card bg-trust"
                style={{ left: `${(peak.x / W) * 100}%`, top: `${(peak.y / H) * 100}%` }}
              />
            ) : null}
          </div>

          <div className="mt-2 flex justify-between text-label-sm tabular-nums text-ink-subtle">
            <span>{bars[0].label}</span>
            <span className="font-medium text-trust-text">
              Đỉnh {peak?.bar.label}: {peak ? formatVndCompact(peak.bar.revenue) : ""}
            </span>
            <span>{bars[bars.length - 1].label}</span>
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Doanh thu và số đơn theo từng ngày</caption>
        <thead>
          <tr>
            <th scope="col">Ngày</th>
            <th scope="col">Doanh thu</th>
            <th scope="col">Số đơn</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.date}>
              <th scope="row">{bar.label}</th>
              <td>{formatVnd(bar.revenue)}</td>
              <td>{bar.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Vòng tỉ trọng nhóm hàng. Sáu nhóm nhưng chỉ một sắc teal đậm nhạt dần —
 * không phải sáu màu: các nhóm ở đây cùng loại (doanh thu), khác nhau về độ
 * lớn, nên độ đậm mã hoá đúng thứ duy nhất khác nhau giữa chúng. Thêm sáu màu
 * là thêm sáu nghĩa không có trong bảng màu của site.
 */
function CategoryDonut() {
  const total = categorySales.reduce((sum, item) => sum + item.revenue, 0);
  const maxCategoryRevenue = Math.max(...categorySales.map((item) => item.revenue));
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const shades = ["opacity-100", "opacity-80", "opacity-60", "opacity-45", "opacity-30", "opacity-20"];

  // `map` cộng dồn thì lint chặn vì đó là sửa biến ngoài trong lúc render;
  // `reduce` gói phần cộng dồn vào giá trị tích luỹ nên không có biến ngoài.
  const slices = categorySales.reduce<{ item: (typeof categorySales)[number]; length: number; start: number }[]>(
    (acc, item) => {
      const length = (item.revenue / total) * circumference;
      const start = acc.length === 0 ? 0 : acc[acc.length - 1].start + acc[acc.length - 1].length;
      return [...acc, { item, length, start }];
    },
    [],
  );

  return (
    <>
      <div className="relative mx-auto my-3 size-40">
        <svg viewBox="0 0 160 160" aria-hidden className="size-full -rotate-90">
          {slices.map(({ item, length, start }, index) => (
            <circle
              key={item.slug}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="22"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-start}
              className={`text-trust ${shades[index]}`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-headline-md font-extrabold tracking-tight text-ink">
            {formatVndCompact(total)}
          </span>
          <span className="text-label-sm text-ink-subtle">6 nhóm lớn nhất</span>
        </div>
      </div>

      <ul className="mt-2 flex flex-col gap-2 border-t border-divider pt-3">
        {categorySales.map((item, index) => (
          <li key={item.slug}>
            <div className="flex items-baseline justify-between gap-2">
              <Link
                href={`/danh-muc/${item.slug}`}
                className="focus-ring flex min-w-0 items-center gap-2 rounded-chip text-label-md text-ink hover:text-trust-text"
              >
                <span
                  aria-hidden
                  className={`inline-block size-2.5 shrink-0 rounded-xs bg-trust ${shades[index]}`}
                />
                <span className="truncate">{item.name}</span>
              </Link>
              <span className="shrink-0 text-label-sm tabular-nums text-ink-muted">
                <strong className="font-semibold text-ink">
                  {Math.round((item.revenue / total) * 100)}%
                </strong>{" "}
                · {formatVndCompact(item.revenue)}
              </span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-chip bg-recessed">
              <div
                className={`h-full rounded-chip bg-trust ${shades[index]}`}
                style={{ width: `${(item.revenue / maxCategoryRevenue) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-body-sm text-ink-subtle">
        Sáu nhóm lớn nhất; tổng ở giữa là của riêng sáu nhóm này, nhỏ hơn doanh thu
        toàn kỳ.
      </p>
    </>
  );
}

/**
 * Chip phần trăm thay đổi. Tăng là teal, giảm là coral — KHÔNG dùng đỏ cho mức giảm
 * doanh thu: đỏ trên site này nghĩa là nguy hiểm cho sức khoẻ, không phải tin xấu về
 * kinh doanh. Trộn hai nghĩa vào một màu thì cảnh báo thuốc mất trọng lượng.
 */
function ChangeChip({ value, withLabel }: { value: number; withLabel?: boolean }) {
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const text = `${up ? "+" : "−"}${Math.abs(value).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-chip px-2 py-0.5 text-label-sm ${
        up ? "bg-trust-wash text-trust-text" : "bg-promo-wash text-promo-text"
      }`}
    >
      <Icon size={13} aria-hidden />
      {text}
      {withLabel ? <span className="font-normal text-ink-subtle">so với kỳ trước</span> : null}
    </span>
  );
}

