import Link from "next/link";
import { AlertTriangle, Delete } from "@/lib/icons";
import { formatVnd } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { ProductThumb } from "@/components/product/ProductThumb";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { StockStatus } from "@/components/ui/StockStatus";
import { removeFromCart, setCartQuantity } from "@/lib/shop/cart-actions";
import type { CartItem } from "@/lib/data/cart";

/**
 * Một dòng trong giỏ hàng.
 *
 * Mọi thao tác đều là form gửi lên server action: đổi số lượng, xoá dòng. Không
 * có `"use client"` — giỏ hàng chạy được cả khi JavaScript chưa tải xong, và
 * không có bản sao trạng thái nào trong trình duyệt để lệch với cookie.
 *
 * Có hoạt chất ngay dưới tên thuốc: đây là trang duy nhất người dùng thấy các
 * thuốc cạnh nhau, nên cũng là chỗ duy nhất họ tự nhận ra hai hộp khác tên lại
 * cùng một hoạt chất — đúng thứ mà cảnh báo phía trên đang nói.
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
    <li className="grid grid-cols-1 items-start gap-y-3 border-b border-divider px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_116px_128px_116px] md:gap-4">
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

          {/* Thuốc kê đơn nằm trong giỏ được, nhưng chưa được soạn. Nói ngay ở
              dòng hàng thay vì để tới bước thanh toán mới báo — khách phải biết
              mình sắp phải chuẩn bị ảnh đơn. */}
          {product.prescriptionRequired ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Badge tone="prescription">Kê đơn</Badge>
              <span className="text-body-sm text-ink-subtle">
                Cần ảnh đơn ở bước thanh toán
              </span>
            </p>
          ) : null}
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
            <RemoveButton productId={product.id} unitLabel={unit.label} name={product.name} />
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

      {/* Số lượng — mỗi nút là một lần gửi form, không cần JS. */}
      <form action={setCartQuantity} className="md:pt-0">
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="unitLabel" value={unit.label} />
        <QuantityStepper
          value={line.quantity}
          max={product.stock.total}
          compact
          submitName="quantity"
        />
      </form>

      {/* Tạm tính */}
      <div className="flex items-baseline justify-between md:justify-end">
        <span className="text-body-sm text-ink-muted md:hidden">Tạm tính</span>
        <span className="text-label-md tabular-nums text-ink">{formatVnd(lineTotal)}</span>
      </div>
    </li>
  );
}

function RemoveButton({
  productId,
  unitLabel,
  name,
}: {
  productId: string;
  unitLabel: string;
  name: string;
}) {
  return (
    <form action={removeFromCart}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="unitLabel" value={unitLabel} />
      <button
        type="submit"
        aria-label={`Xoá ${name} khỏi giỏ hàng`}
        className="focus-ring -ml-2 inline-flex items-center gap-1.5 rounded-chip px-2 py-1 text-label-sm text-ink-subtle transition-colors hover:bg-danger-wash hover:text-danger"
      >
        <Delete size={14} aria-hidden />
        Xoá
      </button>
    </form>
  );
}
