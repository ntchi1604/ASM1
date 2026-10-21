"use server";

import { cookies } from "next/headers";
import { getProductById } from "@/lib/data/products";
import {
  readWishlistIds,
  serializeWishlist,
  wishlistCookieName,
} from "@/lib/shop/wishlist-cookie";

/**
 * Thêm hoặc bỏ một mặt hàng khỏi danh sách yêu thích.
 *
 * Một action cho cả hai chiều: nút gửi đúng mã sản phẩm, còn server tự biết nó
 * đang có trong danh sách hay chưa. Hai action riêng thì giao diện phải biết
 * trạng thái hiện tại để chọn gửi cái nào — và trạng thái đó có thể cũ.
 *
 * KHÔNG redirect: sau khi action xong, Next render lại chính tuyến đang mở, nên
 * trái tim đổi màu tại chỗ và thẻ vừa bỏ thích tự biến khỏi trang yêu thích.
 * Chuyển trang ở đây sẽ đá người dùng khỏi lưới sản phẩm họ đang xem.
 */
export async function toggleWishlist(data: FormData) {
  const product = getProductById(String(data.get("productId") ?? ""));
  if (!product) return;

  const store = await cookies();
  const ids = await readWishlistIds();
  const next = ids.includes(product.id)
    ? ids.filter((id) => id !== product.id)
    : [product.id, ...ids];

  store.set(wishlistCookieName, serializeWishlist(next), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
