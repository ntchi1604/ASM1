"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { districts, isKnownProvince, wards } from "@/lib/data/address";
import {
  normalizeDefaults,
  readAddresses,
  writeAddresses,
  type SavedAddress,
} from "@/lib/shop/address-book";

/**
 * Sửa sổ địa chỉ ở trang tài khoản, và lưu địa chỉ mới khi đặt hàng.
 *
 * Cùng một kho dữ liệu, hai đường vào: khách lưu địa chỉ ngay lúc thanh toán
 * (ô "Lưu làm địa chỉ mặc định") và khách sửa lại ở trang tài khoản. Hai đường
 * phải ghi cùng một chỗ, nếu không địa chỉ lưu lúc mua biến mất khỏi trang tài
 * khoản.
 *
 * Đây là server action công khai: mọi trường đọc lại và kiểm ở đây.
 */

const text = (data: FormData, key: string, max = 160) => {
  const raw = data.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
};

function readDraft(data: FormData) {
  const name = text(data, "name", 80);
  const phone = text(data, "phone", 20).replace(/[\s.-]/g, "");
  const street = text(data, "street");
  const ward = text(data, "ward", 80);
  const district = text(data, "district", 80);
  const province = text(data, "province", 80);
  const valid =
    name.length >= 2 &&
    /^0\d{9,10}$/.test(phone) &&
    street.length >= 4 &&
    wards.includes(ward) &&
    districts.includes(district) &&
    isKnownProvince(province);
  return valid ? { name, phone, street, ward, district, province } : undefined;
}

/** Id sinh từ dữ liệu đã kiểm; không dùng `Math.random` để cùng địa chỉ ra cùng id. */
function idFor(draft: { name: string; phone: string; street: string }) {
  const seed = `${draft.phone}-${draft.street}-${draft.name}`;
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return `dc-${Math.abs(hash).toString(36)}`;
}

/** Đường về kèm kết quả, để cùng một thông báo hiện ở cả hai nơi gọi tới. */
const back = (state: string) => `/tai-khoan?dia-chi=${state}#so-dia-chi`;

export async function saveAddress(data: FormData) {
  const draft = readDraft(data);
  if (!draft) redirect(back("loi"));

  const list = await readAddresses();
  const id = text(data, "id", 40) || idFor(draft);
  const isDefault = data.get("isDefault") !== null;
  const existing = list.find((address) => address.id === id);

  if (!existing && list.length >= 5) redirect(back("day"));

  const next: SavedAddress[] = existing
    ? list.map((address) => (address.id === id ? { ...address, ...draft, isDefault } : address))
    : [...list, { id, ...draft, isDefault }];

  await writeAddresses(next);
  revalidatePath("/tai-khoan");
  revalidatePath("/thanh-toan");
  redirect(back(existing ? "da-sua" : "da-them"));
}

export async function deleteAddress(data: FormData) {
  const id = text(data, "id", 40);
  const list = await readAddresses();
  const target = list.find((address) => address.id === id);
  if (!target) redirect(back("khong-thay"));

  const next = normalizeDefaults(list.filter((address) => address.id !== id));
  await writeAddresses(next);
  revalidatePath("/tai-khoan");
  revalidatePath("/thanh-toan");
  redirect(back("da-xoa"));
}

export async function makeDefaultAddress(data: FormData) {
  const id = text(data, "id", 40);
  const list = await readAddresses();
  if (!list.some((address) => address.id === id)) redirect(back("khong-thay"));

  await writeAddresses(list.map((address) => ({ ...address, isDefault: address.id === id })));
  revalidatePath("/tai-khoan");
  revalidatePath("/thanh-toan");
  redirect(back("da-mac-dinh"));
}

/**
 * Gọi từ `placeOrder` khi khách tích "Lưu làm địa chỉ mặc định". Không redirect:
 * người gọi còn phải xoá giỏ và chuyển trang, và một `redirect` ở đây ném lỗi
 * điều khiển luồng khó gỡ hơn một hàm trả về.
 *
 * Địa chỉ trùng (cùng số điện thoại và số nhà) thì cập nhật chứ không thêm bản
 * thứ hai — mua lại hai lần là hai dòng giống hệt nhau trong sổ.
 */
export async function rememberCheckoutAddress(draft: {
  name: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
}) {
  if (!isKnownProvince(draft.province)) return;
  const list = await readAddresses();
  const id = idFor(draft);
  const existing = list.find((address) => address.id === id);
  const next = existing
    ? list.map((address) => ({ ...address, ...draft }))
    : [...list, { id, ...draft, isDefault: true }];
  await writeAddresses(next.map((address) => ({ ...address, isDefault: address.id === id })));
  revalidatePath("/tai-khoan");
  revalidatePath("/thanh-toan");
}
