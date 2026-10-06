import {
  buildFilterGroups,
  defaultSort,
  isSortKey,
  type FilterGroup,
  type FilterState,
  type SortKey,
} from "@/lib/filters";
import { getDefaultUnit } from "@/lib/data/products";
import type { Product } from "@/lib/types";

/**
 * Đọc, ghi và áp dụng trạng thái lọc của trang danh mục.
 *
 * Trạng thái nằm hết trong URL: chia sẻ được link đã lọc, nút back của
 * trình duyệt hoạt động đúng, và trang vẫn lọc được khi JavaScript chưa tải.
 * Mọi nơi sinh link đều gọi buildCategoryHref nên không có URL nào lệch.
 */

export const perPage = 8;

/** searchParams của Next là object thường; giá trị có thể là mảng. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

function readList(raw: RawSearchParams, key: string): string[] {
  const value = raw[key];
  if (!value) return [];
  const joined = Array.isArray(value) ? value.join(",") : value;
  return joined
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function readNumber(raw: RawSearchParams, key: string): number | undefined {
  const value = raw[key];
  const text = Array.isArray(value) ? value[0] : value;
  if (!text) return undefined;
  const parsed = Number(text.replace(/\D/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function parseFilterState(raw: RawSearchParams): FilterState {
  const sortRaw = Array.isArray(raw.sort) ? raw.sort[0] : raw.sort;
  return {
    type: readList(raw, "type"),
    dosageForm: readList(raw, "dang"),
    audience: readList(raw, "doi-tuong"),
    brand: readList(raw, "thuong-hieu"),
    origin: readList(raw, "nuoc"),
    priceFrom: readNumber(raw, "gia-tu"),
    priceTo: readNumber(raw, "gia-den"),
    sort: isSortKey(sortRaw) ? sortRaw : defaultSort,
  };
}

export function parsePage(raw: RawSearchParams): number {
  return readNumber(raw, "trang") ?? 1;
}

/** Tên tham số trong URL cho từng nhóm lọc. Tiếng Việt cho dễ đọc link. */
const paramName: Record<FilterGroup["key"], string> = {
  type: "type",
  dosageForm: "dang",
  audience: "doi-tuong",
  brand: "thuong-hieu",
  origin: "nuoc",
};

type HrefOptions = {
  /** Bật/tắt một lựa chọn trong nhóm. */
  toggle?: { key: FilterGroup["key"]; value: string };
  sort?: SortKey;
  page?: number;
  /** Xoá hết điều kiện, giữ lại cách sắp xếp. */
  clearAll?: boolean;
  view?: ViewMode;
};

/**
 * Dựng URL mới từ trạng thái hiện tại. Mọi thay đổi bộ lọc đều đưa về
 * trang 1 — giữ lại trang cũ dễ dẫn tới trang trống sau khi lọc.
 */
export function buildCategoryHref(
  basePath: string,
  state: FilterState,
  view: ViewMode,
  options: HrefOptions = {},
): string {
  const params = new URLSearchParams();

  if (options.clearAll) {
    const sort = options.sort ?? state.sort;
    if (sort !== defaultSort) params.set("sort", sort);
    if (view !== defaultView) params.set("xem", view);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  const next: FilterState = {
    ...state,
    type: [...state.type],
    dosageForm: [...state.dosageForm],
    audience: [...state.audience],
    brand: [...state.brand],
    origin: [...state.origin],
  };

  if (options.toggle) {
    const { key, value } = options.toggle;
    const current = next[key];
    next[key] = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
  }

  if (options.sort) next.sort = options.sort;

  (Object.keys(paramName) as FilterGroup["key"][]).forEach((key) => {
    if (next[key].length > 0) params.set(paramName[key], next[key].join(","));
  });

  if (next.priceFrom) params.set("gia-tu", String(next.priceFrom));
  if (next.priceTo) params.set("gia-den", String(next.priceTo));
  if (next.sort !== defaultSort) params.set("sort", next.sort);

  const nextView = options.view ?? view;
  if (nextView !== defaultView) params.set("xem", nextView);

  // Đổi bộ lọc thì về trang 1; chỉ giữ số trang khi chính nó thay đổi.
  const page = options.page ?? (options.toggle || options.sort ? 1 : undefined);
  if (page && page > 1) params.set("trang", String(page));

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export type ViewMode = "grid" | "list";
export const defaultView: ViewMode = "grid";

export function parseView(raw: RawSearchParams): ViewMode {
  const value = Array.isArray(raw.xem) ? raw.xem[0] : raw.xem;
  return value === "list" ? "list" : "grid";
}

/** Lọc theo trạng thái. Nhiều lựa chọn trong CÙNG nhóm là HOẶC, khác nhóm là VÀ. */
export function applyFilters(items: Product[], state: FilterState): Product[] {
  const groups = buildFilterGroups(items);

  return items.filter((product) => {
    for (const group of groups) {
      const selected = state[group.key];
      if (selected.length === 0) continue;
      const matched = group.options
        .filter((option) => selected.includes(option.value))
        .some((option) => option.match(product));
      if (!matched) return false;
    }

    // Khoảng giá so trên ĐÚNG con số đang hiện ở thẻ sản phẩm (đơn vị bán
    // mặc định, thường là hộp). Nếu so trên đơn vị rẻ nhất thì lọc "dưới
    // 50.000" sẽ lôi cả hộp 78.000 vào chỉ vì một viên lẻ giá 5.500.
    const price = getDefaultUnit(product).price;
    if (state.priceFrom && price < state.priceFrom) return false;
    if (state.priceTo && price > state.priceTo) return false;

    return true;
  });
}

/**
 * Sắp xếp. Luôn đẩy hàng hết xuống cuối: người dùng vào đây để mua, sản
 * phẩm không mua được không nên chiếm chỗ đầu trang.
 */
export function sortProducts(items: Product[], sort: SortKey): Product[] {
  const sorted = [...items];

  // rating là tuỳ chọn: sản phẩm chưa có đánh giá coi như 0 lượt.
  const reviews = (product: Product) => product.rating?.count ?? 0;

  // Sắp xếp phải chạy trên cùng con số mà thẻ sản phẩm in ra, nếu không thứ
  // tự trông như ngẫu nhiên: hộp 78.000 nhảy lên trước hộp 26.000 chỉ vì nó
  // có thêm lựa chọn mua lẻ từng viên.
  const price = (product: Product) => getDefaultUnit(product).price;

  const byKey: Record<SortKey, (a: Product, b: Product) => number> = {
    "lien-quan": (a, b) => reviews(b) - reviews(a),
    "ban-chay": (a, b) => reviews(b) - reviews(a),
    "gia-tang": (a, b) => price(a) - price(b),
    "gia-giam": (a, b) => price(b) - price(a),
    "khuyen-mai": (a, b) => discountOf(b) - discountOf(a),
  };

  sorted.sort((a, b) => {
    const aOut = a.stock.total === 0 ? 1 : 0;
    const bOut = b.stock.total === 0 ? 1 : 0;
    if (aOut !== bOut) return aOut - bOut;
    return byKey[sort](a, b);
  });

  return sorted;
}

/** Mức giảm giá lấy trên đơn vị mặc định, khớp với badge "-N%" trên thẻ. */
function discountOf(product: Product): number {
  const unit = getDefaultUnit(product);
  if (!unit.originalPrice) return 0;
  return (unit.originalPrice - unit.price) / unit.originalPrice;
}

export function paginate<T>(items: T[], page: number): { items: T[]; totalPages: number; page: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  return { items: items.slice(start, start + perPage), totalPages, page: safePage };
}

/** Số điều kiện đang bật, để hiện "Đã lọc theo N điều kiện". */
export function countActiveFilters(state: FilterState): number {
  const groupCount =
    state.type.length +
    state.dosageForm.length +
    state.audience.length +
    state.brand.length +
    state.origin.length;
  const priceCount = state.priceFrom || state.priceTo ? 1 : 0;
  return groupCount + priceCount;
}
