import { SuggestionGrid } from "@/components/ai/SuggestionGrid";
import { getCategoryBoughtTogether } from "@/lib/data/bought-together";

/**
 * "Khách mua nhóm này thường mua thêm" — khối gợi ý ở cuối trang danh mục,
 * tính năng AI số 4 áp cho cấp danh mục.
 *
 * Tiêu đề KHÁC trang chi tiết ("Thường được mua cùng") là có chủ ý: ở trang chi
 * tiết, gợi ý neo vào đúng một hộp thuốc người dùng đang xem; ở đây nó neo vào cả
 * nhóm. Dùng lại y nguyên câu "Thường được mua cùng" sẽ hứa mức chính xác mà dữ
 * liệu cấp danh mục không có.
 *
 * Không phụ thuộc bộ lọc đang bật: khối đứng ngoài danh sách kết quả và luôn hiện
 * nếu danh mục có dữ liệu. Cho khối biến mất khi người dùng tích một bộ lọc trông
 * như trang bị lỗi, mà gợi ý chéo danh mục thì cũng không liên quan đến việc đang
 * lọc theo dạng bào chế hay khoảng giá.
 */
export function CategoryBoughtTogether({ categorySlug }: { categorySlug: string }) {
  const data = getCategoryBoughtTogether(categorySlug);
  if (!data) return null;

  return (
    <SuggestionGrid
      title="Khách mua nhóm này thường mua thêm"
      basis={data.basis}
      items={data.items}
      note="Gợi ý thuộc các nhóm khác, dựa trên đơn hàng đã hoàn tất."
    />
  );
}
