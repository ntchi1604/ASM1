/**
 * Phương thức thanh toán. Giữ ở lớp dữ liệu để trang thanh toán chỉ việc hiển
 * thị, và để sau này thêm/bớt cổng thanh toán không phải sửa JSX.
 */
export type PaymentMethodId = "cod" | "momo" | "zalopay" | "vnpay" | "the";

export type PaymentMethod = {
  id: PaymentMethodId;
  name: string;
  /** Câu giải thích ngắn; chỉ có khi thật sự cần nói thêm. */
  note?: string;
};

export const paymentMethods: PaymentMethod[] = [
  {
    id: "cod",
    name: "Thanh toán khi nhận hàng (COD)",
    note: "Kiểm tra thuốc và hoá đơn trước khi trả tiền",
  },
  { id: "momo", name: "Ví MoMo" },
  { id: "zalopay", name: "ZaloPay" },
  { id: "vnpay", name: "VNPay — quét mã QR" },
  { id: "the", name: "Thẻ ATM / Visa / Mastercard" },
];

export const defaultPaymentMethod = paymentMethods[0];

export function getPaymentMethod(id: string | undefined): PaymentMethod {
  return paymentMethods.find((method) => method.id === id) ?? defaultPaymentMethod;
}
