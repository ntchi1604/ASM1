import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Máy này có package-lock.json lạc ở thư mục home, khiến Turbopack đoán sai
    // project root. Ghim root về đúng thư mục dự án.
    root: __dirname,
  },
};

export default nextConfig;
