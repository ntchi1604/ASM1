import Link from "next/link";
import { BellRing, ShoppingCart, Stethoscope } from "@/lib/icons";
import type { Product } from "@/lib/types";
import { getDefaultUnit } from "@/lib/data/products";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { StockStatus } from "@/components/ui/StockStatus";
import { ProductImage } from "@/components/product/ProductImage";
import { discountPercent } from "@/lib/format";

/**
 * Cấu trúc cố định, không được đổi thứ tự giữa các page:
 * ảnh vuông nền trắng → badge → tên tối đa 2 dòng → hoạt chất + hàm lượng
 * → giá kèm đơn vị → tồn kho → nút full-width.
 *
 * Thuốc kê đơn: nút thêm giỏ hàng bị thay bằng "Tư vấn dược sĩ" ở đây,
 * nên không page nào có thể vô tình cho mua thuốc kê đơn.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const unit = getDefaultUnit(product);
  const href = `/thuoc/${product.slug}`;
  const off = unit.originalPrice
    ? discountPercent(unit.price, unit.originalPrice)
    : 0;
  const soldOut = product.stock.total <= 0;

  return (
    <Card as="article" className="flex h-full flex-col overflow-hidden">
      <Link href={href} className="focus-ring block">
        <ProductImage
          src={product.image}
          name={product.name}
          brand={product.brand}
          priority={priority}
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 border-t border-divider p-3">
        <div className="flex min-h-6 flex-wrap items-center gap-1.5">
          {product.prescriptionRequired ? (
            <Badge tone="prescription">Thuốc kê đơn</Badge>
          ) : null}
          {off > 0 ? <Badge tone="promo">Giảm {off}%</Badge> : null}
          {product.type === "supplement" ? (
            <Badge tone="supplement">TPBS</Badge>
          ) : null}
        </div>

        <h3 className="line-clamp-2-name font-headline text-body-md font-medium text-ink">
          <Link href={href} className="focus-ring hover:text-trust-text">
            {product.name}
          </Link>
        </h3>

        <p className="text-body-sm text-ink-muted">
          {product.activeIngredient} · {product.strength}
        </p>

        <Price
          amount={unit.price}
          unit={unit.label}
          originalPrice={unit.originalPrice}
          prescriptionRequired={product.prescriptionRequired}
          className="mt-auto pt-1"
        />

        <StockStatus
          total={product.stock.total}
          nearbyPharmacies={product.stock.nearbyPharmacies}
          unit={unit.label}
          restockDate={product.stock.restockDate}
        />

        {product.prescriptionRequired ? (
          <ButtonLink href="/ai/chatbot" variant="outline-trust" fullWidth>
            <Stethoscope size={18} aria-hidden />
            Tư vấn dược sĩ
          </ButtonLink>
        ) : soldOut ? (
          // Hết hàng: cho đăng ký nhận thông báo thay vì một nút bị mờ vô ích.
          <Button variant="outline-trust" fullWidth>
            <BellRing size={18} aria-hidden />
            Thông báo khi có hàng
          </Button>
        ) : (
          <Button variant="solid-trust" fullWidth>
            <ShoppingCart size={18} aria-hidden />
            Thêm vào giỏ
          </Button>
        )}
      </div>
    </Card>
  );
}
