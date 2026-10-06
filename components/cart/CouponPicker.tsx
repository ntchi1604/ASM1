import Link from "next/link";
import { AlertTriangle, Check, Percent, Truck } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { formatVnd } from "@/lib/format";
import { coupons, type Coupon } from "@/lib/data/coupons";

/**
 * Chọn mã giảm giá. Mỗi mã là một <Link> đổi `?ma=` chứ không phải nút JS:
 * mã đang dùng nằm trong URL nên tải lại trang hay bấm quay lại vẫn đúng, và
 * trang /thanh-toan nhận được mã qua chính link đó.
 *
 * Bấm lại mã đang chọn thì bỏ chọn — không cần thêm một nút "Bỏ mã" riêng.
 */
export function CouponPicker({
  applied,
  rejected,
  subtotal,
}: {
  applied?: Coupon;
  /** Người dùng đã chọn mã nhưng chưa đủ điều kiện. */
  rejected: boolean;
  subtotal: number;
}) {
  return (
    <section className="rounded-card border border-hairline bg-card p-4">
      <h2 className="text-label-md text-ink">Mã giảm giá</h2>

      <div className="mt-3 flex flex-col gap-2">
        {coupons.map((coupon) => {
          const active = applied?.code === coupon.code;
          const eligible = subtotal >= coupon.minSubtotal;
          const missing = coupon.minSubtotal - subtotal;

          return (
            <Link
              key={coupon.code}
              href={active ? "/gio-hang" : `/gio-hang?ma=${coupon.code}`}
              aria-pressed={active}
              className={cn(
                "focus-ring flex items-start gap-3 rounded-card border p-3 transition-colors",
                active
                  ? "border-trust bg-trust-wash"
                  : eligible
                    ? "border-hairline hover:border-trust/40 hover:bg-recessed"
                    : "border-hairline bg-recessed",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 shrink-0",
                  active ? "text-trust-text" : eligible ? "text-promo-text" : "text-ink-subtle",
                )}
              >
                {coupon.kind === "freeship" ? (
                  <Truck size={18} aria-hidden />
                ) : (
                  <Percent size={18} aria-hidden />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-label-md text-ink">{coupon.code}</span>
                  {active ? (
                    <span className="inline-flex items-center gap-1 rounded-chip bg-trust px-2 py-0.5 text-label-sm text-white">
                      <Check size={12} aria-hidden />
                      Đang dùng
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-body-sm text-ink-muted">
                  {coupon.description}
                </span>
                {!eligible ? (
                  <span className="mt-1 block text-body-sm text-ink-subtle">
                    Cần mua thêm {formatVnd(missing)} để dùng mã này
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>

      {rejected ? (
        <p className="mt-3 flex items-start gap-2 rounded-card bg-danger-wash p-2.5 text-body-sm text-danger">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
          Mã bạn chọn chưa đủ điều kiện cho đơn hàng này nên chưa được trừ vào tổng
          tiền.
        </p>
      ) : null}
    </section>
  );
}
