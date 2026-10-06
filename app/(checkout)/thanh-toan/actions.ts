"use server";

import { redirect } from "next/navigation";

/**
 * Đặt hàng.
 *
 * Chưa có backend thật nên hàm này không ghi đơn vào đâu cả — nó chỉ sinh mã đơn
 * rồi chuyển sang trang hoàn tất.
 *
 * Nhưng nó BẮT BUỘC phải là một server action thật chứ không được để form trống
 * `action`: form không có action sẽ gửi GET, và toàn bộ họ tên, số điện thoại,
 * địa chỉ người dùng vừa gõ sẽ nằm trong thanh địa chỉ, trong lịch sử trình
 * duyệt và trong log truy cập. Ở một trang bán thuốc thì đó là thông tin sức
 * khoẻ, không phải tham số tìm kiếm.
 */
export async function placeOrder(formData: FormData) {
  const value = (key: string) => {
    const raw = formData.get(key);
    return typeof raw === "string" && raw.length > 0 ? raw : undefined;
  };

  const query = new URLSearchParams({ don: orderCode() });
  const delivery = value("nhan");
  const payment = value("tt");
  if (delivery) query.set("nhan", delivery);
  if (payment) query.set("tt", payment);

  redirect(`/dat-hang-thanh-cong?${query.toString()}`);
}

/**
 * Mã đơn dạng MV + ngày + 4 số. Đủ để người dùng đọc cho tổng đài qua điện
 * thoại, và nhìn vào là biết đơn của ngày nào.
 */
function orderCode() {
  const now = new Date();
  const part = (value: number) => String(value).padStart(2, "0");
  const day = `${part(now.getDate())}${part(now.getMonth() + 1)}`;
  const serial = String(Math.floor(1000 + Math.random() * 9000));
  return `MV${day}${serial}`;
}
