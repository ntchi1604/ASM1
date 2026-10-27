/**
 * Hàm duy nhất được phép sinh chuỗi giá. Định dạng: 125.000 ₫
 * — dấu chấm phân cách nghìn, không phần thập phân, ₫ đứng sau.
 * Không component nào tự nối chuỗi giá.
 */
export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

/** Giá kèm đơn vị, ví dụ "78.000 ₫ / Hộp". Dùng ở mọi nơi hiển thị giá. */
export function formatPricePerUnit(amount: number, unit: string): string {
  return `${formatVnd(amount)} / ${unit}`;
}

/** Phần trăm giảm giá, làm tròn xuống để không nói quá. */
export function discountPercent(price: number, originalPrice: number): number {
  if (originalPrice <= 0 || price >= originalPrice) return 0;
  return Math.floor(((originalPrice - price) / originalPrice) * 100);
}

/** Số lượng lớn: 1.247 nhà thuốc */
export function formatCount(value: number): string {
  return value.toLocaleString("vi-VN");
}

/**
 * Tồn kho viết cụ thể theo tông giọng đã chốt:
 * "Còn 12 hộp tại 3 nhà thuốc gần bạn", không viết "Còn hàng".
 */
export function formatStock(
  total: number,
  nearbyPharmacies: number,
  unit: string,
): string {
  if (total <= 0) return "Tạm hết hàng";
  const unitLower = unit.toLowerCase();
  if (nearbyPharmacies <= 0) {
    return `Còn ${formatCount(total)} ${unitLower}, giao từ kho trung tâm`;
  }
  return `Còn ${formatCount(total)} ${unitLower} tại ${nearbyPharmacies} nhà thuốc gần bạn`;
}

/**
 * Dung lượng tệp: "1,2 MB".
 *
 * Chia cho 1.048.576 (MiB) chứ không phải 1.000.000: hạn mức của lược đồ là
 * 10.485.760 byte, và mọi câu đã hứa với khách đều ghi "dưới 10 MB". Chia theo
 * hệ thập phân thì chính dòng hạn mức hiện "10,5 MB" — trông như hệ thống cho
 * phép nhiều hơn mức nó thực sự nhận.
 */
export function formatFileSize(bytes: number): string {
  // Dưới 1 MB thì đổi đơn vị: "0 MB" cho một tệp 81 byte là câu trả lời sai cho
  // câu hỏi "khách gửi tệp gì", và cũng giấu mất trường hợp tệp rỗng.
  if (bytes < 1_048_576) {
    return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("vi-VN")} KB`;
  }
  return `${(bytes / 1_048_576).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;
}

/**
 * Ngày tháng kiểu Việt: 16/09/2026
 * Nhận cả chuỗi ISO ("2026-09-12") vì dữ liệu từ API luôn về dạng chuỗi.
 */
export function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Ngày kèm giờ: "15/09/2026 22:07". Dùng cho hàng đợi đơn — đơn trong ngày cần
 * biết giờ, không chỉ ngày.
 *
 * Cắt chuỗi thẳng chứ KHÔNG dựng `Date`: chuỗi ISO không kèm múi giờ mà đem qua
 * `new Date()` thì máy chủ ở múi giờ nào sẽ đọc theo múi giờ đó, và đơn lúc 22:07
 * có ngày hiển thị lệch một ngày.
 */
export function formatDateTime(value: string): string {
  const [date, time = ""] = value.split("T");
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} ${time.slice(0, 5)}`;
}

/**
 * Tiền dạng rút gọn cho nhãn biểu đồ: "33,5 tr", "1,2 tỷ".
 *
 * CHỈ dùng khi chỗ hiển thị hẹp hơn con số đầy đủ — cụ thể là nhãn trên cột biểu
 * đồ, nơi mỗi cột rộng chưa tới 50px còn "33.480.000 ₫" cần 68px. Mọi nơi khác
 * vẫn phải dùng `formatVnd`: giá sản phẩm, tổng giỏ hàng, hoá đơn không được rút
 * gọn, vì người mua có quyền thấy đúng số tiền họ trả.
 *
 * Làm tròn tới một chữ số thập phân, nên đây là con số ĐỌC NHANH, không phải con
 * số để đối chiếu. Chỗ nào dùng nó thì phải có bản đầy đủ ở gần đó (bảng số liệu
 * hoặc bảng ẩn cho trình đọc màn hình).
 */
export function formatVndCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} ng`;
  }
  return formatVnd(amount);
}
