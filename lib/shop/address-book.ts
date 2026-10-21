import { cookies } from "next/headers";
import { isKnownProvince } from "@/lib/data/address";

/**
 * Sổ địa chỉ giao hàng, giữ trong cookie HttpOnly.
 *
 * Cùng lý do với cookie mã đơn: bản mẫu chưa có đăng nhập, nên "địa chỉ của tôi"
 * chỉ có thể là thứ máy này tự nhớ. HttpOnly vì địa chỉ nhà là dữ liệu riêng —
 * script lạ không cần đọc được nó.
 *
 * ponytail: 5 địa chỉ, một cookie. Nhiều hơn thì trình duyệt khác vẫn không thấy;
 * lúc đó cần bảng `customer_addresses` đã có sẵn trong lược đồ.
 */
export const addressBookCookieName = "medivia_addresses";
const MAX_ADDRESSES = 5;

export type SavedAddress = {
  id: string;
  name: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
};

/**
 * Lọc lại từng dòng khi đọc. Cookie là dữ liệu của người lạ: một dòng thiếu
 * trường hay có `isDefault` là chuỗi sẽ làm trang tài khoản vỡ, và người dùng
 * không có cách nào tự sửa ngoài việc xoá cookie.
 */
function parse(raw: string | undefined): SavedAddress[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .flatMap((entry): SavedAddress[] => {
        if (!entry || typeof entry !== "object") return [];
        const row = entry as Record<string, unknown>;
        const text = (key: string) => (typeof row[key] === "string" ? (row[key] as string) : "");
        if (!text("id") || !text("name") || !isKnownProvince(text("province"))) return [];
        return [{
          id: text("id"),
          name: text("name"),
          phone: text("phone"),
          street: text("street"),
          ward: text("ward"),
          district: text("district"),
          province: text("province"),
          isDefault: row.isDefault === true,
        }];
      })
      .slice(0, MAX_ADDRESSES);
  } catch {
    return [];
  }
}

export async function readAddresses(): Promise<SavedAddress[]> {
  return parse((await cookies()).get(addressBookCookieName)?.value);
}

/** Đúng MỘT địa chỉ mặc định: hai cái mặc định là hai địa chỉ cùng đòi điền sẵn. */
export function normalizeDefaults(list: SavedAddress[]): SavedAddress[] {
  const first = list.findIndex((address) => address.isDefault);
  return list.map((address, index) => ({ ...address, isDefault: index === (first === -1 ? 0 : first) }));
}

export async function writeAddresses(list: SavedAddress[]) {
  (await cookies()).set(
    addressBookCookieName,
    encodeURIComponent(JSON.stringify(normalizeDefaults(list).slice(0, MAX_ADDRESSES))),
    { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 },
  );
}

export function defaultAddress(list: SavedAddress[]): SavedAddress | undefined {
  return list.find((address) => address.isDefault) ?? list[0];
}
