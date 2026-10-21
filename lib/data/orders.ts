import { getCartItems, type CartItem } from "@/lib/data/cart";
import { getOrderSummary, type OrderSummary } from "@/lib/data/coupons";
import type { DeliveryMethodId } from "@/lib/data/delivery";
import type { PaymentMethodId } from "@/lib/data/payment";
import { getProductById } from "@/lib/data/products";
import { getTotals } from "@/lib/data/sales";
import type { CartLine, Product } from "@/lib/types";

/**
 * Đơn hàng và đơn thuốc kèm theo — dữ liệu cho hai trang quản trị.
 *
 * Hai thứ nằm chung một tệp vì chúng là một hồ sơ: mỗi đơn thuốc thuộc ĐÚNG một
 * đơn hàng (lược đồ có ràng buộc UNIQUE trên `prescriptions.order_id`), và trang
 * duyệt đơn luôn phải tra ngược lên đơn để biết khách nào, thuốc gì. Tách ra hai
 * tệp thì tệp này phải import tệp kia, mà chẳng được gì.
 *
 * ĐIỀU QUAN TRỌNG NHẤT: đơn hàng ở đây KHÔNG ghi tổng tiền. Mỗi đơn chỉ có các
 * dòng hàng, hình thức nhận, cách thanh toán và mã ưu đãi — tiền tính bằng
 * `getOrderSummary()`, đúng hàm mà trang giỏ hàng và trang thanh toán đang dùng.
 * Ghi tay con số tổng thì có ngày giá trong danh mục đổi mà đơn mẫu không đổi, và
 * trang quản trị hiển thị một đơn mà chính hệ thống không thể tạo ra.
 */

/** Khớp enum `order_status` trong design/medivia-schema.sql. */
export type OrderStatus =
  | "cho-xac-nhan"
  | "da-xac-nhan"
  | "dang-giao"
  | "da-giao"
  | "hoan-thanh"
  | "hoan-tra"
  | "da-huy";

/** Khớp enum `prescription_status` trong design/medivia-schema.sql. */
export type PrescriptionStatus = "cho-duyet" | "da-duyet" | "tu-choi";

export const orderStatusLabel: Record<OrderStatus, string> = {
  "cho-xac-nhan": "Chờ xác nhận",
  "da-xac-nhan": "Đã xác nhận",
  "dang-giao": "Đang giao",
  "da-giao": "Đã giao",
  "hoan-thanh": "Đã hoàn thành",
  "hoan-tra": "Hoàn trả",
  "da-huy": "Đã huỷ",
};

/**
 * Nghĩa của từng trạng thái, viết cho hai người đọc khác nhau: khách tra cứu đơn
 * và nhân viên ở trang quản trị. Một câu dùng chung được cho cả hai — "Đã gọi,
 * chờ soạn và giao" vừa trả lời được khách, vừa là việc tiếp theo của nhân viên.
 *
 * Để ở đây chứ không ở trang quản trị: trang tra cứu đơn cũng cần, và hai bản
 * chép tay thì có ngày khách đọc một câu, nhân viên đọc một câu khác.
 */
export const orderStatusHint: Record<OrderStatus, string> = {
  "cho-xac-nhan": "Cần gọi xác nhận trước khi soạn",
  "da-xac-nhan": "Đã gọi, chờ soạn và giao",
  "dang-giao": "Đã ra khỏi kho",
  "da-giao": "Khách chưa xác nhận đã nhận — tự hoàn thành sau 3 ngày",
  "hoan-thanh": "Đơn đóng, khách đánh giá được",
  "hoan-tra": "Đã trả hàng, xem lý do trong đơn",
  "da-huy": "Khách huỷ hoặc không liên lạc được",
};

/** Lý do khách chọn khi bấm hoàn trả — đúng ba trường hợp đã hứa ở trang đổi trả. */
export const returnReasons = [
  { id: "chua-nhan", label: "Chưa nhận được hàng" },
  { id: "khong-giong", label: "Hàng không giống hình hoặc kém chất lượng" },
  { id: "hang-vo", label: "Hàng vỡ, hỏng khi giao" },
] as const;

/**
 * Số đơn hoàn trả theo lý do trong cả kỳ — nguồn cho khối "lý do hoàn trả" ở
 * trang phân tích. Cộng phải đúng bằng số đơn `hoan-tra` của kỳ; ràng buộc đó
 * được kiểm bên dưới, cùng chỗ với phép cộng tổng số đơn.
 */
export const returnReasonStats: { id: (typeof returnReasons)[number]["id"]; count: number }[] = [
  { id: "khong-giong", count: 12 },
  { id: "hang-vo", count: 7 },
  { id: "chua-nhan", count: 4 },
];

export type ReturnRequest = {
  /** Lý do khách chọn. Đơn quản trị chuyển tay thì không có. */
  reasonId?: (typeof returnReasons)[number]["id"];
  /** Câu hiển thị: nhãn lý do của khách, hoặc câu quản trị gõ. */
  reason: string;
  /** Khách ghi thêm, không bắt buộc. */
  note?: string;
  requestedAt: string;
  /** Thiếu = đang chờ quản trị xử lý. */
  decision?: "da-chap-nhan" | "tu-choi";
  decidedAt?: string;
};

export type MockOrder = {
  /** MV + ngày + 4 số, cùng định dạng với mã sinh ở trang thanh toán. */
  code: string;
  customer: string;
  phone: string;
  /** ISO không kèm múi giờ: giờ địa phương, render server không lệch. */
  placedAt: string;
  status: OrderStatus;
  lines: CartLine[];
  deliveryMethodId: DeliveryMethodId;
  paymentMethodId: PaymentMethodId;
  couponCode?: string;
  /** Các trường dưới đây chỉ có ở đơn khách tự đặt; đơn mẫu cũ không có. */
  email?: string;
  address?: string;
  note?: string;
  /** Lúc giao thành công. Thiếu thì tính mốc 3 ngày từ `placedAt`. */
  deliveredAt?: string;
  /** Khách xin hoàn trả. Đơn mẫu cũ không có. */
  returnRequest?: ReturnRequest;
};

/** Số ngày sau khi giao mà khách không phản hồi thì đơn tự đóng. */
const autoCompleteDays = 3;

/**
 * Trạng thái khách THẤY. `da-giao` quá 3 ngày tự thành `hoan-thanh` mà không cần
 * ai ghi gì — bản mẫu không có cron, và một bộ đếm chạy nền chỉ để đổi một nhãn
 * là thứ dễ hỏng hơn nhiều so với một phép so ngày.
 */
export function effectiveStatus(order: MockOrder): OrderStatus {
  if (order.status !== "da-giao") return order.status;
  // Đang chờ quản trị trả lời thì không tự đóng: đơn tự hoàn thành trong lúc
  // khách vừa báo hàng vỡ là tự động chốt một khiếu nại chưa ai xem.
  if (order.returnRequest && !order.returnRequest.decision) return "da-giao";
  const since = new Date(order.deliveredAt ?? order.placedAt).getTime();
  return Date.now() - since < autoCompleteDays * 86_400_000 ? "da-giao" : "hoan-thanh";
}

export type ResolvedOrder = MockOrder & {
  items: CartItem[];
  summary: OrderSummary;
  requiresPrescription: boolean;
  /** Thuốc kê đơn trong đơn — trang duyệt cần đúng danh sách này. */
  prescriptionProducts: Product[];
};

export function resolveOrder(order: MockOrder): ResolvedOrder {
  // `getCartItems` bỏ qua dòng trỏ tới sản phẩm đã bị xoá khỏi danh mục. Đơn cũ
  // vẫn phải mở được — quản trị xoá một mặt hàng không được làm sập ba trang
  // khác. Dòng đó biến mất khỏi đơn, nên tổng tiền của đơn cũ đọc lại sẽ thấp
  // hơn lúc đặt; ponytail: đơn đã chốt lẽ ra phải giữ giá tại thời điểm đặt.
  const items = getCartItems(order.lines);

  return {
    ...order,
    // Ghi đè `status` thô bằng trạng thái đã tính: mọi trang đọc qua đây đều
    // thấy cùng một trạng thái, không trang nào phải tự gọi `effectiveStatus`.
    status: effectiveStatus(order),
    items,
    summary: getOrderSummary(order.couponCode, order.deliveryMethodId, order.lines),
    requiresPrescription: items.some((item) => item.product.prescriptionRequired),
    prescriptionProducts: items
      .filter((item) => item.product.prescriptionRequired)
      .map((item) => item.product),
  };
}

/**
 * Bảy đơn gần nhất. KHÔNG phải toàn bộ 1.771 đơn của kỳ báo cáo — chép đủ từng
 * ấy dòng vào đây là chép tay một bảng mà không ai đọc hết, và chỉ cần một dòng
 * lệch là con số tổng không còn khớp với trang phân tích.
 */
export const mockOrders: MockOrder[] = [
  {
    code: "MV15092814",
    customer: "Phạm Quốc Bảo",
    phone: "0903 771 204",
    placedAt: "2026-09-15T22:07:00",
    status: "cho-xac-nhan",
    lines: [{ productId: "augmentin-625", unitLabel: "Vỉ", quantity: 2 }],
    deliveryMethodId: "nhan-tai-nha-thuoc",
    paymentMethodId: "cod",
  },
  {
    code: "MV15097390",
    customer: "Nguyễn Thị Lan",
    phone: "0912 345 678",
    placedAt: "2026-09-15T20:41:00",
    status: "cho-xac-nhan",
    lines: [
      { productId: "augmentin-625", unitLabel: "Hộp", quantity: 1 },
      { productId: "prospan", unitLabel: "Chai", quantity: 2 },
    ],
    deliveryMethodId: "tieu-chuan",
    paymentMethodId: "momo",
    couponCode: "GIAM50K",
  },
  {
    code: "MV15091187",
    customer: "Trần Minh Khoa",
    phone: "0938 220 615",
    placedAt: "2026-09-15T16:05:00",
    status: "cho-xac-nhan",
    lines: [
      { productId: "oresol-hydrite", unitLabel: "Hộp", quantity: 3 },
      { productId: "enterogermina", unitLabel: "Hộp", quantity: 1 },
    ],
    deliveryMethodId: "nhanh",
    paymentMethodId: "cod",
  },
  {
    code: "MV14094821",
    customer: "Nguyễn Thị Lan",
    phone: "0912 345 678",
    placedAt: "2026-09-14T09:12:00",
    // Đơn của tài khoản mẫu 0912345678 phải ở trạng thái đã giao, nếu không
    // không có đường nào để thử luồng đánh giá: form chỉ mở cho đơn đã giao.
    status: "da-giao",
    deliveredAt: "2026-10-20T10:05:00",
    lines: [
      { productId: "hapacol-650", unitLabel: "Hộp", quantity: 2 },
      { productId: "vitamin-c-1000", unitLabel: "Hộp", quantity: 1 },
    ],
    deliveryMethodId: "nhanh",
    paymentMethodId: "cod",
  },
  {
    code: "MV13095502",
    customer: "Lê Hoàng Yến",
    phone: "0977 104 382",
    placedAt: "2026-09-13T10:23:00",
    status: "da-giao",
    lines: [
      { productId: "panadol-extra", unitLabel: "Vỉ", quantity: 3 },
      { productId: "decolgen-nd", unitLabel: "Hộp", quantity: 1 },
    ],
    deliveryMethodId: "tieu-chuan",
    paymentMethodId: "zalopay",
    couponCode: "FREESHIP",
  },
  {
    code: "MV12099043",
    customer: "Đỗ Thanh Tùng",
    phone: "0918 662 049",
    placedAt: "2026-09-12T21:58:00",
    status: "da-huy",
    lines: [
      { productId: "tamiflu-75", unitLabel: "Hộp", quantity: 1 },
      { productId: "hapacol-150", unitLabel: "Hộp", quantity: 2 },
    ],
    deliveryMethodId: "nhanh",
    paymentMethodId: "cod",
  },
  {
    code: "MV12093317",
    customer: "Vũ Thị Hồng",
    phone: "0906 418 733",
    placedAt: "2026-09-12T08:30:00",
    status: "da-xac-nhan",
    lines: [
      { productId: "warfarin-5mg", unitLabel: "Hộp", quantity: 1 },
      { productId: "efferalgan-500", unitLabel: "Hộp", quantity: 1 },
      { productId: "otrivin-005", unitLabel: "Lọ", quantity: 1 },
    ],
    deliveryMethodId: "nhan-tai-nha-thuoc",
    paymentMethodId: "cod",
  },
];

/** Đơn mới nhất lên đầu — hàng đợi đọc từ trên xuống. */
export function getOrders(): ResolvedOrder[] {
  return [...mockOrders]
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
    .map(resolveOrder);
}

export function getOrderByCode(code: string): ResolvedOrder | undefined {
  const found = mockOrders.find((order) => order.code === code);
  return found ? resolveOrder(found) : undefined;
}

/**
 * Số đơn theo từng trạng thái trong CẢ KỲ 14 ngày, không phải trong 7 đơn mẫu.
 *
 * Sáu con số này phải cộng đúng bằng số đơn của trang phân tích — hai trang quản
 * trị nói hai con số khác nhau về cùng một kỳ là lỗi người đọc không thể phát
 * hiện. Ràng buộc đó được kiểm ngay bên dưới.
 */
const baseOrderStatusCounts: Record<OrderStatus, number> = {
  "cho-xac-nhan": 38,
  "da-xac-nhan": 52,
  // Một đơn đã chuyển sang "đã giao" cho tài khoản mẫu thử được luồng đánh
  // giá — xem `MV14094821`. Số dưới đây đếm cả đơn mẫu trong kỳ 14 ngày.
  "dang-giao": 143,
  // 23 đơn trong 1.481 đơn "đã giao" đã trả hàng, nên chuyển sang `hoan-tra`.
  // Giữ nguyên tổng: một đơn nằm ở đúng một trạng thái.
  "da-giao": 1_459,
  "hoan-thanh": 0,
  "hoan-tra": 23,
  "da-huy": 56,
};

/**
 * Số đơn theo trạng thái, CỘNG THÊM phần quản trị đã đổi.
 *
 * Bản gốc là con số của cả kỳ 14 ngày, còn bảy đơn dưới đây là đơn mẫu. Khi quản
 * trị đổi trạng thái một đơn mẫu, con số tổng phải nhích theo — nếu không thì
 * trang đơn hàng nói "38 chờ xác nhận" trong khi ngay dưới đó không còn đơn nào
 * chờ xác nhận, và người đọc mất tin vào cả trang.
 *
 * Đếm phần lệch chứ không đếm lại từ đầu: đơn mẫu chỉ là bảy dòng trong hơn một
 * nghìn đơn của kỳ, và bảy dòng đó đã nằm sẵn trong con số gốc.
 */
const baseStatusOf = new Map(mockOrders.map((order) => [order.code, order.status]));

export function getOrderStatusCounts(): Record<OrderStatus, number> {
  const counts = { ...baseOrderStatusCounts };
  for (const order of mockOrders) {
    const after = effectiveStatus(order);
    const before = baseStatusOf.get(order.code);
    // Đơn khách vừa đặt không nằm trong con số gốc, nên cộng thêm thay vì trừ.
    if (before === undefined) {
      counts[after] += 1;
      continue;
    }
    if (before === after) continue;
    counts[before] -= 1;
    counts[after] += 1;
  }
  return counts;
}

const countedOrders = Object.values(baseOrderStatusCounts).reduce((sum, value) => sum + value, 0);
if (countedOrders !== getTotals().orders) {
  throw new Error(
    `orders.ts: tổng đơn theo trạng thái là ${countedOrders}, trang phân tích ghi ${getTotals().orders}`,
  );
}

const countedReturns = returnReasonStats.reduce((sum, item) => sum + item.count, 0);
if (countedReturns !== baseOrderStatusCounts["hoan-tra"]) {
  throw new Error(
    `orders.ts: lý do hoàn trả cộng được ${countedReturns} đơn, trạng thái hoàn trả ghi ${baseOrderStatusCounts["hoan-tra"]}`,
  );
}

export type PrescriptionRow = {
  orderCode: string;
  /** Tên tệp gốc. Ảnh nằm trong kho riêng, KHÔNG có URL công khai — xem chú thích dưới. */
  fileName: string;
  mimeType: "image/jpeg" | "image/png" | "application/pdf";
  sizeBytes: number;
  status: PrescriptionStatus;
  submittedAt: string;
  /** Chỉ có khi `status` là "tu-choi" — lược đồ bắt buộc. */
  rejectReason?: string;
  /** Người duyệt và thời điểm duyệt: lược đồ bắt buộc có đủ cả hai hoặc không có gì. */
  reviewedBy?: string;
  reviewedAt?: string;
  /** Ngày xoá ảnh. Lược đồ để NOT NULL, nên mọi đơn thuốc đều có hạn xoá. */
  deleteAfter: string;
};

/**
 * Lý do từ chối. Bốn trường hợp này là đúng bốn trường hợp đã hứa với khách ở
 * trang Quy định bán thuốc kê đơn — dược sĩ chọn trong danh sách chứ không gõ
 * tự do, vì lý do từ chối là câu khách đọc để biết phải sửa gì.
 */
export const prescriptionRejectReasons = [
  "Ảnh mờ, thiếu phần chẩn đoán hoặc thiếu chữ ký bác sĩ",
  "Đơn đã quá hạn sử dụng theo ghi chú trên đơn",
  "Số lượng thuốc trên đơn ít hơn số lượng đặt",
  "Thuốc trên đơn không khớp với thuốc trong giỏ",
];

export const prescriptionRows: PrescriptionRow[] = [
  {
    orderCode: "MV15092814",
    fileName: "don-thuoc-bao.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 1_284_915,
    status: "cho-duyet",
    submittedAt: "2026-09-15T22:09:00",
    deleteAfter: "2026-09-23",
  },
  {
    orderCode: "MV15097390",
    fileName: "don-thuoc-lan.pdf",
    mimeType: "application/pdf",
    sizeBytes: 842_176,
    status: "cho-duyet",
    submittedAt: "2026-09-15T20:44:00",
    deleteAfter: "2026-09-25",
  },
  {
    orderCode: "MV12093317",
    fileName: "don-thuoc-hong.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 2_105_733,
    status: "da-duyet",
    submittedAt: "2026-09-12T08:35:00",
    reviewedBy: "DS. Trần Thu Hà",
    reviewedAt: "2026-09-12T08:52:00",
    deleteAfter: "2026-09-20",
  },
  {
    orderCode: "MV12099043",
    fileName: "don-thuoc-tung.png",
    mimeType: "image/png",
    sizeBytes: 3_918_442,
    status: "tu-choi",
    submittedAt: "2026-09-12T22:01:00",
    rejectReason: prescriptionRejectReasons[1],
    reviewedBy: "DS. Trần Thu Hà",
    reviewedAt: "2026-09-12T22:14:00",
    deleteAfter: "2026-09-19",
  },
];

/** Ảnh lớn nhất được nhận, khớp ràng buộc `size_bytes <= 10485760` của lược đồ. */
export const prescriptionMaxBytes = 10_485_760;

/**
 * Mọi ràng buộc của bảng `prescriptions` đều được kiểm ở đây, lúc nạp module.
 * Lược đồ chặn được dữ liệu sai khi có cơ sở dữ liệu thật; trước lúc đó, hàng đợi
 * mẫu là thứ duy nhất giữ cho ba lời hứa kia khỏi bị viết sai.
 */
for (const row of prescriptionRows) {
  const order = mockOrders.find((item) => item.code === row.orderCode);
  if (!order) {
    throw new Error(`orders.ts: đơn thuốc trỏ tới đơn không có — ${row.orderCode}`);
  }
  if (!order.lines.some((line) => getProductById(line.productId)?.prescriptionRequired)) {
    throw new Error(`orders.ts: đơn ${row.orderCode} không có thuốc kê đơn nhưng lại có đơn thuốc`);
  }
  if (row.sizeBytes > prescriptionMaxBytes) {
    throw new Error(`orders.ts: đơn thuốc ${row.orderCode} vượt 10 MB`);
  }
  if (row.status === "tu-choi" && !row.rejectReason) {
    throw new Error(`orders.ts: đơn thuốc ${row.orderCode} bị từ chối nhưng không ghi lý do`);
  }
  if (Boolean(row.reviewedBy) !== Boolean(row.reviewedAt)) {
    throw new Error(`orders.ts: đơn thuốc ${row.orderCode} thiếu người duyệt hoặc thời điểm duyệt`);
  }
}

export function getPrescriptionRows(): (PrescriptionRow & { order: ResolvedOrder })[] {
  return prescriptionRows.map((row) => {
    const order = getOrderByCode(row.orderCode);
    if (!order) throw new Error(`orders.ts: không tra được đơn ${row.orderCode}`);
    return { ...row, order };
  });
}