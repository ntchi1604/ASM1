import { getOrderByCode, getOrders, type ResolvedOrder } from "@/lib/data/orders";
import { reviews } from "@/lib/data/reviews";
import { readPlacedOrderCodes } from "@/lib/shop/placed-orders";
import { getCustomer } from "@/lib/shop/customer-auth";

/** So khớp số điện thoại bỏ qua dấu cách và dấu chấm — "0912 345 678" = "0912345678". */
const normalizePhone = (value: string) => value.replace(/[\s.-]/g, "");

/**
 * Đơn này có phải của người đang dùng không.
 *
 * `submitReview` gọi hàm NÀY chứ không tự kiểm lại: form chỉ hiện đơn đã lọc,
 * nhưng Server Action là một POST endpoint công khai — ai gửi mã đơn bất kỳ
 * cũng phải bị chặn ở đây, không phải ở chỗ ẩn nút.
 */
export async function ownsOrder(order: ResolvedOrder): Promise<boolean> {
  if ((await readPlacedOrderCodes()).includes(order.code)) return true;

  const customer = await getCustomer();
  return (
    customer !== undefined && normalizePhone(customer.phone) === normalizePhone(order.phone)
  );
}

/**
 * Các đơn đã giao còn đánh giá được cho một mặt hàng.
 *
 * Dùng ở trang sản phẩm để biết có hiện ô viết đánh giá hay không, và để đổ
 * sẵn danh sách mã đơn cho người chọn. Trả về đơn đã giải (có tên khách, trạng
 * thái) chứ không phải mã, vì form cần hiện "Đơn MV… giao ngày…".
 *
 * Hai nguồn, không phải một: cookie `medivia_orders` (đơn đặt trên máy này) VÀ
 * đơn khớp số điện thoại của tài khoản đang đăng nhập. Trước đây chỉ đọc cookie,
 * nên khách đăng nhập trên máy khác thấy đơn của mình ở `/tai-khoan` nhưng trang
 * sản phẩm không cho đánh giá — cùng một đơn, hai câu trả lời khác nhau.
 */
export async function getReviewableOrders(productId: string): Promise<ResolvedOrder[]> {
  const codes = new Set(await readPlacedOrderCodes());

  const customer = await getCustomer();
  if (customer) {
    const phone = normalizePhone(customer.phone);
    for (const order of getOrders()) {
      if (normalizePhone(order.phone) === phone) codes.add(order.code);
    }
  }

  return [...codes]
    .map(getOrderByCode)
    .filter((order): order is ResolvedOrder => order !== undefined)
    // `getOrderByCode` đã trả trạng thái đã tính, nên đơn giao quá 3 ngày hiện
    // là "hoan-thanh" — vẫn phải đánh giá được, đó mới là đơn đã nhận hàng.
    .filter((order) => order.status === "da-giao" || order.status === "hoan-thanh")
    .filter((order) => order.lines.some((line) => line.productId === productId))
    .filter(
      (order) =>
        !reviews.some(
          (review) => review.orderCode === order.code && review.productId === productId,
        ),
    );
}
