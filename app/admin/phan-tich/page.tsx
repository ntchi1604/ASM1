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
  getTotals,
  reportPeriod,
  resolveProductSales,
  resolveStockAlerts,
} from "@/lib/data/sales";
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
  const maxCategoryRevenue = Math.max(...categorySales.map((item) => item.revenue));

  return (
    <AdminShell activeHref="/admin/phan-tich">
      <div className="flex flex-col gap-6">
        <header>
          <p className="text-label-sm text-ink-subtle">Kỳ báo cáo {reportPeriod.label}</p>
          <h1 className="mt-1 text-headline-xl text-ink">Phân tích doanh số</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Số liệu {reportPeriod.days} ngày gần nhất, so với {reportPeriod.previousLabel}. Toàn
            bộ con số trên trang lấy từ cùng một nguồn dữ liệu, kể cả phần AI diễn giải.
          </p>
        </header>

        {/* Bốn chỉ số tổng. Nền trắng, không tím: đây là số liệu, không phải nhận xét. */}
        <section aria-label="Chỉ số tổng" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Doanh thu" value={formatVnd(totals.revenue)}>
            <span className="mt-2 inline-block">
              <ChangeChip value={totals.revenueChangePercent} withLabel />
            </span>
          </StatCard>
          <StatCard label="Số đơn" value={totals.orders.toLocaleString("vi-VN")}>
            <span className="mt-2 inline-block">
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

        <Card className="p-4 md:p-5">
          <SectionHeading title={`Doanh thu theo ngày — ${reportPeriod.label}`} />
          {/*
            Biểu đồ dựng bằng div, không dùng thư viện chart: 14 cột thì không đáng
            kéo thêm một thư viện vào bundle. Kèm <table> ẩn cho trình đọc màn hình —
            biểu đồ bằng div là vô hình với screen reader nếu không có bản chữ.
          */}
          <div className="mt-4 flex items-end gap-1.5 sm:gap-2" aria-hidden>
            {bars.map((bar) => (
              <div key={bar.date} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-label-sm text-ink-subtle">
                  {bar.isPeak ? formatVndCompact(bar.revenue) : ""}
                </span>
                <div
                  className={`w-full rounded-t-[4px] ${bar.isPeak ? "bg-trust" : "bg-trust/35"}`}
                  style={{ height: `${Math.max(bar.heightPercent, 6) * 1.6}px` }}
                />
                <span className="truncate text-label-sm text-ink-subtle">{bar.label}</span>
              </div>
            ))}
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
        </Card>

        {/*
          Khối AI đặt SAU biểu đồ và bảng chỉ số, TRƯỚC các bảng chi tiết: người đọc
          đã thấy số tổng, giờ đọc diễn giải, rồi mới soi chi tiết nếu muốn.
        */}
        <Suspense fallback={<AiSkeleton message="AI đang đọc số liệu 14 ngày…" lines={5} />}>
          <AiInsights />
        </Suspense>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="p-4 md:p-5">
            <SectionHeading title="Nhóm hàng theo doanh thu" />
            <ul className="mt-4 flex flex-col gap-3">
              {categorySales.map((item) => (
                <li key={item.slug}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/danh-muc/${item.slug}`}
                      className="focus-ring rounded-chip text-label-md text-ink hover:text-trust-text"
                    >
                      {item.name}
                    </Link>
                    <span className="flex items-center gap-2">
                      <span className="text-label-md text-ink">{formatVnd(item.revenue)}</span>
                      <ChangeChip value={item.changePercent} />
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-chip bg-recessed">
                    <div
                      className="h-full rounded-chip bg-trust/60"
                      style={{ width: `${Math.round((item.revenue / maxCategoryRevenue) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-body-sm text-ink-subtle">
                    {item.orders.toLocaleString("vi-VN")} đơn
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-body-sm text-ink-subtle">
              Sáu nhóm lớn nhất. Tổng của bảng này nhỏ hơn tổng doanh thu vì các nhóm
              còn lại không được liệt kê.
            </p>
          </Card>

          <Card className="p-4 md:p-5">
            <SectionHeading title="Mức dùng công cụ AI" />
            <ul className="mt-4 flex flex-col gap-3">
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
            <p className="mt-4 text-body-sm text-ink-subtle">
              “Vào giỏ” là tỉ lệ lượt dùng công cụ dẫn tới thêm sản phẩm vào giỏ hàng.
              Công cụ tra cứu an toàn như cảnh báo tương tác có tỉ lệ thấp là đúng bản
              chất, không phải kém hiệu quả.
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

