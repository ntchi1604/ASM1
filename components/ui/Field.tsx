import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/cn";

/**
 * Ô nhập liệu của MediVia. Nhãn luôn là <label> thật gắn với input bằng id —
 * không dùng placeholder làm nhãn, vì placeholder biến mất ngay khi người dùng
 * bắt đầu gõ và họ không còn biết ô đó là ô gì.
 */
export function Field({
  label,
  id,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  id: string;
  /** Chú thích nhỏ dưới ô, ví dụ quy định định dạng. */
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-label-sm text-ink">
        {label}
        {required ? (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (bắt buộc)</span> : null}
      </label>
      {children}
      {hint ? <p className="text-body-sm text-ink-subtle">{hint}</p> : null}
    </div>
  );
}

const controlClass =
  "h-11 w-full rounded-card border border-hairline bg-card px-3 text-body-md text-ink " +
  "placeholder:text-ink-subtle focus-ring transition-colors hover:border-trust/40";

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn(controlClass, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlClass, "h-auto min-h-20 py-2.5", className)}
      {...rest}
    />
  );
}

/**
 * Select bọc trong div để tự vẽ mũi chevron: mũi mặc định của trình duyệt khác
 * nhau trên Windows, macOS và Android nên ô chọn sẽ trông khác nhau ở mỗi máy.
 */
export function Select({
  className,
  children,
  ...rest
}: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(controlClass, "appearance-none pr-10", className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle"
      />
    </div>
  );
}
