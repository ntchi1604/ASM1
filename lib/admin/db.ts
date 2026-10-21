import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { products } from "@/lib/data/products";
import { categories } from "@/lib/data/categories";
import { coupons } from "@/lib/data/coupons";
import { staticPages } from "@/lib/data/pages";
import { articles } from "@/lib/data/home";
import { mockOrders, prescriptionRows } from "@/lib/data/orders";
import { pharmacies } from "@/lib/data/pharmacies";
import { reviews } from "@/lib/data/reviews";
import { comments } from "@/lib/data/comments";
import { customers } from "@/lib/data/customers";

/**
 * Kho dữ liệu GHI ĐƯỢC của phần quản trị.
 *
 * Vì sao làm thế này mà không dựng cơ sở dữ liệu: toàn bộ site đang đọc từ
 * `lib/data/*.ts`, và 25 tệp import thẳng mảng `products`. Dựng Postgres bây giờ
 * nghĩa là viết lại cả 25 tệp đó cùng lúc — một thay đổi không thể kiểm từng bước.
 * Cách ở đây giữ nguyên các mảng đó, chỉ cho quản trị sửa TẠI CHỖ, nên không tệp
 * nào phải sửa và trang bán hàng thấy thay đổi ngay.
 *
 * Lưu dạng DELTA chứ không phải ảnh chụp toàn bộ. Ảnh chụp sẽ chôn luôn những
 * mặt hàng thêm sau này trong `products.ts`: sửa mã xong khởi động lại thì bản
 * ghi cũ đè lên và mặt hàng mới biến mất, không có gì báo. Delta chỉ ghi đúng
 * trường đã sửa, nên phần còn lại vẫn là mã nguồn.
 *
 * ponytail: một tiến trình, một máy, ghi cả tệp mỗi lần lưu. Đủ cho một máy chủ
 * và một người quản trị. Khi có nhiều người sửa cùng lúc hoặc nhiều máy chủ chạy
 * song song thì thay `save()` bằng UPDATE vào Postgres — lược đồ đã có sẵn ở
 * `design/medivia-schema.sql`, và tên hàm dưới đây giữ nguyên thì trang không
 * phải sửa.
 */

const DATA_DIR = join(process.cwd(), ".data");
const DB_PATH = join(DATA_DIR, "medivia.json");

type Row = Record<string, unknown>;
type Patch = Record<string, unknown>;

/** Ghi đè theo khoá, thêm mới, và xoá — đều tính theo `key` của bộ sưu tập. */
type Delta = {
  updated: Record<string, Record<string, Patch>>;
  added: Record<string, Row[]>;
  removed: Record<string, string[]>;
};

const emptyDelta = (): Delta => ({ updated: {}, added: {}, removed: {} });

/**
 * Bộ sưu tập quản trị được sửa. `rows` phải là CHÍNH mảng mà `lib/data` xuất ra,
 * không phải bản sao — sửa bản sao thì trang bán hàng không thấy gì.
 *
 * `products` và `mockOrders` giữ nguyên tham chiếu nên `getProductById`,
 * `getOrders`, `Lib/data/cart` đều thấy dữ liệu mới mà không phải sửa một dòng.
 */
const collections: Record<string, { rows: Row[]; key: string }> = {
  products: { rows: products as unknown as Row[], key: "id" },
  categories: { rows: categories as unknown as Row[], key: "slug" },
  coupons: { rows: coupons as unknown as Row[], key: "code" },
  articles: { rows: articles as unknown as Row[], key: "slug" },
  pages: { rows: staticPages as unknown as Row[], key: "slug" },
  orders: { rows: mockOrders as unknown as Row[], key: "code" },
  prescriptions: { rows: prescriptionRows as unknown as Row[], key: "orderCode" },
  pharmacies: { rows: pharmacies as unknown as Row[], key: "name" },
  reviews: { rows: reviews as unknown as Row[], key: "id" },
  comments: { rows: comments as unknown as Row[], key: "id" },
  customers: { rows: customers as unknown as Row[], key: "phone" },
};

export type CollectionName = keyof typeof collections;
export const collectionNames = Object.keys(collections) as CollectionName[];

let delta: Delta = emptyDelta();
let loaded = false;

function read(): Delta {
  if (!existsSync(DB_PATH)) return emptyDelta();
  try {
    const parsed = JSON.parse(readFileSync(DB_PATH, "utf8")) as Partial<Delta>;
    return {
      updated: parsed.updated ?? {},
      added: parsed.added ?? {},
      removed: parsed.removed ?? {},
    };
  } catch (err) {
    // Tệp hỏng thì chạy tiếp bằng dữ liệu gốc trong mã, nhưng phải kêu lên. Im
    // lặng bỏ qua nghĩa là quản trị sửa dữ liệu, thấy nó biến mất, và không có
    // manh mối nào để lần ra.
    console.error(`Không đọc được ${DB_PATH}, dùng dữ liệu gốc:`, err);
    return emptyDelta();
  }
}

/** `delta.updated["products"]` — tạo nhánh nếu chưa có. */
function patches(name: string): Record<string, Patch> {
  delta.updated[name] ??= {};
  return delta.updated[name];
}

/** `delta.added["products"]` — tạo nhánh nếu chưa có. */
function additions(name: string): Row[] {
  delta.added[name] ??= [];
  return delta.added[name];
}

/**
 * Áp delta lên các mảng thật. Chạy đúng một lần cho mỗi tiến trình.
 *
 * Thứ tự quan trọng: xoá trước, thêm sau, sửa cuối. Sửa trước khi xoá thì một
 * dòng vừa bị xoá vẫn được ghi đè rồi bị xoá — vô hại nhưng thừa; còn thêm trước
 * khi xoá thì một mặt hàng vừa thêm đã bị xoá ngay nếu trùng khoá.
 */
function apply() {
  delta = read();

  for (const [name, { rows, key }] of Object.entries(collections)) {
    const removed = new Set(delta.removed[name] ?? []);

    // Xoá từ cuối về đầu: splice làm dịch chỉ số, đi xuôi sẽ bỏ sót phần tử.
    for (let i = rows.length - 1; i >= 0; i--) {
      if (removed.has(String(rows[i][key]))) rows.splice(i, 1);
    }

    for (const row of delta.added[name] ?? []) rows.push(row);

    const patches = delta.updated[name] ?? {};
    for (const row of rows) {
      const patch = patches[String(row[key])];
      if (patch) Object.assign(row, patch);
    }
  }

  loaded = true;
}

/** Nạp delta lần đầu, rồi trả về nó. Gọi ở mọi hàm đọc/ghi. */
export function db(): Delta {
  if (!loaded) apply();
  return delta;
}

/**
 * Ghi xuống đĩa. Ghi ra tệp tạm rồi đổi tên: `writeFileSync` thẳng vào đích sẽ
 * để lại tệp cụt nếu tiến trình chết giữa chừng, và lần khởi động sau không đọc
 * được gì — mất sạch dữ liệu quản trị đã nhập.
 */
function save() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(delta, null, 2), "utf8");
  renameSync(tmp, DB_PATH);
}

function findIndex(name: CollectionName, id: string) {
  return collections[name].rows.findIndex((row) => String(row[collections[name].key]) === id);
}

/** Một dòng theo khoá. Trả bản ghi THẬT, không phải bản sao — sửa nó là sửa dữ liệu. */
export function getRow(name: CollectionName, id: string): Row | undefined {
  db();
  const at = findIndex(name, id);
  return at === -1 ? undefined : collections[name].rows[at];
}

export function listRows(name: CollectionName): Row[] {
  db();
  return collections[name].rows;
}

/**
 * Ghi đè một phần dòng. Chỉ những khoá có trong `patch` mới đổi.
 *
 * ponytail: hợp nhất nông. `units` của thuốc là mảng lồng nên form phải gửi cả
 * mảng, không gửi từng phần tử. Đủ dùng vì màn hình sửa giá gửi trọn bảng đơn vị.
 */
export function updateRow(name: CollectionName, id: string, patch: Patch): boolean {
  db();
  const at = findIndex(name, id);
  if (at === -1) return false;
  Object.assign(collections[name].rows[at], patch);

  /**
   * Dòng này có thể đến từ `added` — khi đó `added` ĐANG GIỮ CÙNG object với
   * `rows` (đã push thẳng tham chiếu), nên `Object.assign` phía trên vừa sửa cả
   * hai. Ghi thêm vào `updated` nữa là hai bản ghi cùng khoá trong tệp: lần nạp
   * sau, delta áp `added` rồi `updated` lên cùng một dòng, và xoá dòng đó chỉ
   * xoá được một trong hai.
   */
  const added = additions(name).find((row) => String(row[collections[name].key]) === id);
  if (!added) Object.assign((patches(name)[id] ??= {}), patch);

  save();
  return true;
}

/**
 * Thêm dòng mới. Khoá đã tồn tại thì từ chối thay vì ghi đè — ghi đè âm thầm là
 * cách một mặt hàng mới xoá mất một mặt hàng cũ mà không ai được báo.
 */
export function addRow(name: CollectionName, row: Row): boolean {
  db();
  const id = String(row[collections[name].key]);
  if (findIndex(name, id) !== -1) return false;
  collections[name].rows.push(row);
  (delta.added[name] ??= []).push(row);
  save();
  return true;
}

export function removeRow(name: CollectionName, id: string): boolean {
  db();
  const at = findIndex(name, id);
  if (at === -1) return false;
  collections[name].rows.splice(at, 1);

  const added = additions(name);
  const addedAt = added.findIndex((row) => String(row[collections[name].key]) === id);
  if (addedAt !== -1) {
    // Dòng mới thêm rồi xoá trong cùng phiên: bỏ khỏi `added` là đủ, ghi vào
    // `removed` nữa thì tệp phình ra theo thời gian mà không có tác dụng gì.
    added.splice(addedAt, 1);
  } else {
    (delta.removed[name] ??= []).push(id);
  }

  delete delta.updated[name]?.[id];
  save();
  return true;
}

/** Xoá mọi thay đổi, quay về đúng dữ liệu trong mã nguồn. */
export function resetAll() {
  delta = emptyDelta();
  if (existsSync(DB_PATH)) writeFileSync(DB_PATH, JSON.stringify(delta, null, 2), "utf8");
  loaded = false;
}

/** Số dòng đã sửa / thêm / xoá, để trang quản trị nói rõ đang lệch khỏi mã ở đâu. */
export function changedCounts() {
  const current = db();
  const sum = (source: Record<string, Record<string, unknown> | unknown[]>) =>
    Object.values(source).reduce((total, entry) => total + Object.keys(entry).length, 0);
  return {
    updated: sum(current.updated),
    added: sum(current.added),
    removed: sum(current.removed),
  };
}
