import { ArrowRight, Zap } from "@/lib/icons";
import { ProductCard } from "@/components/product/ProductCard";
import { SaleCountdown } from "@/components/home/SaleCountdown";
import { getProductsOnSale } from "@/lib/data/products";
import Link from "next/link";

/**
 * Khối giảm giá. Cam nghĩa là khuyến mãi, nên chỉ khối này dùng cam.
 * Header nền cam nhạt + chữ cam đậm, còn ô đếm ngược mới là cam đặc: một
 * dải cam đặc cao 50px đầu khối hút mắt khỏi chính các thẻ sản phẩm bên dưới.
 */
export function FlashSale() {
  const items = getProductsOnSale().slice(0, 5);

  // Giây còn lại tới hết ngày, tính ở server cho lần render đầu.
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const initialSeconds = Math.max(
    0,
    Math.floor((endOfDay.getTime() - now.getTime()) / 1000),
  );

  return (
    <section className="container-medivia pb-8 md:pb-10">
      <div className="overflow-hidden rounded-card border border-hairline">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-promo/30 bg-promo-wash px-4 py-3">
          <h2 className="flex items-center gap-2 font-headline text-headline-md text-promo-text">
            <Zap size={20} aria-hidden />
            Giảm giá hôm nay
          </h2>
          <SaleCountdown initialSeconds={initialSeconds} />
        </div>

        <div className="bg-card p-4">
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {items.map((product, i) => (
              <li key={product.id}>
                <ProductCard product={product} priority={i < 3} />
              </li>
            ))}
          </ul>

          <Link
            href="/danh-muc/thuoc"
            className="focus-ring mt-4 inline-flex items-center gap-1.5 text-label-md text-trust-text hover:underline"
          >
            Xem tất cả sản phẩm đang giảm
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
