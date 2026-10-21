import { cookies } from "next/headers";

/**
 * Mã các đơn đã đặt trên máy này.
 *
 * Không có đăng nhập nên không có cách nào hỏi máy chủ "đơn của tôi là đơn nào".
 * Giữ đúng danh sách MÃ ĐƠN trong cookie HttpOnly là cách nhỏ nhất để trang tài
 * khoản có lịch sử mua hàng thật mà không phải dựng tài khoản: mã đơn đã là thứ
 * người dùng đọc cho tổng đài, và bản thân mã không tiết lộ gì về họ.
 *
 * ponytail: 10 mã gần nhất. Nhiều hơn thì trình duyệt khác hay thiết bị khác vẫn
 * không thấy — lúc đó cần `users` + `orders.user_id`, lược đồ đã có sẵn.
 */
export const placedOrdersCookieName = "medivia_orders";
const MAX_CODES = 10;

function parse(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((code) => code.trim())
    .filter((code) => /^MV\d{6,}$/.test(code))
    .slice(0, MAX_CODES);
}

export async function readPlacedOrderCodes(): Promise<string[]> {
  return parse((await cookies()).get(placedOrdersCookieName)?.value);
}

/** Gọi trong server action, ngay sau khi đơn đã ghi xong. */
export async function rememberPlacedOrder(code: string) {
  const store = await cookies();
  const next = [code, ...parse(store.get(placedOrdersCookieName)?.value).filter((item) => item !== code)];
  store.set(placedOrdersCookieName, next.slice(0, MAX_CODES).join(","), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
