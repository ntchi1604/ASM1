import { GitCompareArrows } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { toggleCompare } from "@/lib/shop/compare-actions";
import { readCompareIds } from "@/lib/shop/compare-cookie";
import type { Product } from "@/lib/types";

/**
 * Nút "So sánh" ở trang chi tiết. Chỉ ở đây, không ở thẻ sản phẩm: thẻ đã có
 * nút thêm giỏ và trái tim, thêm nút thứ ba thì mỗi thẻ thành một bảng điều
 * khiển. Người so sánh thuốc chọn từ trang chi tiết, nơi họ đã đọc kỹ một cái.
 *
 * Chữ đổi theo trạng thái chứ không chỉ đổi màu — nút viền teal mờ và nút teal
 * đặc dễ lẫn nhau khi nhìn nhanh.
 */
export async function CompareToggle({ product }: { product: Product }) {
  const active = (await readCompareIds()).includes(product.id);

  return (
    <form action={toggleCompare}>
      <input type="hidden" name="productId" value={product.id} />
      <button
        type="submit"
        aria-pressed={active}
        className={cn(
          "focus-ring inline-flex h-9 items-center gap-1.5 rounded-card border px-3 text-label-sm font-medium transition-colors",
          active
            ? "border-trust bg-trust-wash text-trust-text"
            : "border-hairline bg-card text-ink-muted hover:border-trust hover:text-trust-text",
        )}
      >
        <GitCompareArrows size={15} aria-hidden />
        {active ? "Đang so sánh" : "So sánh"}
      </button>
    </form>
  );
}
