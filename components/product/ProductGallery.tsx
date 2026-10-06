import { BadgeCheck } from "@/lib/icons";
import { ProductImage } from "@/components/product/ProductImage";
import type { Product } from "@/lib/types";

/**
 * Khung ảnh sản phẩm ở trang chi tiết.
 *
 * Cố ý KHÔNG có dải ảnh nhỏ như bản thiết kế Stitch: dữ liệu hiện chỉ có một
 * ảnh cho mỗi sản phẩm, nên bốn ô nhỏ sẽ là bốn bản sao của cùng một ảnh —
 * trông như có nhiều góc chụp trong khi không có. Khi `Product` có mảng ảnh
 * thật thì thêm dải ảnh vào đây, phần còn lại của trang không phải sửa.
 *
 * Nhãn "Ảnh thật tại nhà thuốc" giữ nguyên vì đó là cam kết về nguồn ảnh —
 * điểm khác biệt so với ảnh do nhà sản xuất cung cấp.
 */
export function ProductGallery({ product }: { product: Product }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative rounded-card border border-hairline bg-card p-2">
        <ProductImage
          src={product.image}
          name={product.name}
          brand={product.brand}
          priority
          sizes="(max-width: 1024px) 100vw, 420px"
        />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-chip bg-trust-wash px-2.5 py-1 text-label-sm text-trust-text">
          <BadgeCheck size={14} aria-hidden />
          Ảnh thật tại nhà thuốc
        </span>
      </div>
    </div>
  );
}
