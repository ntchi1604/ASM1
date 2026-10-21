import type { ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { getDefaultUnit } from "@/lib/data/products";
import { addToCart, buyNow } from "@/lib/shop/cart-actions";
import type { Product } from "@/lib/types";

/**
 * Nút thêm vào giỏ, dùng chung cho mọi thẻ sản phẩm.
 *
 * Một form + một server action, không có `"use client"`: cả site không cần một
 * byte JavaScript nào cho việc thêm hàng. Server action tự dựng lại trang sau
 * khi ghi cookie, nên số trên header và nội dung giỏ đổi ngay.
 *
 * Luôn thêm theo ĐƠN VỊ MẶC ĐỊNH của sản phẩm — muốn đơn vị khác thì vào trang
 * chi tiết, nơi có bộ chọn đơn vị. Thẻ sản phẩm không có chỗ cho một bộ chọn
 * thứ hai, và hai bộ chọn cho cùng một việc là hai chỗ có thể lệch nhau.
 */
export function AddToCartForm({
  product,
  unitLabel,
  quantity = 1,
  variant = "solid-trust",
  size = "md",
  fullWidth = false,
  icon,
  label = "Thêm vào giỏ",
}: {
  product: Product;
  /** Đơn vị đang chọn ở trang chi tiết; bỏ trống thì dùng đơn vị mặc định. */
  unitLabel?: string;
  quantity?: number;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  label?: string;
}) {
  const unit = getDefaultUnit(product);

  return (
    <form action={addToCart}>
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="unitLabel" value={unitLabel ?? unit.label} />
      <input type="hidden" name="quantity" value={quantity} />
      <Button type="submit" variant={variant} size={size} fullWidth={fullWidth}>
        {icon}
        {label}
      </Button>
    </form>
  );
}

/**
 * "Mua ngay": thêm hàng rồi đi thẳng sang thanh toán trong cùng một lượt gửi.
 * Tách khỏi `AddToCartForm` vì mỗi form chỉ có một `action`.
 */
export function BuyNowForm({
  product,
  unitLabel,
  quantity = 1,
  icon,
}: {
  product: Product;
  unitLabel?: string;
  quantity?: number;
  icon?: ReactNode;
}) {
  const unit = getDefaultUnit(product);

  return (
    <form action={buyNow}>
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="unitLabel" value={unitLabel ?? unit.label} />
      <input type="hidden" name="quantity" value={quantity} />
      <Button type="submit" variant="outline-trust" size="lg" fullWidth>
        {icon}
        Mua ngay
      </Button>
    </form>
  );
}
