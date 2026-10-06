/**
 * Kiểm tra khối "Khách mua nhóm này thường mua thêm" trên cả 12 trang danh mục.
 *
 * Cách chạy (cần `next dev` đang mở ở cổng 3100):
 *   node design/check-combos.mjs && cat design/_combos.txt
 *
 * Chạy trong Node chứ không trong tab browser vì `fetch` từ browser pane bị chặn
 * cross-origin. Xem thêm design/sweep.mjs.
 *
 * Đếm bằng đúng câu lý do đã viết trong lib/data/bought-together.ts, không đếm
 * bằng class CSS: `text-label-sm text-ai-text` còn được AiCategoryHint và vài chỗ
 * khác dùng, nên đếm class ra 9 thay vì 4 và không nói được điều gì về khối này.
 */
const BASE = "http://localhost:3100";

/** Câu lý do mong đợi theo từng danh mục, khớp categoryCombos. */
const expected = {
  "cam-cum-ha-sot": [
    "Bù nước và điện giải khi sốt cao",
    "Rửa mũi, làm sạch dịch khi ngạt",
    "Dịu cổ khi cảm kèm đau họng",
    "Tăng đề kháng trong đợt cảm",
  ],
  "ho-hen-suyen": [
    "Rửa mũi để giảm ho do dịch mũi sau",
    "Hạ sốt nếu ho kèm sốt",
    "Tăng đề kháng khi hô hấp yếu",
    "Bù vitamin nhóm B khi mệt kéo dài",
  ],
  "khang-sinh": [
    "Cân bằng lợi khuẩn khi dùng kháng sinh",
    "Bù nước nếu bị tiêu chảy do thuốc",
    "Hạ sốt trong đợt nhiễm khuẩn",
    "Hỗ trợ đề kháng sau đợt điều trị",
  ],
  "vitamin-khoang-chat": [
    "Hỗ trợ hấp thu khi đường ruột kém",
    "Bảo vệ họng khi trở lạnh",
    "Vệ sinh mũi hằng ngày",
    "Bù điện giải sau khi vận động",
  ],
  "tim-mach": [
    "Hỗ trợ mỡ máu, dùng dài ngày",
    "Bù vitamin nhóm B cho người lớn tuổi",
    "Hỗ trợ thành mạch",
    "Bù điện giải khi dùng thuốc lợi tiểu",
  ],
  "giam-dau-khang-viem": [
    "Giảm đau, hạ sốt khi cần tránh kháng viêm",
    "Bảo vệ đường ruột khi dùng kháng viêm",
    "Hỗ trợ khớp khi đau kéo dài",
    "Bù vitamin khi đau mỏi dài ngày",
  ],
  "tieu-hoa": [
    "Hạ sốt khi tiêu chảy kèm sốt",
    "Bù vitamin khi ăn uống kém",
    "Tăng đề kháng khi đường ruột yếu",
    "Bổ sung khi hấp thu kém dài ngày",
  ],
  "cham-soc-ca-nhan": [
    "Bảo vệ họng khi thời tiết đổi",
    "Tăng đề kháng hằng ngày",
    "Bù vitamin cho người hay mệt",
    "Cân bằng lợi khuẩn đường ruột",
  ],
};

const emptyCategories = ["da-lieu", "me-va-be", "thiet-bi-y-te", "mat"];
const slugs = [...Object.keys(expected), ...emptyCategories];

/** Tên các thuốc kê đơn — tuyệt đối không được xuất hiện trong khối gợi ý. */
const rxNames = ["Augmentin", "Warfarin", "Tamiflu"];

const lines = [];
let bad = 0;

for (const slug of slugs) {
  const url = `${BASE}/danh-muc/${slug}`;
  let res, html;
  try {
    res = await fetch(url);
    html = await res.text();
  } catch (err) {
    lines.push(`${slug.padEnd(22)} FETCH FAIL ${err.message}`);
    bad++;
    continue;
  }

  const shouldHave = Boolean(expected[slug]);
  const hasBlock = html.includes("Khách mua nhóm này thường mua thêm");

  const problems = [];
  if (res.status !== 200) problems.push(`status ${res.status}`);
  if (hasBlock !== shouldHave) problems.push(hasBlock ? "co block du danh muc rong" : "THIEU block");
  if ((html.match(/<img[^>]*src=""/g) ?? []).length > 0) problems.push("img src rong");
  if (/ReferenceError|is not defined|missing required/.test(html)) problems.push("loi runtime");

  let found = 0;
  if (shouldHave) {
    /*
      Bó phần HTML đúng bằng thẻ <section> của AiBlock, KHÔNG dùng
      html.slice(start): Next nhúng toàn bộ RSC flight payload vào các thẻ <script>
      ở cuối tài liệu, nên slice hở đuôi sẽ ăn luôn dữ liệu cả trang và báo "có
      thuốc kê đơn trong khối" chỉ vì Augmentin nằm ở lưới sản phẩm phía trên.
    */
    const start = html.indexOf("Khách mua nhóm này thường mua thêm");
    const end = start >= 0 ? html.indexOf("</section>", start) : -1;
    const block = start >= 0 && end >= 0 ? html.slice(start, end) : "";
    if (!block) problems.push("khong tach duoc khoi");

    for (const reason of expected[slug]) {
      if (block.includes(reason)) found++;
      else problems.push(`thieu ly do "${reason}"`);
    }
    for (const name of rxNames) {
      if (block.includes(name)) problems.push(`CO THUOC KE DON: ${name}`);
    }
    if (block.includes("Cần đơn bác sĩ")) problems.push("co nut Can don bac si");
  }

  lines.push(
    `${slug.padEnd(22)} ${res.status} block=${hasBlock ? "YES" : "no "} lyDo=${shouldHave ? `${found}/4` : "-"} ${problems.length ? "!! " + problems.join("; ") : "OK"}`,
  );
  if (problems.length) bad++;
}

const out = lines.join("\n") + `\n\nKET QUA: ${bad === 0 ? "TAT CA OK (8 danh muc co block, 4 danh muc rong bo qua)" : bad + " trang co van de"}\n`;
const fs = await import("node:fs");
fs.writeFileSync("design/_combos.txt", out, "utf8");
