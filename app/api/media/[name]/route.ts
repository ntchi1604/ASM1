import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { contentTypeOf, uploadsDir, safeName } from "@/lib/media";

/**
 * Phục vụ ảnh/video tải lên từ `.data/uploads` — tệp đính kèm đánh giá và ảnh
 * mặt hàng do quản trị tải lên.
 *
 * Vì sao có route này thay vì đặt tệp vào `public/`: tệp tải lên sinh ra
 * LÚC CHẠY, còn `public/` chỉ phục vụ nội dung có từ lúc build. Chép tệp vào
 * `public/` trong một tiến trình đang chạy thì bản deploy đóng gói sẵn không
 * thấy chúng, và trên nền tảng chỉ đọc thì còn không ghi được.
 *
 * Không kiểm quyền đọc: đánh giá và ảnh mặt hàng ai cũng xem được, và tên tệp
 * là UUID ngẫu nhiên. Tên đi qua URL nên phải khớp đúng dạng `safeName` sinh ra
 * trước khi chạm đĩa — đó là hàng rào duy nhất chống `../`.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/media/[name]">,
) {
  const { name } = await ctx.params;
  const safe = safeName(name);
  const type = safe ? contentTypeOf(safe) : undefined;
  if (!safe || !type) return new Response("Not found", { status: 404 });

  try {
    const body = await readFile(join(uploadsDir, safe));
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": type,
        // Tên tệp không đổi nội dung, nên cache vĩnh viễn là an toàn. Thay ảnh
        // mặt hàng sinh tên mới, nên không có ảnh cũ nào bị giữ lại ở đây.
        "Cache-Control": "public, max-age=31536000, immutable",
        // Tệp do người dùng tải lên: cấm trình duyệt đoán lại loại và chạy mã.
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
