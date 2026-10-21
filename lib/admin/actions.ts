"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminUsers, canApprovePrescriptions } from "@/lib/admin/users";
import {
  addRow,
  changedCounts,
  getRow,
  listRows,
  removeRow,
  resetAll,
  updateRow,
} from "@/lib/admin/db";
import { isCategoryIcon } from "@/lib/data/categories";
import { collections } from "@/lib/data/collections";
import { parseSections } from "@/lib/admin/page-text";
import { mediaUrl, removeMediaFromUrl, saveProductImage } from "@/lib/media";
import { getOrderByCode } from "@/lib/data/orders";
import {
  requireRole,
  requireSession,
  sessionCookie,
  sessionCookieName,
} from "@/lib/admin/auth";
import type { CartLine, Product, ProductUnit, UnitLabel } from "@/lib/types";

/**
 * Mọi thao tác ghi của phần quản trị.
 *
 * Mỗi hàm dưới đây là một điểm vào công khai: Next.js biên dịch `"use server"`
 * thành một POST mà BẤT KỲ AI gửi được, không riêng gì giao diện. Nên hai việc
 * luôn làm ở đầu mỗi hàm, không có ngoại lệ:
 *
 *  1. `requireSession()` hoặc `requireRole()` — kiểm quyền ngay trong hàm, không
 *     tin vào việc trang đã ẩn nút.
 *  2. Kiểm dữ liệu vào. `FormData` là dữ liệu của người lạ.
 *
 * Không có `revalidatePath("/")` chung chung: nó xoá cả site mỗi lần lưu, kể cả
 * những trang không liên quan. Mỗi hàm chỉ revalidate đúng trang bị ảnh hưởng.
 */

export type ActionState = { ok: boolean; message: string };

const ok = (message: string): ActionState => ({ ok: true, message });
const err = (message: string): ActionState => ({ ok: false, message });

const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

/** Ô chọn tệp. Trả `undefined` khi để trống — cùng nghĩa "không đổi ảnh". */
const fileOf = (data: FormData, key: string) => {
  const value = data.get(key);
  return value instanceof File ? value : undefined;
};

const money = (data: FormData, key: string) => {
  // Bỏ mọi dấu phân cách người dùng gõ vào: "1.234.567 ₫" và "1234567" phải ra
  // cùng một số. `Number("1.234")` một mình cho 1.234 — sai gấp nghìn lần.
  const raw = text(data, key).replace(/[.\s₫đ]/gi, "").replace(/,/g, "");
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : NaN;
};

// ---------------------------------------------------------------- Đăng nhập

export async function login(_prev: ActionState, data: FormData): Promise<ActionState> {
  const username = text(data, "username");
  const password = text(data, "password");

  if (!username || !password) return err("Nhập đủ tên đăng nhập và mật khẩu.");

  const user = adminUsers.find(
    (candidate) => candidate.username === username && candidate.password === password,
  );

  // Một câu báo chung cho cả hai trường hợp sai. Nói "tên đăng nhập không tồn
  // tại" là xác nhận cho người đang dò xem tài khoản nào có thật.
  if (!user) return err("Tên đăng nhập hoặc mật khẩu không đúng.");

  (await cookies()).set(sessionCookie(username));
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(sessionCookieName);
  redirect("/admin/dang-nhap");
}

// ------------------------------------------------------------------- Kho thuốc

/**
 * Sửa giá và tồn kho của một mặt hàng.
 *
 * Giá gửi lên theo TỪNG ĐƠN VỊ, dạng `price:<nhãn>` — chỉ đơn vị nào có trong
 * form mới được sửa. Không cho form gửi cả mảng `units` vì như thế form phải biết
 * đơn vị nào đang tồn tại: một ô bị bỏ trống do lỗi hiển thị sẽ xoá luôn đơn vị
 * đó, và mặt hàng mất giá bán mà không ai được báo.
 */
export async function saveStock(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");

  const id = text(data, "id");
  const product = getRow("products", id) as unknown as Product | undefined;
  if (!product) return err("Không tìm thấy mặt hàng này.");

  const total = Number(text(data, "total"));
  if (!Number.isInteger(total) || total < 0) {
    return err("Tồn kho phải là số nguyên không âm.");
  }

  const units: ProductUnit[] = product.units.map((unit) => {
    const next = money(data, `price:${unit.label}`);
    if (Number.isNaN(next)) return unit;
    // Giá gốc phải luôn cao hơn giá bán, nếu không thì nhãn "-%" hiện số âm.
    const originalPrice =
      unit.originalPrice !== undefined && unit.originalPrice > next
        ? unit.originalPrice
        : undefined;
    return { ...unit, price: next, ...(originalPrice ? { originalPrice } : {}) };
  });

  const nearby = Number(text(data, "nearbyPharmacies"));
  if (text(data, "nearbyPharmacies") && (!Number.isInteger(nearby) || nearby < 0)) {
    return err("Số nhà thuốc gần bạn phải là số nguyên không âm.");
  }

  const restock = text(data, "restockDate");
  const patch: Record<string, unknown> = {
    units,
    stock: {
      ...product.stock,
      total,
      ...(text(data, "nearbyPharmacies") ? { nearbyPharmacies: nearby } : {}),
      // `restockDate` chỉ có nghĩa khi hết hàng — lược đồ cũng ghi vậy. Còn hàng
      // mà vẫn giữ ngày dự kiến về thì trang sản phẩm hiện "sắp có hàng" cho một
      // mặt hàng đang bán được.
      ...(total === 0 && restock ? { restockDate: restock } : {}),
    },
  };
  if (total > 0) delete (patch.stock as Record<string, unknown>).restockDate;

  updateRow("products", id, patch);
  revalidatePath("/admin/kho-thuoc");
  // Trang sản phẩm và danh mục đọc cùng dữ liệu này, nên giá đổi ở đây phải hiện
  // ở đó — không revalidate thì khách vẫn thấy giá cũ tới lần dựng lại.
  revalidatePath(`/thuoc/${product.slug}`);
  revalidatePath("/");
  revalidatePath("/danh-muc", "layout");

  return ok(`Đã lưu ${product.name}.`);
}

// ------------------------------------------------------------------ Mặt hàng

/** Ô chọn trong form thêm mặt hàng — nguồn duy nhất là danh mục đang có thật. */
export async function addProduct(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");

  const id = text(data, "id");
  const name = text(data, "name");
  const categorySlug = text(data, "categorySlug");
  const price = money(data, "price");
  const total = Number(text(data, "total"));

  if (!/^[a-z0-9-]+$/.test(id)) {
    return err("Mã mặt hàng chỉ gồm chữ thường, số và dấu gạch ngang.");
  }
  if (!name) return err("Thiếu tên mặt hàng.");
  if (Number.isNaN(price) || price <= 0) return err("Giá bán phải là số lớn hơn 0.");
  if (!Number.isInteger(total) || total < 0) return err("Tồn kho phải là số nguyên không âm.");

  // Ảnh tải lên phải lưu TRƯỚC dòng dữ liệu: ghi dòng trước rồi mới lưu tệp
  // thì một tệp hỏng để lại mặt hàng trỏ vào ảnh không tồn tại, và không có gì
  // báo cho người thêm.
  let image = "";
  try {
    const name = await saveProductImage(fileOf(data, "image"));
    if (name) image = mediaUrl(name);
  } catch (error) {
    return err(error instanceof Error ? error.message : "Không lưu được ảnh.");
  }

  const product: Product = {
    id,
    slug: text(data, "slug") || id,
    name,
    activeIngredient: text(data, "activeIngredient") || "Chưa khai báo",
    strength: text(data, "strength"),
    brand: text(data, "brand") || "Chưa khai báo",
    origin: text(data, "origin") || "Việt Nam",
    categorySlug,
    type: (text(data, "type") || "drug") as Product["type"],
    dosageForm: (text(data, "dosageForm") || "vien-nen") as Product["dosageForm"],
    audiences: data.getAll("audiences").map(String) as Product["audiences"],
    prescriptionRequired: data.get("prescriptionRequired") === "on",
    units: [{ label: (text(data, "unitLabel") || "Hộp") as UnitLabel, price }],
    stock: { total, nearbyPharmacies: 0 },
    image,
    shortUses: text(data, "shortUses") || "Chưa có mô tả.",
  };

  if (!addRow("products", product as unknown as Record<string, unknown>)) {
    return err(`Mã "${id}" đã có mặt hàng khác dùng. Chọn mã khác.`);
  }

  revalidatePath("/admin/kho-thuoc");
  revalidatePath("/");
  return ok(`Đã thêm ${name}.`);
}

/**
 * Sửa thuộc tính của mặt hàng đã có.
 *
 * Không nhận `id` và `slug`: mã là khoá của dòng, đường dẫn là địa chỉ công khai
 * đã được chia sẻ và ghi trong đơn cũ. Đổi đường dẫn làm mọi liên kết đã trỏ tới
 * mặt hàng thành 404, trong khi không ai xoá được liên kết đã gửi đi.
 *
 * Danh mục phải là danh mục đang có thật — gõ tự do thì mặt hàng rơi khỏi mọi
 * trang danh mục mà vẫn mở được bằng đường dẫn trực tiếp, và không màn hình nào
 * báo điều đó.
 */
export async function saveProduct(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");

  const id = text(data, "id");
  const product = getRow("products", id) as unknown as Product | undefined;
  if (!product) return err("Không tìm thấy mặt hàng này.");

  const name = text(data, "name");
  const categorySlug = text(data, "categorySlug");
  const type = text(data, "type") as Product["type"];
  const dosageForm = text(data, "dosageForm") as Product["dosageForm"];

  if (!name) return err("Thiếu tên mặt hàng.");
  if (!getRow("categories", categorySlug)) return err("Danh mục không có thật. Chọn lại.");
  if (!["drug", "supplement", "cosmetic", "device"].includes(type)) {
    return err("Loại hàng không hợp lệ.");
  }
  if (!["vien-nen", "vien-sui", "siro", "goi-bot", "xit-nho", "vien-ngam", "ong-uong", "dung-dich"].includes(dosageForm)) {
    return err("Dạng bào chế không hợp lệ.");
  }

  const audiences = data.getAll("audiences").map(String) as Product["audiences"];
  if (audiences.some((value) => !["nguoi-lon", "tre-em", "nguoi-cao-tuoi"].includes(value))) {
    return err("Đối tượng dùng không hợp lệ.");
  }

  // Ảnh mới ghi xong mới xoá ảnh cũ: làm ngược lại thì một ảnh hỏng để mặt hàng
  // mất ảnh đang có, mà ảnh cũ cũng đã bị xoá khỏi đĩa.
  let image = product.image;
  let replaced = false;
  try {
    const name = await saveProductImage(fileOf(data, "image"));
    if (name) {
      image = mediaUrl(name);
      replaced = true;
    }
  } catch (error) {
    return err(error instanceof Error ? error.message : "Không lưu được ảnh.");
  }

  updateRow("products", id, {
    name,
    activeIngredient: text(data, "activeIngredient") || "Chưa khai báo",
    strength: text(data, "strength"),
    brand: text(data, "brand") || "Chưa khai báo",
    origin: text(data, "origin") || "Việt Nam",
    categorySlug,
    type,
    dosageForm,
    audiences,
    prescriptionRequired: data.get("prescriptionRequired") === "on",
    shortUses: text(data, "shortUses") || "Chưa có mô tả.",
    image,
  });

  if (replaced) await removeMediaFromUrl(product.image);

  revalidatePath("/admin/kho-thuoc");
  revalidatePath("/");
  revalidatePath(`/thuoc/${product.slug}`);
  revalidatePath(`/danh-muc/${categorySlug}`);
  return ok(`Đã lưu thuộc tính của ${name}.`);
}

export async function deleteProduct(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si");

  const id = text(data, "id");
  const product = getRow("products", id) as unknown as Product | undefined;
  if (!product) return err("Không tìm thấy mặt hàng này.");

  // Đơn đã chốt dựng lại từ danh mục hiện tại (`resolveOrder` → `getCartItems`),
  // nên xoá mặt hàng là dòng đó biến mất khỏi đơn cũ và tổng tiền đọc lại thấp
  // hơn số khách đã trả. Chặn ở đây rẻ hơn lưu ảnh chụp giá vào từng dòng đơn,
  // và đúng với yêu cầu lưu hồ sơ bán thuốc.
  const usedBy = listRows("orders").filter((row) =>
    (row.lines as CartLine[] | undefined)?.some((line) => line.productId === id),
  );
  if (usedBy.length > 0) {
    const codes = usedBy.slice(0, 3).map((row) => String(row.code)).join(", ");
    return err(
      `Không xoá được: ${usedBy.length} đơn đã có mặt hàng này (${codes}${usedBy.length > 3 ? "…" : ""}). Đặt tồn kho về 0 để ngừng bán — đơn cũ giữ nguyên.`,
    );
  }

  removeRow("products", id);
  // Ảnh tải lên không còn ai trỏ tới thì xoá luôn; ảnh trong `public/products`
  // vẫn thuộc về mã nguồn và không bị đụng.
  await removeMediaFromUrl(product.image);
  revalidatePath("/admin/kho-thuoc");
  revalidatePath("/");
  return ok(`Đã xoá ${product.name}.`);
}

// ---------------------------------------------------------------- Đơn thuốc

/**
 * Duyệt hoặc từ chối một đơn thuốc.
 *
 * Chỉ vai trò `duoc-si`. `reviewedBy` lấy từ PHIÊN chứ không từ form: người gửi
 * không được tự khai mình là ai, nếu không thì nhật ký duyệt đơn thuốc — thứ để
 * truy trách nhiệm chuyên môn — trở thành ô chữ ai điền cũng được.
 *
 * Từ chối bắt buộc có lý do, và lý do phải nằm trong danh sách có sẵn: khách đọc
 * câu đó để biết cần sửa gì, còn câu gõ tự do thì mỗi dược sĩ viết một kiểu.
 */
export async function reviewPrescription(
  _prev: ActionState,
  data: FormData,
): Promise<ActionState> {
  const session = await requireRole("duoc-si");

  const orderCode = text(data, "orderCode");
  const decision = text(data, "decision");
  const reason = text(data, "rejectReason");

  const row = getRow("prescriptions", orderCode);
  if (!row) return err("Không tìm thấy đơn thuốc này.");
  if (row.status !== "cho-duyet") {
    return err("Đơn này đã được xử lý rồi. Tải lại trang để xem kết quả.");
  }

  if (decision === "duyet") {
    updateRow("prescriptions", orderCode, {
      status: "da-duyet",
      reviewedBy: session.name,
      reviewedAt: new Date().toISOString(),
    });
  } else if (decision === "tu-choi") {
    if (!reason) return err("Từ chối phải kèm lý do — khách đọc lý do để biết cần sửa gì.");
    updateRow("prescriptions", orderCode, {
      status: "tu-choi",
      rejectReason: reason,
      reviewedBy: session.name,
      reviewedAt: new Date().toISOString(),
    });
  } else {
    return err("Quyết định không hợp lệ.");
  }

  revalidatePath("/admin/duyet-don-thuoc");
  revalidatePath("/admin/don-hang");
  return ok(decision === "duyet" ? `Đã duyệt ${orderCode}.` : `Đã từ chối ${orderCode}.`);
}

// ------------------------------------------------------------------ Đơn hàng

const orderStatuses = [
  "cho-xac-nhan",
  "da-xac-nhan",
  "dang-giao",
  "da-giao",
  "hoan-thanh",
  "hoan-tra",
  "da-huy",
];

export async function setOrderStatus(
  _prev: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");

  const code = text(data, "code");
  const status = text(data, "status");
  const reason = text(data, "reason").slice(0, 300);

  if (!orderStatuses.includes(status)) return err("Trạng thái không hợp lệ.");

  /*
    Đọc bằng `getOrderByCode`, KHÔNG bằng `getRow("orders")`.

    `getRow` trả dòng thô trong `mockOrders`, mà `requiresPrescription` không nằm
    ở đó — nó do `resolveOrder()` tính ra từ danh mục sản phẩm. Đọc dòng thô thì
    trường đó là `undefined`, điều kiện dưới đây luôn sai, và ràng buộc pháp lý
    dưới đây **không bao giờ chạy** — trong khi giao diện vẫn hiện cảnh báo, nên
    nhìn vào tưởng nó đang chạy. Đã xảy ra thật: đặt một đơn Augmentin chưa duyệt
    đơn thuốc sang "đang giao" thì action nhận, và tệp delta ghi trạng thái mới.
  */
  const order = getOrderByCode(code);
  if (!order) return err("Không tìm thấy đơn này.");

  /*
    Đơn có thuốc kê đơn không được rời khỏi "chờ xác nhận" khi đơn thuốc chưa
    duyệt. Đây là lời hứa đã nói với khách ở trang Quy định bán thuốc kê đơn, và
    là ràng buộc pháp lý: bán thuốc kê đơn mà chưa có người có chứng chỉ hành nghề
    đối chiếu đơn là vi phạm, không phải chuyện quy trình nội bộ.

    Đơn có thuốc kê đơn mà KHÔNG có dòng đơn thuốc nào cũng bị chặn: khách chưa
    gửi đơn thì càng không được soạn hàng.
  */
  if (order.requiresPrescription && status !== "cho-xac-nhan" && status !== "da-huy") {
    const prescription = getRow("prescriptions", code);
    if (prescription?.status !== "da-duyet") {
      return err(
        `${code} có thuốc kê đơn chưa duyệt. Duyệt đơn thuốc trước, hoặc huỷ đơn.`,
      );
    }
  }

  /*
    Hoàn trả bắt buộc có lý do. Khách xin hoàn trả thì lý do đã có sẵn trong
    `returnRequest`; quản trị tự chuyển tay (hàng vỡ khi giao, sai địa chỉ) thì
    phải gõ lý do. Không có lý do nghĩa là đơn mất tiền mà không ai biết vì sao.
  */
  /*
    Giờ ĐỊA PHƯƠNG chứ không phải `toISOString()`: toISOString trả giờ UTC, và
    một đơn xử lý lúc 18:14 sẽ được ghi 11:14 — sớm hơn lúc khách gửi yêu cầu,
    trên cùng một trường. Cả dữ liệu mẫu đều dùng giờ địa phương.
  */
  const nowLocal = () => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  if (status === "hoan-tra") {
    const pending = order.returnRequest;
    const finalReason = pending && !pending.decision ? pending.reason : reason;
    if (!finalReason) return err("Hoàn trả phải ghi rõ lý do.");
    updateRow("orders", code, {
      status,
      returnRequest: {
        ...pending,
        reason: finalReason,
        requestedAt: pending?.requestedAt ?? nowLocal(),
        decision: "da-chap-nhan",
        decidedAt: nowLocal(),
      },
    });
  } else if (status === "da-giao" && order.returnRequest && !order.returnRequest.decision) {
    // Giữ đơn ở "Đã giao" nghĩa là từ chối khiếu nại. Đánh dấu để đơn không bị
    // coi là đang chờ xử lý mãi mãi.
    updateRow("orders", code, {
      status,
      returnRequest: {
        ...order.returnRequest,
        decision: "tu-choi",
        decidedAt: nowLocal(),
      },
    });
  } else {
    updateRow("orders", code, { status });
  }

  revalidatePath("/admin/don-hang");
  revalidatePath("/tra-cuu-don-hang");
  revalidatePath("/tai-khoan");
  return ok(`Đơn ${code}: ${status}.`);
}

// ------------------------------------------------------------------ Ưu đãi

export async function saveCoupon(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");

  const code = text(data, "code").toUpperCase();
  const kind = text(data, "kind");
  const minSubtotal = money(data, "minSubtotal");
  const description = text(data, "description");

  if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
    return err("Mã chỉ gồm chữ in, số và gạch ngang, dài 3–20 ký tự.");
  }
  if (Number.isNaN(minSubtotal) || minSubtotal < 0) {
    return err("Đơn tối thiểu phải là số không âm.");
  }
  if (!description) return err("Thiếu mô tả — khách đọc câu này ở ô nhập mã.");
  if (kind !== "amount" && kind !== "freeship") return err("Loại giảm giá không hợp lệ.");

  // Ngày dạng `YYYY-MM-DD` — so sánh chuỗi được, và đúng thứ ô `type="date"` gửi lên.
  // Chuỗi rỗng chứ không phải `undefined` khi xoá ngày: `JSON.stringify` bỏ hẳn
  // khoá `undefined`, nên nạp lại delta sẽ để ngày cũ sống sót.
  const startAt = text(data, "startAt");
  const endAt = text(data, "endAt");
  const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
  if ((startAt && !isDate(startAt)) || (endAt && !isDate(endAt))) {
    return err("Ngày không hợp lệ.");
  }
  if (startAt && endAt && endAt < startAt) {
    return err("Ngày kết thúc phải sau ngày bắt đầu.");
  }

  const existing = getRow("coupons", code);

  if (kind === "amount") {
    const amount = money(data, "amount");
    if (Number.isNaN(amount) || amount <= 0) return err("Số tiền giảm phải lớn hơn 0.");
    // Giảm nhiều hơn mức đơn tối thiểu là lỗ chắc chắn ở mọi đơn đủ điều kiện.
    if (amount >= minSubtotal && minSubtotal > 0) {
      return err("Số tiền giảm phải nhỏ hơn đơn tối thiểu, nếu không thì mọi đơn đủ điều kiện đều lỗ.");
    }
    const patch = { code, kind, amount, minSubtotal, description, startAt, endAt };
    if (existing) updateRow("coupons", code, patch);
    else addRow("coupons", patch);
  } else {
    const patch = { code, kind: "freeship", minSubtotal, description, startAt, endAt };
    if (existing) updateRow("coupons", code, patch);
    else addRow("coupons", patch);
  }

  revalidatePath("/admin/uu-dai");
  revalidatePath("/gio-hang");
  revalidatePath("/thanh-toan");
  return ok(`Đã lưu mã ${code}.`);
}

export async function deleteCoupon(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");
  const code = text(data, "code");
  if (!removeRow("coupons", code)) return err("Không tìm thấy mã này.");
  revalidatePath("/admin/uu-dai");
  return ok(`Đã xoá mã ${code}.`);
}

// ----------------------------------------------------------------- Đánh giá

/**
 * Ẩn hoặc hiện lại một đánh giá trên trang sản phẩm.
 *
 * Ẩn chứ KHÔNG xoá: nội dung khách viết là bằng chứng khi có khiếu nại, còn một
 * câu đánh giá có thể do khách gửi nhầm đơn hoặc do quản trị viên đọc sai lúc
 * đầu. Xoá đi thì không lấy lại được.
 */
export async function setReviewHidden(
  _prev: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");

  const id = text(data, "id");
  const hidden = text(data, "hidden") === "1";
  const row = getRow("reviews", id);
  if (!row) return err("Không tìm thấy đánh giá này.");

  updateRow("reviews", id, { hidden });
  revalidatePath("/admin/danh-gia");
  const product = getRow("products", String(row.productId));
  if (product) revalidatePath(`/thuoc/${String(product.slug)}`);
  return ok(hidden ? "Đã ẩn đánh giá." : "Đã hiện lại đánh giá.");
}

// ---------------------------------------------------------------- Bình luận

/**
 * Ẩn bình luận khỏi bài viết. Ẩn chứ không xoá — cùng lý do với đánh giá: nội
 * dung khách viết còn đó để đối chiếu khi có khiếu nại.
 */
export async function setCommentHidden(
  _prev: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");

  const id = text(data, "id");
  const hidden = text(data, "hidden") === "1";
  const row = getRow("comments", id);
  if (!row) return err("Không tìm thấy bình luận này.");

  updateRow("comments", id, { hidden });
  revalidatePath(`/goc-suc-khoe/${String(row.articleSlug)}`);
  revalidatePath("/admin/binh-luan");
  return ok(hidden ? "Đã ẩn bình luận." : "Đã hiện lại bình luận.");
}

/**
 * Trả lời một bình luận. Tên người trả lời lấy từ phiên đăng nhập, không phải từ
 * form — người gửi không được tự nhận là dược sĩ trong câu trả lời.
 */
export async function replyToComment(
  _prev: ActionState,
  data: FormData,
): Promise<ActionState> {
  const session = await requireRole("duoc-si", "ke-toan");

  const id = text(data, "id");
  const body = text(data, "body").slice(0, 600);
  const row = getRow("comments", id);
  if (!row) return err("Không tìm thấy bình luận này.");
  if (body.length < 10) return err("Câu trả lời cần ít nhất 10 ký tự.");

  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  updateRow("comments", id, { reply: { body, author: session.name, date } });
  revalidatePath(`/goc-suc-khoe/${String(row.articleSlug)}`);
  revalidatePath("/admin/binh-luan");
  return ok("Đã gửi trả lời.");
}

// -------------------------------------------------------- Bài viết & trang chữ

export async function saveArticle(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");

  const slug = text(data, "slug");
  const title = text(data, "title");
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return err("Đường dẫn chỉ gồm chữ thường, số và gạch ngang.");
  }
  if (!title) return err("Thiếu tiêu đề.");

  const patch = {
    slug,
    title,
    tag: text(data, "tag") || "Góc sức khoẻ",
    excerpt: text(data, "excerpt"),
    author: text(data, "author"),
    date: text(data, "date") || new Date().toISOString().slice(0, 10),
    readingMinutes: Math.max(1, Number(text(data, "readingMinutes")) || 1),
  };

  const existing = getRow("articles", slug);
  if (existing) updateRow("articles", slug, patch);
  else addRow("articles", patch);

  revalidatePath("/admin/bai-viet");
  revalidatePath("/goc-suc-khoe");
  return ok(`Đã lưu bài "${title}".`);
}

export async function deleteArticle(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");
  const slug = text(data, "slug");
  if (!removeRow("articles", slug)) return err("Không tìm thấy bài này.");
  revalidatePath("/admin/bai-viet");
  revalidatePath("/goc-suc-khoe");
  return ok("Đã xoá bài viết.");
}

/**
 * Sửa một trang chữ.
 *
 * `sections` gửi lên dưới dạng CHỮ, không phải JSON — xem `lib/admin/page-text.ts`.
 * Người sửa trang là dược sĩ; bắt họ gõ JSON thì mỗi lần sửa là một lần có thể sai
 * dấu phẩy, và câu báo lỗi duy nhất nhận được là "không đọc được".
 *
 * Trang không có mục nào bị từ chối: trang chữ không có nội dung là một trang trắng
 * vẫn qua được kiểm tra, và người sửa chỉ phát hiện khi khách báo. Một trang chính
 * sách trắng còn tệ hơn một trang chính sách sai — không ai biết là sai.
 */
export async function savePage(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");

  const slug = text(data, "slug");
  const title = text(data, "title");
  if (!title) return err("Thiếu tiêu đề trang.");

  const sections = parseSections(text(data, "sections"));
  if (sections.length === 0) {
    return err("Trang phải có ít nhất một mục. Mỗi mục bắt đầu bằng dòng ## Tiêu đề.");
  }

  const patch = { slug, title, lead: text(data, "lead"), sections };
  const existing = getRow("pages", slug);
  if (existing) updateRow("pages", slug, patch);
  else addRow("pages", patch);

  revalidatePath("/admin/trang");
  revalidatePath(`/${slug}`);
  return ok(`Đã lưu trang "${title}".`);
}

export async function deletePage(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si");
  const slug = text(data, "slug");
  if (!removeRow("pages", slug)) return err("Không tìm thấy trang này.");
  revalidatePath("/admin/trang");
  return ok("Đã xoá trang.");
}

// ---------------------------------------------------------------- Nhà thuốc

export async function savePharmacy(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");

  const name = text(data, "name");
  const original = text(data, "originalName");
  if (!name) return err("Thiếu tên nhà thuốc.");

  const patch = {
    name,
    address: text(data, "address"),
    district: text(data, "district"),
    phone: text(data, "phone"),
    hours: text(data, "hours"),
  };

  const existing = getRow("pharmacies", original || name);
  if (existing) {
    // Đổi tên là đổi KHOÁ của dòng này, nên phải xoá rồi thêm chứ không sửa được
    // tại chỗ — `updateRow` tra theo khoá cũ và sẽ không tìm thấy dòng mới.
    if (original && original !== name) removeRow("pharmacies", original);
    if (original && original !== name) addRow("pharmacies", patch);
    else updateRow("pharmacies", name, patch);
  } else {
    addRow("pharmacies", patch);
  }

  revalidatePath("/admin/nha-thuoc");
  revalidatePath("/he-thong-nha-thuoc");
  return ok(`Đã lưu ${name}.`);
}

export async function deletePharmacy(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si");
  const name = text(data, "name");
  if (!removeRow("pharmacies", name)) return err("Không tìm thấy nhà thuốc này.");
  revalidatePath("/admin/nha-thuoc");
  revalidatePath("/he-thong-nha-thuoc");
  return ok(`Đã xoá ${name}.`);
}

// ---------------------------------------------------------------- Khách hàng

/**
 * Xoá tài khoản khách.
 *
 * Không đụng tới đơn hàng: `orders` trong bản mẫu giữ SỐ ĐIỆN THOẠI chứ không
 * giữ khoá tới `customers`, nên đơn cũ vẫn còn nguyên và vẫn đối soát được.
 * Đúng ý định chứ không phải may mắn — hoá đơn không được biến mất theo tài
 * khoản, cùng lý do với `reviews.order_code` dùng ON DELETE SET NULL trong lược
 * đồ SQL.
 *
 * Không ai xoá được tài khoản của chính mình vì đây là tài khoản KHÁCH, tách hẳn
 * khỏi `admin_users` — nhưng người vẫn đang đăng nhập bằng số đó thì phiên của
 * họ chết ngay ở yêu cầu kế tiếp: `getCustomer()` tra lại kho mỗi lần, không tin
 * vào cookie.
 */
export async function deleteCustomer(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si");

  const phone = text(data, "phone");
  if (!removeRow("customers", phone)) return err("Không tìm thấy tài khoản này.");

  revalidatePath("/admin/nguoi-dung");
  return ok(`Đã xoá tài khoản ${phone}.`);
}

// ------------------------------------------------------------------ Danh mục

/** Slug đã có chủ ở `/danh-muc/…`: bộ sưu tập ảo dùng chung đường dẫn với danh mục. */
const reservedCategorySlugs = new Set(collections.map((collection) => collection.slug));

/**
 * Thêm hoặc sửa một danh mục.
 *
 * Đường dẫn KHÔNG đổi được sau khi tạo, cùng lý do với bài viết: `categorySlug`
 * của mọi mặt hàng trỏ thẳng vào nó, đổi đường dẫn là cả danh mục rỗng ruột và
 * mọi liên kết cũ thành 404. Muốn đổi tên đường dẫn thì tạo danh mục mới rồi
 * chuyển mặt hàng sang.
 *
 * Hai ràng buộc của `aiHint` chép đúng từ lược đồ SQL: nhãn và địa chỉ hoặc cùng
 * có hoặc cùng không, và địa chỉ phải trỏ vào một danh mục. Kiểm ở đây để người
 * sửa nhận câu báo lỗi đọc được, thay vì lỗi ràng buộc của PostgreSQL sau này.
 */
export async function saveCategory(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");

  const slug = text(data, "slug");
  const name = text(data, "name");
  const shortName = text(data, "shortName");
  const icon = text(data, "icon");

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return err("Đường dẫn chỉ gồm chữ thường, số và gạch ngang.");
  }
  if (!name) return err("Thiếu tên danh mục.");
  if (!shortName) return err("Thiếu tên ngắn — tên này hiện trong ô ở trang chủ.");
  if (!isCategoryIcon(icon)) return err("Chọn một icon trong danh sách.");

  // `/danh-muc/thuoc` và `/danh-muc/thuoc-khong-ke-don` đã là bộ sưu tập có thật.
  // Danh mục thắng khi trùng slug, nên tạo trùng là đè mất trang đó.
  if (reservedCategorySlugs.has(slug)) {
    return err(`Đường dẫn "${slug}" đã dùng cho một bộ sưu tập. Chọn đường dẫn khác.`);
  }

  const hintMessage = text(data, "hintMessage");
  const hintLabel = text(data, "hintLabel");
  const hintHref = text(data, "hintHref");
  if (Boolean(hintLabel) !== Boolean(hintHref)) {
    return err("Gợi ý AI cần đủ cả nhãn nút và địa chỉ, hoặc để trống cả hai.");
  }
  if (hintHref && !/^\/danh-muc\/[a-z0-9-]+$/.test(hintHref)) {
    return err("Địa chỉ của nút gợi ý phải có dạng /danh-muc/ten-danh-muc.");
  }

  const patch = {
    slug,
    name,
    shortName,
    icon,
    description: text(data, "description"),
    sortOrder: Number(text(data, "sortOrder")) || 0,
    // Xoá hẳn khoá khi không có gợi ý: `Object.assign` không xoá được khoá, nên
    // gán `undefined` sẽ để lại một `aiHint` rỗng và khối AI hiện dải trống.
    aiHint: hintMessage
      ? { message: hintMessage, ...(hintLabel ? { action: { label: hintLabel, href: hintHref } } : {}) }
      : null,
  };

  if (getRow("categories", slug)) updateRow("categories", slug, patch);
  else addRow("categories", patch);

  revalidatePath("/admin/danh-muc");
  revalidatePath("/");
  revalidatePath(`/danh-muc/${slug}`);
  return ok(`Đã lưu danh mục "${name}".`);
}

export async function deleteCategory(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si");

  const slug = text(data, "slug");
  const inUse = (listRows("products") as unknown as Product[]).filter(
    (product) => product.categorySlug === slug,
  ).length;

  // Xoá danh mục còn mặt hàng là bỏ rơi chúng: trang sản phẩm vẫn mở được nhưng
  // không danh mục nào liệt kê chúng nữa, và không có màn hình nào báo điều đó.
  if (inUse > 0) {
    return err(`Danh mục còn ${inUse} mặt hàng. Chuyển chúng sang danh mục khác trước.`);
  }
  if (!removeRow("categories", slug)) return err("Không tìm thấy danh mục này.");

  revalidatePath("/admin/danh-muc");
  revalidatePath("/");
  return ok("Đã xoá danh mục.");
}

// ------------------------------------------------------------------- Cài đặt

export async function saveDanger(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si");

  if (text(data, "confirm") !== "XOÁ") {
    return err('Gõ đúng chữ "XOÁ" để xác nhận. Đây là thao tác không hoàn tác được.');
  }

  resetAll();
  revalidatePath("/", "layout");
  return ok("Đã xoá mọi thay đổi. Dữ liệu quay về đúng như trong mã nguồn.");
}

/** Tóm tắt mức lệch so với mã nguồn, hiện ở đầu mỗi trang quản trị. */
export async function getChangeSummary() {
  await requireSession();
  return changedCounts();
}

// -------------------------------------------------------- Duyệt đơn (kiểm quyền)

/** Trang duyệt đơn thuốc cần biết người đang xem có được duyệt không, để ẩn nút. */
export async function canReviewPrescriptions() {
  const session = await requireSession();
  return canApprovePrescriptions(session.role);
}

/** Dùng bởi `check-permissions` để chứng minh vai trò kế toán không duyệt được. */
export async function attemptPrescriptionReview(orderCode: string) {
  const session = await requireSession();
  if (!canApprovePrescriptions(session.role)) {
    return { allowed: false, reviewer: session.name };
  }
  const row = getRow("prescriptions", orderCode);
  return { allowed: true, reviewer: session.name, status: row?.status };
}
