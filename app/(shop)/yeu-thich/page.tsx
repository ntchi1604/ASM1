import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import { Heart } from "@/lib/icons";
import { readWishlistProducts } from "@/lib/shop/wishlist-cookie";

export const metadata: Metadata = {
  title: "Danh sách yêu thích",
  description: "Các sản phẩm bạn đã lưu trên máy này để mua sau.",
};

/**
 * Danh sách yêu thích.
 *
 * Nhấn mạnh "trên máy này" thay vì giả vờ có tài khoản: danh sách nằm trong
 * cookie, đổi máy hay xoá cookie là mất. Nói trước còn hơn để người dùng dựa
 * vào nó rồi mất.
 *
 * Bỏ thích tại chỗ: action không redirect, Next render lại đúng tuyến này và
 * thẻ vừa bỏ tự biến khỏi lưới.
 */
export default async function WishlistPage() {
  const products = await readWishlistProducts();

  return (
    <div className="container-medivia py-6 md:py-8">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Yêu thích" }]} />

      <h1 className="mt-3 text-headline-xl text-ink">Danh sách yêu thích</h1>
      <p className="mt-1 text-body-md text-ink-muted">
        {products.length > 0
          ? `${products.length} sản phẩm đã lưu trên máy này`
          : "Chưa có sản phẩm nào được lưu"}
      </p>

      {products.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-card border border-hairline bg-card px-6 py-14 text-center">
          <span className="text-ink-subtle">
            <Heart size={40} aria-hidden />
          </span>
          <p className="text-headline-md text-ink">Danh sách đang trống</p>
          <p className="max-w-md text-body-md text-ink-muted">
            Bấm biểu tượng trái tim trên thẻ sản phẩm để lưu lại. Danh sách nằm trên
            máy này — đổi máy hoặc xoá dữ liệu trình duyệt là mất.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/danh-muc/cam-cum-ha-sot">Xem danh mục thuốc</ButtonLink>
            <ButtonLink href="/ai/tim-kiem" variant="outline-trust">
              Tìm thuốc bằng AI
            </ButtonLink>
          </div>
        </div>
      ) : (
        <>
          <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-body-sm text-ink-subtle">
            Bấm trái tim để bỏ khỏi danh sách. Giá đọc lại từ danh mục mỗi lần mở
            trang, nên danh sách luôn khớp giá hiện tại.
          </p>
        </>
      )}
    </div>
  );
}
