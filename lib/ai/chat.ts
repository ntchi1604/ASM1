import { getProductBySlug, products } from "@/lib/data/products";
import { getProductDetail } from "@/lib/data/product-details";
import { matchesAny, normalize, thinkingDelay } from "./engine";

/** Một đoạn trả lời. Tách đoạn để trang xuống dòng đúng chỗ, không nhận về một khối chữ. */
export type ChatAnswer = {
  question: string;
  /** Câu trả lời, mỗi phần tử là một đoạn. */
  paragraphs: string[];
  /** Gạch đầu dòng, nếu câu trả lời có dạng liệt kê. */
  bullets?: string[];
  /**
   * true khi câu hỏi vượt ngoài phạm vi chatbot được phép trả lời — trang phải
   * hiện khối chuyển sang dược sĩ thật thay vì cố trả lời.
   */
  needsPharmacist: boolean;
  /** Vì sao phải chuyển dược sĩ; hiện nguyên văn cho người dùng. */
  handoffReason?: string;
  /** Thuốc liên quan tới câu hỏi, để trang dẫn sang trang chi tiết. */
  relatedSlug?: string;
  /** Câu hỏi tiếp theo gợi ý. */
  followUps: string[];
};

/**
 * Tính năng 3 — Chatbot dược sĩ AI.
 *
 * Giới hạn được cài trong hàm, không phải trong lời nhắc: bốn nhóm câu hỏi luôn
 * chuyển sang dược sĩ thật, dù AI "có thể" trả lời được.
 *
 *   1. Liều cho trẻ theo cân nặng — sai một chữ số là ngộ độc.
 *   2. Phụ nữ có thai, cho con bú — phải xét từng ca.
 *   3. Thuốc kê đơn, kháng sinh — không tư vấn dùng qua chatbot.
 *   4. Dấu hiệu nặng — cần người khám, không cần câu trả lời.
 *
 * Đây là lý do hàm trả về `needsPharmacist` chứ không để trang tự đoán: nếu quyết
 * định nằm ở trang thì mỗi trang gọi chatbot lại có thể quên một nhóm.
 */
export async function askPharmacist(
  question: string,
  aboutProductName?: string,
): Promise<ChatAnswer> {
  await thinkingDelay(1000);

  const related = aboutProductName
    ? products.find((item) => item.name === aboutProductName)
    : undefined;

  const base = {
    question,
    relatedSlug: related?.slug,
  };

  if (matchesAny(question, ["co thai", "mang thai", "bau", "cho con bu", "cho bu"])) {
    return {
      ...base,
      paragraphs: [
        "Câu hỏi này MediVia không trả lời bằng AI. Thuốc dùng cho phụ nữ có thai hoặc đang cho con bú phải xét theo từng trường hợp: tuổi thai, thuốc cụ thể, liều và bệnh kèm theo đều làm thay đổi kết luận.",
      ],
      needsPharmacist: true,
      handoffReason:
        "Phụ nữ có thai và cho con bú cần dược sĩ hoặc bác sĩ xem trực tiếp, không tư vấn qua chatbot.",
      followUps: [],
    };
  }

  // Nhận diện câu hỏi liều cho trẻ KHÔNG thể chỉ dựa vào danh sách cụm từ cố định.
  // Câu tự nhiên nhất mà người mẹ gõ là "con tôi 13kg uống bao nhiêu ml" — không chứa
  // cụm nào trong danh sách cũ, và nó từng rơi xuống nhánh mô tả sản phẩm bình thường.
  // Đó là kiểu lỗi im lặng đúng ở chỗ nguy hiểm nhất: máy vẫn trả lời tự tin.
  // Nên bắt thêm hai dấu hiệu độc lập: (a) có số kèm "kg", (b) có từ chỉ trẻ VÀ từ hỏi liều.
  const asksDose = matchesAny(question, [
    "bao nhieu", "lieu", "may ml", "may vien", "may goi", "uong the nao", "cach dung",
  ]);
  // Dùng regex có biên từ, KHÔNG dùng matchesAny: `matchesAny` so khớp chuỗi con, nên
  // "tre" sẽ khớp cả "trên 60 tuổi" và đẩy câu hỏi liều cho người cao tuổi vào nhánh
  // trẻ em. Sai nhánh ở đây không nguy hiểm bằng bỏ sót, nhưng vẫn là trả lời sai câu.
  const mentionsChild = /(^|[^a-z])(tre|be|chau|con)([^a-z]|$)|so sinh|thang tuoi/.test(
    normalize(question),
  );
  const mentionsWeight = /\d+\s*(kg|ki-?lo)/.test(normalize(question));

  if (
    matchesAny(question, ["lieu cho tre", "tre may kg", "can nang", "tre so sinh", "tre bao nhieu"]) ||
    (mentionsWeight && (mentionsChild || asksDose)) ||
    (mentionsChild && asksDose)
  ) {
    return {
      ...base,
      paragraphs: [
        "Liều thuốc cho trẻ tính theo cân nặng, và MediVia không đưa con số liều cụ thể cho trẻ qua chatbot — nhầm một chữ số là ngộ độc.",
        "Nguyên tắc chung bạn có thể nắm: thuốc hạ sốt paracetamol cho trẻ thường tính 10–15 mg cho mỗi kg cân nặng, mỗi lần cách nhau tối thiểu 4–6 giờ, tối đa 4 lần một ngày. Con số áp cho con bạn thì cần dược sĩ xác nhận theo cân nặng thật và dạng thuốc bạn đang có.",
      ],
      needsPharmacist: true,
      handoffReason: "Liều cho trẻ phải tính theo cân nặng thật, cần dược sĩ xác nhận.",
      followUps: [],
    };
  }

  if (matchesAny(question, ["khang sinh", "augmentin", "amoxicillin", "thuoc ke don", "don thuoc"])) {
    return {
      ...base,
      paragraphs: [
        "Kháng sinh và thuốc kê đơn chỉ dùng theo chỉ định của bác sĩ. MediVia không tư vấn cách dùng kháng sinh qua chatbot, kể cả khi bạn đã từng dùng thuốc đó.",
        "Nếu bạn đang có đơn thuốc, dược sĩ MediVia sẽ đọc đơn và hướng dẫn cách dùng, thời điểm uống và những thứ cần tránh trong thời gian điều trị.",
      ],
      needsPharmacist: true,
      handoffReason: "Thuốc kê đơn cần dược sĩ đối chiếu đơn trước khi hướng dẫn.",
      followUps: [],
    };
  }

  if (matchesAny(question, ["kho tho", "tuc nguc", "co giat", "lo mo", "ngat", "chay mau nhieu"])) {
    return {
      ...base,
      paragraphs: [
        "Những dấu hiệu bạn vừa nhắc là dấu hiệu cần được khám ngay, không phải tình huống để tra cứu thuốc. Hãy đến cơ sở y tế gần nhất, hoặc gọi 115 nếu tình trạng đang nặng lên.",
      ],
      needsPharmacist: true,
      handoffReason: "Dấu hiệu nghi nặng — cần người khám trực tiếp, không chờ tư vấn.",
      followUps: [],
    };
  }

  // Câu hỏi về một thuốc cụ thể: trả lời từ dữ liệu thuốc đó.
  if (related) {
    const detail = getProductDetail(related.id);

    if (matchesAny(question, ["uong luc nao", "truoc an", "sau an", "khi nao uong", "cach dung", "lieu"])) {
      return {
        ...base,
        paragraphs: [
          `Về ${related.name}, đây là cách dùng ghi trên nhãn:`,
        ],
        bullets: detail?.dosage ?? [],
        needsPharmacist: false,
        followUps: [
          `${related.name} có tác dụng phụ gì?`,
          `${related.name} dùng được cho trẻ em không?`,
        ],
      };
    }

    if (matchesAny(question, ["tac dung phu", "phan ung", "co hai", "anh huong gan"])) {
      return {
        ...base,
        paragraphs: [
          `Tác dụng phụ được ghi nhận của ${related.name}: ${detail?.sideEffects ?? "chưa có dữ liệu trong hệ thống."}`,
          "Nếu bạn gặp bất kỳ dấu hiệu nào khác thường sau khi dùng thuốc, ngừng thuốc và gọi dược sĩ.",
        ],
        bullets: detail?.cautions,
        needsPharmacist: false,
        followUps: [
          `${related.name} uống lúc nào thì tốt nhất?`,
          `${related.name} có tương tác với thuốc nào?`,
        ],
      };
    }

    if (matchesAny(question, ["tuong tac", "uong cung", "chung voi", "ket hop"])) {
      return {
        ...base,
        paragraphs: [
          `Để đối soát chính xác, bạn dùng công cụ kiểm tra tương tác và nhập tất cả thuốc đang dùng — kể cả thuốc mua ở nơi khác. Riêng với ${related.name}, hoạt chất cần để ý là ${related.activeIngredient.toLowerCase()}.`,
          "Nguyên tắc quan trọng nhất: không dùng đồng thời hai thuốc cùng hoạt chất, vì đó là quá liều chứ không phải tăng hiệu quả.",
        ],
        needsPharmacist: false,
        followUps: [`${related.name} có tác dụng phụ gì?`],
      };
    }

    return {
      ...base,
      paragraphs: [
        `${related.name} chứa ${related.activeIngredient.toLowerCase()}${related.strength ? ` hàm lượng ${related.strength}` : ""}. ${related.shortUses}`,
      ],
      bullets: detail?.uses,
      needsPharmacist: false,
      followUps: [
        `${related.name} uống lúc nào?`,
        `${related.name} có tác dụng phụ gì?`,
        `${related.name} dùng được cho trẻ em không?`,
      ],
    };
  }

  // Câu hỏi chung, không gắn thuốc nào.
  if (matchesAny(question, ["ha sot", "sot", "cam", "dau dau"])) {
    return {
      ...base,
      paragraphs: [
        "Với sốt và đau đầu thông thường ở người lớn, nhóm thuốc đầu tay là paracetamol. Vài điểm cần nhớ:",
      ],
      bullets: [
        "Chỉ dùng MỘT thuốc chứa paracetamol tại một thời điểm — Hapacol, Efferalgan, Panadol đều là paracetamol.",
        "Người lớn không vượt 4.000 mg paracetamol mỗi ngày, mỗi lần cách nhau tối thiểu 4 giờ.",
        "Uống nhiều nước; sốt làm mất nước nhanh hơn bình thường.",
        "Sốt trên 39°C không hạ sau 2 ngày dùng thuốc thì đi khám, không tăng liều.",
      ],
      needsPharmacist: false,
      relatedSlug: getProductBySlug("hapacol-650")?.slug,
      followUps: [
        "Paracetamol và ibuprofen khác nhau thế nào?",
        "Sốt bao nhiêu độ thì cần uống thuốc hạ sốt?",
      ],
    };
  }

  if (matchesAny(question, ["vitamin", "de khang", "bo sung", "uong bao lau"])) {
    return {
      ...base,
      paragraphs: [
        "Thực phẩm bảo vệ sức khoẻ không phải là thuốc và không thay thế thuốc chữa bệnh. Chúng hỗ trợ khi chế độ ăn chưa đủ chất, không dùng để điều trị.",
        "Vitamin C liều 1.000 mg thường uống sau ăn sáng, không uống lúc đói vì dễ cồn ruột, và không uống vào buổi tối vì có thể gây khó ngủ ở một số người.",
      ],
      needsPharmacist: false,
      followUps: [
        "Vitamin C có tương tác với thuốc nào không?",
        "Uống vitamin C liên tục có sao không?",
      ],
    };
  }

  // Không hiểu câu hỏi: nói thẳng, kèm đường sang dược sĩ thật.
  return {
    ...base,
    paragraphs: [
      "MediVia chưa hiểu rõ câu hỏi của bạn nên chưa trả lời được một cách chắc chắn. Bạn hỏi lại cụ thể hơn — kèm tên thuốc hoặc triệu chứng — hoặc nói trực tiếp với dược sĩ sẽ nhanh hơn.",
    ],
    needsPharmacist: true,
    handoffReason: "AI chưa đủ căn cứ để trả lời câu hỏi này.",
    followUps: [
      "Thuốc hạ sốt nào dùng được cho người lớn?",
      "Uống thuốc cảm bao lâu thì đỡ?",
      "Vitamin C nên uống lúc nào?",
    ],
  };
}

/** Câu hỏi gợi ý khi mở chatbot mà chưa hỏi gì. */
export const starterQuestions = [
  "Thuốc hạ sốt nào dùng được cho người lớn?",
  "Paracetamol và ibuprofen khác nhau thế nào?",
  "Vitamin C nên uống lúc nào?",
  "Uống thuốc cảm bao lâu thì đỡ?",
  "Trẻ 15kg uống hạ sốt liều bao nhiêu?",
];

/** Chuẩn hoá câu hỏi để so với gợi ý — dùng ở trang chatbot. */
export function isStarter(question: string) {
  return starterQuestions.some((item) => normalize(item) === normalize(question));
}
