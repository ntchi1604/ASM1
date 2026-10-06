// Cổng kiểm tầng AI. Giữ lại chứ không phải file tạm: sweep.mjs chỉ hỏi "trang trả
// 200 chưa", còn cổng này hỏi "AI có trả nội dung thật không, và có dừng lại đúng
// lúc không" — hai câu khác nhau, và câu thứ hai đã bắt được một lỗi thật (xem
// khối "cờ đỏ" bên dưới).
//
// Cách chạy (cần `next dev` ở cổng 3100):
//   node design/check-ai.mjs
//
// Hai điều phải nhớ khi sửa tệp này, cả hai đều là bài học trả giá:
//
// 1. Lấy tham số từ CHÍNH giao diện (đọc nút ví dụ trong HTML rồi bấm theo), đừng
//    tự bịa. Hai lần đầu tôi báo "thiếu tính năng": lần một truyền mã triệu chứng
//    vào `?tc=` trong khi nó nhận câu mô tả, lần hai truyền id sản phẩm vào
//    `?thuoc=` trong khi nó nhận TÊN thuốc. Trang vẫn đúng, que dò của tôi sai.
//
// 2. Nội dung AI nằm trong Suspense nên stream xuống CUỐI trang, sau cả footer —
//    cắt lấy phần sau "© 2026" mới thấy; phần đầu trang chỉ có khung chờ.
import { createHmac } from "node:crypto";
import { matchesAny } from "../lib/ai/engine.ts";

const BASE = "http://localhost:3100";

/**
 * Tuyến quản trị cần phiên đăng nhập. Không có cookie thì `/admin/phan-tich` trả
 * về trang đăng nhập, và cổng này báo "thiếu AI" — trong khi lỗi thật là cổng
 * không đăng nhập được. Cùng khoá và thuật toán với `lib/admin/auth.ts`.
 */
const SECRET = process.env.ADMIN_SESSION_SECRET ?? "medivia-ban-mau-doi-khoa-nay";
const payload = `${Date.now() + 8 * 60 * 60 * 1000}.duocsi`;
const COOKIE = `medivia_admin=${encodeURIComponent(
  `${payload}.${createHmac("sha256", SECRET).update(payload).digest("base64url")}`,
)}`;

const get = (route) =>
  fetch(BASE + route, { headers: route.startsWith("/admin") ? { cookie: COOKIE } : {} });

let bad = 0;
const fail = (msg) => {
  bad++;
  console.log(`LOI  ${msg}`);
};

// ---------------------------------------------------------------- 1. Bộ khớp từ
// Khớp theo biên từ, không phải chuỗi con. Ca "không muốn buồn ngủ" là lý do tồn
// tại của cả hàm: bản cũ dùng `includes` nên từ khoá "ho" khớp bên trong "không".
const matchCases = [
  ["Tôi bị khó thở và đau ngực", ["dau nguc", "kho tho"], true],
  ["tôi không muốn buồn ngủ", ["ho"], false],
  ["thuốc ho cho trẻ", ["ho"], true],
  ["Tôi bị đau bụng âm ỉ", ["dau bung"], true],
  ["đau đầu và nghẹt mũi", ["dau dau"], true],
  ["dưới 100k", ["duoi"], true],
  ["người cao tuổi", ["nguoi cao tuoi"], true],
  ["thuốc không gây buồn ngủ", ["khong gay buon ngu"], true],
  ["ho khan về đêm", ["ho", "khan tieng"], true],
  // "cũng có" chuẩn hoá thành "cung co" — khớp là ĐÚNG. Ghi lại vì chính vì thế
  // mà "cung co" không được dùng làm từ khoá cờ đỏ: cụm này người Việt gõ hằng
  // ngày, không phải dấu hiệu nguy hiểm.
  ["tôi cũng có triệu chứng này", ["cung co"], true],
];
for (const [q, kw, want] of matchCases) {
  if (matchesAny(q, kw) !== want) fail(`khớp từ :: ${JSON.stringify(q)} [${kw}]`);
}

// ------------------------------------------------------------- 2. Chín tính năng
const strip = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");

const body = async (route) => strip(await get(route).then((r) => r.text()));

const firstExample = async (route) => {
  const html = await get(route).then((r) => r.text());
  const href = html.match(/href="(\/ai\/[^"]*\?[^"]*)"/)?.[1];
  return href ? href.replace(/&amp;/g, "&") : null;
};

const features = [
  ["1 Tư vấn theo triệu chứng", await firstExample("/ai/tu-van"), ["Gợi ý nhóm thuốc"]],
  ["2 Tìm thuốc bằng AI", await firstExample("/ai/tim-kiem"), ["Thêm vào giỏ"]],
  ["3 Chatbot dược sĩ", await firstExample("/ai/chatbot"), ["Dược sĩ"]],
  ["4 Gợi ý sản phẩm", "/", ["AI gợi ý"]],
  ["5 Nhận diện bằng ảnh", "/ai/nhan-dien?anh=anh-mo-thieu-sang.jpg", ["Không dùng kết quả này để uống thuốc"]],
  ["6 Tóm tắt thông tin thuốc", "/thuoc/augmentin-625mg", ["Tóm tắt"]],
  ["7 Cảnh báo tương tác", "/ai/tuong-tac?thuoc=Warfarin,Aspirin", ["Nghiêm trọng"]],
  ["8 Phân tích doanh số", "/admin/phan-tich", ["AI"]],
  ["9 Tìm bằng giọng nói", await firstExample("/ai/giong-noi"), ["Thêm vào giỏ"]],
];
for (const [name, route, needles] of features) {
  if (!route) {
    fail(`${name} :: khong tim thay nut vi du`);
    continue;
  }
  const text = await body(route);
  const missing = needles.filter((n) => !text.includes(n));
  if (missing.length) fail(`${name} ${route} :: thiếu ${missing.join(", ")}`);
}

// ------------------------------------------------------- 3. Cờ đỏ, kiểm HAI chiều
// Chỉ kiểm chiều chặn thì một hàm chặn tất cả cũng "đạt". Phải kiểm cả chiều còn
// lại: câu thường vẫn phải ra danh sách thuốc.
const mustStop = [
  "đau ngực dữ dội, khó thở, vã mồ hôi",
  "tức ngực và khó thở khi nằm",
  "chồng tôi bị ngất, gọi mãi không tỉnh",
  "co giật, lơ mơ không nói rõ",
  "nôn ra máu, đi ngoài phân đen",
  "chảy máu không cầm được",
];
const mustSuggest = [
  "Tôi bị sốt 38.5 độ, đau đầu và nghẹt mũi hai ngày nay",
  "Đau bụng âm ỉ sau khi ăn, kèm đầy hơi và khó tiêu",
];
const consult = async (q) => body(`/ai/tu-van?tc=${encodeURIComponent(q)}`);
for (const q of mustStop) {
  const t = await consult(q);
  if (t.includes("Thêm vào giỏ") || !/115|khám ngay|cấp cứu/i.test(t)) {
    fail(`cờ đỏ không chặn :: ${q}`);
  }
}
for (const q of mustSuggest) {
  if (!(await consult(q)).includes("Thêm vào giỏ")) fail(`cờ đỏ chặn nhầm :: ${q}`);
}

// ------------------------------------- 4. Giỏ hàng đối soát tương tác ở tầng giỏ
const cart = await body("/gio-hang");
if (!/tương tác/i.test(cart)) fail("giỏ hàng không đối soát tương tác");

console.log(
  bad
    ? `\n${bad} mục cần xem lại.`
    : `\n${matchCases.length} ca khớp từ, 9/9 tính năng, ${mustStop.length} ca cờ đỏ chặn + ${mustSuggest.length} ca thường vẫn gợi ý, giỏ hàng đối soát. Tất cả OK.`,
);
process.exit(bad ? 1 : 0);
