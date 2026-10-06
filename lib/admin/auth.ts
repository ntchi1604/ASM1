import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";
import { adminUsers, type AdminRole } from "@/lib/admin/users";

/**
 * Phiên đăng nhập của phần quản trị.
 *
 * Vì sao tự ký cookie thay vì kéo thư viện: bản mẫu chưa có cơ sở dữ liệu, mà mọi
 * thư viện xác thực đều cần một nơi lưu phiên. Ở đây chỉ cần một câu hỏi — "người
 * gửi yêu cầu này có phải dược sĩ đã đăng nhập không" — và trả lời được bằng một
 * cookie ký HMAC. Kéo thư viện về chỉ để gọi ba hàm của nó là thêm một phụ thuộc
 * phải cập nhật mãi về sau.
 *
 * ponytail: mật khẩu so bằng chuỗi thẳng, vì chúng nằm trong `adminUsers` ở mã
 * nguồn và tài khoản demo ai cũng đọc được. Có cơ sở dữ liệu thì thay bằng
 * `bcrypt.compare` — chỗ đổi là MỘT dòng trong `verifyPassword`, phần còn lại của
 * tệp này không phải sửa.
 *
 * Không có gì bí mật ở đây: khoá ký lấy từ biến môi trường, và khi không đặt thì
 * rơi về một giá trị mặc định ai cũng biết. Cookie giả được thì đăng nhập được vào
 * phần quản trị của BẢN MẪU — nơi không có dữ liệu thật nào. Đặt
 * `ADMIN_SESSION_SECRET` là bắt buộc trước khi chạy thật.
 */

const COOKIE = "medivia_admin";
const SECRET = process.env.ADMIN_SESSION_SECRET ?? "medivia-ban-mau-doi-khoa-nay";

/**
 * Nội dung cookie: tên đăng nhập + hạn. Không chứa vai trò — vai trò tra lại từ
 * `adminUsers` mỗi lần đọc, nên đổi vai trò trong mã là có hiệu lực ngay, không
 * phải chờ mọi cookie cũ hết hạn.
 */
function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/** Cookie `"<hạn>.<tên>"` kèm chữ ký, đủ để tự kiểm mà không cần bảng phiên. */
function serialize(username: string, expiresAt: number) {
  const payload = `${expiresAt}.${username}`;
  return `${payload}.${sign(payload)}`;
}

function parse(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const at = raw.lastIndexOf(".");
  if (at === -1) return undefined;

  const payload = raw.slice(0, at);
  const given = raw.slice(at + 1);
  const expected = sign(payload);

  // So sánh độ dài trước: `timingSafeEqual` ném lỗi khi hai đệm khác độ dài, và
  // một ngoại lệ ở đây làm sập trang quản trị thay vì chỉ từ chối đăng nhập.
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;

  const dot = payload.indexOf(".");
  const expiresAt = Number(payload.slice(0, dot));
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return undefined;

  return payload.slice(dot + 1);
}

export type Session = { username: string; name: string; role: AdminRole };

/** Phiên hiện tại, hoặc undefined. Đây là phép kiểm THẬT — proxy chỉ là lớp ngoài. */
export async function getSession(): Promise<Session | undefined> {
  const username = parse((await cookies()).get(COOKIE)?.value);
  if (!username) return undefined;

  const user = adminUsers.find((candidate) => candidate.username === username);
  if (!user) return undefined;

  return { username: user.username, name: user.name, role: user.role };
}

/**
 * Gọi ở đầu MỌI trang quản trị. Đây mới là chỗ chặn thật: proxy bỏ qua được bằng
 * cách gửi thẳng POST tới Server Action, còn hàm này thì không.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/dang-nhap");
  return session;
}

/**
 * Chặn theo vai trò. Duyệt đơn thuốc là việc của người có chứng chỉ hành nghề, nên
 * vai trò `ke-toan` không được đụng vào — và phép kiểm nằm ở đây chứ không ở giao
 * diện, vì giao diện chỉ ẩn nút, không chặn được yêu cầu gửi thẳng.
 */
export async function requireRole(...allowed: AdminRole[]): Promise<Session> {
  const session = await requireSession();
  if (!allowed.includes(session.role)) redirect("/admin?khong-du-quyen=1");
  return session;
}

export const sessionCookieName = COOKIE;

export function sessionCookie(username: string) {
  return {
    name: COOKIE,
    value: serialize(username, Date.now() + 8 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    // `secure` chỉ khi chạy HTTPS. Bật cứng thì cookie không được đặt khi phát
    // triển ở http://localhost, và người phát triển không đăng nhập được.
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60,
  };
}
