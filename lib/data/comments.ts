import type { Comment } from "@/lib/types";

/**
 * Bình luận dưới bài viết Góc sức khoẻ.
 *
 * Bình luận mẫu để trang có nội dung ngay từ lần mở đầu; bình luận khách viết
 * được ghi vào kho delta qua `addRow("comments", …)`, nên mảng này chỉ là bản
 * mẫu — trang quản trị đọc bằng `listRows` để thấy cả hai loại.
 *
 * Nội dung mẫu là câu hỏi thật người đọc hay hỏi, không phải lời khen. Một mục
 * bình luận toàn lời khen thì người đọc không dám hỏi.
 */
export const comments: Comment[] = [
  {
    id: "cm-sot-xuat-huyet-1",
    articleSlug: "phan-biet-sot-xuat-huyet-va-cam-cum",
    author: "Trịnh Mai Phương",
    initials: "TP",
    date: "2026-09-30T09:12",
    body: "Bé nhà mình sốt ngày thứ 3, đã xét nghiệm âm tính sốt xuất huyết. Vẫn phải theo dõi tiếp đến ngày thứ 6 không, hay âm tính là yên tâm được rồi?",
    reply: {
      body: "Xét nghiệm trong 3 ngày đầu có thể âm tính dù đang nhiễm, nên kết quả âm không thay thế việc theo dõi. Bé còn sốt hoặc có dấu hiệu mệt lả, nôn nhiều thì cho đi khám lại, đừng chờ đủ ngày. Bạn gọi 1800 6928 để dược sĩ hỏi thêm triệu chứng nhé.",
      author: "DS. Trần Thu Hà",
      date: "2026-09-30T10:04",
    },
  },
  {
    id: "cm-sot-xuat-huyet-2",
    articleSlug: "phan-biet-sot-xuat-huyet-va-cam-cum",
    author: "Lâm Quốc Thái",
    initials: "LT",
    date: "2026-10-02T20:41",
    body: "Cho mình hỏi oresol pha sẵn để trong tủ lạnh dùng dần trong ngày được không, hay phải pha mới mỗi lần uống?",
    reply: {
      body: "Pha xong dùng trong 24 giờ và bảo quản nắp kín; qua ngày thì bỏ, pha mẻ mới. Nước đã pha để lâu có thể nhiễm khuẩn mà vị vẫn bình thường, nên đừng tiếc.",
      author: "DS. Trần Thu Hà",
      date: "2026-10-03T08:15",
    },
  },
  {
    id: "cm-khang-sinh-1",
    articleSlug: "uong-khang-sinh-bao-nhieu-ngay",
    author: "Nguyễn Hải Yến",
    initials: "NY",
    date: "2026-09-25T14:08",
    body: "Mình uống kháng sinh được 4/7 ngày thì hết thuốc vì bác sĩ kê thiếu. Có nên mua thêm đúng loại đó để uống cho đủ không?",
    reply: {
      body: "Đừng tự mua bổ sung. Liều và số ngày do bác sĩ tính theo ca bệnh; uống nối bằng một hộp mua ngoài có thể sai hàm lượng hoặc sai hoạt chất. Mang đơn và vỏ thuốc quay lại chỗ kê đơn để được cấp đủ.",
      author: "DS. Trần Thu Hà",
      date: "2026-09-25T15:30",
    },
  },
  {
    id: "cm-tuong-tac-1",
    articleSlug: "tuong-tac-thuoc-huyet-ap-va-nsaids",
    author: "Đoàn Minh Khôi",
    initials: "ĐK",
    date: "2026-10-05T11:20",
    body: "Bố mình đang dùng losartan và có uống thêm aspirin 81mg mỗi ngày theo chỉ định tim mạch. Vậy có được dùng paracetamol khi đau khớp không?",
    reply: {
      body: "Paracetamol đúng liều thường là lựa chọn được cân nhắc trong nhóm này, nhưng cần biết thêm chức năng gan và các thuốc đang dùng. Aspirin liều thấp theo chỉ định tim mạch thì không tự ngưng. Bạn dùng công cụ Kiểm tra tương tác của MediVia rồi gọi dược sĩ xác nhận lại giúp bố nhé.",
      author: "DS. Trần Thu Hà",
      date: "2026-10-05T13:02",
    },
  },
];

/**
 * Bình luận đang hiện của một bài, cũ nhất trước — mạch hỏi đáp đọc từ trên
 * xuống như một cuộc trò chuyện. Bình luận bị ẩn thì không lên bài.
 */
export function getComments(articleSlug: string): Comment[] {
  return comments
    .filter((comment) => comment.articleSlug === articleSlug && !comment.hidden)
    .sort((a, b) => a.date.localeCompare(b.date));
}
