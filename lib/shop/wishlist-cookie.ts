import { cookies } from "next/headers";
import { getProductById, products } from "@/lib/data/products";
import type { Product } from "@/lib/types";

/**
 * Danh sách yêu thích nằm trong cookie — cùng lý do với giỏ hàng: chưa có đăng
 * nhập, và cookie HttpOnly là chỗ duy nhất còn lại để nhớ một lựa chọn của
 * khách giữa hai lần mở trang.
 *
 * Chỉ giữ mã sản phẩm, không giữ giá hay tên. Giá đọc lại từ danh mục mỗi lần
 * render, nên quản trị đổi giá là danh sách đổi theo.
 *
 * ponytail: 30 mã. Có `users` thì chuyển sang bảng `wishlists` — cột đã có trong
 * lược đồ.
 */
export const wishlistCookieName = "medivia_wishlist";
const MAX_IDS = 30;

function parse(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^[a-z0-9-]+$/.test(id))
    .slice(0, MAX_IDS);
}

export function serializeWishlist(ids: string[]) {
  return ids.slice(0, MAX_IDS).join(",");
}

/** Mã sản phẩm đã thích trên máy này. */
export async function readWishlistIds(): Promise<string[]> {
  return parse((await cookies()).get(wishlistCookieName)?.value);
}

/**
 * Sản phẩm đã thích, đã lọc theo danh mục hiện tại. Một mặt hàng bị quản trị xoá
 * thì biến khỏi danh sách chứ không hiện dòng chết.
 */
export async function readWishlistProducts(): Promise<Product[]> {
  const ids = await readWishlistIds();
  return ids
    .map((id) => getProductById(id))
    .filter((product): product is Product => product !== undefined);
}

/** Số mặt hàng đã thích — cho badge ở header hoặc trang tài khoản. */
export async function countWishlist(): Promise<number> {
  const ids = await readWishlistIds();
  return ids.filter((id) => products.some((product) => product.id === id)).length;
}
