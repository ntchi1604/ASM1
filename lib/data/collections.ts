import { getCategoryBySlug, type Category } from "@/lib/data/categories";
import { getProductsByCategory, products } from "@/lib/data/products";
import type { Product } from "@/lib/types";

/**
 * Bộ sưu tập ảo — tập con của catalogue KHÔNG phải danh mục.
 *
 * "Tất cả sản phẩm" và "Thuốc không kê đơn" là hai đích đến có thật của các link
 * "Xem tất cả" ở trang chủ, và bản trước trỏ chúng vào `/danh-muc/thuoc` — một
 * giá trị của `Product.type`, không phải slug danh mục, nên 404.
 *
 * Không thêm hai mục này vào `categories`: danh mục là cách phân loại theo bệnh
 * và nhóm hàng, hiện ở lưới trang chủ, ở nav và ở bộ lọc. Một "danh mục" gộp cả
 * 12 nhóm lại sẽ nằm chình ình giữa lưới đó và không lọc được gì.
 *
 * Trang danh mục đọc cả hai loại qua cùng một giao diện `{ slug, name,
 * description, aiHint? }`, nên bộ sưu tập dùng lại được toàn bộ bộ lọc, sắp xếp,
 * phân trang và khối gợi ý của trang danh mục mà không phải viết trang thứ hai.
 */
export type Collection = {
  slug: string;
  name: string;
  description: string;
  /** Bộ sưu tập chưa có gợi ý AI riêng; để trống thì khối gợi ý tự ẩn. */
  aiHint?: Category["aiHint"];
  /** Vị từ chọn hàng. Bỏ trống nghĩa là lấy toàn bộ catalogue. */
  include?: (product: Product) => boolean;
};

export const collections: Collection[] = [
  {
    slug: "thuoc",
    name: "Thuốc và sản phẩm sức khoẻ",
    description:
      "Toàn bộ thuốc, thực phẩm bổ sung và sản phẩm chăm sóc sức khoẻ đang bán tại MediVia.",
  },
  {
    slug: "thuoc-khong-ke-don",
    name: "Thuốc không kê đơn",
    description:
      "Thuốc bán không cần đơn bác sĩ. Vẫn nên hỏi dược sĩ khi dùng cùng lúc nhiều loại.",
    // Khớp đúng định nghĩa của bộ lọc "Không kê đơn (OTC)" ở sidebar, nếu không
    // thì bấm vào bộ lọc đó trên trang này sẽ ra số khác với số ở tiêu đề.
    include: (product) => product.type === "drug" && !product.prescriptionRequired,
  },
];

/**
 * Gộp danh mục và bộ sưu tập về một hình dạng để trang danh mục chỉ có một
 * luồng xử lý. Danh mục thắng khi trùng slug — hiện không trùng, nhưng thứ tự
 * này giữ cho bộ sưu tập không lấn được danh mục thật nếu sau này có thêm.
 */
export function resolveCollection(slug: string) {
  const category = getCategoryBySlug(slug);
  if (category) {
    return { meta: category as Collection, products: getProductsByCategory(slug) };
  }

  const collection = collections.find((item) => item.slug === slug);
  if (!collection) return undefined;

  const items = collection.include ? products.filter(collection.include) : products;
  return { meta: collection, products: items };
}