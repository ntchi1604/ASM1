"use server";

import { cookies } from "next/headers";
import { getProductById } from "@/lib/data/products";
import {
  compareCookieName,
  MAX_COMPARE,
  readCompareIds,
  serializeCompare,
} from "@/lib/shop/compare-cookie";

/**
 * Thêm hoặc bỏ một sản phẩm khỏi bảng so sánh.
 *
 * Đầy bốn chỗ thì bỏ sản phẩm CŨ NHẤT thay vì từ chối: người dùng bấm "so sánh"
 * ở sản phẩm thứ năm đang muốn xem nó, không muốn đọc thông báo "danh sách đầy".
 * Cái họ vừa xem là cái họ còn nhớ, nên cái cũ nhất là cái bỏ được.
 */
export async function toggleCompare(data: FormData) {
  const product = getProductById(String(data.get("productId") ?? ""));
  if (!product) return;

  const store = await cookies();
  const ids = await readCompareIds();
  const next = ids.includes(product.id)
    ? ids.filter((id) => id !== product.id)
    : [product.id, ...ids].slice(0, MAX_COMPARE);

  store.set(compareCookieName, serializeCompare(next), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/** Xoá cả bảng — nút "Bỏ tất cả" trên trang so sánh. */
export async function clearCompare() {
  (await cookies()).delete(compareCookieName);
}
