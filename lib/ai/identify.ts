import type { Product } from "@/lib/types";
import { getProductById } from "@/lib/data/products";
import { thinkingDelay } from "./engine";

/** Một ứng viên nhận diện. Luôn đi kèm lý do, không chỉ tên thuốc. */
export type IdentifyCandidate = {
  product: Product;
  percent: number;
  /** Dấu hiệu trên ảnh dẫn tới ứng viên này — người dùng đối chiếu được. */
  evidence: string[];
};

export type IdentifyResult = {
  /** Chữ AI đọc được trên vỉ/hộp. Hiện nguyên văn để người dùng tự kiểm tra. */
  readText: string[];
  candidates: IdentifyCandidate[];
  confidence: number;
  /**
   * Việc người dùng PHẢI làm sau khi xem kết quả. Không phải lời khuyên chung —
   * là một câu bắt buộc, vì nhận diện bằng ảnh không bao giờ là căn cứ để uống.
   */
  mustVerify: string;
  /** Vì sao lần này không chắc, nếu không chắc. */
  limitation?: string;
};

/**
 * Tính năng 5 — Nhận diện thuốc bằng ảnh (⭐⭐⭐⭐).
 *
 * Hai quyết định định hình toàn bộ tính năng này:
 *
 * 1. LUÔN trả về nhiều ứng viên kèm phần trăm, không bao giờ trả một đáp án
 *    duy nhất. Vỉ thuốc trắng in chữ nhỏ giống nhau đến mức người trong ngành
 *    cũng phải soi số đăng ký. Hiện một tên duy nhất là mời người dùng uống theo
 *    kết quả của một cái máy.
 *
 * 2. Trả `readText` — đúng những chữ AI đọc được trên ảnh. Người dùng đang cầm
 *    vỉ thuốc trong tay: họ đối chiếu được ngay chữ trên vỉ với chữ máy đọc, và
 *    đó là cách kiểm tra nhanh hơn mọi lời giải thích.
 *
 * `mustVerify` không phải disclaimer cho đẹp. Nhận diện ảnh sai thì hậu quả là
 * uống sai thuốc, nên câu "đối chiếu với vỉ thuốc trong tay" phải nằm cạnh kết
 * quả, không nằm ở chân trang.
 */
export async function identifyFromPhoto(fileName?: string): Promise<IdentifyResult> {
  await thinkingDelay(1600);

  // Chưa gọi mô hình thật nên chọn kịch bản theo tên tệp: ảnh có chữ "sui",
  // "siro"… cho ra kịch bản tương ứng. Khi lắp mô hình thật thì chỗ này nhận
  // ảnh, phần còn lại của hàm và toàn bộ trang không đổi.
  const hint = (fileName ?? "").toLowerCase();

  if (hint.includes("siro") || hint.includes("syrup")) {
    return {
      readText: ["PROSPAN", "Cao khô lá thường xuân", "100 ml", "Siro"],
      candidates: [
        candidate("prospan-siro-ho", 91, [
          "Chữ PROSPAN trên nhãn chai",
          "Dạng siro, thể tích 100 ml",
          "Nhãn ghi cao khô lá thường xuân",
        ]),
      ],
      confidence: 91,
      mustVerify:
        "Đối chiếu tên trên nhãn chai và hạn dùng ở đáy chai trước khi cho trẻ uống.",
    };
  }

  if (hint.includes("mo") || hint.includes("blur") || hint.includes("toi")) {
    return {
      readText: ["…AC…", "650"],
      candidates: [
        candidate("hapacol-650", 44, ["Đọc được số 650", "Vỉ nhôm ép, viên tròn màu trắng"]),
        candidate("efferalgan-500", 29, ["Viên sủi trắng, đường kính lớn"]),
        candidate("panadol-extra", 21, ["Vỉ nhôm, viên bao phim trắng"]),
      ],
      confidence: 44,
      mustVerify:
        "Không dùng kết quả này để uống thuốc. Hãy chụp lại rõ mặt vỉ có chữ, hoặc mang vỉ thuốc tới nhà thuốc.",
      limitation:
        "Ảnh mờ và thiếu sáng nên AI chỉ đọc được một phần chữ trên vỉ. Ba ứng viên bên dưới đều là thuốc hạ sốt nhưng hàm lượng khác nhau — chênh hàm lượng là chênh liều.",
    };
  }

  if (hint.includes("sui") || hint.includes("effer")) {
    return {
      readText: ["EFFERALGAN", "500 mg", "Paracétamol", "Viên nén sủi"],
      candidates: [
        candidate("efferalgan-500", 88, [
          "Chữ EFFERALGAN in trên tuýp",
          "Hàm lượng 500 mg",
          "Dạng viên nén sủi",
        ]),
        candidate("hapacol-650", 34, [
          "Cũng là viên sủi paracetamol — khác hàm lượng (650 mg)",
        ]),
      ],
      confidence: 88,
      mustVerify:
        "Kiểm tra hàm lượng in trên vỉ: 500 mg và 650 mg là hai liều khác nhau, đừng lấy theo trí nhớ.",
      limitation:
        "Hai ứng viên đều chứa paracetamol. Nếu bạn đang uống thêm thuốc cảm nào khác, hãy kiểm tra tương tác trước — cộng dồn paracetamol là quá liều.",
    };
  }

  // Kịch bản mặc định: vỉ thuốc chụp rõ.
  return {
    readText: ["HAPACOL 650", "Paracetamol 650 mg", "DHG PHARMA", "VD-24567-16"],
    candidates: [
      candidate("hapacol-650", 94, [
        "Chữ HAPACOL 650 rõ trên vỉ",
        "Số đăng ký VD-24567-16 khớp dữ liệu MediVia",
        "Tên nhà sản xuất DHG PHARMA",
      ]),
      candidate("panadol-extra", 18, [
        "Cùng nhóm giảm đau hạ sốt, vỉ nhôm tương tự",
      ]),
    ],
    confidence: 94,
    mustVerify:
      "Số đăng ký khớp, nhưng vẫn hãy đọc lại tên và hạn dùng trên vỉ bạn đang cầm trước khi uống.",
  };
}

function candidate(productId: string, percent: number, evidence: string[]): IdentifyCandidate {
  const product = getProductById(productId);
  if (!product) {
    throw new Error(`identifyFromPhoto: không có sản phẩm ${productId}`);
  }
  return { product, percent, evidence };
}

/** Hướng dẫn chụp ảnh — hiện trước khi người dùng chụp, không phải sau khi sai. */
export const photoTips = [
  "Đặt vỉ thuốc trên nền tối, phẳng",
  "Chụp mặt có chữ, lấy trọn cả vỉ",
  "Đủ sáng, tránh loá đèn flash lên vỉ nhôm",
  "Nếu còn hộp, chụp thêm mặt hộp có số đăng ký",
];
