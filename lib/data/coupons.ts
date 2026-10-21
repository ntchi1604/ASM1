import { getCartTotals } from "@/lib/data/cart";
import { defaultDeliveryMethod, getDeliveryMethod, type DeliveryMethod } from "@/lib/data/delivery";
import type { CartLine } from "@/lib/types";

/**
 * Mã ưu đãi. Điều kiện áp dụng ghi thành số (`minSubtotal`) chứ không chỉ ghi
 * trong câu mô tả — nếu chỉ có câu chữ thì mã vẫn áp được cho đơn chưa đủ điều
 * kiện, và người dùng chỉ phát hiện ở bước thanh toán.
 */
export type Coupon = {
  code: string;
  description: string;
  /** Giá trị đơn tối thiểu để dùng mã. */
  minSubtotal: number;
  /**
   * Ngày bắt đầu / kết thúc, dạng `YYYY-MM-DD` giờ địa phương. Bỏ trống = không
   * giới hạn. So sánh bằng CHUỖI chứ không dựng `Date`: `"2026-10-01"` đem qua
   * `new Date()` là nửa đêm UTC, và mã sẽ mở sớm hơn 7 tiếng ở Việt Nam.
   */
  startAt?: string;
  endAt?: string;
} & (
  | { kind: "amount"; amount: number }
  | { kind: "freeship" }
);

export type CouponState = "dang-chay" | "chua-bat-dau" | "het-han";

/** Hôm nay theo giờ máy chủ, cùng định dạng với `startAt`/`endAt`. */
function todayStamp(now = new Date()): string {
  const part = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${part(now.getMonth() + 1)}-${part(now.getDate())}`;
}

/** Ngày kết thúc tính CẢ ngày đó — hết hạn từ hôm sau. */
export function couponState(coupon: Coupon, today = todayStamp()): CouponState {
  if (coupon.startAt && today < coupon.startAt) return "chua-bat-dau";
  if (coupon.endAt && today > coupon.endAt) return "het-han";
  return "dang-chay";
}

/** Mã đang chạy — thứ được quảng cáo cho khách. Mã hết hạn vẫn nằm trong kho. */
export function getActiveCoupons(): Coupon[] {
  return coupons.filter((coupon) => couponState(coupon) === "dang-chay");
}

export const coupons: Coupon[] = [
  {
    code: "GIAM50K",
    kind: "amount",
    amount: 50_000,
    description: "Giảm 50.000 ₫ cho đơn từ 300.000 ₫",
    minSubtotal: 300_000,
  },
  {
    code: "FREESHIP",
    kind: "freeship",
    description: "Miễn phí giao hàng toàn quốc cho đơn từ 200.000 ₫",
    minSubtotal: 200_000,
  },
];

/** Phí giao hàng tiêu chuẩn nội thành. */
export const shippingFee = defaultDeliveryMethod.fee;

export function getCoupon(code: string | undefined): Coupon | undefined {
  if (!code) return undefined;
  return coupons.find((coupon) => coupon.code === code.toUpperCase());
}

export type OrderSummary = {
  count: number;
  /** Tổng giá gốc trước mọi khuyến mãi. */
  originalSubtotal: number;
  subtotal: number;
  /** Tiền giảm sẵn trên từng sản phẩm. */
  productDiscount: number;
  coupon?: Coupon;
  /** Tiền giảm do mã, 0 nếu mã là freeship. */
  couponDiscount: number;
  delivery: DeliveryMethod;
  shipping: number;
  /** true khi mã được chọn nhưng đơn chưa đủ điều kiện. */
  couponRejected: boolean;
  /** Trạng thái thời gian của mã đã nhập — trang nói rõ vì sao mã bị từ chối. */
  couponState?: CouponState;
  /**
   * true khi mã freeship không tiết kiệm được gì vì hình thức nhận hàng đang
   * chọn vốn đã miễn phí — nói thẳng còn hơn để người dùng tưởng mã có tác dụng.
   */
  freeshipRedundant: boolean;
  total: number;
};

/**
 * Tính toàn bộ số tiền của đơn. MỘT hàm duy nhất cho cả /gio-hang và
 * /thanh-toan — hai trang tự tính riêng là hai trang có thể ra hai con số.
 *
 * Phí giao lấy từ hình thức nhận hàng, nên đổi hình thức ở trang thanh toán là
 * tổng tiền đổi theo ngay, không cần trang tự cộng trừ.
 */
export function getOrderSummary(
  couponCode?: string,
  deliveryId?: string,
  lines?: CartLine[],
): OrderSummary {
  const { items, subtotal, saved, count } = getCartTotals(lines);
  const requested = getCoupon(couponCode);
  // Mã không đủ điều kiện thì KHÔNG trừ tiền, nhưng vẫn báo lại để trang nói rõ
  // lý do thay vì im lặng bỏ qua mã người dùng đã bấm.
  const state = requested ? couponState(requested) : undefined;
  const eligible =
    requested && state === "dang-chay" && subtotal >= requested.minSubtotal;
  const coupon = eligible ? requested : undefined;

  const delivery = getDeliveryMethod(deliveryId);
  const couponDiscount =
    coupon?.kind === "amount" ? Math.min(coupon.amount, subtotal) : 0;

  const baseShipping = items.length > 0 ? delivery.fee : 0;
  const shipping = coupon?.kind === "freeship" ? 0 : baseShipping;

  return {
    count,
    originalSubtotal: subtotal + saved,
    subtotal,
    productDiscount: saved,
    coupon,
    couponDiscount,
    delivery,
    shipping,
    couponRejected: Boolean(requested) && !eligible,
    couponState: state,
    freeshipRedundant: coupon?.kind === "freeship" && baseShipping === 0,
    total: subtotal - couponDiscount + shipping,
  };
}
