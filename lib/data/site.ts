/**
 * Hằng số toàn site. Header, footer, nav chỉ đọc từ đây nên không thể
 * lệch chữ giữa các page.
 */

export const site = {
  name: "MediVia",
  tagline: "Nhà thuốc trực tuyến có dược sĩ và AI đồng hành",
  hotline: "1800 6928",
  pharmacyCount: 1247,
  licenseNumber: "0106/HCM",
  professionalManager: "DS. Trần Thu Hà",
  address: "142 Nguyễn Đình Chiểu, P. Võ Thị Sáu, Q.3, TP.HCM",
} as const;

/** Placeholder ô tìm kiếm — thể hiện luôn năng lực AI hiểu câu tự nhiên. */
export const searchPlaceholder =
  "Nhập triệu chứng hoặc tên thuốc — ví dụ: thuốc đau đầu dưới 100.000 ₫";

export const utilityBarLinks = [
  { label: "Tra cứu đơn hàng", href: "/tra-cuu-don-hang", icon: "truck" },
  {
    label: `Hệ thống ${site.pharmacyCount.toLocaleString("vi-VN")} nhà thuốc`,
    href: "/he-thong-nha-thuoc",
    icon: "store",
  },
  { label: "Tải ứng dụng", href: "/tai-ung-dung", icon: "smartphone" },
] as const;

/**
 * 7 mục nav chính, thứ tự cố định trên mọi page.
 *
 * Mọi href ở đây PHẢI là slug có thật trong `lib/data/categories.ts`. Bản trước
 * trỏ vào `/danh-muc/thuoc`, `/danh-muc/thuc-pham-chuc-nang`, `/danh-muc/duoc-my-pham`
 * — đó là cách phân loại theo `Product.type`, không phải danh mục, nên cả ba đều
 * 404. Nav là chỗ người xem bấm vào đầu tiên; ba mục chết ở đó thì không còn gì
 * để nói về phần còn lại của trang.
 *
 * Chọn 6 danh mục có sản phẩm nhiều nhất, không lấy đủ 12: nav 12 mục thì trên
 * màn 1280px phải cuộn ngang, mà danh mục còn lại đã có ở lưới trang chủ và footer.
 */
export const mainNav = [
  { label: "Cảm cúm, hạ sốt", href: "/danh-muc/cam-cum-ha-sot" },
  { label: "Hô hấp, ho", href: "/danh-muc/ho-hen-suyen" },
  { label: "Tiêu hoá", href: "/danh-muc/tieu-hoa" },
  { label: "Vitamin & khoáng chất", href: "/danh-muc/vitamin-khoang-chat" },
  { label: "Đau nhức xương khớp", href: "/danh-muc/giam-dau-khang-viem" },
  { label: "Tim mạch", href: "/danh-muc/tim-mach" },
  { label: "Góc sức khoẻ", href: "/goc-suc-khoe" },
] as const;

/** Các tính năng AI, dùng cho menu AI ở header và khối giới thiệu trang chủ. */
export const aiNav = [
  { label: "Tư vấn triệu chứng", href: "/ai/tu-van", icon: "stethoscope" },
  { label: "Tìm thuốc bằng AI", href: "/ai/tim-kiem", icon: "search" },
  { label: "Chatbot dược sĩ", href: "/ai/chatbot", icon: "message" },
  { label: "Nhận diện thuốc bằng ảnh", href: "/ai/nhan-dien", icon: "camera" },
  { label: "Kiểm tra tương tác thuốc", href: "/ai/tuong-tac", icon: "alert" },
  { label: "Tìm bằng giọng nói", href: "/ai/giong-noi", icon: "mic" },
] as const;

export const footerColumns = [
  {
    title: "Về MediVia",
    links: [
      { label: "Giới thiệu", href: "/gioi-thieu" },
      { label: "Hệ thống nhà thuốc", href: "/he-thong-nha-thuoc" },
      { label: "Tuyển dụng", href: "/tuyen-dung" },
      { label: "Liên hệ", href: "/lien-he" },
    ],
  },
  {
    title: "Hỗ trợ khách hàng",
    links: [
      { label: "Hướng dẫn mua thuốc", href: "/huong-dan-mua-thuoc" },
      { label: "Chính sách vận chuyển", href: "/chinh-sach-van-chuyen" },
      { label: "Chính sách đổi trả", href: "/chinh-sach-doi-tra" },
      { label: "Câu hỏi thường gặp", href: "/faq" },
    ],
  },
  {
    title: "Chính sách",
    links: [
      { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
      { label: "Điều khoản sử dụng", href: "/dieu-khoan-su-dung" },
      { label: "Quy định bán thuốc kê đơn", href: "/quy-dinh-thuoc-ke-don" },
    ],
  },
] as const;

/** Khuyến cáo bắt buộc theo quy định với thực phẩm bảo vệ sức khoẻ. */
export const supplementDisclaimer =
  "Thực phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.";

/** Khuyến cáo bắt buộc trên mọi khối do AI tạo. */
export const aiDisclaimer =
  "Nội dung do AI tổng hợp, không chẩn đoán và không thay thế chỉ định của bác sĩ hoặc dược sĩ.";

/** Ghi chú cạnh giá thuốc kê đơn. */
export const prescriptionPriceNote = "Bán theo đơn bác sĩ";

