import { formatDate } from "@/lib/format";
import { getPickupPharmacy } from "@/lib/data/pharmacies";

/**
 * Hình thức nhận hàng. Phí nằm ở đây, không nằm trong trang: phí giao là một
 * con số của đơn hàng nên phải do lớp dữ liệu tính, giống giá và mã giảm giá.
 */
export type DeliveryMethodId = "nhanh" | "tieu-chuan" | "nhan-tai-nha-thuoc";

export type DeliveryMethod = {
  id: DeliveryMethodId;
  name: string;
  fee: number;
  /** Mô tả thời gian nhận; tính theo hôm nay nên không gõ cứng ngày. */
  eta: () => string;
  /** Chỉ có với hình thức nhận tại nhà thuốc. */
  pharmacy?: { name: string; address: string; distanceKm: number };
};

function addDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Ngày dự kiến tính từ hôm nay chứ không ghi sẵn "17/09 – 18/09/2026" như bản
 * thiết kế: ngày gõ cứng sẽ thành ngày quá khứ ngay tuần sau, và trang thanh
 * toán là chỗ tệ nhất để người dùng thấy một ngày vô lý.
 */
export const deliveryMethods: DeliveryMethod[] = [
  {
    id: "nhanh",
    name: "Giao nhanh 2 giờ",
    fee: 25_000,
    eta: () => `Dự kiến nhận trong 2 giờ, trước 21:00 hôm nay ${formatDate(new Date())}`,
  },
  {
    id: "tieu-chuan",
    name: "Giao tiêu chuẩn",
    fee: 0,
    eta: () => `Dự kiến ${formatDate(addDays(1))} – ${formatDate(addDays(2))}`,
  },
  {
    id: "nhan-tai-nha-thuoc",
    name: "Nhận tại nhà thuốc",
    fee: 0,
    eta: () => "Sẵn hàng sau 30 phút, giữ hàng trong 24 giờ",
    // Getter chứ không phải giá trị: `deliveryMethods` là mảng tính một lần lúc nạp
    // module, nên gán thẳng thì địa chỉ đóng băng ở bản đầu tiên và quản trị sửa
    // nhà thuốc xong khách vẫn ra chỉ đường cũ.
    get pharmacy() {
      const pickup = getPickupPharmacy();
      return {
        name: pickup.name,
        address: `${pickup.address}, ${pickup.district}`,
        distanceKm: 1.2,
      };
    },
  },
];

export const defaultDeliveryMethod = deliveryMethods[0];

/** Giá trị lạ thì rơi về hình thức mặc định, không làm trang lỗi. */
export function getDeliveryMethod(id: string | undefined): DeliveryMethod {
  return deliveryMethods.find((method) => method.id === id) ?? defaultDeliveryMethod;
}
