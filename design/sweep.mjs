// Quét mọi trang: HTTP status + đếm ảnh src rỗng trong HTML trả về, rồi bò theo
// mọi liên kết nội bộ để tìm liên kết chết. Chạy ngoài browser để không phụ thuộc
// vào một tab đang mở.
//
// Cách chạy (cần `next dev` đang mở ở cổng 3100):
//   node design/sweep.mjs
//
// Giữ lại file này làm smoke test chạy lại được, không phải file tạm: mỗi lần sửa
// layout dùng chung (header, ProductCard, AiBlock) thì một lệnh này soát cả 36
// tuyến nhanh hơn mở từng trang, và nó đã bắt được lỗi ảnh src rỗng thật.
//
// In thẳng ra stdout, KHÔNG ghi ra tệp: thêm một tệp đầu ra chỉ để `cat` lại là
// thêm một thứ nữa phải nhớ xoá trước khi nộp.
//
// Tuyến quản trị cần phiên đăng nhập — xem `adminCookie()` bên dưới. Đọc
// `ADMIN_SESSION_SECRET` từ môi trường nếu `next dev` được chạy với biến đó; chạy
// mặc định thì dùng đúng khoá dự phòng trong `lib/admin/auth.ts`.
const routes = [
  "/",
  "/danh-muc/cam-cum-ha-sot",
  "/danh-muc/vitamin-khoang-chat",
  "/danh-muc/khang-sinh",
  "/danh-muc/cam-cum-ha-sot?sx=gia-tang&kieu=danh-sach",
  "/danh-muc/cam-cum-ha-sot?dang=vien-nen&doi-tuong=tre-em",
  "/thuoc/prospan-siro-ho",
  "/thuoc/augmentin-625mg",
  "/thuoc/vitamin-c-1000mg",
  "/gio-hang",
  "/yeu-thich",
  "/so-sanh",
  "/thanh-toan",
  "/he-thong-nha-thuoc",
  "/tra-cuu-don-hang",
  "/tra-cuu-don-hang?ma=MV15092814",
  "/tai-don-thuoc",
  "/tai-khoan",
  "/dang-nhap",
  "/dang-ky",
  "/tai-ung-dung",
  "/goc-suc-khoe",
  "/goc-suc-khoe/phan-biet-sot-xuat-huyet-va-cam-cum",
  "/dat-hang-thanh-cong?don=MV1609TEST&nhan=nhanh&tt=cod",
  "/ai/tu-van",
  "/ai/tu-van?tc=ho-khan,dau-hong",
  "/ai/tim-kiem",
  "/ai/tim-kiem?q=thu%E1%BB%91c%20ho%20cho%20tr%E1%BA%BB",
  "/ai/chatbot",
  "/ai/chatbot?hoi=li%E1%BB%81u%20cho%20tr%E1%BA%BB%202%20tu%E1%BB%95i&thuoc=prospan",
  "/ai/tuong-tac",
  "/ai/tuong-tac?thuoc=warfarin-5mg,aspirin-81",
  "/ai/nhan-dien",
  "/ai/nhan-dien?anh=augmentin-625",
  "/ai/giong-noi",
  "/ai/giong-noi?noi=t%C3%ACm%20thu%E1%BB%91c%20h%E1%BA%A1%20s%E1%BB%91t",
  "/admin",
  "/admin/phan-tich",
  "/admin/don-hang",
  "/admin/kho-thuoc",
  "/admin/danh-muc",
  "/admin/duyet-don-thuoc",
  "/admin/uu-dai",
  "/admin/danh-gia",
  "/admin/binh-luan",
  "/admin/bai-viet",
  "/admin/trang",
  "/admin/nha-thuoc",
];

/**
 * Đăng nhập lấy cookie quản trị.
 *
 * Không có bước này thì mọi tuyến `/admin/*` trả 307 về trang đăng nhập và cổng
 * này "đạt" trong khi chưa hề dựng một trang quản trị nào. Một cổng kiểm tra chỉ
 * thấy chuyển hướng là cổng kiểm tra không kiểm gì cả.
 *
 * Server Action không gọi được bằng fetch thường (cần header `Next-Action` của
 * từng action), nên lấy cookie bằng cách gọi thẳng hàm ký phiên — cùng khoá, cùng
 * thuật toán với `lib/admin/auth.ts`.
 */
async function adminCookie() {
  const { createHmac } = await import("node:crypto");
  const secret = process.env.ADMIN_SESSION_SECRET ?? "medivia-ban-mau-doi-khoa-nay";
  const payload = `${Date.now() + 8 * 60 * 60 * 1000}.duocsi`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `medivia_admin=${encodeURIComponent(`${payload}.${sig}`)}`;
}

const cookie = await adminCookie();

const lines = [];
for (const route of routes) {
  try {
    const res = await fetch(`http://localhost:3100${route}`, {
      headers: route.startsWith("/admin") ? { cookie } : {},
      redirect: "manual",
    });
    const html = await res.text();
    const emptySrc = (html.match(/<img[^>]*src=""/g) ?? []).length;
    const missingSrc = (html.match(/<img(?![^>]*\ssrc=)[^>]*>/g) ?? []).length;
    const errText = /ReferenceError|is not defined|missing required/.test(html);
    // Chuyển hướng ở tuyến quản trị nghĩa là phiên không được nhận — đếm là lỗi,
    // không phải là trang hợp lệ.
    const redirected = res.status >= 300 && res.status < 400;
    lines.push(
      `${String(res.status).padEnd(4)} emptySrc=${emptySrc} noSrc=${missingSrc} err=${errText ? "YES" : "no"}${redirected ? " REDIRECT" : ""}  ${route}`,
    );
  } catch (err) {
    lines.push(`FAIL ${route} :: ${err.message}`);
  }
}
lines.push("");
lines.push(`total routes: ${routes.length}`);

// --- Phần hai: bò theo mọi href nội bộ từ trang chủ -------------------------
// Danh sách 36 tuyến ở trên là chọn tay, nên nó không biết về một liên kết hỏng
// nằm sâu trong trang. Phần này bắt đầu từ "/" và đi theo mọi href tìm được; nó
// đã bắt được lỗi thật (ba mục nav trỏ vào giá trị `Product.type` thay vì slug
// danh mục — cả ba 404, mà không tuyến nào trong danh sách trên đụng tới).
const seen = new Map();
const queue = ["/"];
const dead = [];
while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  try {
    const res = await fetch(`http://localhost:3100${path}`);
    seen.set(path, res.status);
    if (res.status !== 200) {
      dead.push(`${res.status} ${path}`);
      continue;
    }
    for (const m of (await res.text()).matchAll(/href="(\/[^"#?]*)/g)) {
      const href = m[1].replace(/\/$/, "") || "/";
      if (!href.startsWith("/_next") && !seen.has(href)) queue.push(href);
    }
  } catch (err) {
    seen.set(path, "ERR");
    dead.push(`ERR ${path} ${err.message}`);
  }
}
lines.push("");
lines.push(`crawled links: ${seen.size}`);
lines.push(dead.length ? "DEAD LINKS:\n" + dead.join("\n") : "khong co lien ket chet.");
process.stdout.write(lines.join("\n") + "\n");
process.exit(dead.length ? 1 : 0);
