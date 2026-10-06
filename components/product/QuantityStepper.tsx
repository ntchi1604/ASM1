import type { ReactNode } from "react";
import { Minus, Plus } from "@/lib/icons";
import { cn } from "@/lib/cn";

/**
 * Chọn số lượng. Là các nút thật (không phải link) vì số lượng chưa gửi đi
 * đâu cho tới khi bấm "Thêm vào giỏ" — không nên nằm trong URL.
 *
 * `max` lấy từ tồn kho: không cho gõ 50 hộp khi kho còn 12, để lỗi hiện ra ở
 * đây thay vì ở bước thanh toán.
 *
 * `compact` bỏ nhãn "Số lượng" và dòng "Tối đa N" cho từng dòng giỏ hàng —
 * ở đó cột đã có tiêu đề riêng nên nhãn sẽ bị lặp. Vẫn dùng chung MỘT
 * component để cái hộp bấm ở trang chi tiết và trong giỏ hàng giống nhau.
 */
export function QuantityStepper({
  value = 1,
  max,
  compact = false,
  className,
}: {
  value?: number;
  max: number;
  compact?: boolean;
  className?: string;
}) {
  const atMin = value <= 1;
  const atMax = value >= max;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {compact ? null : <p className="text-label-md text-ink">Số lượng</p>}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-card border border-hairline bg-card">
          <StepButton label="Giảm số lượng" disabled={atMin}>
            <Minus size={16} aria-hidden />
          </StepButton>
          <input
            type="text"
            inputMode="numeric"
            defaultValue={value}
            aria-label="Số lượng"
            className={cn(
              "border-x border-hairline bg-transparent py-2 text-center font-mono text-body-md tabular-nums text-ink outline-none",
              compact ? "w-10" : "w-12",
            )}
          />
          <StepButton label="Tăng số lượng" disabled={atMax}>
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

function StepButton({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={cn(
        "focus-ring px-3 py-2 transition-colors",
        disabled ? "text-ink-subtle" : "text-ink hover:bg-recessed",
      )}
    >
      {children}
    </button>
  );
}
