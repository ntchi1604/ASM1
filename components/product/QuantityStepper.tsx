import type { ReactNode } from "react";
import Link from "next/link";
import { Minus, Plus } from "@/lib/icons";
import { cn } from "@/lib/cn";

/**
 * Chọn số lượng. Không có `"use client"` — bấm nút là điều hướng hoặc gửi form,
 * nên không cần một byte JavaScript nào ở đây.
 *
 * Hai chế độ, chọn đúng một:
 *  - `hrefFor`  — số lượng nằm trong URL (`?sl=2`). Dùng ở trang sản phẩm, nơi
 *    chưa có gì để gửi cho tới khi bấm "Thêm vào giỏ". Đổi số lượng là điều
 *    hướng, nút quay lại của trình duyệt vẫn đúng.
 *  - `submitName` — mỗi nút là nút gửi form, mang giá trị `value ± 1`. Dùng ở
 *    giỏ hàng, nơi mỗi lần bấm là một lần lưu thật.
 *
 * Ô số ở giữa chỉ để HIỂN THỊ khi ở chế độ form: nếu nó cũng mang `name`, form
 * có hai giá trị cùng tên và bấm "tăng" sẽ gửi lại số cũ. Muốn gõ số trực tiếp
 * thì sửa trên URL của trang sản phẩm.
 *
 * `max` lấy từ tồn kho: không cho cộng quá số đang có, để lỗi hiện ra ở đây
 * thay vì ở bước thanh toán.
 */
export function QuantityStepper({
  value = 1,
  max,
  compact = false,
  className,
  submitName,
  hrefFor,
}: {
  value?: number;
  max: number;
  compact?: boolean;
  className?: string;
  submitName?: string;
  hrefFor?: (next: number) => string;
}) {
  const atMin = value <= 1;
  const atMax = value >= max;
  const down = Math.max(1, value - 1);
  const up = Math.min(max, value + 1);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {compact ? null : <p className="text-label-md text-ink">Số lượng</p>}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-card border border-hairline bg-card">
          <StepButton
            label="Giảm số lượng"
            disabled={atMin}
            submitName={submitName}
            next={down}
            href={hrefFor?.(down)}
          >
            <Minus size={16} aria-hidden />
          </StepButton>
          <input
            type="text"
            inputMode="numeric"
            readOnly
            value={value}
            aria-label="Số lượng"
            className={cn(
              "border-x border-hairline bg-transparent py-2 text-center font-mono text-body-md tabular-nums text-ink outline-none",
              compact ? "w-10" : "w-12",
            )}
          />
          <StepButton
            label="Tăng số lượng"
            disabled={atMax}
            submitName={submitName}
            next={up}
            href={hrefFor?.(up)}
          >
            <Plus size={16} aria-hidden />
          </StepButton>
        </div>
        {max > 0 && !compact ? (
          <span className="text-body-sm text-ink-subtle">Tối đa {max}</span>
        ) : null}
      </div>
    </div>
  );
}

/** Link ưu tiên hơn nút gửi form: trang sản phẩm không có form nào bọc ngoài. */
function StepButton({
  label,
  disabled,
  submitName,
  next,
  href,
  children,
}: {
  label: string;
  disabled: boolean;
  submitName?: string;
  next: number;
  href?: string;
  children: ReactNode;
}) {
  const className = cn(
    "focus-ring px-3 py-2 transition-colors",
    disabled ? "text-ink-subtle" : "text-ink hover:bg-recessed",
  );

  if (href) {
    return (
      <Link
        href={href}
        scroll={false}
        aria-label={label}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        className={cn(className, disabled && "pointer-events-none")}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={submitName ? "submit" : "button"}
      name={submitName}
      value={submitName ? next : undefined}
      aria-label={label}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}
