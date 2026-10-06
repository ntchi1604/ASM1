import { cn } from "@/lib/cn";
import { formatDate, formatStock } from "@/lib/format";

/**
 * Tồn kho viết cụ thể: "Còn 12 hộp tại 3 nhà thuốc gần bạn".
 * Không dùng chữ "Còn hàng" chung chung.
 *
 * Hết hàng mà biết ngày về thì nói luôn ngày — đây là chỗ duy nhất diễn đạt
 * việc hết hàng, nên mọi trang đều nói giống nhau.
 */
export function StockStatus({
  total,
  nearbyPharmacies,
  unit,
  restockDate,
  className,
}: {
  total: number;
  nearbyPharmacies: number;
  unit: string;
  /** Chỉ có nghĩa khi total = 0. */
  restockDate?: string;
  className?: string;
}) {
  const soldOut = total <= 0;

  const text =
    soldOut && restockDate
      ? `Hết hàng, dự kiến có lại ${formatDate(restockDate)}`
      : formatStock(total, nearbyPharmacies, unit);

  return (
    <p className={cn("text-body-sm", soldOut ? "text-ink-subtle" : "text-trust-text", className)}>
      {text}
    </p>
  );
}
