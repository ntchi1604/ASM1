import { NextResponse, type NextRequest } from "next/server";

/**
 * Chặn sớm đường vào phần quản trị. Next 16 gọi tệp này là `proxy` (trước là
 * `middleware`) — cùng chức năng, đổi tên cho đúng việc nó làm.
 *
 * ĐÂY KHÔNG PHẢI LỚP BẢO VỆ. Proxy chỉ đọc cookie để biết có chữ ký hay không;
 * nó không kiểm chữ ký, không tra tài khoản, và không chạy cho Server Action. Lớp
 * chặn thật là `requireSession()` trong `lib/admin/auth.ts`, gọi ở đầu mỗi trang
 * và mỗi action.
 *
 * Vì sao vẫn để proxy: không có nó thì người chưa đăng nhập vào `/admin/kho-thuoc`
 * sẽ thấy trang dựng xong rồi mới bị đá sang trang đăng nhập — chớp một cái nội
 * dung quản trị. Chỉ để tránh cái chớp đó.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/dang-nhap") return NextResponse.next();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!request.cookies.get("medivia_admin")?.value) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dang-nhap";
      // Giữ đích đến để đăng nhập xong quay lại đúng chỗ vừa bấm.
      url.search = `?tiep=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
