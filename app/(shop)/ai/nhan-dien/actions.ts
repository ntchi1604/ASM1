"use server";

import { redirect } from "next/navigation";

/**
 * Nhận ảnh vỉ thuốc.
 *
 * Vì sao đây là server action chứ không phải form GET như các trang AI khác: GET
 * không mang được nội dung tệp. Form GET có ô chọn tệp chỉ gửi đúng cái TÊN tệp
 * và bỏ toàn bộ ảnh — trang sẽ chạy, không báo lỗi, và luôn trả kết quả sai. Đó
 * là kiểu lỗi tệ nhất: im lặng.
 *
 * Ảnh KHÔNG được lưu lại. Bản demo chỉ đọc tên tệp để chọn kịch bản, rồi chuyển
 * sang trang kết quả với `?anh=` — nhờ vậy kết quả vẫn nằm trong URL, vẫn quay
 * lại được và vẫn chia sẻ được như mọi trang AI khác.
 *
 * Khi lắp mô hình thật: chỗ này gửi `file` tới API nhận diện và chuyển sang trang
 * kết quả kèm mã lần nhận diện. Ảnh vỉ thuốc của người dùng vẫn không cần lưu.
 */
export async function identifyPhoto(formData: FormData) {
  const file = formData.get("anh");
  const name = file instanceof File && file.name.length > 0 ? file.name : "vi-thuoc.jpg";

  redirect(`/ai/nhan-dien?anh=${encodeURIComponent(name)}`);
}
