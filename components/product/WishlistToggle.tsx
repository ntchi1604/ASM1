import { Heart } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { toggleWishlist } from "@/lib/shop/wishlist-actions";
import { readWishlistIds } from "@/lib/shop/wishlist-cookie";
import type { Product } from "@/lib/types";

/**
 * Nút thả tim, dùng chung cho thẻ sản phẩm và trang chi tiết.
 *
 * Là Server Component đọc cookie: mỗi thẻ tự biết trạng thái của mình, nên
 * ProductCard không phải nhận thêm prop và mọi chỗ dùng thẻ cũ không phải sửa.
 * Cái giá là đọc cookie — header đã đọc cookie rồi nên nhóm (shop) vốn đã render
 * động, thêm một lần đọc không đổi gì.
 *
 * `aria-pressed` chứ không phải đổi nhãn nút: trình đọc màn hình đọc trạng thái
 * bật/tắt, còn nhãn giữ nguyên việc nút làm.
 */
export async function WishlistToggle({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const saved = (await readWishlistIds()).includes(product.id);

  return (
    <form action={toggleWishlist} className={className}>
      <input type="hidden" name="productId" value={product.id} />
      <button
        type="submit"
        aria-pressed={saved}
        aria-label={saved ? `Bỏ ${product.name} khỏi yêu thích` : `Thêm ${product.name} vào yêu thích`}
        title={saved ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
        className={cn(
          "focus-ring flex size-9 items-center justify-center rounded-chip border bg-card/95 transition-colors",
          saved
            ? "border-trust bg-trust-wash text-trust-text"
            : "border-hairline text-ink-muted hover:border-trust hover:text-trust-text",
        )}
      >
        <Heart size={18} aria-hidden fill={saved ? "currentColor" : "none"} />
      </button>
    </form>
  );
}
