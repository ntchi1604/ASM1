import { cookies } from "next/headers";
import { cartLines } from "@/lib/data/cart";
import { getProductById } from "@/lib/data/products";
import type { CartLine, UnitLabel } from "@/lib/types";

/**
 * Giỏ hàng nằm trong cookie, không nằm trong bộ nhớ tiến trình.
 *
 * Cookie chỉ giữ mã sản phẩm, nhãn đơn vị và số lượng — không giữ giá. Giá đọc
 * lại từ danh mục mỗi lần render, nên quản trị đổi giá là giỏ hàng đổi theo
 * ngay, và người dùng không mang theo được một cái giá cũ trong trình duyệt.
 *
 * ponytail: một cookie, tối đa 20 dòng. Quá 4 KB thì chuyển sang bảng `carts`
 * trong lược đồ PostgreSQL. Với 20 dòng × ~50 byte thì còn xa mức đó.
 */
export const cartCookieName = "medivia_cart";
const MAX_LINES = 20;

/** Đọc và LÀM SẠCH giỏ từ cookie. Cookie là dữ liệu của người lạ. */
export async function readCartLines(): Promise<CartLine[]> {
  const raw = (await cookies()).get(cartCookieName)?.value;

  // Khách mở site lần đầu: dùng giỏ mẫu. Cùng lý do với khách mẫu ở trang tài
  // khoản — bản mẫu cần có nội dung để xem, không phải một site trống.
  if (raw === undefined) return cartLines;

  return normalizeLines(parse(raw));
}

/** JSON có dấu `"` và `,` — không hợp lệ trong giá trị cookie thô, nên mã hoá. */
export function serializeCart(lines: CartLine[]): string {
  return encodeURIComponent(
    JSON.stringify(lines.map(({ productId, unitLabel, quantity }) => [productId, unitLabel, quantity])),
  );
}

/**
 * Chỉ giữ dòng còn bán được. Dòng trỏ tới sản phẩm đã xoá, đơn vị không còn,
 * thuốc kê đơn (không được nằm trong giỏ) hoặc số lượng vô lý đều bị bỏ — thà
 * mất một dòng còn hơn để trang giỏ vỡ vì dữ liệu cũ trong trình duyệt.
 */
export function normalizeLines(lines: CartLine[]): CartLine[] {
  const merged = new Map<string, CartLine>();

  for (const line of lines) {
    const product = getProductById(line.productId);
    if (!product || product.prescriptionRequired || product.stock.total <= 0) continue;

    const unit = product.units.find((item) => item.label === line.unitLabel);
    if (!unit) continue;

    const quantity = Math.floor(Number(line.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) continue;

    const key = `${product.id}|${line.unitLabel}`;
    const previous = merged.get(key)?.quantity ?? 0;
    merged.set(key, {
      productId: product.id,
      unitLabel: line.unitLabel as UnitLabel,
      quantity: Math.min(previous + quantity, product.stock.total),
    });
  }

  return [...merged.values()].slice(0, MAX_LINES);
}

function parse(raw: string): CartLine[] {
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Dạng gọn [productId, unitLabel, quantity]; đọc cả dạng đầy đủ để cookie
    // ghi bởi bản cũ vẫn dùng được sau khi đổi định dạng.
    // `unitLabel` chỉ là `UnitLabel` sau khi `normalizeLines` đối chiếu với danh
    // mục; ở đây nó vẫn là chuỗi tuỳ ý từ trình duyệt.
    return parsed.flatMap((entry): CartLine[] => {
      if (Array.isArray(entry) && entry.length === 3) {
        return [{
          productId: String(entry[0]),
          unitLabel: String(entry[1]) as UnitLabel,
          quantity: Number(entry[2]),
        }];
      }
      if (entry && typeof entry === "object") {
        const { productId, unitLabel, quantity } = entry as Record<string, unknown>;
        return [{
          productId: String(productId),
          unitLabel: String(unitLabel) as UnitLabel,
          quantity: Number(quantity),
        }];
      }
      return [];
    });
  } catch {
    return [];
  }
}
