import { cn } from "@/lib/cn";

/**
 * Độ tin cậy của một kết quả AI.
 *
 * Hiện số thật chứ không quy về chữ "cao / thấp": người dùng có quyền biết máy
 * chắc bao nhiêu phần trăm rồi tự quyết định, nhất là khi kết quả là tên một
 * loại thuốc họ sắp uống.
 *
 * Dưới 70% đổi sang màu cảnh báo (cam) kèm chữ "chưa chắc". Cùng một con số mà
 * lúc nào cũng tô tím thì màu không còn nói được gì.
 */
export function ConfidenceBadge({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const unsure = percent < 70;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-chip px-2.5 py-1 text-label-sm",
        unsure ? "bg-promo-wash text-promo-text" : "bg-ai-wash text-ai-text",
        className,
      )}
    >
      <span aria-hidden className="text-body-sm">
        {unsure ? "Chưa chắc" : "Độ tin cậy"}
      </span>
      {percent}%
      <span className="sr-only">
        {unsure
          ? " — AI chưa chắc chắn, hãy đối chiếu với vỏ thuốc hoặc hỏi dược sĩ"
          : " độ tin cậy do AI tự đánh giá"}
      </span>
    </span>
  );
}
