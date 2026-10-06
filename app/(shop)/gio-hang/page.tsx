import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight, BadgeCheck, Clock, RotateCcw, ShoppingCart } from "@/lib/icons";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { CartInteractionPanel } from "@/components/cart/CartInteractionPanel";
import { CartLineRow } from "@/components/cart/CartLineRow";
import { CartSuggestions } from "@/components/cart/CartSuggestions";
import { CouponPicker } from "@/components/cart/CouponPicker";
import { OrderSummaryCard } from "@/components/cart/OrderSummaryCard";
import { getCartItems, getCartProductIds } from "@/lib/data/cart";
import { getCartSuggestions } from "@/lib/data/bought-together";
import { getOrderSummary } from "@/lib/data/coupons";
import { findCartInteractions, severeProductIds } from "@/lib/data/interactions";

export const metadata: Metadata = {
  title: "Giỏ hàng",
  description:
    "Kiểm tra giỏ hàng và xem cảnh báo tương tác thuốc do AI của MediVia đối soát trước khi thanh toán.",
};

/**
 * Trang giỏ hàng.
 *
 * Thứ tự khối là có chủ ý: cảnh báo tương tác đứng TRƯỚC danh sách hàng. Người
 * dùng vào trang này để bấm thanh toán, nên thông tin có thể khiến họ dừng lại
 * phải nằm trên đường đi tới nút đó, không nằm dưới.
 *
 * Mã giảm giá đọc từ `?ma=` nên tình trạng giỏ hàng chia sẻ được và nút quay
 * lại của trình duyệt hoạt động đúng.
 */
export default async function CartPage({
  searchParams,
}: PageProps<"/gio-hang">) {
  const { ma } = await searchParams;
  const couponCode = Array.isArray(ma) ? ma[0] : ma;

  const items = getCartItems();
  // Không truyền hình thức nhận hàng: giỏ hàng hiển thị phí mặc định, người dùng
  // chọn hình thức thật ở bước thanh toán.
  const summary = getOrderSummary(couponCode);
  const interactions = findCartInteractions(getCartProductIds());
  const flagged = severeProductIds(interactions);
  const suggestions = getCartSuggestions(getCartProductIds());

  return (
    <div className="container-medivia py-6 md:py-8">
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Giỏ hàng" }]}
      />

      <h1 className="mt-3 text-headline-xl text-ink">Giỏ hàng của bạn</h1>
      <p className="mt-1 text-body-md text-ink-muted">
        {items.length > 0
          ? `${items.length} sản phẩm đang chờ thanh toán`
          : "Chưa có sản phẩm nào"}
      </p>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="flex flex-col gap-5">
            <CartInteractionPanel interactions={interactions} />

            <section
              aria-label="Danh sách sản phẩm"
              className="overflow-hidden rounded-card border border-hairline bg-card"
            >
              <div className="hidden grid-cols-[auto_minmax(0,1fr)_116px_128px_116px] gap-4 border-b border-divider bg-recessed px-4 py-2.5 text-label-sm text-ink-muted md:grid">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    aria-label="Chọn tất cả sản phẩm"
                    className="focus-ring size-4 accent-trust"
                  />
                </span>
                <span>Chọn tất cả ({items.length})</span>
                <span>Đơn giá</span>
                <span>Số lượng</span>
                <span className="text-right">Tạm tính</span>
              </div>

              <ul>
                {items.map((item) => (
                  <CartLineRow
                    key={`${item.product.id}-${item.unit.label}`}
                    item={item}
                    flagged={flagged.has(item.product.id)}
                  />
                ))}
              </ul>
            </section>

            <CartSuggestions items={suggestions} />
          </div>

          {/* Cột tiền dính theo màn hình: cuộn danh sách dài vẫn thấy tổng tiền. */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <CouponPicker
              applied={summary.coupon}
              rejected={summary.couponRejected}
              subtotal={summary.subtotal}
            />

            <OrderSummaryCard summary={summary} />

            <ButtonLink
              href={couponCode ? `/thanh-toan?ma=${couponCode}` : "/thanh-toan"}
              size="lg"
              fullWidth
            >
              Tiến hành thanh toán
              <ArrowRight size={18} aria-hidden />
            </ButtonLink>

            <p className="text-body-sm text-ink-muted">
              Bạn sẽ xác nhận lại đơn trước khi dược sĩ soạn hàng.
            </p>

            <ul className="flex flex-col gap-2 rounded-card border border-hairline bg-card p-4">
              <TrustItem icon={<BadgeCheck size={16} aria-hidden />}>
                Dược sĩ kiểm tra đơn trước khi giao
              </TrustItem>
              <TrustItem icon={<Clock size={16} aria-hidden />}>
                Giao trong 2 giờ nội thành
              </TrustItem>
              <TrustItem icon={<RotateCcw size={16} aria-hidden />}>
                Đổi trả trong 30 ngày
              </TrustItem>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function TrustItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-2 text-body-sm text-ink-muted">
      <span className="mt-0.5 shrink-0 text-trust-text">{icon}</span>
      {children}
    </li>
  );
}

function EmptyCart() {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-card border border-hairline bg-card px-6 py-14 text-center">
      <span className="text-ink-subtle">
        <ShoppingCart size={40} aria-hidden />
      </span>
      <p className="text-headline-md text-ink">Giỏ hàng đang trống</p>
      <p className="max-w-md text-body-md text-ink-muted">
        Bạn có thể tìm thuốc theo tên, theo triệu chứng, hoặc nhờ dược sĩ AI của
        MediVia gợi ý.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/danh-muc/thuoc-khong-ke-don">Xem danh mục thuốc</ButtonLink>
        <ButtonLink href="/ai/tim-kiem" variant="outline-trust">
          Tìm thuốc bằng AI
        </ButtonLink>
      </div>
    </div>
  );
}
