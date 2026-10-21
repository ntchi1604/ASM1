import { normalize } from "@/lib/ai/engine";

/** Ô lọc của một màn quản trị: `?q=` cộng vài `?<name>=` tuỳ màn. */
export type AdminFilter = Record<string, string | undefined>;

/**
 * Đọc `searchParams` thành chuỗi phẳng.
 *
 * Next trả mỗi khoá là `string | string[] | undefined`; trang quản trị chỉ cần
 * giá trị đầu tiên. Khoá lạ bị bỏ — form GET của trình duyệt không gửi khoá lạ,
 * còn URL gõ tay thì không có lý do gì để chúng đi tiếp vào truy vấn.
 */
export function readFilter(
  params: Record<string, string | string[] | undefined>,
  names: readonly string[],
): AdminFilter {
  const result: AdminFilter = {};
  for (const name of names) {
    const value = params[name];
    const first = Array.isArray(value) ? value[0] : value;
    if (first) result[name] = first;
  }
  return result;
}

/**
 * Dòng này có khớp từ khoá không. Không có từ khoá thì mọi dòng đều khớp.
 *
 * Dùng chung `normalize` của `lib/ai/engine` với trang tìm kiếm, nên gõ không
 * dấu vẫn ra: "nguyen thi lan" tìm được "Nguyễn Thị Lan". Nhiều từ phải khớp
 * TẤT CẢ — khớp một từ thì "lan 0912" trả về mọi thứ có chữ "lan".
 */
export function matchesQuery(query: string | undefined, ...fields: (string | number | undefined)[]) {
  const tokens = normalize(query ?? "").split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const hay = normalize(fields.filter((value) => value !== undefined).join(" "));
  return tokens.every((token) => hay.includes(token));
}
