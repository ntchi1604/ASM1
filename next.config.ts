import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Máy này có package-lock.json lạc ở thư mục home, khiến Turbopack đoán sai
    // project root. Ghim root về đúng thư mục dự án.
    root: __dirname,
  },
  experimental: {
    serverActions: {
      // Mặc định 1 MB. Đánh giá nhận tối đa 3 ảnh × 2 MB và 1 video × 5 MB, cộng
      // phần bao của multipart nên trần 12 MB. Giới hạn thật vẫn nằm trong
      // `saveReviewMedia` — đây chỉ là ngưỡng chặn request trước khi nó được đọc.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
