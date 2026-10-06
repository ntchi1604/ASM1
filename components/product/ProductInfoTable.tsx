import type { Product, ProductDetail } from "@/lib/types";
import { dosageFormLabel } from "@/lib/filters";
import { getDefaultUnit } from "@/lib/data/products";

/**
 * Bảng thông tin dược. Đây là phần "sự thật đã kiểm duyệt", đối lập với khối
 * tóm tắt AI ở trên — nên nền trắng, không màu tím, không khuyến cáo AI.
 *
 * Dòng nào chưa có dữ liệu thì ghi "Đang cập nhật" thay vì bỏ hàng đi. Bảng
 * thiếu hàng làm người đọc tưởng thuốc không có số đăng ký.
 */
export function ProductInfoTable({
  product,
  detail,
}: {
  product: Product;
  detail?: ProductDetail;
}) {
  const packaging = getDefaultUnit(product).packaging;

  const rows: { label: string; value: string }[] = [
    { label: "Danh mục", value: detail?.therapeuticGroup ?? "Đang cập nhật" },
    { label: "Dạng bào chế", value: dosageFormLabel(product.dosageForm) },
    {
      label: "Quy cách",
      value: packaging
        ? `${getDefaultUnit(product).label} ${packaging}`
        : getDefaultUnit(product).label,
    },
    {
      label: "Hoạt chất chính",
      value: `${product.activeIngredient} ${product.strength}`.trim(),
    },
    { label: "Nhà sản xuất", value: detail?.manufacturer ?? product.brand },
    { label: "Nước sản xuất", value: product.origin },
    { label: "Số đăng ký lưu hành", value: detail?.registrationNumber ?? "Đang cập nhật" },
    { label: "Hạn dùng", value: detail?.shelfLife ?? "Đang cập nhật" },
    { label: "Bảo quản", value: detail?.storage ?? "Đang cập nhật" },
  ];

  if (detail?.sideEffects) {
    rows.push({ label: "Tác dụng không mong muốn", value: detail.sideEffects });
  }

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
