import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Khung thẻ chuẩn: nền trắng, bo 12px, viền hairline 1px. Không đổ bóng. */
export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={cn(
        "rounded-card border border-hairline bg-card",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Tiêu đề khối, dùng chung để mọi section có cùng nhịp. */
export function SectionHeading({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <h2 className="text-headline-md text-ink">{title}</h2>
      {action}
    </div>
  );
}
