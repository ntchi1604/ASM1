import type { Interaction } from "@/lib/types";
import { products } from "@/lib/data/products";
import {
  canonicalIngredient,
  matchRules,
  productIngredients,
} from "@/lib/data/interactions";
import { normalize, thinkingDelay } from "./engine";

/** Một thuốc AI nhận ra được từ dòng người dùng gõ. */
export type ResolvedDrug = {
  /** Nguyên văn người dùng gõ. */
  input: string;
  /** Tên hiển thị sau khi nhận diện. */
  name: string;
  /** Các hoạt chất đã chuẩn hoá, dùng để đối soát. */
  ingredients: string[];
  /** Có trong danh mục MediVia thì kèm slug để dẫn sang trang thuốc. */
  slug?: string;
};

/** Cặp tương tác giữa hai dòng người dùng nhập. */
export type PairFinding = Interaction & {
  a: ResolvedDrug;
  b: ResolvedDrug;
};

/** Hai thuốc khác tên nhưng cùng hoạt chất — nguy cơ quá liều, không phải tương tác. */
export type DuplicateFinding = {
  ingredient: string;
  names: string[];
};

export type InteractionCheckResult = {
  drugs: ResolvedDrug[];
  /** Dòng AI không nhận ra. Phải nói ra, không được im lặng bỏ qua. */
  unresolved: string[];
  pairs: PairFinding[];
  duplicates: DuplicateFinding[];
  confidence: number;
};

/**
 * Tính năng 7 — Cảnh báo tương tác thuốc, bản tra cứu tự do.
 *
 * Dùng CHUNG bảng luật với trang chi tiết thuốc và giỏ hàng qua `matchRules`.
 * Ba nơi cùng một nguồn nên không thể xảy ra chuyện trang này nói "an toàn"
 * trong khi giỏ hàng nói "nghiêm trọng".
 *
 * Nhận cả thuốc MediVia không bán: người đang uống thuốc huyết áp mua ở nơi khác
 * vẫn cần biết nó có xung đột với thuốc cảm họ sắp mua hay không. Vì vậy hàm đối
 * soát theo hoạt chất, không theo mã sản phẩm.
 *
 * Hai loại vấn đề tách riêng và không gộp:
 *   - `pairs`      — hai thuốc tác động lẫn nhau.
 *   - `duplicates` — cùng hoạt chất, nguy cơ là QUÁ LIỀU. Người dùng cần nghe
 *                    đúng chữ "quá liều", vì cách xử lý là bỏ một thuốc chứ
 *                    không phải uống cách giờ.
 *
 * Dòng không nhận ra trả về trong `unresolved`. Im lặng bỏ qua một thuốc rồi kết
 * luận "không phát hiện tương tác" là kiểu sai nguy hiểm nhất của tính năng này.
 */
export async function checkInteractions(raw: string): Promise<InteractionCheckResult> {
  await thinkingDelay(1200);

  const lines = raw
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const drugs: ResolvedDrug[] = [];
  const unresolved: string[] = [];

  for (const line of lines) {
    const term = normalize(line);
    if (term.length < 2) {
      unresolved.push(line);
      continue;
    }

    const product = products.find(
      (item) =>
        normalize(item.name).includes(term) ||
        normalize(item.brand) === term ||
        normalize(item.activeIngredient).includes(term),
    );

    if (product) {
      drugs.push({
        input: line,
        name: product.name,
        ingredients: productIngredients(product),
        slug: product.slug,
      });
      continue;
    }

    // Không có trong danh mục nhưng vẫn có thể là hoạt chất đã biết.
    const canonical = canonicalIngredient(line);
    if (canonical !== line || isKnownWord(term)) {
      drugs.push({ input: line, name: canonical, ingredients: [canonical] });
      continue;
    }

    unresolved.push(line);
  }

  const pairs: PairFinding[] = [];
  for (let i = 0; i < drugs.length; i += 1) {
    for (let j = i + 1; j < drugs.length; j += 1) {
      const rule = matchRules(drugs[i].ingredients, drugs[j].ingredients);
      if (rule) pairs.push({ ...rule, a: drugs[i], b: drugs[j] });
    }
  }

  return {
    drugs,
    unresolved,
    pairs: pairs.sort(bySeverity),
    duplicates: findDuplicates(drugs),
    // Có dòng không nhận ra thì kết quả không thể coi là đầy đủ, và con số phải
    // nói ra điều đó.
    confidence: unresolved.length > 0 ? 52 : drugs.length < 2 ? 40 : 92,
  };
}

/**
 * Nhận thêm vài hoạt chất phổ biến ngoài bảng luật, để câu trả lời là "đã nhận
 * ra thuốc này nhưng không thấy tương tác" thay vì "không biết thuốc này".
 * Hai câu đó khác nhau hoàn toàn với người đang lo lắng.
 */
const extraIngredients = [
  "metformin",
  "omeprazol",
  "amlodipin",
  "atorvastatin",
  "cetirizin",
  "loratadin",
  "losartan",
  "insulin",
  "salbutamol",
  "prednisolon",
];

function isKnownWord(term: string) {
  return extraIngredients.some((name) => term.includes(normalize(name)));
}

/**
 * Trùng hoạt chất. So từng hoạt chất riêng lẻ vì thuốc phối hợp ghi nhiều hoạt
 * chất — Panadol Extra ("Paracetamol, Caffeine") và Hapacol ("Paracetamol") phải
 * bị bắt là cùng paracetamol dù hai chuỗi hoạt chất không giống nhau.
 */
function findDuplicates(drugs: ResolvedDrug[]): DuplicateFinding[] {
  const groups = new Map<string, Set<string>>();

  for (const drug of drugs) {
    for (const ingredient of drug.ingredients) {
      const bucket = groups.get(ingredient) ?? new Set<string>();
      bucket.add(drug.name);
      groups.set(ingredient, bucket);
    }
  }

  return [...groups.entries()]
    .filter(([, names]) => names.size > 1)
    .map(([ingredient, names]) => ({ ingredient, names: [...names] }));
}

const severityRank: Record<Interaction["severity"], number> = {
  "nghiem-trong": 0,
  "trung-binh": 1,
  nhe: 2,
};

function bySeverity(a: Interaction, b: Interaction) {
  return severityRank[a.severity] - severityRank[b.severity];
}
