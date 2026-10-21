import Link from "next/link";
import { BellRing, ShoppingCart, Stethoscope } from "@/lib/icons";
import type { Product } from "@/lib/types";
import { getDefaultUnit } from "@/lib/data/products";
import { AddToCartForm } from "@/components/cart/AddToCartForm";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { StockStatus } from "@/components/ui/StockStatus";
import { ProductImage } from "@/components/product/ProductImage";
import { WishlistToggle } from "@/components/product/WishlistToggle";
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
      {/* Tim đè lên góc ảnh: nút hành động thứ hai trong thẻ mà không chiếm
          thêm một dòng, vì mọi thẻ trong lưới phải giữ đúng chiều cao. */}
      <div className="relative">
        <Link href={href} className="focus-ring block">
          <ProductImage
            src={product.image}
            name={product.name}
            brand={product.brand}
            priority={priority}
          />
        </Link>
        <WishlistToggle product={product} className="absolute top-2 right-2" />
        {/* Huy hiệu −% đè góc ảnh như Stitch: giảm giá là thông tin so sánh
            giữa các thẻ trong lưới, nên nó phải nằm cùng chỗ trên mọi thẻ. */}
        {off > 0 ? (
          <span className="pointer-events-none absolute top-2 left-2 rounded-chip bg-promo px-2 py-0.5 text-label-sm font-bold text-white">
            −{off}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-divider p-3">
        {/* Luôn giữ hàng cao 24px kể cả khi không có huy hiệu: lưới so sánh
            theo hàng ngang, tên thuốc lệch nhau một dòng là mắt đọc sai thẻ. */}
        <div className="flex min-h-6 flex-wrap items-center gap-1.5">
          {product.prescriptionRequired ? (
            <Badge tone="prescription">Thuốc kê đơn</Badge>
          ) : null}
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
          showDiscount={false}
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
          <AddToCartForm
            product={product}
            fullWidth
            icon={<ShoppingCart size={18} aria-hidden />}
          />
        )}
      </div>
    </Card>
  );
}
