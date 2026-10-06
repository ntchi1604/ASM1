import { SuggestionGrid } from "@/components/ai/SuggestionGrid";
import { getBoughtTogether } from "@/lib/data/bought-together";

/**
 * "Thường được mua cùng" ở trang chi tiết thuốc — tính năng AI số 4.
 *
 * Phần vẽ nằm ở `SuggestionGrid`, dùng chung với khối gợi ý cuối trang danh mục
 * (`CategoryBoughtTogether`) để hai chỗ không thể hiện khác nhau.
 *
 * Nguồn dữ liệu đã lọc bỏ thuốc kê đơn và hàng hết — xem getBoughtTogether.
 */
export function BoughtTogether({ productId }: { productId: string }) {
  const data = getBoughtTogether(productId);
  if (!data) return null;

  return (
    <SuggestionGrid
      title="Thường được mua cùng"
      basis={data.basis}
      items={data.items}
    />
  );
}
