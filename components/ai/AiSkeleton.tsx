import { Sparkles } from "@/lib/icons";

/**
 * Trạng thái đang chờ AI trả lời.
 *
 * Có câu chữ mô tả AI đang làm gì, không chỉ mấy vạch xám nhấp nháy: chờ 2 giây
 * mà không biết máy đang làm gì thì người dùng bấm lại lần nữa. Câu chữ do trang
 * truyền vào vì mỗi tính năng làm một việc khác nhau — "đang đọc ảnh vỉ thuốc"
 * khác "đang đối soát 4 thuốc".
 *
 * Vẫn tô tím và vẫn có nhãn AI ngay từ lúc chờ, để nhãn không xuất hiện muộn hơn
 * nội dung mà nó có nhiệm vụ dán nhãn.
 */
export function AiSkeleton({
  message,
  lines = 3,
}: {
  message: string;
  lines?: number;
}) {
  return (
    <section
      className="rounded-card border border-ai/25 bg-ai-wash p-4 md:p-5"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="flex items-center gap-2 text-label-md text-ai-text">
        <Sparkles size={16} className="animate-pulse" aria-hidden />
        {message}
      </p>

      <div className="mt-4 flex flex-col gap-2.5" aria-hidden>
        {Array.from({ length: lines }, (_, index) => (
          <span
            key={index}
            className="block h-3.5 animate-pulse rounded-chip bg-ai/15"
            style={{ width: `${100 - index * 12}%` }}
          />
        ))}
      </div>
    </section>
  );
}
