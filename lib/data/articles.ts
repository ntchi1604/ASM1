import { articles } from "@/lib/data/home";

/**
 * Góc sức khoẻ — danh sách bài viết và thân bài.
 *
 * Danh sách bài lấy từ `home.ts` chứ không chép sang đây: ba bài ở trang chủ và
 * danh sách đầy đủ ở `/goc-suc-khoe` phải là CÙNG những bài. Hai sổ thì có ngày
 * sửa tiêu đề một chỗ, và trang chủ nói một câu còn trang bài nói câu khác.
 */

export type ArticleBlock =
  | { kind: "para"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "warning"; text: string };

export type ArticleContent = {
  /** Neo vào bài trong `home.ts` theo slug. */
  slug: string;
  blocks: ArticleBlock[];
};

/**
 * Thân bài cho TỪNG bài trong `articles`. Không có bài nào thiếu: trang chi tiết
 * tra không thấy thì trả 404 chứ không dựng một thân bài chung chung — một bài
 * viết rỗng ruột còn tệ hơn một bài không tồn tại, vì người đọc tin nó.
 *
 * Lưu ý nội dung: đây là bài do dược sĩ viết theo dạng giải thích, KHÔNG phải
 * phác đồ điều trị. Bài nào chạm tới việc dùng thuốc đều phải chốt bằng câu "hỏi
 * bác sĩ hoặc dược sĩ", vì người đọc có thể đang có bệnh nền mà bài không biết.
 */
const contents: ArticleContent[] = [
  {
    slug: "phan-biet-sot-xuat-huyet-va-cam-cum",
    blocks: [
      {
        kind: "para",
        text: "Sốt xuất huyết và cảm cúm mùa khởi đầu gần giống nhau: sốt, mệt, đau đầu, đau mỏi người. Ba ngày đầu thường không phân biệt được nếu chỉ nhìn triệu chứng. Thứ phân biệt được là diễn tiến và các dấu hiệu cảnh báo.",
      },
      {
        kind: "para",
        text: "Điểm cần nhớ: với sốt xuất huyết, ngày nguy hiểm nhất không phải ngày sốt cao nhất mà là lúc sốt bắt đầu giảm — thường ngày thứ 4 đến thứ 6. Nhiều người chủ quan đúng lúc cần theo dõi sát nhất.",
      },
      {
        kind: "warning",
        text: "Đi khám ngay khi có: chảy máu chân răng hoặc chảy máu mũi, nôn ra máu, đi ngoài phân đen, đau bụng dữ dội vùng gan, tay chân lạnh và vã mồ hôi, li bì hoặc vật vã. Đây là dấu hiệu sốc, không phải triệu chứng sốt thường.",
      },
      {
        kind: "para",
        text: "Việc bù nước đúng cách tại nhà: uống oresol pha đúng tỉ lệ ghi trên gói, chia từng ngụm nhỏ nhiều lần trong ngày. Pha đặc hơn hướng dẫn không giúp bù nhanh hơn mà làm rối loạn điện giải.",
      },
      {
        kind: "list",
        items: [
          "Không tự ý dùng thuốc hạ sốt nhóm NSAIDs (ibuprofen, diclofenac, aspirin) khi chưa loại trừ sốt xuất huyết — nhóm này làm tăng nguy cơ chảy máu.",
          "Paracetamol là lựa chọn hạ sốt thường dùng, nhưng phải đúng liều và đúng khoảng cách giữa các lần uống.",
          "Không dùng kháng sinh: sốt xuất huyết và cảm cúm đều do virus, kháng sinh không có tác dụng.",
          "Theo dõi sốt bằng nhiệt kế và ghi lại, đừng ước lượng bằng tay.",
        ],
      },
    ],
  },
  {
    slug: "uong-khang-sinh-bao-nhieu-ngay",
    blocks: [
      {
        kind: "para",
        text: "Câu hỏi này có một câu trả lời duy nhất đúng: uống đủ số ngày bác sĩ chỉ định, không tự ngưng sớm hơn. Cảm giác đỡ hơn sau hai ngày là dấu hiệu thuốc đang có tác dụng, không phải dấu hiệu đã khỏi.",
      },
      {
        kind: "para",
        text: "Khi bạn ngưng giữa chừng, những vi khuẩn còn sống sót thường là những con khoẻ nhất. Chúng sinh sản và lần sau chính bạn cần một loại kháng sinh mạnh hơn, đắt hơn, hoặc phải truyền qua đường tĩnh mạch.",
      },
      {
        kind: "warning",
        text: "Kháng kháng sinh là vấn đề y tế công cộng, không phải chuyện của riêng ai. Mỗi lần ngưng thuốc sớm là một lần góp phần vào đó.",
      },
      {
        kind: "list",
        items: [
          "Không dùng kháng sinh còn thừa của lần bệnh trước cho lần bệnh sau — cùng triệu chứng không có nghĩa cùng vi khuẩn.",
          "Không mua kháng sinh không có đơn. MediVia không bán loại này nếu không có đơn của bác sĩ.",
          "Uống đúng giờ, đủ liều. Kháng sinh uống lệch giờ nhiều làm nồng độ thuốc trong máu không ổn định.",
          "Nếu tác dụng phụ khiến bạn muốn ngưng, gọi bác sĩ hoặc dược sĩ để đổi loại — đừng tự bỏ.",
        ],
      },
      {
        kind: "para",
        text: "Với trẻ em, số ngày dùng thuốc do bác sĩ tính theo cân nặng chứ không theo tuổi. Hết sốt không phải là mốc để ngưng.",
      },
    ],
  },
  {
    slug: "tuong-tac-thuoc-huyet-ap-va-nsaids",
    blocks: [
      {
        kind: "para",
        text: "Thuốc giảm đau kháng viêm không steroid (NSAIDs) — ibuprofen, diclofenac, naproxen, celecoxib — làm giảm tác dụng hạ áp của nhiều thuốc huyết áp, đồng thời giữ muối và nước khiến huyết áp tăng lên.",
      },
      {
        kind: "para",
        text: "Với người đang dùng thuốc ức chế men chuyển hoặc ức chế thụ thể (tên thường gặp: enalapril, lisinopril, losartan, valsartan) kèm lợi tiểu, phối hợp thêm NSAID tạo thành bộ ba làm tăng đáng kể nguy cơ suy thận cấp. Bộ ba này có tên riêng trong y văn vì hậu quả của nó quá phổ biến.",
      },
      {
        kind: "list",
        items: [
          "Nguy cơ tăng theo tuổi và theo số bệnh nền — người trên 65 tuổi dùng nhiều thuốc là nhóm cần thận trọng nhất.",
          "Với người đang dùng thuốc chống đông (warfarin) hoặc chống kết tập tiểu cầu (aspirin, clopidogrel), thêm NSAID làm tăng nguy cơ xuất huyết tiêu hoá.",
          "Paracetamol ở đúng liều là lựa chọn giảm đau thường được cân nhắc hơn cho nhóm này, nhưng quyết định vẫn thuộc về bác sĩ đang điều trị cho bạn.",
        ],
      },
      {
        kind: "warning",
        text: "Đừng tự ngưng thuốc huyết áp để đổi sang thuốc giảm đau. Ngưng thuốc huyết áp đột ngột còn nguy hiểm hơn.",
      },
      {
        kind: "para",
        text: "Cách kiểm tra nhanh: mở MediVia, vào công cụ Kiểm tra tương tác thuốc và nhập đủ các thuốc bạn đang dùng — kể cả thuốc bổ sung và thuốc nam. Công cụ tra theo hoạt chất, nên nhập tên thương mại cũng khớp.",
      },
    ],
  },
];

export function getArticleBySlug(slug: string) {
  const meta = articles.find((article) => article.slug === slug);
  const content = contents.find((item) => item.slug === slug);
  if (!meta || !content) return undefined;
  return { meta, blocks: content.blocks };
}

/** Ba bài mới nhất, dùng cho khối "đọc tiếp". */
export function getOtherArticles(slug: string) {
  return articles.filter((article) => article.slug !== slug).slice(0, 2);
}