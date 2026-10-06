/**
 * Điểm nối tới mô hình AI thật.
 *
 * Hiện tại MediVia CHƯA gọi mô hình nào. Sáu tính năng AI đều trả dữ liệu mẫu
 * viết tay trong `lib/ai/*.ts`. Đây là chủ ý, không phải thiếu sót: giao diện
 * được dựng trước để chốt luồng và cách trình bày, phần gọi mô hình lắp sau.
 *
 * Cách lắp mô hình thật: mỗi tính năng là MỘT hàm trong MỘT tệp
 * (`lib/ai/consult.ts`, `lib/ai/identify.ts`, ...) trả về một kiểu dữ liệu đã
 * khai báo. Đổi ruột hàm đó thành lệnh gọi API, giữ nguyên kiểu trả về, thì
 * trang không phải sửa một dòng nào. Đó là lý do các trang không bao giờ tự
 * dựng chuỗi câu trả lời trong JSX.
 *
 * `thinkingDelay` tồn tại để trạng thái chờ trong giao diện là trạng thái chờ
 * THẬT. Nếu dữ liệu mẫu trả về tức thì, khối "AI đang đọc..." sẽ không bao giờ
 * hiện, và tới lúc gắn mô hình thật — lúc đó mới có độ trễ vài giây — mới phát
 * hiện chưa ai thiết kế cảnh đó.
 */

/** Bật khi đã gắn mô hình thật, để giao diện bỏ nhãn "dữ liệu mẫu". */
export const aiIsLive = false;

/**
 * Câu nói rõ tình trạng hiện tại, hiển thị ở mọi trang AI.
 *
 * Nói thẳng là dữ liệu mẫu. Trang demo mà để người dùng tưởng máy đang thật sự
 * đọc ảnh vỉ thuốc của họ là chuyện khác hẳn một trang demo.
 */
export const aiMockNotice =
  "Bản demo: kết quả bên dưới là dữ liệu mẫu dựng sẵn, chưa phải kết quả từ mô hình AI thật.";

export function thinkingDelay(ms = 900) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Bỏ dấu tiếng Việt để so khớp câu người dùng gõ, ví dụ "đau đầu" ~ "dau dau". */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

/**
 * true khi câu người dùng gõ chứa bất kỳ từ khoá nào trong danh sách.
 *
 * Khớp theo BIÊN TỪ, không phải khớp chuỗi con. Đây là sửa lỗi thật, không phải
 * làm cho đẹp: bản cũ dùng `includes` nên từ khoá "ho" khớp bên trong "không" —
 * câu "tôi không muốn buồn ngủ" và "khó thở" đều bị tính là có nhắc tới ho. Với
 * danh sách triệu chứng thì đó là phân loại sai âm thầm: câu về đau ngực rơi vào
 * nhánh cảm cúm và trang vẫn hiện ra một danh sách thuốc đầy tự tin.
 */
export function matchesAny(text: string, keywords: string[]) {
  const haystack = normalize(text);
  return keywords.some((keyword) => {
    const needle = normalize(keyword);
    if (!needle) return false;
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(haystack);
  });
}
