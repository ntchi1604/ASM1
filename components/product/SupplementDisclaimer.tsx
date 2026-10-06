import { supplementDisclaimer } from "@/lib/data/site";
import { Info } from "@/lib/icons";
import { cn } from "@/lib/cn";

/**
 * Khuyến cáo bắt buộc cho thực phẩm bảo vệ sức khoẻ (TPBS).
 *
 * Câu chữ KHÔNG nằm ở đây — nó lấy từ `supplementDisclaimer` trong lib/data/site.ts,
 * cùng một chuỗi mà chân trang đang dùng. Đây là câu bắt buộc theo quy định, nên nó
 * chỉ được có đúng một bản trong toàn bộ mã: nếu mỗi chỗ tự viết lại thì sớm muộn sẽ
 * có chỗ viết thiếu chữ "chữa bệnh" và câu đó không còn đúng luật nữa.
 *
 * Component này gom phần MARKUP đang bị lặp: trang chi tiết và trang danh mục trước
 * đó có hai khối <p> giống nhau từng class, chỉ khác padding. Lặp markup thì đổi kiểu
 * hiển thị phải sửa hai nơi, và một nơi sẽ bị quên.
 *
 * Màu xám trung tính, không tô đỏ: đây là thông tin phân loại sản phẩm, không phải
 * cảnh báo nguy hiểm. Đỏ trên site này dành riêng cho thuốc kê đơn và cảnh báo an
 * toàn — pha loãng nó bằng khuyến cáo TPBS thì cảnh báo thật mất trọng lượng.
 */
export function SupplementDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-card border border-hairline bg-recessed px-3 py-2.5 text-body-sm text-ink-muted",
        className,
      )}
    >
      <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
      <span>{supplementDisclaimer}</span>
    </p>
  );
}
