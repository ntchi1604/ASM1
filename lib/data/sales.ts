import { getDefaultUnit, products } from "./products";

/**
 * Số liệu bán hàng mô phỏng cho trang phân tích của quản trị.
 *
 * Toàn bộ con số trên /admin/phan-tich phải lấy từ đây, kể cả những câu nhận xét
 * do AI "viết". Lý do: nếu trang tự tính lại một phần và AI tính lại phần khác thì
 * sẽ có ngày biểu đồ nói doanh thu tăng còn câu nhận xét nói giảm — và người đọc
 * không có cách nào biết bên nào đúng.
 *
 * Dữ liệu cố định, không random: một trang phân tích mà mỗi lần tải lại cho ra
 * con số khác thì không dùng để ra quyết định được.
 */

export type DayPoint = {
  /** ISO yyyy-mm-dd — không dùng Date object để tránh lệch múi giờ khi render server. */
  date: string;
  revenue: number;
  orders: number;
};

export type CategorySales = {
  slug: string;
  name: string;
  revenue: number;
  orders: number;
  /** So với kỳ 14 ngày liền trước, đơn vị phần trăm. */
  changePercent: number;
};

export type ProductSales = {
  /** Phải là `Product.id` — KHÔNG phải slug. Hai thứ này khác nhau trong danh mục. */
  productId: string;
  unitsSold: number;
  /** Số lượt xem trang chi tiết — dùng để tính tỉ lệ xem→mua. */
  views: number;
};

/** Số liệu bán hàng đã ghép với danh mục: tên, giá, doanh thu đều là dữ liệu thật. */
export type ResolvedProductSales = ProductSales & {
  name: string;
  slug: string;
  revenue: number;
  prescriptionRequired: boolean;
};

export type StockAlert = {
  productId: string;
  /** Trung bình bán mỗi ngày trong 14 ngày qua. */
  dailyRate: number;
};

/**
 * Tồn kho KHÔNG ghi trong `stockAlerts` mà lấy từ danh mục lúc ghép. Ghi con số
 * này ở hai chỗ thì có ngày sửa tồn trong danh mục mà quên sửa ở đây, và trang
 * phân tích nói "còn 42" trong khi trang kho thuốc nói "còn 26" cho cùng một thuốc.
 */
export type ResolvedStockAlert = StockAlert & {
  remaining: number;
  name: string;
  slug: string;
};

/** Kỳ báo cáo: 14 ngày, kết thúc ngày cuối cùng có dữ liệu. */
export const reportPeriod = {
  days: 14,
  from: "2026-09-02",
  to: "2026-09-15",
  label: "2 – 15/9/2026",
  previousLabel: "19/8 – 1/9/2026",
};

export const dailySales: DayPoint[] = [
  { date: "2026-09-02", revenue: 18_420_000, orders: 96 },
  { date: "2026-09-03", revenue: 17_960_000, orders: 92 },
  { date: "2026-09-04", revenue: 21_340_000, orders: 108 },
  { date: "2026-09-05", revenue: 24_880_000, orders: 127 },
  { date: "2026-09-06", revenue: 26_150_000, orders: 134 },
  { date: "2026-09-07", revenue: 19_720_000, orders: 101 },
  { date: "2026-09-08", revenue: 18_050_000, orders: 94 },
  { date: "2026-09-09", revenue: 22_610_000, orders: 115 },
  { date: "2026-09-10", revenue: 28_940_000, orders: 148 },
  { date: "2026-09-11", revenue: 31_270_000, orders: 161 },
  { date: "2026-09-12", revenue: 33_480_000, orders: 172 },
  { date: "2026-09-13", revenue: 29_650_000, orders: 152 },
  { date: "2026-09-14", revenue: 25_310_000, orders: 129 },
  { date: "2026-09-15", revenue: 27_880_000, orders: 142 },
];

/** Kỳ trước, chỉ cần tổng để tính phần trăm thay đổi. */
export const previousPeriodTotals = {
  revenue: 289_400_000,
  orders: 1_512,
};

export const categorySales: CategorySales[] = [
  { slug: "cam-cum-ha-sot", name: "Cảm, cúm, hạ sốt", revenue: 132_480_000, orders: 742, changePercent: 34.2 },
  { slug: "ho-hen-suyen", name: "Ho, hen suyễn", revenue: 61_150_000, orders: 381, changePercent: 28.6 },
  { slug: "vitamin-khoang-chat", name: "Vitamin, khoáng chất", revenue: 48_920_000, orders: 214, changePercent: -4.1 },
  { slug: "giam-dau-khang-viem", name: "Giảm đau, kháng viêm", revenue: 39_760_000, orders: 268, changePercent: 6.8 },
  { slug: "tieu-hoa", name: "Tiêu hoá", revenue: 31_240_000, orders: 187, changePercent: 2.3 },
  { slug: "tim-mach", name: "Tim mạch", revenue: 22_010_000, orders: 79, changePercent: -1.5 },
];

/**
 * Chỉ lưu `productId` + số bán + số lượt xem. Tên, slug, giá, trạng thái kê đơn đều
 * lấy từ danh mục qua `resolveProductSales()`. Nếu lặp lại tên và doanh thu ở đây thì
 * sẽ có ngày sửa giá trong danh mục mà quên sửa ở đây, và trang phân tích nói một
 * con số khác trang sản phẩm — không ai phát hiện được bằng mắt.
 */
export const productSales: ProductSales[] = [
  { productId: "hapacol-650", unitsSold: 412, views: 5_840 },
  { productId: "prospan", unitsSold: 296, views: 6_120 },
  { productId: "efferalgan-500", unitsSold: 358, views: 4_910 },
  { productId: "augmentin-625", unitsSold: 94, views: 4_680 },
  { productId: "panadol-extra", unitsSold: 274, views: 3_450 },
  { productId: "oresol-hydrite", unitsSold: 261, views: 2_180 },
  { productId: "otrivin-005", unitsSold: 186, views: 2_910 },
  { productId: "vitamin-c-1000", unitsSold: 198, views: 4_320 },
  { productId: "decolgen-nd", unitsSold: 248, views: 3_960 },
  { productId: "bao-thanh-vien-ngam", unitsSold: 232, views: 2_740 },
];

export const stockAlerts: StockAlert[] = [
  { productId: "prospan", dailyRate: 21.1 },
  { productId: "oresol-hydrite", dailyRate: 18.6 },
  { productId: "hapacol-650", dailyRate: 29.4 },
];

/** Lượt dùng từng công cụ AI trong kỳ — để đo tính năng nào thật sự được dùng. */
export const aiToolUsage = [
  { slug: "/ai/tu-van", label: "AI tư vấn thuốc", uses: 3_128, toCartPercent: 31.4 },
  { slug: "/ai/tim-kiem", label: "Tìm thuốc bằng AI", uses: 2_740, toCartPercent: 38.2 },
  { slug: "/ai/chatbot", label: "Chatbot dược sĩ AI", uses: 1_960, toCartPercent: 12.7 },
  { slug: "/ai/tuong-tac", label: "Cảnh báo tương tác", uses: 1_204, toCartPercent: 8.1 },
  { slug: "/ai/nhan-dien", label: "Nhận diện thuốc bằng ảnh", uses: 862, toCartPercent: 24.6 },
  { slug: "/ai/giong-noi", label: "Tìm bằng giọng nói", uses: 418, toCartPercent: 29.9 },
];

/** Số ca chatbot tự chuyển sang dược sĩ thật — chỉ số an toàn, không phải chỉ số thất bại. */
export const pharmacistHandoffs = {
  total: 604,
  ofChatbotUses: 30.8,
  byReason: [
    { reason: "Liều cho trẻ theo cân nặng", count: 241 },
    { reason: "Phụ nữ có thai, cho con bú", count: 168 },
    { reason: "Thuốc kê đơn, kháng sinh", count: 132 },
    { reason: "Dấu hiệu nghi nặng", count: 63 },
  ],
};

export function getTotals() {
  const revenue = dailySales.reduce((sum, day) => sum + day.revenue, 0);
  const orders = dailySales.reduce((sum, day) => sum + day.orders, 0);
  return {
    revenue,
    orders,
    averageOrderValue: Math.round(revenue / orders),
    revenueChangePercent: percentChange(revenue, previousPeriodTotals.revenue),
    ordersChangePercent: percentChange(orders, previousPeriodTotals.orders),
  };
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

/** Ngày bán cao nhất và thấp nhất trong kỳ — AI trích dẫn đúng hai ngày này. */
export function getPeak() {
  const sorted = [...dailySales].sort((a, b) => b.revenue - a.revenue);
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}

/**
 * Tỉ lệ xem → mua. Tách thành hàm vì AI và bảng đều cần, và làm tròn phải giống
 * nhau ở hai nơi.
 */
export function conversionPercent(item: ProductSales) {
  return Number(((item.unitsSold / item.views) * 100).toFixed(1));
}

/** Số ngày còn bán được với tốc độ hiện tại. Nhận bản đã ghép — cần tồn kho thật. */
export function daysOfStock(alert: ResolvedStockAlert) {
  return Math.floor(alert.remaining / alert.dailyRate);
}

/**
 * Ghép số liệu bán với danh mục và sắp theo doanh thu giảm dần.
 *
 * Ném lỗi nếu `productId` không còn trong danh mục, thay vì bỏ qua dòng đó. Bỏ qua
 * âm thầm nghĩa là bảng "10 thuốc bán chạy" có ngày chỉ còn 9 dòng mà không ai biết.
 */
export function resolveProductSales(): ResolvedProductSales[] {
  return productSales
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) {
        throw new Error(`sales.ts: không tìm thấy sản phẩm "${item.productId}" trong danh mục`);
      }
      return {
        ...item,
        name: product.name,
        slug: product.slug,
        // `unitsSold` đếm theo đơn vị mặc định (hộp, chai), không phải viên. Nhân
        // với `getBaseUnit` — giá VIÊN rẻ nhất — là nhân số hộp với giá viên, và
        // bảng "bán chạy nhất" ra doanh thu nhỏ hơn thực tế cả chục lần.
        revenue: getDefaultUnit(product).price * item.unitsSold,
        prescriptionRequired: product.prescriptionRequired,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

/** Cảnh báo tồn kho, sắp theo số ngày còn bán được — ít ngày nhất lên đầu. */
export function resolveStockAlerts(): ResolvedStockAlert[] {
  return stockAlerts
    .map((alert) => {
      const product = products.find((candidate) => candidate.id === alert.productId);
      if (!product) {
        throw new Error(`sales.ts: không tìm thấy sản phẩm "${alert.productId}" trong danh mục`);
      }
      return {
        ...alert,
        remaining: product.stock.total,
        name: product.name,
        slug: product.slug,
      };
    })
    .sort((a, b) => daysOfStock(a) - daysOfStock(b));
}

export type RatingRow = {
  productId: string;
  name: string;
  slug: string;
  score: number;
  count: number;
};

/**
 * Điểm đánh giá từng sản phẩm, thấp lên trước. Sản phẩm chưa có điểm bị loại —
 * hiện "0 sao" cho mặt hàng chưa ai đánh giá là nói sai về nó.
 *
 * Sắp thấp lên trước vì đây là bảng để TÌM VẤN ĐỀ; bảng sắp cao xuống chỉ để
 * khoe, và người quản lý cuộn hết mới thấy mặt hàng đang bị chê.
 */
export function getRatingRows(): RatingRow[] {
  return products
    .filter((product) => product.rating)
    .map((product) => ({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      score: product.rating!.score,
      count: product.rating!.count,
    }))
    .sort((a, b) => a.score - b.score || b.count - a.count);
}

/** Điểm trung bình có trọng số theo số lượt — trung bình cộng của 24 sản phẩm là số vô nghĩa. */
export function getAverageRating(): number {
  const rows = getRatingRows();
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return 0;
  return Number(
    (rows.reduce((sum, row) => sum + row.score * row.count, 0) / total).toFixed(2),
  );
}
