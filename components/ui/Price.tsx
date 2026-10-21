import { cn } from "@/lib/cn";
import { discountPercent, formatVnd } from "@/lib/format";
import { prescriptionPriceNote } from "@/lib/data/site";

/**
 * Hiển thị giá. Luôn kèm đơn vị. Thuốc kê đơn hiện thêm ghi chú
 * "Cần tư vấn trước khi bán" ngay cạnh giá.
 */
export function Price({
  amount,
  unit,
  originalPrice,
  prescriptionRequired = false,
  size = "md",
  showDiscount = true,
  className,
}: {
  amount: number;
  unit: string;
  originalPrice?: number;
  prescriptionRequired?: boolean;
  size?: "md" | "lg";
  /**
   * Thẻ sản phẩm đặt huy hiệu −% đè lên ảnh nên tắt chip ở đây; chỗ khác
   * (trang chi tiết, giỏ hàng) không có ảnh để đè thì vẫn cần chip.
   */
  showDiscount?: boolean;
  className?: string;
}) {
  const off = originalPrice ? discountPercent(amount, originalPrice) : 0;

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={cn(
            "font-mono font-semibold text-ink tabular-nums",
            size === "lg" ? "text-headline-lg" : "text-body-lg",
          )}
        >
          {formatVnd(amount)}
        </span>
        <span className="text-body-sm text-ink-muted">/ {unit}</span>
        {off > 0 && originalPrice ? (
          <>
            <span className="font-mono text-body-sm text-ink-subtle line-through tabular-nums">
              {formatVnd(originalPrice)}
            </span>
            {showDiscount ? (
              <span className="rounded-chip bg-promo-wash px-2 py-0.5 text-label-sm text-promo-text">
                −{off}%
              </span>
            ) : null}
          </>
        ) : null}
      </div>
      {prescriptionRequired ? (
        <span className="text-label-sm text-danger">{prescriptionPriceNote}</span>
      ) : null}
    </div>
  );
}
