"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { addRow, getRow } from "@/lib/admin/db";
import type { Customer } from "@/lib/data/customers";
import { customerCookie, customerCookieName, hashPassword, verifyPassword } from "@/lib/shop/customer-auth";

/**
 * Đăng ký, đăng nhập, đăng xuất của khách.
 *
 * Mọi trường đọc lại và kiểm ở đây: form là dữ liệu của người lạ, `required` của
 * HTML không phải kiểm tra phía máy chủ.
 *
 * Câu báo lỗi đăng nhập dùng CHUNG một câu cho sai số điện thoại lẫn sai mật
 * khẩu. Tách ra là dạy người dò biết số nào có tài khoản — với trang bán thuốc,
 * chính việc "số này có tài khoản" cũng là dữ liệu riêng.
 */

const text = (data: FormData, key: string, max: number) => {
  const raw = data.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
};

const normalizePhone = (value: string) => value.replace(/[\s.-]/g, "");

/** ISO không kèm múi giờ, cùng định dạng với đơn mẫu. */
function localStamp() {
  const now = new Date();
  const part = (value: number) => String(value).padStart(2, "0");
  return (
    `${now.getFullYear()}-${part(now.getMonth() + 1)}-${part(now.getDate())}` +
    `T${part(now.getHours())}:${part(now.getMinutes())}:${part(now.getSeconds())}`
  );
}

/**
 * Đích quay về khi lỗi. Chỉ nhận đúng một giá trị nên đây không phải chỗ mở
 * chuyển hướng ra ngoài site; form đặt ngay trên `/tai-khoan` mà lỗi lại nhảy
 * sang `/dang-ky` thì người dùng mất chỗ đang đứng.
 */
const backTo = (data: FormData, fallback: string) =>
  data.get("quayLai") === "/tai-khoan" ? "/tai-khoan" : fallback;

export async function register(data: FormData) {
  const name = text(data, "name", 80);
  const phone = normalizePhone(text(data, "phone", 20));
  const password = String(data.get("password") ?? "");
  const back = backTo(data, "/dang-ky");

  if (name.length < 2 || !/^0\d{9,10}$/.test(phone) || password.length < 6) {
    redirect(`${back}?loi=thong-tin`);
  }

  const customer: Customer = {
    phone,
    name,
    passwordHash: hashPassword(password),
    createdAt: localStamp(),
  };

  // `addRow` từ chối khoá trùng — cùng số điện thoại thì không ghi đè tài khoản cũ.
  if (!addRow("customers", customer as unknown as Record<string, unknown>)) {
    redirect(`${back}?loi=da-co`);
  }

  (await cookies()).set(customerCookie(phone));
  redirect("/tai-khoan?tai-khoan=da-dang-ky");
}

export async function login(data: FormData) {
  const phone = normalizePhone(text(data, "phone", 20));
  const password = String(data.get("password") ?? "");
  const back = backTo(data, "/dang-nhap");
  const row = getRow("customers", phone);

  if (!row || !verifyPassword(password, String(row.passwordHash))) {
    redirect(`${back}?loi=sai`);
  }

  (await cookies()).set(customerCookie(phone));
  redirect("/tai-khoan");
}

export async function logout() {
  (await cookies()).delete(customerCookieName);
  // Trang khách chưa đăng nhập giờ là form đăng nhập; câu xác nhận đặt ngay trên
  // đó để người dùng biết máy đã thoát tài khoản chứ không tưởng form tự hiện.
  redirect("/tai-khoan?tai-khoan=da-dang-xuat");
}
