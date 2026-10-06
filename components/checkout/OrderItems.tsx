import Link from "next/link";
import { formatVnd } from "@/lib/format";
import { ProductThumb } from "@/components/product/ProductThumb";
import type { CartItem } from "@/lib/data/cart";

/**
 * Danh sách hàng ở bước thanh toán: chỉ đọc, không có nút tăng giảm.
 *
 * Muốn sửa số lượng thì quay lại giỏ hàng — cho sửa ở đây nghĩa là số tiền có
 * thể đổi ngay dưới ngón tay người dùng khi họ đang chuẩn bị bấm "Đặt hàng".
 */
export function OrderItems({ items }: { items: CartItem[] }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="text-label-md text-ink">Đơn hàng của bạn</h2>
        <Link
          href="/gio-hang"
          className="focus-ring text-body-sm text-trust-text underline decoration-trust/30 underline-offset-2"
        >
          Sửa giỏ hàng
        </Link>
      </div>
      <p className="mt-0.5 text-body-sm text-ink-muted">{items.length} sản phẩm</p>

      <ul className="mt-3 flex flex-col gap-3">
        {items.map((item) => (
          <li key={`${item.product.id}-${item.unit.label}`} className="flex gap-3">
            <ProductThumb product={item.product} size="sm" />

            <div className="min-w-0 flex-1">
              <p className="line-clamp-2-name text-body-sm text-ink">
                {item.product.name}
              </p>
              <p className="mt-0.5 text-body-sm text-ink-subtle">
                {item.unit.label} × {item.line.quantity}
              </p>
            </div>

            <p className="shrink-0 text-label-sm tabular-nums text-ink">
              {formatVnd(item.lineTotal)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
