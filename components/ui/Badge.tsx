import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * prescription — thuốc kê đơn, đỏ đặc (dùng nhiều nhất)
 * promo        — giảm giá
 * supplement   — thực phẩm bảo vệ sức khoẻ
 * ai           — nhãn nội dung AI, CHỈ trong components/ai
 * neutral      — nhãn trung tính (xuất xứ, thương hiệu)
 */
export type BadgeTone =
  | "prescription"
  | "promo"
  | "supplement"
  | "ai"
  | "neutral";

const toneClass: Record<BadgeTone, string> = {
  prescription: "bg-danger text-white",
  promo: "bg-promo-wash text-promo-text",
  supplement: "bg-recessed text-ink-muted",
  ai: "bg-ai-wash text-ai-text border border-ai/30",
  neutral: "bg-recessed text-ink-muted",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-chip px-2 py-0.5 text-label-sm",
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
