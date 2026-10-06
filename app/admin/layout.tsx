import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * `app/admin` KHÔNG nằm trong nhóm route (shop) nên không nhận header/footer bán hàng.
 * Đây là chủ ý: trang quản trị không có ô tìm kiếm, giỏ hàng hay menu danh mục.
 *
 * `AdminShell` được gọi trong từng page thay vì ở đây, vì shell cần biết `activeHref`
 * để tô mục đang mở — layout không đọc được đường dẫn mà không chuyển sang client.
 */

export const metadata: Metadata = {
  // Không thêm "MediVia": layout gốc đã có template "%s · MediVia".
  title: "Quản trị",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
