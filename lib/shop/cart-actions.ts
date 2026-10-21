"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  cartCookieName,
  normalizeLines,
  readCartLines,
  serializeCart,
} from "@/lib/shop/cart-cookie";
import type { CartLine, UnitLabel } from "@/lib/types";

/**
 * Thao tác giỏ hàng. Mọi hàm ở đây là một POST công khai: dữ liệu form là dữ
 * liệu của người lạ, nên `normalizeLines` kiểm lại từng dòng trước khi ghi —
 * sản phẩm còn bán, đơn vị còn tồn tại, số lượng là số nguyên dương trong
 * khoảng tồn kho. Không tin bất cứ con số nào gửi lên.
 *
 * Cookie là HttpOnly: trang không cần đọc nó bằng JavaScript, và một cookie
 * giỏ hàng đọc được bằng JS là chỗ để script lạ sửa giá trị.
 */
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

async function writeCart(lines: CartLine[]) {
  (await cookies()).set(cartCookieName, serializeCart(lines), cookieOptions);
}

/** Số lượng gửi lên hỏng thì coi như 1, không phải 0 — 0 sẽ xoá cả dòng. */
function readQuantity(data: FormData, key: string): number {
  const value = Number(data.get(key));
  return Number.isInteger(value) && value > 0 ? value : 1;
}

export async function addToCart(data: FormData) {
  const productId = String(data.get("productId") ?? "");
  const unitLabel = String(data.get("unitLabel") ?? "") as UnitLabel;
  const quantity = readQuantity(data, "quantity");

  const lines = await readCartLines();
  const next = lines.map((line) =>
    line.productId === productId && line.unitLabel === unitLabel
      ? { ...line, quantity: line.quantity + quantity }
      : line,
  );
  if (!next.some((line) => line.productId === productId && line.unitLabel === unitLabel)) {
    next.push({ productId, unitLabel, quantity });
  }

  await writeCart(normalizeLines(next));
}

export async function setCartQuantity(data: FormData) {
  const productId = String(data.get("productId") ?? "");
  const unitLabel = String(data.get("unitLabel") ?? "") as UnitLabel;
  const quantity = readQuantity(data, "quantity");

  const lines = await readCartLines();
  await writeCart(
    normalizeLines(
      lines.map((line) =>
        line.productId === productId && line.unitLabel === unitLabel
          ? { ...line, quantity }
          : line,
      ),
    ),
  );
}

export async function removeFromCart(data: FormData) {
  const productId = String(data.get("productId") ?? "");
  const unitLabel = String(data.get("unitLabel") ?? "");

  const lines = await readCartLines();
  await writeCart(
    normalizeLines(
      lines.filter((line) => line.productId !== productId || line.unitLabel !== unitLabel),
    ),
  );
}

export async function clearCart() {
  await writeCart([]);
}

/**
 * "Mua ngay": thêm đúng mặt hàng đang xem rồi sang thẳng trang thanh toán.
 * Không mang theo đơn vị qua URL: dòng hàng đã ghi rõ đơn vị trong giỏ, còn
 * trang thanh toán không có bộ chọn đơn vị nào để áp nó vào.
 */
export async function buyNow(data: FormData) {
  await addToCart(data);
  redirect("/thanh-toan");
}
