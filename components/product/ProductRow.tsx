import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { AddToCartForm } from "@/components/cart/AddToCartForm";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { StockStatus } from "@/components/ui/StockStatus";
import { ProductImage } from "@/components/product/ProductImage";
import { getDefaultUnit } from "@/lib/data/products";
import { discountPercent } from "@/lib/format";
import { BellRing, ShoppingCart, Stethoscope } from "@/lib/icons";
import type { Product } from "@/lib/types";

/**
 * Thẻ sản phẩm dạng hàng ngang cho kiểu xem danh sách.
 *
 * Cùng dữ liệu, cùng thứ tự thông tin và CÙNG nhánh kê đơn như ProductCard:
 * thuốc kê đơn không có nút thêm giỏ hàng ở đây cũng như ở kiểu lưới. Khác
 * biệt duy nhất là bố cục.
 */
export function ProductRow({ product }: { product: Product }) {
  const unit = getDefaultUnit(product);
  const href = `/thuoc/${product.slug}`;
  const off = unit.originalPrice ? discountPercent(unit.price, unit.originalPrice) : 0;
  const soldOut = product.stock.total <= 0;

  return (
    <Card as="article" className="flex gap-4 overflow-hidden p-3">
      <Link href={href} className="focus-ring w-[104px] shrink-0 self-start sm:w-[132px]">
        <ProductImage src={product.image} name={product.name} brand={product.brand} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-h-6 flex-wrap items-center gap-1.5">
          {product.prescriptionRequired ? <Badge tone="prescription">Thuốc kê đơn</Badge> : null}
          {off > 0 ? <Badge tone="promo">Giảm {off}%</Badge> : null}
          {product.type === "supplement" ? <Badge tone="supplement">TPBS</Badge> : null}
        </div>

        <h3 className="font-headline text-body-md font-medium text-ink">
          <Link href={href} className="focus-ring hover:text-trust-text">
            {product.name}
          </Link>
        </h3>

        <p className="text-body-sm text-ink-muted">
          {product.activeIngredient} · {product.strength} · {product.brand}
        </p>

        {/* Kiểu danh sách có chỗ rộng nên nói thêm công dụng ngắn. */}
        <p className="text-body-sm text-ink-muted">{product.shortUses}</p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <Price
              amount={unit.price}
              unit={unit.label}
              originalPrice={unit.originalPrice}
              prescriptionRequired={product.prescriptionRequired}
            />
            <StockStatus
              total={product.stock.total}
              nearbyPharmacies={product.stock.nearbyPharmacies}
              unit={unit.label}
              restockDate={product.stock.restockDate}
            />
          </div>

          <div className="w-full sm:w-auto">
            {product.prescriptionRequired ? (
              <ButtonLink href="/ai/chatbot" variant="outline-trust">
                <Stethoscope size={18} aria-hidden />
                Tư vấn dược sĩ
              </ButtonLink>
            ) : soldOut ? (
              <Button variant="outline-trust">
                <BellRing size={18} aria-hidden />
                Thông báo khi có hàng
              </Button>
            ) : (
              <AddToCartForm
                product={product}
                icon={<ShoppingCart size={18} aria-hidden />}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
