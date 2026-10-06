import type { DosageForm, Product } from "@/lib/types";

/**
 * Nguồn duy nhất định nghĩa bộ lọc trang danh mục.
 *
 * Sidebar, dải chip "đang lọc" và hàm lọc thật đều đọc từ đây. Nếu tách ra
 * thì nhãn trên chip sẽ lệch với nhãn trong sidebar, hoặc tệ hơn: checkbox
 * hiện lên nhưng không lọc gì cả.
 *
 * Mỗi mục có `match` riêng nên việc lọc không phụ thuộc vào tên khoá — đổi
 * cấu trúc Product cũng chỉ sửa ở đây.
 */

/** Tham số lọc đọc được từ query string. */
export type FilterState = {
  type: string[];
  dosageForm: string[];
  audience: string[];
  brand: string[];
  origin: string[];
  priceFrom?: number;
  priceTo?: number;
  sort: SortKey;
};

export type SortKey = "lien-quan" | "ban-chay" | "gia-tang" | "gia-giam" | "khuyen-mai";

export const sortOptions: { key: SortKey; label: string }[] = [
  { key: "lien-quan", label: "Liên quan nhất" },
  { key: "ban-chay", label: "Bán chạy" },
  { key: "gia-tang", label: "Giá thấp đến cao" },
  { key: "gia-giam", label: "Giá cao đến thấp" },
  { key: "khuyen-mai", label: "Khuyến mãi" },
];

export const defaultSort: SortKey = "lien-quan";

export function isSortKey(value: string | undefined): value is SortKey {
  return sortOptions.some((o) => o.key === value);
}

/** Một lựa chọn trong nhóm lọc. `match` quyết định sản phẩm có đạt hay không. */
export type FilterOption = {
  value: string;
  label: string;
  match: (product: Product) => boolean;
  /** Ghi chú ngắn hiện dưới nhãn, dùng cho các lựa chọn cần nói rõ. */
  note?: string;
};

export type FilterGroup = {
  /** Khoá trong query string, ví dụ ?type=otc,rx */
  key: keyof Omit<FilterState, "priceFrom" | "priceTo" | "sort">;
  title: string;
  options: FilterOption[];
};

const typeOptions: FilterOption[] = [
  {
    value: "otc",
    label: "Không kê đơn (OTC)",
    match: (p) => p.type === "drug" && !p.prescriptionRequired,
  },
  {
    value: "rx",
    label: "Kê đơn (Rx)",
    note: "Cần tư vấn dược sĩ trước khi bán",
    match: (p) => p.prescriptionRequired,
  },
  {
    value: "tpbs",
    label: "Thực phẩm bổ sung",
    match: (p) => p.type === "supplement",
  },
];

const dosageFormOptions: FilterOption[] = [
  { value: "vien-nen", label: "Viên nén, viên nang", match: (p) => p.dosageForm === "vien-nen" },
  { value: "vien-sui", label: "Viên sủi", match: (p) => p.dosageForm === "vien-sui" },
  { value: "siro", label: "Siro và hỗn dịch", match: (p) => p.dosageForm === "siro" },
  { value: "goi-bot", label: "Gói bột, cốm", match: (p) => p.dosageForm === "goi-bot" },
  { value: "xit-nho", label: "Xịt mũi, xịt họng", match: (p) => p.dosageForm === "xit-nho" },
  { value: "vien-ngam", label: "Viên ngậm", match: (p) => p.dosageForm === "vien-ngam" },
  { value: "ong-uong", label: "Ống uống", match: (p) => p.dosageForm === "ong-uong" },
  { value: "dung-dich", label: "Dung dịch", match: (p) => p.dosageForm === "dung-dich" },
];

/**
 * Nhãn dạng bào chế để hiện ở bảng thông tin trang chi tiết. Đọc lại từ
 * dosageFormOptions để trang chi tiết và bộ lọc không bao giờ gọi tên khác
 * nhau cho cùng một dạng bào chế.
 */
export function dosageFormLabel(form: DosageForm): string {
  return dosageFormOptions.find((option) => option.value === form)?.label ?? form;
}

/**
 * Không có lựa chọn "Phụ nữ có thai và cho con bú" dù bản thiết kế có.
 * An toàn thai kỳ phụ thuộc tuổi thai, liều và bệnh kèm — không thể trả lời
 * bằng một checkbox. Trang chi tiết dẫn sang dược sĩ cho nhóm này.
 */
const audienceOptions: FilterOption[] = [
  { value: "nguoi-lon", label: "Người lớn", match: (p) => p.audiences.includes("nguoi-lon") },
  { value: "tre-em", label: "Trẻ em", match: (p) => p.audiences.includes("tre-em") },
  {
    value: "nguoi-cao-tuoi",
    label: "Người cao tuổi",
    match: (p) => p.audiences.includes("nguoi-cao-tuoi"),
  },
];

/** Dựng lựa chọn thương hiệu và nước sản xuất từ chính dữ liệu sản phẩm. */
function optionsFromField(
  items: Product[],
  read: (product: Product) => string,
): FilterOption[] {
  const values = [...new Set(items.map(read))].sort((a, b) => a.localeCompare(b, "vi"));
  return values.map((value) => ({
    value: slugifyValue(value),
    label: value,
    match: (p) => read(p) === value,
  }));
}

/** "Thuỵ Sĩ" → "thuy-si". Dùng cho giá trị trong URL. */
function slugifyValue(value: string): string {
  return value
    .normalize("NFD")
    // \p{M} = dấu thanh và dấu phụ đã tách ra sau NFD. Viết bằng ASCII để
    // không phụ thuộc encoding của file.
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Nhóm lọc cho một danh mục. Lựa chọn thương hiệu và nước sản xuất phụ
 * thuộc hàng thực có trong danh mục nên phải tính theo từng danh mục.
 */
export function buildFilterGroups(items: Product[]): FilterGroup[] {
  return [
    { key: "type", title: "Loại thuốc", options: typeOptions },
    { key: "dosageForm", title: "Dạng bào chế", options: dosageFormOptions },
    { key: "audience", title: "Đối tượng", options: audienceOptions },
    { key: "brand", title: "Thương hiệu", options: optionsFromField(items, (p) => p.brand) },
    { key: "origin", title: "Nước sản xuất", options: optionsFromField(items, (p) => p.origin) },
  ];
}

/** Số sản phẩm đạt một lựa chọn, tính trên toàn danh mục chưa lọc. */
export function countMatches(items: Product[], option: FilterOption): number {
  return items.filter(option.match).length;
}
