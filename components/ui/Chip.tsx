import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { X } from "@/lib/icons";

/**
 * Chip. Hai dạng: chip lọc bấm được và chip đang lọc có nút bỏ.
 * Dùng Link thay vì button để bộ lọc hoạt động không cần JavaScript và
 * trạng thái lọc nằm trong URL — chia sẻ được, back/forward đúng.
 */

export function ChipLink({
  href,
  children,
  active = false,
  count,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
  /** Số sản phẩm khớp, hiện mờ phía sau nhãn. */
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-chip border px-3 py-1.5 text-body-sm whitespace-nowrap transition-colors",
        active
          ? "border-trust bg-trust-wash font-medium text-trust-text"
          : "border-hairline bg-card text-ink-muted hover:border-trust hover:text-trust-text",
      )}
    >
      {children}
      {count !== undefined ? (
        <span className="text-label-sm text-ink-subtle tabular-nums">{count}</span>
      ) : null}
    </Link>
  );
}

export function RemovableChip({
  href,
  children,
  removeLabel,
}: {
  /** URL sau khi bỏ điều kiện này. */
  href: string;
  children: ReactNode;
  /** Đọc cho trình đọc màn hình: bỏ điều kiện gì. */
  removeLabel: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-chip border border-trust bg-trust-wash py-1 pr-1 pl-3 text-body-sm font-medium text-trust-text">
      {children}
      <Link
        href={href}
        aria-label={removeLabel}
        className="focus-ring grid size-5 place-items-center rounded-chip transition-colors hover:bg-trust hover:text-white"
      >
        <X size={13} aria-hidden />
      </Link>
    </span>
  );
}
