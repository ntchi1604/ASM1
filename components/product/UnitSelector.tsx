import Link from "next/link";
import type { Product, ProductUnit } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatVnd } from "@/lib/format";

/**
 * Chọn đơn vị bán. Mỗi lựa chọn là một link ?dv=... nên đổi đơn vị không cần
 * JavaScript, và link sản phẩm kèm đơn vị có thể gửi cho người khác.
 *
 * Giá LUÔN hiện ngay trong từng lựa chọn. Người mua cần so giá hộp với giá vỉ
 * trước khi chọn, không phải chọn rồi mới thấy giá đổi.
 */
export function UnitSelector({
  product,
  selected,
  hrefFor,
}: {
  product: Product;
  selected: ProductUnit;
  /** Đường dẫn giữ nguyên số lượng đang chọn. */
  hrefFor: (label: string) => string;
}) {
  if (product.units.length <= 1) return null;

  return (
    <div>
      <p className="mb-2 text-label-md text-ink">Chọn đơn vị</p>
      <div role="group" aria-label="Chọn đơn vị bán" className="flex flex-wrap gap-2">
        {product.units.map((unit) => {
          const active = unit.label === selected.label;
          return (
            <Link
              key={unit.label}
              href={hrefFor(unit.label)}
              aria-current={active ? "true" : undefined}
              scroll={false}
              className={cn(
                "focus-ring min-w-24 rounded-card border px-3 py-2 text-center transition-colors",
                active
                  ? "border-trust bg-trust-wash"
                  : "border-hairline bg-card hover:border-trust/40",
              )}
            >
              <span className={cn("block text-label-md", active ? "text-trust-text" : "text-ink")}>
                {unit.label}
              </span>
              <span className="mt-0.5 block font-mono text-body-sm tabular-nums text-ink-muted">
                {formatVnd(unit.price)}
              </span>
              {unit.packaging ? (
                <span className="mt-0.5 block text-label-sm text-ink-subtle">
                  {unit.packaging}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
