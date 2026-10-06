/**
 * Kiểm tra cấu trúc tệp lược đồ trước khi có ai đó chạy nó trên PostgreSQL thật.
 *
 * Không thay được `psql` — không có máy chủ nào ở đây để chạy. Nhưng ba loại lỗi
 * hay gặp nhất khi viết tay một tệp SQL dài thì bắt được mà không cần máy chủ:
 * ngoặc đóng thiếu, khoá ngoại trỏ tới bảng không tồn tại, và hai ràng buộc trùng
 * tên trong cùng một bảng (PostgreSQL từ chối cả tệp vì lỗi này, và thông báo lỗi
 * chỉ nói tên bảng nên rất khó dò).
 *
 * Chạy: node design/check-schema.mjs
 */
import { readFileSync } from "node:fs";

const sql = readFileSync(new URL("./medivia-schema.sql", import.meta.url), "utf8");

// Bỏ chú thích dòng trước khi đếm ngoặc — chú thích có chứa ngoặc trong ví dụ.
const code = sql.replace(/--[^\n]*/g, "");

const problems = [];

// 1. Ngoặc tròn cân bằng trong toàn tệp.
let depth = 0;
for (const ch of code) {
  if (ch === "(") depth++;
  else if (ch === ")") depth--;
  if (depth < 0) {
    problems.push("Ngoặc đóng thừa trước khi mở.");
    break;
  }
}
if (depth > 0) problems.push(`Thiếu ${depth} ngoặc đóng.`);

// 2. Bảng và view có tồn tại.
const tables = new Set(
  [...code.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)/g)].map((m) => m[1]),
);
const views = new Set(
  [...code.matchAll(/CREATE(?: OR REPLACE)? VIEW\s+(\w+)/g)].map((m) => m[1]),
);

// 3. Mọi REFERENCES phải trỏ tới bảng có thật trong cùng tệp.
for (const [, target] of code.matchAll(/REFERENCES\s+(\w+)/g)) {
  if (!tables.has(target)) problems.push(`REFERENCES tới bảng không có: ${target}`);
}

// 4. Hai ràng buộc cùng tên trong một bảng là lỗi làm cả tệp không chạy được.
// Cắt tệp theo từng CREATE TABLE để tên ở bảng này không lẫn sang bảng khác.
for (const block of code.split(/CREATE TABLE/).slice(1)) {
  const name = block.match(/^\s+(\w+)/)?.[1];
  const names = [...block.matchAll(/CONSTRAINT\s+(\w+)/g)].map((m) => m[1]);
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  for (const dupe of new Set(dupes)) {
    problems.push(`Ràng buộc trùng tên trong bảng ${name}: ${dupe}`);
  }
}

// 5. View phải đọc từ bảng có thật — view trỏ sai bảng chỉ lộ ra lúc chạy.
for (const [, body] of code.matchAll(/CREATE(?: OR REPLACE)? VIEW\s+\w+\s+AS([\s\S]*?);/g)) {
  for (const [, from] of body.matchAll(/\bFROM\s+(\w+)/g)) {
    if (!tables.has(from) && !views.has(from)) {
      problems.push(`View đọc từ bảng không có: ${from}`);
    }
  }
}

// 6. Số bảng phải khớp con số đã ghi trong tài liệu — lệch nghĩa là một trong
// hai chỗ đã sửa mà chỗ kia thì chưa.
//
// Đọc từ báo cáo dự án, KHÔNG phải một tệp thiết kế riêng: bản thiết kế từng nằm
// ở tệp riêng và đã được gộp vào báo cáo, nên tệp cũ không còn để đọc.
const report = readFileSync(new URL("../BAO-CAO-DU-AN.md", import.meta.url), "utf8");
const claim = report.match(/\*\*(\d+) bảng \+ (\d+) view\*\*/);
const documented = Number(claim?.[1] ?? 0);
const documentedViews = Number(claim?.[2] ?? 0);
if (documentedViews !== views.size) {
  problems.push(`Tài liệu ghi ${documentedViews} view, lược đồ có ${views.size}.`);
}
if (documented !== tables.size) {
  problems.push(`Tài liệu ghi ${documented} bảng, lược đồ có ${tables.size}.`);
}

const total = tables.size + views.size;
if (problems.length > 0) {
  console.log(`LỖI (${problems.length}):`);
  for (const problem of problems) console.log("  - " + problem);
  process.exit(1);
}

console.log(
  `OK — ${tables.size} bảng, ${views.size} view, ${total} đối tượng. Khớp tài liệu.`,
);