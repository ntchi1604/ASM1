import Link from "next/link";
import { AlertTriangle, Delete } from "@/lib/icons";
import { formatVnd } from "@/lib/format";
import { ProductThumb } from "@/components/product/ProductThumb";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { StockStatus } from "@/components/ui/StockStatus";
import type { CartItem } from "@/lib/data/cart";

/**
 * Một dòng trong giỏ hàng.
 *
 * Có hoạt chất ngay dưới tên thuốc: đây là trang duy nhất người dùng thấy các
 * thuốc cạnh nhau, nên cũng là chỗ duy nhất họ tự nhận ra hai hộp khác tên lại
 * cùng một hoạt chất — đúng thứ mà cảnh báo phía trên đang nói.
 *
 * Tồn kho nằm dưới tên thuốc chứ không ở cột phải: câu tồn kho của MediVia là
 * câu đầy đủ ("Còn 12 hộp tại 3 nhà thuốc gần bạn"), nhồi vào cột hẹp thì xuống
 * dòng lem nhem. Đổi cách viết cho vừa cột thì trang này lại nói khác các trang
 * còn lại.
 *
 * `flagged` đến từ kết quả soát tương tác của cả giỏ, không tự tính lại ở đây:
 * dấu trên dòng và khối cảnh báo phía trên luôn phải kể cùng một câu chuyện.
 */
export function CartLineRow({
  item,
  flagged,
}: {
  item: CartItem;
  flagged: boolean;
}) {
  const { product, unit, line, lineTotal } = item;
  const original = unit.originalPrice;

  return (
    <li className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-3 border-b border-divider px-4 py-4 last:border-b-0 md:grid-cols-[auto_minmax(0,1fr)_116px_128px_116px] md:items-start md:gap-4">
      <input
        type="checkbox"
        defaultChecked
        aria-label={`Chọn ${product.name}`}
        className="focus-ring mt-1 size-4 shrink-0 accent-trust"
      />

      <div className="flex min-w-0 gap-3">
        <ProductThumb product={product} size="lg" />

        <div className="min-w-0">
          <Link
            href={`/thuoc/${product.slug}`}
            className="focus-ring line-clamp-2-name text-label-md text-ink hover:text-trust-text"
          >
            {product.name}
          </Link>
          <p className="mt-0.5 text-body-sm text-ink-muted">{product.activeIngredient}</p>
          <p className="mt-0.5 text-body-sm text-ink-subtle">Đơn vị: {unit.label}</p>
          <StockStatus
            total={product.stock.total}
            nearbyPharmacies={product.stock.nearbyPharmacies}
            unit={unit.label}
            restockDate={product.stock.restockDate}
            className="mt-0.5"
          />

          {flagged ? (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-chip bg-danger-wash px-2 py-0.5 text-label-sm text-danger">
              <AlertTriangle size={13} aria-hidden />
              Liên quan cảnh báo phía trên
            </p>
          ) : null}

          {/* Mobile không có cột đơn giá riêng nên giá đi kèm luôn ở đây. */}
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 md:hidden">
            <span className="text-label-md text-ink">{formatVnd(unit.price)}</span>
            {original ? (
              <span className="text-body-sm text-ink-subtle line-through">
                {formatVnd(original)}
              </span>
            ) : null}
          </div>

          <div className="mt-2">
            <RemoveButton name={product.name} />
          </div>
        </div>
      </div>

      {/* Đơn giá */}
      <div className="hidden flex-col md:flex">
        <span className="text-label-md text-ink">{formatVnd(unit.price)}</span>
        {original ? (
          <span className="text-body-sm text-ink-subtle line-through">
            {formatVnd(original)}
          </span>
        ) : null}
      </div>

      {/* Số lượng */}
      <div className="col-start-2 md:col-start-auto">
        <QuantityStepper value={line.quantity} max={product.stock.total} compact />
      </div>

      {/* Tạm tính */}
      <div className="col-start-2 flex items-baseline justify-between md:col-start-auto md:justify-end">
        <span className="text-body-sm text-ink-muted md:hidden">Tạm tính</span>
        <span className="text-label-md tabular-nums text-ink">{formatVnd(lineTotal)}</span>
      </div>
    </li>
  );
}

function RemoveButton({ name }: { name: string }) {
  return (
    <button
      type="button"
      aria-label={`Xoá ${name} khỏi giỏ hàng`}
      className="focus-ring -ml-2 inline-flex items-center gap-1.5 rounded-chip px-2 py-1 text-label-sm text-ink-subtle transition-colors hover:bg-danger-wash hover:text-danger"
    >
      <Delete size={14} aria-hidden />
      Xoá
    </button>
  );
}
