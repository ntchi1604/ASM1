import { Check } from "@/lib/icons";
import { cn } from "@/lib/cn";

/**
 * Ba bước đặt hàng. Bước đã qua hiện dấu tích thay vì số: người dùng biết ngay
 * bước nào xong, bước nào đang làm, mà không cần đọc chữ.
 */
const steps = [
  { id: 1, label: "Giỏ hàng" },
  { id: 2, label: "Thanh toán" },
  { id: 3, label: "Hoàn tất" },
];

export function CheckoutSteps({ current }: { current: number }) {
  return (
    <nav aria-label="Tiến trình đặt hàng">
      <ol className="flex items-center gap-2 md:gap-3">
        {steps.map((step, index) => {
          const done = step.id < current;
          const active = step.id === current;

          return (
            <li key={step.id} className="flex items-center gap-2 md:gap-3">
              <span
                className="flex items-center gap-2"
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-chip text-label-sm",
                    done
                      ? "bg-trust text-white"
                      : active
                        ? "bg-trust text-white"
                        : "border border-hairline bg-card text-ink-subtle",
                  )}
                >
                  {done ? <Check size={15} aria-hidden /> : step.id}
                </span>
                <span
                  className={cn(
                    "text-label-sm",
                    active ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {step.label}
                </span>
              </span>

              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "h-px w-6 md:w-12",
                    done ? "bg-trust" : "bg-divider",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
