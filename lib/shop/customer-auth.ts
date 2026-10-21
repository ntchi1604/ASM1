import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getRow } from "@/lib/admin/db";
import type { Customer } from "@/lib/data/customers";

/**
 * Đăng nhập của khách mua hàng.
 *
 * Khác với `lib/admin/auth.ts` ở đúng một điểm: mật khẩu của khách do khách tự
 * đặt, nên phải băm chứ không so chuỗi thẳng. Dùng `scrypt` có sẵn trong
 * `node:crypto` — thêm bcrypt chỉ để gọi ba hàm của nó là thêm một phụ thuộc
 * phải cập nhật mãi về sau.
 *
 * Cookie ký HMAC cùng cơ chế với quản trị nhưng TÊN KHÁC. Dùng chung một cookie
 * là một lỗ hổng: cookie quản trị đọc được tên đăng nhập, và đổi chỗ sẽ cho
 * khách mang phiên quản trị.
 *
 * ponytail: khoá ký chung `ADMIN_SESSION_SECRET` với phần quản trị, vì bản mẫu
 * chỉ có một biến môi trường. Chạy thật thì tách khoá riêng và đặt cả hai.
 */
const COOKIE = "medivia_customer";
const SECRET = process.env.ADMIN_SESSION_SECRET ?? "medivia-ban-mau-doi-khoa-nay";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const given = Buffer.from(scryptSync(password, salt, 64).toString("base64url"));
  const expected = Buffer.from(hash);
  // Cùng lý do với quản trị: `timingSafeEqual` ném lỗi khi độ dài khác nhau.
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function parse(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const at = raw.lastIndexOf(".");
  if (at === -1) return undefined;

  const payload = raw.slice(0, at);
  const given = Buffer.from(raw.slice(at + 1));
  const expected = Buffer.from(sign(payload));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return undefined;

  const dot = payload.indexOf(".");
  const expiresAt = Number(payload.slice(0, dot));
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return undefined;

  return payload.slice(dot + 1);
}

/** Khách đang đăng nhập, hoặc undefined. Tên đọc lại từ kho mỗi lần, không nằm trong cookie. */
export async function getCustomer(): Promise<Customer | undefined> {
  const phone = parse((await cookies()).get(COOKIE)?.value);
  if (!phone) return undefined;
  const row = getRow("customers", phone);
  return row ? (row as unknown as Customer) : undefined;
}

export function customerCookie(phone: string) {
  const payload = `${Date.now() + SESSION_MS}.${phone}`;
  return {
    name: COOKIE,
    value: `${payload}.${sign(payload)}`,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MS / 1000,
  };
}

export const customerCookieName = COOKIE;
