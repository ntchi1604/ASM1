import Link from "next/link";
import { Check, MapPin, Store, Truck, Zap } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { formatVnd } from "@/lib/format";
import { deliveryMethods, type DeliveryMethodId } from "@/lib/data/delivery";

const icons: Record<DeliveryMethodId, typeof Truck> = {
  nhanh: Zap,
  "tieu-chuan": Truck,
  "nhan-tai-nha-thuoc": Store,
};

/**
 * Chọn hình thức nhận hàng. Là <Link> đổi `?nhan=` chứ không phải radio JS: phí
 * giao đổi theo lựa chọn, nên lựa chọn phải nằm trong URL để tổng tiền do server
 * tính lại — không có hai nơi cùng cộng tiền.
 */
export function DeliveryOptions({
  selected,
  hrefFor,
}: {
  selected: DeliveryMethodId;
  /** Trang tự dựng link để giữ lại các tham số khác như mã giảm giá. */
  hrefFor: (id: DeliveryMethodId) => string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {deliveryMethods.map((method) => {
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

              <span className="mt-0.5 block text-body-sm text-ink-muted">
                {method.eta()}
              </span>

              {method.pharmacy ? (
                <span className="mt-1 flex items-start gap-1.5 text-body-sm text-ink-muted">
                  <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden />
                  {method.pharmacy.name} — {method.pharmacy.address}, cách bạn{" "}
                  {method.pharmacy.distanceKm.toFixed(1).replace(".", ",")} km
                </span>
              ) : null}
            </span>

            <span
              className={cn(
                "shrink-0 text-label-md tabular-nums",
                method.fee === 0 ? "text-promo-text" : "text-ink",
              )}
            >
              {method.fee === 0 ? "Miễn phí" : formatVnd(method.fee)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
