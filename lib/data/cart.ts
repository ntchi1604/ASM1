import type { CartLine, Product, ProductUnit } from "@/lib/types";
import { products } from "@/lib/data/products";

/**
 * Giỏ hàng mẫu — nguồn duy nhất.
 *
 * Số trên header, trang /gio-hang, trang /thanh-toan và cảnh báo tương tác ở
 * trang chi tiết đều đọc từ đây. Trước đó header gõ cứng số 3; chỉ cần thêm
 * một dòng vào giỏ là ba chỗ nói ba con số khác nhau.
 *
 * Cố ý có cả Hapacol 650 và Panadol Extra: hai thuốc tên khác nhau nhưng cùng
 * chứa Paracetamol, nên cảnh báo trùng hoạt chất ở trang giỏ hàng và trang chi
 * tiết là cảnh báo thật, không phải ảnh minh hoạ.
 */
export const cartLines: CartLine[] = [
  { productId: "hapacol-650", unitLabel: "Hộp", quantity: 2 },
  { productId: "panadol-extra", unitLabel: "Vỉ", quantity: 3 },
  { productId: "vitamin-c-1000", unitLabel: "Hộp", quantity: 1 },
  { productId: "oresol-hydrite", unitLabel: "Hộp", quantity: 2 },
];

export type CartItem = {
  line: CartLine;
  product: Product;
  unit: ProductUnit;
  /** Giá dòng = giá đơn vị × số lượng. */
  lineTotal: number;
};

/**
 * Ghép dòng giỏ hàng với sản phẩm và đơn vị đã chọn.
 *
 * Bỏ qua dòng nào trỏ tới sản phẩm hoặc đơn vị không còn tồn tại thay vì để
 * trang vỡ — dữ liệu giỏ hàng thật luôn có thể trỏ tới hàng đã ngừng bán.
 */
export function getCartItems(lines: CartLine[] = cartLines): CartItem[] {
  const items: CartItem[] = [];

  for (const line of lines) {
    const product = products.find((item) => item.id === line.productId);
    if (!product) continue;
    const unit = product.units.find((u) => u.label === line.unitLabel);
    if (!unit) continue;
    items.push({ line, product, unit, lineTotal: unit.price * line.quantity });
  }

  return items;
}

/**
 * Số sản phẩm khác nhau trong giỏ — dùng cho cả số nhỏ trên biểu tượng giỏ
 * hàng và câu "N sản phẩm".
 *
 * Đếm theo DÒNG chứ không cộng số lượng: hai chỗ này luôn phải nói cùng một
 * con số. Nếu badge cộng số lượng (8) mà tiêu đề đếm dòng (4) thì người dùng
 * thấy hai số khác nhau cho cùng một giỏ hàng.
 */
export function getCartCount(lines: CartLine[] = cartLines): number {
  return getCartItems(lines).length;
}

/** Tổng số đơn vị hàng, chỉ dùng khi cần nói "8 hộp/vỉ" chứ không phải "4 sản phẩm". */
export function getCartQuantity(lines: CartLine[] = cartLines): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function getCartProductIds(lines: CartLine[] = cartLines): string[] {
  return lines.map((line) => line.productId);
}

/**
 * Tổng tiền. Trả về cả tiền tiết kiệm được để trang giỏ hàng không phải tự
 * tính lại — hai chỗ tính riêng là hai chỗ có thể lệch nhau.
 */
export function getCartTotals(lines: CartLine[] = cartLines) {
  const items = getCartItems(lines);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const originalSubtotal = items.reduce(
    (sum, item) => sum + (item.unit.originalPrice ?? item.unit.price) * item.line.quantity,
    0,
  );

  return {
    items,
    subtotal,
    saved: originalSubtotal - subtotal,
    count: getCartCount(lines),
  };
}
