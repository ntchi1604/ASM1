import Link from "next/link";
import { Banknote, Check, CreditCard, QrCode, Wallet } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { paymentMethods, type PaymentMethodId } from "@/lib/data/payment";

const icons: Record<PaymentMethodId, typeof Wallet> = {
  cod: Banknote,
  momo: Wallet,
  zalopay: Wallet,
  vnpay: QrCode,
  the: CreditCard,
};

/**
 * Chọn phương thức thanh toán, cũng nằm trong URL như hình thức nhận hàng để
 * bước xác nhận đọc được lựa chọn mà không cần lưu tạm ở client.
 *
 * COD đứng đầu vì đây là cách phổ biến nhất khi mua thuốc: người mua muốn xem
 * thuốc và hoá đơn trước khi trả tiền.
 */
export function PaymentOptions({
  selected,
  hrefFor,
}: {
  selected: PaymentMethodId;
  hrefFor: (id: PaymentMethodId) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {paymentMethods.map((method) => {
        const active = method.id === selected;
        const Icon = icons[method.id];

        return (
          <Link
            key={method.id}
            href={hrefFor(method.id)}
            aria-pressed={active}
            className={cn(
              "focus-ring flex items-start gap-3 rounded-card border p-3.5 transition-colors",
              active
                ? "border-trust bg-trust-wash"
                : "border-hairline bg-card hover:border-trust/40 hover:bg-recessed",
            )}
          >
            <span
              className={cn(
                "mt-0.5 shrink-0",
                active ? "text-trust-text" : "text-ink-muted",
              )}
            >
              <Icon size={18} aria-hidden />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-label-md text-ink">{method.name}</span>
                {active ? (
                  <span className="inline-flex items-center gap-1 rounded-chip bg-trust px-2 py-0.5 text-label-sm text-white">
                    <Check size={12} aria-hidden />
                    Đang chọn
                  </span>
                ) : null}
              </span>
              {method.note ? (
                <span className="mt-0.5 block text-body-sm text-ink-muted">
                  {method.note}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
