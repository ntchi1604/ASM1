"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateRow } from "@/lib/admin/db";
import { getOrderByCode, returnReasons } from "@/lib/data/orders";
import { readPlacedOrderCodes } from "@/lib/shop/placed-orders";

/**
 * Hai thao tác khách làm được trên đơn của mình: xác nhận đã nhận hàng, và xin
 * hoàn trả.
 *
 * Quyền chứng minh bằng đúng cookie mã đơn mà trang thanh toán đã ghi — cùng cơ
 * chế với đánh giá và trang tài khoản. Không có nó thì bất kỳ ai tra được mã đơn
 * (mã in trên tin nhắn, người khác đọc được) cũng đóng được đơn của người khác.
 *
 * Hoàn trả KHÔNG tự đổi trạng thái: khách báo, quản trị quyết định. Tự chuyển
 * sang "Hoàn trả" nghĩa là ai gõ một lý do cũng rút được tiền khỏi đơn.
 */

const text = (data: FormData, key: string, max = 300) => {
  const raw = data.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
};

/** Giờ địa phương dạng `YYYY-MM-DDTHH:mm`, cùng định dạng với dữ liệu mẫu. */
function nowLocal() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function back(code: string, state: string) {
  return `/tra-cuu-don-hang?ma=${encodeURIComponent(code)}&trang-thai=${state}#don`;
}

/** Đơn phải tồn tại VÀ nằm trong cookie của máy này. */
async function findOwnOrder(code: string) {
  const order = getOrderByCode(code);
  if (!order) return undefined;
  const placed = await readPlacedOrderCodes();
  return placed.includes(order.code) ? order : undefined;
}

export async function confirmReceived(data: FormData) {
  const code = text(data, "code", 20);
  const order = await findOwnOrder(code);
  if (!order) redirect(back(code, "loi-don"));
  if (order.status !== "da-giao") redirect(back(code, "loi-trang-thai"));

  // Ghi `deliveredAt` cùng lúc: nếu không, mốc tự hoàn thành sẽ tính từ ngày
  // ĐẶT hàng, và một đơn giao chậm 4 ngày sẽ tự đóng ngay khi vừa giao.
  updateRow("orders", code, {
    status: "hoan-thanh",
    deliveredAt: order.deliveredAt ?? nowLocal(),
  });

  revalidatePath("/tra-cuu-don-hang");
  revalidatePath("/tai-khoan");
  revalidatePath("/admin/don-hang");
  redirect(back(code, "ok-da-nhan"));
}

export async function requestReturn(data: FormData) {
  const code = text(data, "code", 20);
  const reasonId = text(data, "reasonId", 40);
  const note = text(data, "note", 300);

  const order = await findOwnOrder(code);
  if (!order) redirect(back(code, "loi-don"));
  if (order.status !== "da-giao") redirect(back(code, "loi-trang-thai"));

  const reason = returnReasons.find((item) => item.id === reasonId);
  if (!reason) redirect(back(code, "loi-ly-do"));
  if (order.returnRequest && !order.returnRequest.decision) {
    redirect(back(code, "da-gui-hoan-tra"));
  }

  updateRow("orders", code, {
    returnRequest: {
      reasonId: reason.id,
      reason: reason.label,
      note: note || undefined,
      requestedAt: nowLocal(),
    },
  });

  revalidatePath("/tra-cuu-don-hang");
  revalidatePath("/tai-khoan");
  revalidatePath("/admin/don-hang");
  redirect(back(code, "ok-hoan-tra"));
}
