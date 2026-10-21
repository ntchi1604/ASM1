"use server";

import { redirect } from "next/navigation";
import { addRow } from "@/lib/admin/db";
import { couponState, getCoupon } from "@/lib/data/coupons";
import { getDeliveryMethod, type DeliveryMethodId } from "@/lib/data/delivery";
import type { MockOrder } from "@/lib/data/orders";
import { getPaymentMethod, type PaymentMethodId } from "@/lib/data/payment";
import { clearCart } from "@/lib/shop/cart-actions";
import { readCartLines } from "@/lib/shop/cart-cookie";
import { rememberPlacedOrder } from "@/lib/shop/placed-orders";
import { rememberCheckoutAddress } from "@/lib/shop/address-actions";

/**
 * Đặt hàng.
 *
 * Ghi đơn vào kho delta của phần quản trị (`lib/admin/db`), xoá giỏ, rồi chuyển
 * sang trang hoàn tất. Đơn vừa tạo hiện ngay ở `/admin/don-hang` và tra được ở
 * `/tra-cuu-don-hang` — trước đây hàm này chỉ sinh mã rồi vứt sạch thông tin
 * khách vừa gõ.
 *
 * BẮT BUỘC phải là server action chứ không được để form trống `action`: form
 * không có action sẽ gửi GET, và toàn bộ họ tên, số điện thoại, địa chỉ người
 * dùng vừa gõ sẽ nằm trong thanh địa chỉ, trong lịch sử trình duyệt và trong log
 * truy cập. Ở một trang bán thuốc thì đó là thông tin sức khoẻ.
 *
 * Mọi trường đọc lại và kiểm ở đây: form là dữ liệu của người lạ, `required`
 * của HTML không phải là kiểm tra phía server.
 */
export async function placeOrder(data: FormData) {
  const text = (key: string, max = 200) => {
    const raw = data.get(key);
    return typeof raw === "string" ? raw.trim().slice(0, max) : "";
  };

  const customer = text("hoTen", 80);
  const phone = text("dienThoai", 20).replace(/[\s.-]/g, "");
  const street = text("diaChi", 160);
  const ward = text("phuong", 80);
  const district = text("quan", 80);
  const province = text("tinh", 80);

  const valid =
    customer.length >= 2 &&
    /^0\d{9,10}$/.test(phone) &&
    street.length >= 4 &&
    ward.length > 0 &&
    district.length > 0 &&
    province.length > 0 &&
    data.get("dongY") !== null;

  if (!valid) redirect("/thanh-toan?loi=thong-tin");

  const lines = await readCartLines();
  if (lines.length === 0) redirect("/thanh-toan");

  const delivery = getDeliveryMethod(text("nhan"));
  const payment = getPaymentMethod(text("tt"));

  const order: Omit<MockOrder, "code"> = {
    customer,
    phone,
    placedAt: localStamp(),
    status: "cho-xac-nhan",
    lines,
    deliveryMethodId: delivery.id as DeliveryMethodId,
    paymentMethodId: payment.id as PaymentMethodId,
    // Mã hết hạn hoặc chưa tới ngày không được ghi vào đơn: đơn đã rời khỏi trang
    // thanh toán thì không còn ai thấy cảnh báo "mã chưa áp dụng" nữa.
    couponCode: activeCoupon(text("ma", 20))?.code,
    email: text("email", 120) || undefined,
    address: `${street}, ${ward}, ${district}, ${province}`,
    note: text("ghiChu", 500) || undefined,
  };

  const saved = persistOrder(order);
  if (!saved) redirect("/thanh-toan?loi=ma-don");

  // Ô "Lưu làm địa chỉ mặc định" trước đây chỉ trang trí: tích hay không tích
  // cũng không có gì được lưu. Ghi sau khi đơn đã tạo xong để một địa chỉ hỏng
  // không làm mất đơn vừa đặt.
  if (data.get("luuDiaChi") !== null) {
    await rememberCheckoutAddress({ name: customer, phone, street, ward, district, province });
  }

  await clearCart();
  await rememberPlacedOrder(saved.code);
  redirect(`/dat-hang-thanh-cong?don=${saved.code}`);
}

/** Mã còn trong thời gian chạy; hết hạn hoặc chưa mở thì trả `undefined`. */
function activeCoupon(code: string) {
  const coupon = getCoupon(code);
  return coupon && couponState(coupon) === "dang-chay" ? coupon : undefined;
}

/**
 * `addRow` từ chối khoá trùng, nên vòng lặp này vừa sinh mã vừa kiểm mã. 20 lần
 * là quá đủ: không trùng nổi sau hai lần với không gian 4 chữ số mỗi ngày.
 */
function persistOrder(order: Omit<MockOrder, "code">): MockOrder | undefined {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate: MockOrder = { ...order, code: orderCode() };
    // `MockOrder` là bản ghi phẳng, không có trường nào không ghi được xuống JSON.
    if (addRow("orders", candidate as unknown as Record<string, unknown>)) return candidate;
  }
  return undefined;
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

/** ISO không kèm múi giờ — cùng định dạng với các đơn mẫu trong `lib/data/orders`. */
function localStamp() {
  const now = new Date();
  const part = (value: number) => String(value).padStart(2, "0");
  return (
    `${now.getFullYear()}-${part(now.getMonth() + 1)}-${part(now.getDate())}` +
    `T${part(now.getHours())}:${part(now.getMinutes())}:${part(now.getSeconds())}`
  );
}
