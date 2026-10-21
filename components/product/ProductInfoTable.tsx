import type { Product } from "@/lib/types";
import { infoRows } from "@/lib/product-compare";

/**
 * Bảng thông tin dược. Đây là phần "sự thật đã kiểm duyệt", đối lập với khối
 * tóm tắt AI ở trên — nên nền trắng, không màu tím, không khuyến cáo AI.
 *
 * Dòng đọc từ `infoRows` để bảng so sánh dùng đúng cùng bộ nhãn.
 */
export function ProductInfoTable({ product }: { product: Product }) {
  const rows = infoRows(product);

  return (
    <section id="thong-tin-chi-tiet" className="scroll-mt-24">
      <h2 className="mb-3 text-headline-md text-ink">Thông tin chi tiết</h2>
      <div className="overflow-hidden rounded-card border border-hairline bg-card">
        <dl className="divide-y divide-divider">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
              <dt className="text-body-sm text-ink-muted">{row.label}</dt>
              <dd className="text-body-sm text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
