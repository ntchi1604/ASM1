#!/usr/bin/env bash
# Tải 12 màn hình Stitch về design/stitch-html/ để tham chiếu layout khi port sang Next.js.
# Các file này KHÔNG được import vào build — chỉ đọc để lấy cấu trúc, thứ tự section, nội dung tiếng Việt.
#
# Nguồn URL: design/stitch-urls.txt, mỗi dòng "<slug> <downloadUrl>".
# URL là chuỗi base64 — luôn copy nguyên vẹn từ list_screens, không bao giờ cắt/ghép.

set -uo pipefail

cd "$(dirname "$0")"
mkdir -p stitch-html

ok=0
fail=0

while read -r slug url; do
  [ -z "${slug:-}" ] && continue
  case "$slug" in \#*) continue ;; esac

  out="stitch-html/$slug.html"
  if curl -sfL --max-time 120 -o "$out" "$url"; then
    size=$(wc -c < "$out" | tr -d ' ')
    if [ "$size" -lt 1000 ]; then
      echo "LỖI  $slug — chỉ $size byte, có thể URL đã hết hạn"
      fail=$((fail + 1))
    else
      echo "ok   $slug — $size byte"
      ok=$((ok + 1))
    fi
  else
    echo "LỖI  $slug — curl thất bại"
    fail=$((fail + 1))
  fi
done < stitch-urls.txt

echo "----"
echo "Tải được $ok file, lỗi $fail file."
[ "$fail" -eq 0 ] || exit 1
