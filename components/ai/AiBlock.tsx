import type { ReactNode } from "react";
import { Info, Sparkles } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { aiDisclaimer } from "@/lib/data/site";

/**
 * Khung bọc MỌI nội dung do AI tạo. Đây là chỗ duy nhất màu tím được dùng
 * cho nền và viền, nên người dùng luôn phân biệt được đâu là AI, đâu là
 * thông tin dược đã kiểm duyệt.
 *
 * Bắt buộc có nhãn "AI" ở trên và khuyến cáo ở dưới — cả hai do component
 * tự thêm để không page nào quên.
 */
export function AiBlock({
  label,
  note,
  children,
  disclaimer = true,
  className,
}: {
  /** Nhãn khối, ví dụ "AI gợi ý", "AI tóm tắt". */
  label: string;
  /** Chú thích nhỏ cạnh nhãn, ví dụ "Cá nhân hoá an toàn". */
  note?: string;
  children: ReactNode;
  /** Chỉ tắt khi khối cha đã có khuyến cáo. */
  disclaimer?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-card border border-ai/25 bg-ai-wash p-4 md:p-5",
        className,
      )}
      aria-label={label}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-chip bg-ai px-2.5 py-1 text-label-sm text-white">
          <Sparkles size={14} aria-hidden />
          {label}
        </span>
        {note ? <span className="text-body-sm text-ai-text">{note}</span> : null}
      </div>

      {children}

      {disclaimer ? (
        <p className="mt-4 flex items-start gap-2 border-t border-ai/20 pt-3 text-body-sm text-ink-muted">
          <Info size={16} className="mt-0.5 shrink-0 text-ai-text" aria-hidden />
          {aiDisclaimer}
        </p>
      ) : null}
    </section>
  );
}
