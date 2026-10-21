import type { Review, ReviewSummary } from "@/lib/types";
import { products } from "@/lib/data/products";

/**
 * Đánh giá khách hàng. Chỉ có với sản phẩm nào đã có `rating` trong
 * products.ts — nếu sản phẩm chưa có điểm thì cũng không được có nhận xét,
 * vì hai con số đó phải nói cùng một chuyện.
 */
export const reviews: Review[] = [
  {
    id: "rv-hapacol-1",
    productId: "hapacol-650",
    author: "Nguyễn Thị Lan",
    initials: "NL",
    score: 5,
    date: "2026-09-08",
    body: "Thuốc sủi uống nhanh tan, vị cam dễ chịu không bị đắng. Uống khoảng 20 phút là thấy hạ sốt và bớt nhức đầu rõ rệt.",
  },
  {
    id: "rv-hapacol-2",
    productId: "hapacol-650",
    author: "Trần Hoàng Nam",
    initials: "TN",
    score: 5,
    date: "2026-09-05",
    body: "Dược sĩ tư vấn rất kỹ về liều cách nhau 4 tiếng. Đặt giao hoả tốc nhận hàng trong 45 phút, đóng gói cẩn thận có túi giữ nhiệt.",
  },
  {
    id: "rv-hapacol-3",
    productId: "hapacol-650",
    author: "Lê Minh Châu",
    initials: "LC",
    score: 4,
    date: "2026-08-29",
    body: "Hiệu quả tốt nhưng viên sủi hơi to, người khó uống nên chia nước ra nhiều lần. Giá ở đây rẻ hơn nhà thuốc gần nhà tôi.",
  },
  {
    id: "rv-panadol-1",
    productId: "panadol-extra",
    author: "Phạm Quốc Anh",
    initials: "PA",
    score: 5,
    date: "2026-09-11",
    body: "Giảm đau đầu nhanh, khoảng 30 phút là dịu. Có điều uống buổi tối thì khó ngủ đúng như dược sĩ nhắc trước.",
  },
  {
    id: "rv-panadol-2",
    productId: "panadol-extra",
    author: "Đỗ Thu Hương",
    initials: "ĐH",
    score: 4,
    date: "2026-09-02",
    body: "Mua thường xuyên cho tủ thuốc gia đình. Hộp có tem chống hàng giả, quét mã kiểm tra được nguồn gốc.",
  },
  {
    id: "rv-efferalgan-1",
    productId: "efferalgan-500",
    author: "Vũ Thanh Bình",
    initials: "VB",
    score: 5,
    date: "2026-09-09",
    body: "Tuýp nhựa kín nên viên không bị ẩm như loại vỉ giấy. Con tôi 14 tuổi uống hạ sốt trong vòng một tiếng.",
  },
  {
    id: "rv-hapacol150-1",
    productId: "hapacol-150",
    author: "Ngô Kim Yến",
    initials: "NY",
    score: 5,
    date: "2026-09-12",
    body: "Bột vị cam bé chịu uống, không phải dỗ. Dược sĩ hỏi cân nặng của bé rồi mới hướng dẫn liều, tôi thấy yên tâm.",
  },
  {
    id: "rv-hapacol150-2",
    productId: "hapacol-150",
    author: "Bùi Văn Tuấn",
    initials: "BT",
    score: 4,
    date: "2026-08-25",
    body: "Gói nhỏ tiện mang đi. Nên có thêm loại 250mg cho bé lớn hơn để không phải đổi thuốc khi con tăng cân.",
  },
];

export function getReviews(productId: string): Review[] {
  // Mới nhất lên trước: người mua muốn biết chất lượng gần đây, không phải
  // nhận xét từ hai năm trước. Đánh giá bị quản trị ẩn thì không lên trang.
  return reviews
    .filter((review) => review.productId === productId && !review.hidden)
    .sort((a, b) => b.date.localeCompare(a.date));
}


/**
 * Các phương án phần đuôi (3 sao, 2 sao, 1 sao), xếp từ "thật" nhất xuống.
 *
 * Điểm càng cao thì phần đuôi càng phải nhỏ, vì trung bình có trọng số phải
 * đúng bằng điểm: 4,9 sao không thể có 5% đánh giá 1–3 sao, và 5,0 sao buộc
 * phải là 100% năm sao. Chọn phương án đầu tiên còn giải được.
 */
const tailCandidates: [number, number, number][] = [
  [3, 1, 1],
  [2, 1, 1],
  [2, 0, 1],
  [1, 0, 1],
  [1, 0, 0],
  [0, 0, 0],
];

/**
 * Phân bố sao. Tính từ điểm trung bình thật trong products.ts thay vì gõ tay
 * từng sản phẩm.
 *
 * Hai ràng buộc phải đúng tuyệt đối: tổng bằng 100% và trung bình có trọng số
 * bằng `score`. Nếu chia áng theo cảm giác thì biểu đồ sẽ nói một điểm khác
 * với con số 4,8 in ngay bên cạnh nó.
 */
export function getReviewSummary(productId: string): ReviewSummary | undefined {
  const product = products.find((item) => item.id === productId);
  if (!product?.rating) return undefined;

  const { score, count } = product.rating;

  // Làm việc trên số nguyên "phần trăm × sao" để không có sai số dấu phẩy.
  const totalPoints = Math.round(score * 100);

  for (const [three, two, one] of tailCandidates) {
    const tailPercent = three + two + one;
    const tailPoints = three * 3 + two * 2 + one * 1;
    const headPercent = 100 - tailPercent;

    // Giải f từ: 5f + 4(headPercent − f) + tailPoints = totalPoints
    const five = totalPoints - 4 * headPercent - tailPoints;
    if (five < 0 || five > headPercent) continue;

    const four = headPercent - five;
    const distribution: [number, number, number, number, number] = [
      five,
      four,
      three,
      two,
      one,
    ];

    return {
      productId,
      score,
      count,
      // "Hài lòng" = 4 sao trở lên. Nhãn ở component phải nói rõ ngưỡng này.
      satisfactionPercent: five + four,
      distribution,
    };
  }

  // Điểm dưới 4,0: không phương án nào khớp. Thà không vẽ biểu đồ còn hơn vẽ
  // một biểu đồ nói sai điểm.
  return undefined;
}
