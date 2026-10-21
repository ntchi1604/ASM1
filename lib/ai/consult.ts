import type { Product, RedFlag } from "@/lib/types";
import { getProductById } from "@/lib/data/products";
import { matchesAny, thinkingDelay } from "./engine";

/** Một nhóm thuốc được gợi ý, kèm lý do và các thuốc cụ thể. */
export type ConsultGroup = {
  /** Tên nhóm theo cách người thường gọi, ví dụ "Thuốc hạ sốt, giảm đau". */
  title: string;
  /** Vì sao nhóm này phù hợp với triệu chứng vừa mô tả. */
  reason: string;
  products: Product[];
};

export type ConsultResult = {
  /** Câu người dùng đã mô tả, trả lại để trang hiện "bạn đã hỏi". */
  query: string;
  /**
   * Nhận định của AI, viết như dược sĩ nói: nêu điều nhìn thấy, không kết luận
   * bệnh. Không bao giờ chứa tên bệnh kèm chữ "bạn bị".
   */
  reading: string;
  groups: ConsultGroup[];
  redFlags: RedFlag[];
  selfCare: string[];
  confidence: number;
  /** Câu hỏi AI cần biết thêm; hiện dạng gợi ý bấm được. */
  followUps: string[];
};

/**
 * Ba dấu hiệu chung, luôn đứng đầu danh sách cờ đỏ của mọi nhánh gợi ý.
 *
 * Xuất ra ngoài để `design/seed-postgres.mjs` nạp được vào bảng `red_flags`:
 * danh sách này là DỮ LIỆU Y KHOA, và lược đồ đặt nó trong cơ sở dữ liệu chứ
 * không trong mã — dược sĩ cập nhật được mà không phải deploy lại.
 */
export const commonFlags: RedFlag[] = [
  {
    label: "Sốt trên 39°C không hạ sau 2 ngày dùng thuốc",
    action: "Đến cơ sở y tế để tìm nguyên nhân, không tăng liều thuốc hạ sốt.",
  },
  {
    label: "Khó thở, tức ngực, lơ mơ hoặc co giật",
    action: "Gọi 115 hoặc đến khoa cấp cứu gần nhất ngay.",
  },
  {
    label: "Trẻ dưới 3 tháng tuổi bị sốt",
    action: "Đưa trẻ đi khám ngay, không tự dùng thuốc hạ sốt tại nhà.",
  },
];

/**
 * Tính năng 1 — Tư vấn triệu chứng.
 *
 * Nguyên tắc: AI mô tả lại triệu chứng và gợi ý NHÓM thuốc, tuyệt đối không
 * chẩn đoán bệnh. "Bạn có thể bị viêm họng do vi khuẩn, nên dùng kháng sinh" là
 * câu một phần mềm không được phép nói — nó vừa sai luật vừa dẫn tới người dùng
 * tự mua kháng sinh.
 *
 * Mọi nhánh đều trả `redFlags` trước `groups`. Trang hiển thị theo đúng thứ tự
 * đó, nên dấu hiệu nguy hiểm luôn đứng trên danh sách thuốc.
 */
export async function consultSymptoms(query: string): Promise<ConsultResult> {
  await thinkingDelay(1100);

  const pick = (...ids: string[]) =>
    ids.map(getProductById).filter((item): item is Product => Boolean(item));

  /*
    Cờ đỏ chạy TRƯỚC mọi nhánh gợi ý, và trả về danh sách thuốc RỖNG.

    Trước đây hàm này không có nhánh cờ đỏ nào: nó chỉ trả `commonFlags` (ba dấu
    hiệu chung) kèm danh sách thuốc đầy đủ. Nghĩa là người gõ "đau ngực dữ dội,
    khó thở, vã mồ hôi" nhận được 11 sản phẩm — vì "khó thở" khớp từ khoá "ho".
    Khối đỏ nằm trên cùng nên đọc qua thì có vẻ an toàn, nhưng người đang đau ngực
    vẫn thấy danh sách thuốc ngay bên dưới, và đó chính là thứ trang này phải
    không được làm.

    Báo cáo mục 9.2 vẽ đúng nhánh này ("DỪNG gợi ý sản phẩm"). Code chưa có.
  */
  if (
    matchesAny(query, [
      "dau nguc",
      "tuc nguc",
      "kho tho",
      "tho gap",
      "tim dap nhanh",
      "ngat",
      "lo mo",
      "co giat",
      "noi khong ro",
      "chay mau",
      "non ra mau",
      "di ngoai phan den",
      "sot cao keo dai",
      "te tay",
    ])
  ) {
    return {
      query,
      reading:
        "Những dấu hiệu bạn mô tả không phải nhóm để tự mua thuốc. Đây là trường hợp cần người khám trực tiếp, và việc cần làm là đi khám chứ không phải chọn thuốc.",
      groups: [],
      redFlags: [
        {
          label: "Dấu hiệu bạn vừa mô tả",
          action:
            "Đến cơ sở y tế gần nhất ngay. Nếu đang khó thở, đau ngực hoặc vã mồ hôi, gọi 115 — không tự lái xe đi.",
        },
        ...commonFlags,
      ],
      selfCare: [],
      confidence: 12,
      followUps: [],
    };
  }

  if (matchesAny(query, ["sot", "cam", "cum", "dau dau", "nhuc nguoi", "ho"])) {
    return {
      query,
      reading:
        "Bạn đang mô tả các dấu hiệu thường gặp khi cảm và sốt: nóng người, đau đầu, có thể kèm ho. Đây là nhóm triệu chứng có thể xử trí tại nhà nếu chưa có dấu hiệu nặng.",
      groups: [
        {
          title: "Hạ sốt, giảm đau",
          reason:
            "Dùng khi sốt từ 38,5°C hoặc đau đầu nhiều. Chỉ chọn MỘT thuốc trong nhóm này — cả ba đều chứa paracetamol, uống cùng lúc là quá liều.",
          products: pick("hapacol-650", "efferalgan-500", "panadol-extra"),
        },
        {
          title: "Giảm nghẹt mũi, sổ mũi",
          reason:
            "Dùng khi nghẹt mũi làm khó ngủ. Loại có kháng histamin gây buồn ngủ, không dùng trước khi lái xe.",
          products: pick("decolgen-nd", "tiffy-dey", "otrivin-005"),
        },
        {
          title: "Dịu ho, dịu họng",
          reason: "Dùng khi ho khan gây rát họng, có thể dùng cùng thuốc hạ sốt.",
          products: pick("prospan", "bao-thanh-vien-ngam", "xit-hong-propolis"),
        },
        {
          title: "Bù nước và điện giải",
          reason:
            "Sốt làm mất nước nhanh. Đây là phần dễ bị bỏ qua nhất nhưng ảnh hưởng tới mức độ mệt nhiều hơn cả thuốc hạ sốt.",
          products: pick("oresol-hydrite", "vitamin-c-1000"),
        },
      ],
      redFlags: commonFlags,
      selfCare: [
        "Uống 2–2,5 lít nước mỗi ngày, chia nhiều lần.",
        "Nghỉ ngơi, hạ nhiệt bằng khăn ấm — không chườm lạnh hay lau bằng rượu.",
        "Đo lại nhiệt độ sau mỗi 4–6 giờ và ghi lại để báo bác sĩ nếu phải đi khám.",
      ],
      confidence: 82,
      followUps: [
        "Sốt bao nhiêu độ và đã mấy ngày?",
        "Có đang dùng thuốc nào khác không?",
        "Người bệnh là trẻ em hay người lớn?",
      ],
    };
  }

  if (matchesAny(query, ["dau bung", "tieu chay", "kho tieu", "day hoi", "buon non"])) {
    return {
      query,
      reading:
        "Bạn đang mô tả vấn đề ở đường tiêu hoá. Phần lớn trường hợp nhẹ sẽ tự ổn trong 1–2 ngày, việc quan trọng nhất là bù đủ nước.",
      groups: [
        {
          title: "Bù nước và điện giải",
          reason:
            "Ưu tiên số một khi tiêu chảy. Pha đúng tỉ lệ ghi trên gói, pha đặc hơn sẽ làm tiêu chảy nặng thêm.",
          products: pick("oresol-hydrite"),
        },
        {
          title: "Hỗ trợ hệ vi sinh đường ruột",
          reason:
            "Dùng khi tiêu hoá còn yếu sau đợt tiêu chảy hoặc sau khi dùng kháng sinh.",
          products: pick("enterogermina"),
        },
      ],
      redFlags: [
        {
          label: "Phân có máu hoặc phân đen",
          action: "Đi khám ngay, không tự dùng thuốc cầm tiêu chảy.",
        },
        {
          label: "Đau bụng dữ dội một chỗ, bụng cứng",
          action: "Đến cấp cứu — cần loại trừ viêm ruột thừa và các cấp cứu ổ bụng.",
        },
        {
          label: "Nôn liên tục không uống được nước, môi khô, ít đi tiểu",
          action: "Dấu hiệu mất nước nặng, cần truyền dịch tại cơ sở y tế.",
        },
      ],
      selfCare: [
        "Ăn thức ăn mềm, nhạt, chia nhỏ bữa.",
        "Tránh sữa, đồ dầu mỡ và cà phê trong 1–2 ngày.",
        "Rửa tay trước khi ăn để không lây cho người trong nhà.",
      ],
      confidence: 76,
      followUps: [
        "Đi ngoài mấy lần trong 24 giờ qua?",
        "Có sốt kèm theo không?",
        "Đã ăn gì khác thường trước khi đau?",
      ],
    };
  }

  // Không khớp nhóm nào: nói thẳng là chưa đủ dữ kiện thay vì gợi ý bừa.
  return {
    query,
    reading:
      "Mô tả hiện tại chưa đủ để MediVia gợi ý nhóm thuốc một cách an toàn. Bạn cho biết thêm vài chi tiết bên dưới, hoặc nói trực tiếp với dược sĩ sẽ nhanh hơn.",
    groups: [],
    redFlags: commonFlags,
    selfCare: [],
    confidence: 34,
    followUps: [
      "Triệu chứng chính là gì và xuất hiện mấy ngày rồi?",
      "Người bệnh bao nhiêu tuổi?",
      "Có bệnh nền hoặc thuốc đang dùng hằng ngày không?",
    ],
  };
}
