import type { Product } from "@/lib/types";
import { getBaseUnit, getSellableProducts } from "@/lib/data/products";
import { matchesAny, normalize, thinkingDelay } from "./engine";

/** Điều kiện AI hiểu được từ câu người dùng gõ, hiện lại thành chip. */
export type ParsedFilter = {
  label: string;
  /** Từ nào trong câu dẫn tới điều kiện này. */
  from: string;
};

export type SearchHit = {
  product: Product;
  /** Vì sao thuốc này khớp — mỗi kết quả một câu riêng, không dùng câu chung. */
  why: string;
};

export type SearchResult = {
  query: string;
  /** Câu AI diễn giải lại yêu cầu, để người dùng biết máy hiểu đúng hay sai. */
  understood: string;
  filters: ParsedFilter[];
  hits: SearchHit[];
  confidence: number;
  /** Gợi ý sửa câu khi kết quả ít hoặc không có. */
  suggestions: string[];
};

/**
 * Tính năng 2 — Tìm thuốc bằng câu tự nhiên.
 *
 * Điểm khác một ô tìm kiếm thường: AI tách được ĐIỀU KIỆN ra khỏi câu ("dưới
 * 100.000", "cho trẻ em", "không gây buồn ngủ") và hiện các điều kiện đó thành
 * chip. Người dùng nhìn chip là biết máy hiểu đúng hay không — quan trọng hơn cả
 * việc kết quả có đúng, vì khi sai họ biết sai ở đâu mà sửa.
 */
export async function searchProducts(query: string): Promise<SearchResult> {
  await thinkingDelay(850);

  const filters: ParsedFilter[] = [];
  let pool = getSellableProducts();

  // Giá: "dưới 100k", "dưới 100.000", "dưới 100"
  const priceMatch = normalize(query).match(/duoi\s*([\d.]+)\s*(k|nghin|ngan)?/);
  if (priceMatch) {
    const raw = Number(priceMatch[1].replace(/\./g, ""));
    // "100k" và "100" đều hiểu là 100.000 ₫ — không ai tìm thuốc dưới 100 đồng.
    const inThousands = Boolean(priceMatch[2]) || raw < 1000;
    const ceiling = inThousands ? raw * 1000 : raw;
    filters.push({ label: `Dưới ${ceiling.toLocaleString("vi-VN")} ₫`, from: priceMatch[0] });
    pool = pool.filter((product) => getBaseUnit(product).price <= ceiling);
  }

  if (matchesAny(query, ["tre em", "cho tre", "be", "tre nho"])) {
    filters.push({ label: "Dùng được cho trẻ em", from: "trẻ em" });
    pool = pool.filter((product) => product.audiences.includes("tre-em"));
  }

  if (matchesAny(query, ["nguoi cao tuoi", "nguoi gia", "ong ba"])) {
    filters.push({ label: "Dùng được cho người cao tuổi", from: "người cao tuổi" });
    pool = pool.filter((product) => product.audiences.includes("nguoi-cao-tuoi"));
  }

  if (matchesAny(query, ["khong buon ngu", "khong gay buon ngu", "de lai xe"])) {
    filters.push({ label: "Không gây buồn ngủ", from: "không buồn ngủ" });
    // Loại các thuốc có kháng histamin gây ngủ — dựa trên hoạt chất, không đoán.
    pool = pool.filter(
      (product) =>
        !matchesAny(product.activeIngredient, ["chlorpheniramin", "phenylephrine"]),
    );
  }

  if (matchesAny(query, ["sui", "vien sui"])) {
    filters.push({ label: "Dạng viên sủi", from: "viên sủi" });
    pool = pool.filter((product) => product.dosageForm === "vien-sui");
  }

  if (matchesAny(query, ["siro", "nuoc", "uong dang nuoc"])) {
    filters.push({ label: "Dạng siro", from: "siro" });
    pool = pool.filter((product) => product.dosageForm === "siro");
  }

  // Chủ đề triệu chứng → nhóm hàng.
  const topics: { keywords: string[]; label: string; categories: string[] }[] = [
    { keywords: ["sot", "ha sot", "cam", "cum", "nghet mui"], label: "Cảm, cúm, hạ sốt", categories: ["cam-cum-ha-sot"] },
    { keywords: ["dau dau", "dau", "nhuc", "khang viem"], label: "Giảm đau", categories: ["giam-dau-khang-viem", "cam-cum-ha-sot"] },
    { keywords: ["ho", "dau hong", "rat hong", "khan tieng"], label: "Ho, đau họng", categories: ["ho-hen-suyen"] },
    { keywords: ["tieu hoa", "dau bung", "tieu chay", "day hoi"], label: "Tiêu hoá", categories: ["tieu-hoa"] },
    { keywords: ["vitamin", "de khang", "bo sung", "mien dich"], label: "Vitamin, tăng đề kháng", categories: ["vitamin-khoang-chat"] },
    { keywords: ["tim mach", "huyet ap", "huyet khoi"], label: "Tim mạch", categories: ["tim-mach"] },
  ];

  const topic = topics.find((item) => matchesAny(query, item.keywords));
  if (topic) {
    filters.push({ label: topic.label, from: topic.keywords[0] });
    pool = pool.filter((product) => topic.categories.includes(product.categorySlug));
  }

  // Tên thuốc gõ trực tiếp vẫn phải ra kết quả — đây là cách tìm phổ biến nhất.
  if (filters.length === 0 && query.trim().length > 0) {
    const term = normalize(query);
    pool = pool.filter(
      (product) =>
        normalize(product.name).includes(term) ||
        normalize(product.activeIngredient).includes(term) ||
        normalize(product.brand).includes(term),
    );
  }

  const hits: SearchHit[] = pool.slice(0, 6).map((product) => ({
    product,
    why: explain(product, topic?.label, filters),
  }));

  return {
    query,
    understood: describe(query, filters, topic?.label),
    filters,
    hits,
    // Không có điều kiện nào nhận ra được thì độ tin cậy phải thấp, kể cả khi
    // vẫn ra kết quả nhờ khớp tên.
    confidence: hits.length === 0 ? 28 : filters.length === 0 ? 61 : 88,
    suggestions:
      hits.length > 0
        ? []
        : [
            "thuốc hạ sốt cho trẻ em dạng siro",
            "thuốc cảm không gây buồn ngủ",
            "vitamin tăng đề kháng dưới 200.000",
          ],
  };
}

function explain(product: Product, topic: string | undefined, filters: ParsedFilter[]) {
  const parts: string[] = [];
  parts.push(`Chứa ${product.activeIngredient.toLowerCase()}`);
  if (topic) parts.push(`thuộc nhóm ${topic.toLowerCase()}`);
  if (filters.some((filter) => filter.label.includes("trẻ em"))) {
    parts.push("có liều dùng cho trẻ em trên nhãn");
  }
  if (filters.some((filter) => filter.label.includes("Dưới"))) {
    parts.push(`giá ${getBaseUnit(product).price.toLocaleString("vi-VN")} ₫ nằm trong mức bạn đặt ra`);
  }
  return `${parts.join(", ")}.`;
}

function describe(query: string, filters: ParsedFilter[], topic: string | undefined) {
  if (filters.length === 0) {
    return `MediVia hiểu bạn đang tìm theo tên hoặc hoạt chất "${query.trim()}". Nếu chưa đúng, hãy mô tả triệu chứng thay vì tên thuốc.`;
  }
  // Nhóm bệnh đã được đẩy vào `filters` ở trên, nên nếu vừa in tiền tố "thuốc <nhóm>"
  // vừa in cả danh sách điều kiện thì câu sẽ lặp: "thuốc ho, đau họng, …, ho, đau họng".
  // Bỏ đúng điều kiện trùng với nhóm, giữ lại tiền tố vì nó làm câu đọc tự nhiên hơn.
  const conditions = filters
    .filter((filter) => filter.label !== topic)
    .map((filter) => filter.label.toLowerCase())
    .join(", ");
  const prefix = topic ? `thuốc ${topic.toLowerCase()}` : "";
  return `MediVia hiểu bạn cần: ${[prefix, conditions].filter(Boolean).join(", ")}.`;
}
