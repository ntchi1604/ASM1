import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Be_Vietnam_Pro, Inter } from "next/font/google";
import { db } from "@/lib/admin/db";
import "./globals.css";

// Subset 'vietnamese' là bắt buộc: thiếu nó thì dấu xếp tầng sẽ fallback
// sang font hệ thống và gây nhảy layout.
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MediVia — Nhà thuốc trực tuyến có dược sĩ và AI đồng hành",
    template: "%s · MediVia",
  },
  description:
    "Mua thuốc trực tuyến với tư vấn của dược sĩ và trợ lý AI: tra cứu triệu chứng, kiểm tra tương tác thuốc, nhận diện thuốc bằng ảnh.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  /*
    Áp phần dữ liệu quản trị đã sửa, NGAY Ở GỐC.

    `db()` nạp tệp delta rồi sửa thẳng vào các mảng dữ liệu dùng chung. Không gọi
    ở đây thì nó chỉ chạy khi có ai đó mở một trang quản trị — nghĩa là sau khi
    khởi động lại máy chủ, khách xem trang sản phẩm vẫn thấy giá CŨ cho tới khi
    một quản trị viên tình cờ mở `/admin`. Lỗi đó chỉ hiện sau khi restart, tức là
    đúng lúc không ai đang nhìn.

    Gọi ở layout gốc vì mọi tuyến đều đi qua đây, kể cả trang quản trị.
  */
  db();

  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
