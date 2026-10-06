"""Trích văn bản từ file HTML của Stitch để đọc nhanh nội dung màn hình.

Dùng: python design/text.py <ten-file.html>
Ghi kết quả ra design/stitch-text/<ten-file>.txt (UTF-8) vì console Windows
dùng cp1252, không in được tiếng Việt.
"""

import html
import os
import re
import sys

here = os.path.dirname(os.path.abspath(__file__))
name = sys.argv[1]
src_path = os.path.join(here, "stitch-html", name)
with open(src_path, encoding="utf-8") as f:
    src = f.read()

src = re.sub(r"<script.*?</script>", "", src, flags=re.S)
src = re.sub(r"<style.*?</style>", "", src, flags=re.S)
src = re.sub(r"<svg.*?</svg>", " [icon] ", src, flags=re.S)
src = re.sub(r"<(?:div|section|header|footer|nav|main|ul|ol|li|tr|table|h[1-6]|p|br|button|a|aside)\b[^>]*>", "\n", src)
src = re.sub(r"<[^>]+>", " ", src)

lines = [html.unescape(line).strip() for line in src.split("\n")]
lines = [re.sub(r"\s+", " ", line) for line in lines if line.strip()]

out_dir = os.path.join(here, "stitch-text")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, name.replace(".html", ".txt"))
with open(out_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print(out_path, len(lines), "dòng")
