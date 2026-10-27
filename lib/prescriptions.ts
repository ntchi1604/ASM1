import { unlinkSync } from "node:fs";
import { appendFile, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { saveOne } from "@/lib/media";

/**
 * Tệp ảnh đơn thuốc — kho RIÊNG, không phục vụ công khai.
 *
 * Vì sao không dùng `uploadsDir` của `lib/media`: mọi tệp ở đó được `/api/media`
 * trả về cho bất kỳ ai có tên, mà tên thì nằm trong URL. Ảnh đơn thuốc là dữ
 * liệu sức khoẻ — chẩn đoán, tên thuốc, tên bác sĩ — nên nó phải đi qua một
 * route kiểm quyền, và đường dẫn phải không đoán được.
 *
 * Ba lời hứa ở trang Quy định bán thuốc kê đơn được giữ đúng ở đây:
 *  1. Không có URL công khai → route `/api/don-thuoc/[name]` đòi phiên dược sĩ.
 *  2. Chỉ JPG, PNG, PDF dưới 10 MB → kiểm bằng BYTE ĐẦU, không tin `file.type`.
 *  3. Xoá sau khi đơn hoàn tất → `purgeExpiredPrescriptions`.
 */

export const prescriptionsDir = join(process.cwd(), ".data", "prescriptions");
const accessLog = join(process.cwd(), ".data", "prescriptions-access.log");

/** Khớp `size_bytes <= 10485760` của lược đồ. */
export const prescriptionMaxBytes = 10_485_760;

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

/** Đuôi tệp đi qua URL — chỉ đúng dạng `saveOne` sinh ra, không nhận `../`. */
function safeKey(name: string): string {
  return /^[0-9a-f-]{36}\.(jpg|png|pdf)$/i.test(name) ? name : "";
}

export function prescriptionPath(name: string): string | undefined {
  const safe = safeKey(name);
  return safe ? join(prescriptionsDir, safe) : undefined;
}

export function prescriptionContentType(name: string): string | undefined {
  const safe = safeKey(name);
  return safe ? contentTypes[safe.split(".").pop()!.toLowerCase()] : undefined;
}

export function prescriptionUrl(name: string): string {
  return `/api/don-thuoc/${name}`;
}

export type SavedPrescription = {
  storageKey: string;
  mimeType: "image/jpeg" | "image/png" | "application/pdf";
  sizeBytes: number;
  /** Tên tệp gốc, để dược sĩ đối chiếu với thứ khách tưởng đã gửi. */
  fileName: string;
};

/** `undefined` khi không có tệp, sai loại, hoặc quá hạn mức. */
export async function savePrescription(file: File): Promise<SavedPrescription | undefined> {
  if (file.size === 0 || file.size > prescriptionMaxBytes) return undefined;

  const name = await saveOne(file, new Set(["jpg", "png", "pdf"]), prescriptionsDir);
  if (!name) return undefined;

  const mimeType = prescriptionContentType(name) as SavedPrescription["mimeType"];
  // Tên người gửi chỉ để hiển thị, nên cắt ngắn và bỏ đường dẫn: nó không bao
  // giờ chạm đĩa, nhưng vẫn là chuỗi người lạ gửi lên và sẽ hiện trong HTML.
  const base = file.name.split(/[\\/]/).pop() ?? "don-thuoc";
  return { storageKey: name, mimeType, sizeBytes: file.size, fileName: base.slice(0, 120) };
}

export async function removePrescription(storageKey: string) {
  const path = prescriptionPath(storageKey);
  if (path) await unlink(path).catch(() => {});
}

/**
 * Ghi nhật ký mỗi lần mở ảnh đơn — lời hứa ở trang tải đơn thuốc.
 *
 * Ghi nối thêm, không khoá tệp: một dòng log thiếu còn hơn một lần mở ảnh bị
 * chặn vì log hỏng. ponytail: log là tệp văn bản trên đĩa của tiến trình; nhiều
 * máy chủ thì đổi sang bảng `audit_log` trong lược đồ.
 */
export async function logPrescriptionAccess(username: string, storageKey: string) {
  try {
    await mkdir(prescriptionsDir, { recursive: true });
    await appendFile(
      accessLog,
      `${new Date().toISOString()}\t${username}\t${storageKey}\n`,
      "utf8",
    );
  } catch (err) {
    console.error("Không ghi được nhật ký truy cập đơn thuốc:", err);
  }
}

/**
 * Lý do một đơn thuốc quá hạn bị đóng. Không nằm trong `prescriptionRejectReasons`
 * vì đây không phải lựa chọn của dược sĩ — không ai bấm nút, hạn lưu tự đóng đơn.
 */
export const prescriptionExpiredReason =
  "Đơn thuốc quá hạn 30 ngày chưa được duyệt. Vui lòng gửi lại ảnh đơn mới để đặt thuốc.";

/**
 * Xoá tệp của những đơn đã quá `deleteAfter`. Trả về mã những dòng vừa được dọn
 * để người gọi xoá luôn `storageKey` trong kho delta.
 *
 * Chỉ xoá TỆP, không xoá dòng: dòng còn lại là nhật ký chuyên môn (ai duyệt, khi
 * nào, vì sao từ chối), và lời hứa với khách là ảnh bị xoá — không phải hồ sơ
 * biến mất. `fileName` giữ nguyên làm dấu vết kiểm toán.
 *
 * Đồng bộ (`unlinkSync`): gọi từ lúc render trang quản trị, nơi một vòng `await`
 * chỉ để xoá bốn tệp là thêm độ trễ cho mọi lượt mở trang.
 *
 * ponytail: chạy khi có người mở trang duyệt đơn, không có cron. Đủ cho một máy
 * chủ; máy chủ thật thì đây là job định kỳ — `delete_after` đã có index sẵn.
 */
export function purgeExpiredPrescriptions(
  rows: { orderCode: string; storageKey?: string; deleteAfter: string }[],
): string[] {
  const today = new Date().toISOString().slice(0, 10);
  const cleared: string[] = [];
  for (const row of rows) {
    if (!row.storageKey || row.deleteAfter >= today) continue;
    const path = prescriptionPath(row.storageKey);
    if (path) {
      try {
        unlinkSync(path);
      } catch {
        // Tệp đã mất từ lần chạy trước — không phải lỗi.
      }
    }
    cleared.push(row.orderCode);
  }
  return cleared;
}
