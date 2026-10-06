import { cn } from "@/lib/cn";
import { formatVnd } from "@/lib/format";
import type { OrderSummary } from "@/lib/data/coupons";

/**
 * Bảng tiền của đơn hàng. Dùng chung cho /gio-hang và /thanh-toan, đọc từ
 * `getOrderSummary` — hai trang không được phép ra hai con số.
 *
 * Mỗi khoản giảm đều nói RÕ giảm từ đâu: "Giảm giá sản phẩm" (giá gốc → giá
 * bán) khác với "Mã GIAM50K". Gộp thành một dòng "Giảm giá" thì người dùng
 * không kiểm tra được mã của mình có được trừ thật hay không.
 */
export function OrderSummaryCard({
  summary,
  className,
}: {
  summary: OrderSummary;
  className?: string;
}) {
  const {
    count,
    originalSubtotal,
    productDiscount,
    coupon,
    couponDiscount,
    delivery,
    shipping,
    freeshipRedundant,
    total,
  } = summary;

  return (
    <section className={cn("rounded-card border border-hairline bg-card p-4", className)}>
      <h2 className="text-label-md text-ink">Tổng tiền</h2>

      <dl className="mt-3 flex flex-col gap-2 text-body-md">
        <Row label={`Tạm tính (${count} sản phẩm)`} value={formatVnd(originalSubtotal)} />

        {productDiscount > 0 ? (
          <Row
            label="Giảm giá sản phẩm"
            value={`− ${formatVnd(productDiscount)}`}
            tone="promo"
          />
        ) : null}

        {couponDiscount > 0 && coupon ? (
          <Row
            label={`Mã ${coupon.code}`}
            value={`− ${formatVnd(couponDiscount)}`}
            tone="promo"
          />
        ) : null}

        <Row
          label={`Phí giao hàng (${delivery.name.toLowerCase()})`}
          value={shipping === 0 ? "Miễn phí" : formatVnd(shipping)}
          tone={shipping === 0 ? "promo" : "default"}
        />
      </dl>

      <div className="mt-3 flex items-baseline justify-between border-t border-divider pt-3">
        <span className="text-label-md text-ink">Cần thanh toán</span>
        <span className="text-headline-md tabular-nums text-trust-text">
          {formatVnd(total)}
        </span>
      </div>

      {/* Nói rõ đã tiết kiệm bao nhiêu, gộp cả giảm giá sản phẩm và mã. */}
      {productDiscount + couponDiscount > 0 ? (
        <p className="mt-1.5 text-body-sm text-promo-text">
          Bạn tiết kiệm {formatVnd(productDiscount + couponDiscount)} so với giá gốc
        </p>
      ) : null}

      {freeshipRedundant ? (
        <p className="mt-1.5 text-body-sm text-ink-muted">
          Mã {coupon?.code} chưa có tác dụng vì hình thức nhận hàng bạn chọn đã miễn
          phí giao.
        </p>
      ) : null}

      <p className="mt-1.5 text-body-sm text-ink-subtle">Giá đã bao gồm VAT.</p>
    </section>
  );
}

function Row({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "promo";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          tone === "promo" ? "text-promo-text" : "text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
