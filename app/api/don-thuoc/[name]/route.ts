import { readFile } from "node:fs/promises";
import { getSession } from "@/lib/admin/auth";
import { canApprovePrescriptions } from "@/lib/admin/users";
import {
  logPrescriptionAccess,
  prescriptionContentType,
  prescriptionPath,
} from "@/lib/prescriptions";

/**
 * Xem ảnh đơn thuốc — chỉ dược sĩ.
 *
 * Vì sao không để tệp trong `.data/uploads` cạnh ảnh đánh giá: `/api/media/[name]`
 * phục vụ công khai cho bất kỳ ai có tên tệp, và tên tệp nằm trong URL nên nó đi
 * vào lịch sử trình duyệt, log proxy, tiêu đề `Referer`. Ảnh đơn thuốc là dữ liệu
 * sức khoẻ của một người cụ thể — nó phải đi qua một chỗ kiểm quyền.
 *
 * Trả 404 chứ không chuyển hướng: `requireRole` gọi `redirect()`, mà một câu trả
 * lời 307 ở đây trở thành "trang này tồn tại, chỉ là bạn chưa đăng nhập" — đúng
 * thông tin không nên nói cho người đang dò. 404 thì không phân biệt được với
 * "tên tệp sai", và tên tệp là UUID ngẫu nhiên nên cũng không đoán được.
 *
 * `no-store` chứ không `immutable` như `/api/media`: cùng một URL, nhưng quyền
 * đọc có thể bị thu hồi, và một bản sao nằm trong bộ nhớ đệm của proxy thì không
 * có cách nào gọi lại.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/don-thuoc/[name]">) {
  const session = await getSession();
  if (!session || !canApprovePrescriptions(session.role)) {
    return new Response("Not found", { status: 404 });
  }

  const { name } = await ctx.params;
  const path = prescriptionPath(name);
  const type = path ? prescriptionContentType(name) : undefined;
  if (!path || !type) return new Response("Not found", { status: 404 });

  try {
    const body = await readFile(path);
    await logPrescriptionAccess(session.username, name);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, no-store",
        // Tệp do người lạ tải lên: cấm trình duyệt đoán lại loại rồi chạy mã.
        "X-Content-Type-Options": "nosniff",
        // PDF mở thẳng trên tab mới: khoá mọi thứ chạy được bên trong tệp.
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
