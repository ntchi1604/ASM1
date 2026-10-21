import type { Interaction, Product } from "@/lib/types";
import { products } from "@/lib/data/products";

/**
 * Cặp tương tác thuốc, khoá theo HOẠT CHẤT chứ không theo tên thương mại.
 *
 * Đây là lý do: người mua Hapacol rồi mua thêm Panadol không nghĩ mình đang
 * uống hai lần cùng một thuốc, vì hai cái tên chẳng liên quan gì nhau. Khoá
 * theo hoạt chất thì cảnh báo vẫn bắt được, kể cả với thuốc mới thêm vào sau.
 */
export const interactionRules: Interaction[] = [
  {
    severity: "nghiem-trong",
    drugA: "Paracetamol",
    drugB: "Paracetamol",
    mechanism:
      "Hai sản phẩm cùng chứa Paracetamol. Dùng đồng thời rất dễ vượt liều tối đa 4.000 mg mỗi ngày và gây độc cho gan.",
    advice:
      "Chỉ dùng một loại chứa Paracetamol tại một thời điểm. Nếu đã uống loại này, đợi tối thiểu 4 giờ và không cộng dồn hai thuốc.",
  },
  {
    severity: "nghiem-trong",
    drugA: "Warfarin",
    drugB: "Aspirin",
    mechanism:
      "Cả hai đều làm giảm khả năng đông máu theo hai cơ chế khác nhau. Dùng cùng nhau làm tăng rõ rệt nguy cơ xuất huyết tiêu hoá và chảy máu khó cầm.",
    advice:
      "Không tự phối hợp. Chỉ bác sĩ điều trị được quyết định, kèm theo xét nghiệm INR định kỳ.",
  },
  {
    severity: "nghiem-trong",
    drugA: "Warfarin",
    drugB: "Ibuprofen",
    mechanism:
      "Ibuprofen làm tăng tác dụng chống đông của Warfarin và gây tổn thương niêm mạc dạ dày, cộng lại thành nguy cơ xuất huyết cao.",
    advice:
      "Người đang dùng Warfarin nên chọn Paracetamol để giảm đau, hạ sốt. Hỏi dược sĩ trước khi dùng bất kỳ thuốc giảm đau nào.",
  },
  {
    severity: "trung-binh",
    drugA: "Ibuprofen",
    drugB: "Aspirin",
    mechanism:
      "Hai thuốc cùng nhóm chống viêm không steroid. Dùng chung không tăng hiệu quả giảm đau nhưng cộng dồn nguy cơ loét và xuất huyết dạ dày.",
    advice:
      "Không dùng đồng thời. Nếu đang dùng Aspirin liều thấp để dự phòng tim mạch, hỏi dược sĩ trước khi thêm thuốc giảm đau.",
  },
  {
    severity: "trung-binh",
    // Khoá theo Amoxicillin chứ không phải cả cụm "Amoxicillin + Acid
    // clavulanic": sau khi tách hoạt chất thì không thành phần nào mang tên
    // ghép đó, nên luật viết theo cụm sẽ không bao giờ khớp.
    drugA: "Amoxicillin",
    drugB: "Bacillus clausii",
    mechanism:
      "Kháng sinh tiêu diệt cả vi khuẩn có lợi trong men vi sinh nếu uống cùng lúc, làm men vi sinh gần như mất tác dụng.",
    advice:
      "Vẫn dùng được cả hai, nhưng uống cách nhau tối thiểu 2 giờ. Đây là tương tác về thời điểm uống, không phải chống chỉ định.",
  },
  {
    severity: "trung-binh",
    drugA: "Acid ascorbic",
    drugB: "Aspirin",
    mechanism:
      "Vitamin C liều cao làm giảm thải Aspirin qua nước tiểu, có thể đẩy nồng độ Aspirin trong máu lên cao hơn dự kiến.",
    advice:
      "Uống cách nhau tối thiểu 2 giờ. Người dùng Aspirin dài ngày nên hỏi dược sĩ trước khi bổ sung vitamin C liều 1.000 mg.",
  },
  {
    severity: "nhe",
    drugA: "Paracetamol",
    drugB: "Caffein",
    mechanism:
      "Caffein trong thuốc cảm cộng với trà, cà phê có thể gây bồn chồn, tim đập nhanh và khó ngủ.",
    advice: "Hạn chế trà, cà phê trong thời gian dùng thuốc và tránh uống liều cuối vào buổi tối.",
  },
];

/**
 * Bảng đồng nghĩa hoạt chất → tên chuẩn dùng trong luật tương tác.
 *
 * Bắt buộc phải có vì nhãn thuốc Việt Nam ghi tên INN ("Acid acetylsalicylic",
 * "Warfarin natri") còn luật tương tác và người dùng gọi tên thông dụng
 * ("Aspirin", "Warfarin"). So chuỗi thẳng thì Aspirin 81 không bao giờ khớp
 * luật Warfarin × Aspirin — cảnh báo xuất huyết im lặng biến mất.
 *
 * Khoá viết thường không dấu để so không phụ thuộc cách viết hoa.
 */
export const ingredientAliases: Record<string, string> = {
  "acid acetylsalicylic": "Aspirin",
  aspirin: "Aspirin",
  "warfarin natri": "Warfarin",
  warfarin: "Warfarin",
  caffeine: "Caffein",
  caffein: "Caffein",
  paracetamol: "Paracetamol",
  acetaminophen: "Paracetamol",
  ibuprofen: "Ibuprofen",
  amoxicillin: "Amoxicillin",
  "acid clavulanic": "Acid clavulanic",
  "bacillus clausii": "Bacillus clausii",
};

/**
 * Tách hoạt chất của một sản phẩm thành danh sách tên chuẩn.
 *
 * Dữ liệu sản phẩm ghi thuốc phối hợp bằng dấu phẩy ("Paracetamol, Caffeine")
 * và đôi khi bằng dấu cộng, nên tách theo cả hai. Thành phần không có trong
 * bảng đồng nghĩa vẫn giữ nguyên tên: luật nào viết đúng tên đó vẫn khớp.
 */
function ingredientsOf(product: Product): string[] {
  return product.activeIngredient
    .split(/[,+]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => ingredientAliases[part.toLowerCase()] ?? part);
}

export type DetectedInteraction = Interaction & {
  /** Sản phẩm đang có trong giỏ gây ra cảnh báo này. */
  withProduct: Product;
};

/**
 * Tìm tương tác giữa một sản phẩm và các sản phẩm đang có trong giỏ.
 *
 * Trả về danh sách đã xếp theo mức nghiêm trọng giảm dần: cảnh báo nặng nhất
 * phải đứng trên cùng, người dùng có thể chỉ đọc dòng đầu tiên.
 */
export function findInteractions(
  product: Product,
  cartProductIds: string[],
): DetectedInteraction[] {
  const mine = ingredientsOf(product);
  const found: DetectedInteraction[] = [];

  for (const id of cartProductIds) {
    if (id === product.id) continue;
    const other = products.find((item) => item.id === id);
    if (!other) continue;
    const theirs = ingredientsOf(other);

    for (const rule of interactionRules) {
      const direct =
        mine.includes(rule.drugA) && theirs.includes(rule.drugB);
      const reversed =
        mine.includes(rule.drugB) && theirs.includes(rule.drugA);
      if (!direct && !reversed) continue;

      // Mỗi cặp sản phẩm chỉ cảnh báo một lần, lấy mức nặng nhất. Ba dải đỏ
      // cho cùng một cặp thuốc thì người dùng bỏ qua cả ba.
      const existing = found.findIndex((item) => item.withProduct.id === other.id);
      if (existing >= 0) {
        if (severityRank(rule.severity) > severityRank(found[existing].severity)) {
          found[existing] = { ...rule, withProduct: other };
        }
        continue;
      }
      found.push({ ...rule, withProduct: other });
    }
  }

  return found.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function severityRank(severity: Interaction["severity"]): number {
  if (severity === "nghiem-trong") return 3;
  if (severity === "trung-binh") return 2;
  return 1;
}

/** Một cặp sản phẩm trong giỏ có tương tác với nhau. */
export type CartInteraction = Interaction & {
  productA: Product;
  productB: Product;
};

/**
 * Quét TỪNG CẶP sản phẩm trong giỏ.
 *
 * Khác findInteractions ở chỗ: trang chi tiết chỉ hỏi "thuốc đang xem có xung
 * đột với giỏ không", còn trang giỏ hàng phải tự soát cả giỏ — hai thuốc thêm
 * vào từ hai lần khác nhau vẫn có thể xung đột với nhau mà người dùng chưa
 * từng mở trang chi tiết của thuốc nào.
 */
export function findCartInteractions(cartProductIds: string[]): CartInteraction[] {
  const items = cartProductIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));

  const found: CartInteraction[] = [];

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];
      const mine = ingredientsOf(a);
      const theirs = ingredientsOf(b);

      let best: Interaction | undefined;
      for (const rule of interactionRules) {
        const direct = mine.includes(rule.drugA) && theirs.includes(rule.drugB);
        const reversed = mine.includes(rule.drugB) && theirs.includes(rule.drugA);
        if (!direct && !reversed) continue;
        // Mỗi cặp chỉ báo một lần, giữ mức nặng nhất.
        if (!best || severityRank(rule.severity) > severityRank(best.severity)) {
          best = rule;
        }
      }

      if (best) found.push({ ...best, productA: a, productB: b });
    }
  }

  return found.sort((x, y) => severityRank(y.severity) - severityRank(x.severity));
}

/** Id các sản phẩm dính cảnh báo nghiêm trọng — dùng để đánh dấu dòng trong giỏ. */
export function severeProductIds(interactions: CartInteraction[]): Set<string> {
  const ids = new Set<string>();
  for (const item of interactions) {
    if (item.severity !== "nghiem-trong") continue;
    ids.add(item.productA.id);
    ids.add(item.productB.id);
  }
  return ids;
}

export const severityLabel: Record<Interaction["severity"], string> = {
  "nghiem-trong": "Nghiêm trọng",
  "trung-binh": "Trung bình",
  nhe: "Nhẹ",
};

/**
 * Đối soát một danh sách hoạt chất TỰ DO — không cần sản phẩm nào trong danh mục.
 *
 * Tính năng "Kiểm tra tương tác thuốc" ở trang AI phải nhận cả thuốc MediVia
 * không bán: người dùng đang uống thuốc huyết áp mua ở nơi khác thì vẫn cần biết
 * nó có xung đột với thuốc cảm họ sắp mua hay không. Vì vậy hàm này nhận chuỗi
 * hoạt chất chứ không nhận `Product`.
 *
 * Dùng CHUNG `interactionRules` với hai hàm phía trên. Nếu trang AI tự giữ một
 * bảng luật riêng thì sẽ có ngày trang AI nói an toàn còn giỏ hàng nói nghiêm
 * trọng, và không ai biết bên nào đúng.
 */
export function matchRules(groupA: string[], groupB: string[]): Interaction | undefined {
  const mine = groupA.map(canonicalIngredient);
  const theirs = groupB.map(canonicalIngredient);

  let best: Interaction | undefined;
  for (const rule of interactionRules) {
    const direct = mine.includes(rule.drugA) && theirs.includes(rule.drugB);
    const reversed = mine.includes(rule.drugB) && theirs.includes(rule.drugA);
    if (!direct && !reversed) continue;
    if (!best || severityRank(rule.severity) > severityRank(best.severity)) {
      best = rule;
    }
  }
  return best;
}

/** Tên chuẩn của một hoạt chất, theo đúng bảng đồng nghĩa dùng cho luật. */
export function canonicalIngredient(name: string): string {
  return ingredientAliases[name.trim().toLowerCase()] ?? name.trim();
}

/** Tách hoạt chất của sản phẩm — mở ra cho tầng AI dùng lại. */
export function productIngredients(product: Product): string[] {
  return ingredientsOf(product);
}

/** Danh sách hoạt chất MediVia có luật tương tác, dùng làm gợi ý nhập. */
export const knownIngredients: string[] = [
  ...new Set(Object.values(ingredientAliases)),
].sort((a, b) => a.localeCompare(b, "vi"));
