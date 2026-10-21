import { cookies } from "next/headers";
import { getProductById } from "@/lib/data/products";
import type { Product } from "@/lib/types";

/**
 * Danh sách đang so sánh — cookie, cùng lý do với giỏ hàng và yêu thích.
 *
 * Bốn là mức trần có lý do: bảng so sánh chia mỗi sản phẩm một cột, cột thứ năm
 * trên màn 1280px đã hẹp đến mức tên thuốc xuống bốn dòng. Thêm nữa thì bảng
 * không còn đọc được trên điện thoại, mà đó mới là chỗ người ta tra thuốc.
 *
 * ponytail: 4 mã trong cookie. Có `users` thì chuyển sang bảng riêng.
 */
export const compareCookieName = "medivia_compare";
export const MAX_COMPARE = 4;

export function parseCompare(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^[a-z0-9-]+$/.test(id))
    .slice(0, MAX_COMPARE);
}

export function serializeCompare(ids: string[]) {
  return ids.slice(0, MAX_COMPARE).join(",");
}

export async function readCompareIds(): Promise<string[]> {
  return parseCompare((await cookies()).get(compareCookieName)?.value);
}

export async function readCompareProducts(): Promise<Product[]> {
  const ids = await readCompareIds();
  return ids
    .map((id) => getProductById(id))
    .filter((product): product is Product => product !== undefined);
}
