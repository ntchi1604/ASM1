import { getProductDetail } from "@/lib/data/product-details";
import { getDefaultUnit } from "@/lib/data/products";
import { dosageFormLabel } from "@/lib/filters";
import { formatPricePerUnit, formatStock } from "@/lib/format";
import type { Product } from "@/lib/types";

/**
 * Các dòng của bảng so sánh.
 *
 * Bảng thông tin trang chi tiết và bảng so sánh đọc chung một danh sách nhãn:
 * người xem đặt hai trang cạnh nhau mà thấy "Nhà sản xuất" một chỗ, "Hãng sản
 * xuất" chỗ khác thì bảng so sánh trông như dữ liệu khác nguồn.
 *
 * Dòng nào thiếu dữ liệu ghi "Đang cập nhật", không bỏ hàng — bảng thiếu hàng
 * làm người đọc tưởng thuốc không có số đăng ký.
 */
export function infoRows(product: Product) {
  const detail = getProductDetail(product.id);
  const unit = getDefaultUnit(product);
  const rows: { label: string; value: string }[] = [
    { label: "Danh mục", value: detail?.therapeuticGroup ?? "Đang cập nhật" },
    { label: "Dạng bào chế", value: dosageFormLabel(product.dosageForm) },
    {
      label: "Quy cách",
      value: unit.packaging ? `${unit.label} ${unit.packaging}` : unit.label,
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

  return rows;
}

/**
 * Dòng so sánh = dòng thông tin + ba thứ chỉ có nghĩa khi đặt cạnh nhau: giá,
 * tồn kho và cách bán. Ba dòng này đứng đầu bảng vì chúng là lý do người ta mở
 * trang so sánh.
 */
export function compareRows(product: Product) {
  const unit = getDefaultUnit(product);
  return [
    { label: "Giá", value: formatPricePerUnit(unit.price, unit.label) },
    {
      label: "Tình trạng",
      value: formatStock(product.stock.total, product.stock.nearbyPharmacies, unit.label),
    },
    {
      label: "Cách bán",
      value: product.prescriptionRequired ? "Kê đơn — cần tư vấn dược sĩ" : "Bán tự do (OTC)",
    },
    ...infoRows(product),
  ];
}
