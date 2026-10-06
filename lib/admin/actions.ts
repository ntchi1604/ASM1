"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminUsers, canApprovePrescriptions } from "@/lib/admin/users";
import {
  addRow,
  changedCounts,
  getRow,
  removeRow,
  resetAll,
  updateRow,
} from "@/lib/admin/db";
import { parseSections } from "@/lib/admin/page-text";
import { getOrderByCode } from "@/lib/data/orders";
import {
  requireRole,
  requireSession,
  sessionCookie,
  sessionCookieName,
} from "@/lib/admin/auth";
import type { Product, ProductUnit, UnitLabel } from "@/lib/types";

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
    image: "",
    shortUses: text(data, "shortUses") || "Chưa có mô tả.",
  };

  if (!addRow("products", product as unknown as Record<string, unknown>)) {
    return err(`Mã "${id}" đã có mặt hàng khác dùng. Chọn mã khác.`);
  }

  revalidatePath("/admin/kho-thuoc");
  revalidatePath("/");
  return ok(`Đã thêm ${name}.`);
}

export async function deleteProduct(_prev: ActionState, data: FormData): Promise<ActionState> {
  await requireRole("duoc-si");

  const id = text(data, "id");
  const product = getRow("products", id) as unknown as Product | undefined;
  if (!product) return err("Không tìm thấy mặt hàng này.");

  removeRow("products", id);
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

const orderStatuses = ["cho-xac-nhan", "da-xac-nhan", "dang-giao", "da-giao", "da-huy"];

export async function setOrderStatus(
  _prev: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireRole("duoc-si", "ke-toan");

  const code = text(data, "code");
  const status = text(data, "status");

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

  updateRow("orders", code, { status });
  revalidatePath("/admin/don-hang");
  revalidatePath("/tra-cuu-don-hang");
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

  const existing = getRow("coupons", code);

  if (kind === "amount") {
    const amount = money(data, "amount");
    if (Number.isNaN(amount) || amount <= 0) return err("Số tiền giảm phải lớn hơn 0.");
    // Giảm nhiều hơn mức đơn tối thiểu là lỗ chắc chắn ở mọi đơn đủ điều kiện.
    if (amount >= minSubtotal && minSubtotal > 0) {
      return err("Số tiền giảm phải nhỏ hơn đơn tối thiểu, nếu không thì mọi đơn đủ điều kiện đều lỗ.");
    }
    const patch = { code, kind, amount, minSubtotal, description };
    if (existing) updateRow("coupons", code, patch);
    else addRow("coupons", patch);
  } else {
    const patch = { code, kind: "freeship", minSubtotal, description };
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
