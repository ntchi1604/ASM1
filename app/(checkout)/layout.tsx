import type { ReactNode } from "react";
import { Headset } from "@/lib/icons";
import { Logo } from "@/components/layout/Logo";
import { site } from "@/lib/data/site";

/**
 * Layout riêng cho bước thanh toán: KHÔNG có thanh tìm kiếm, menu danh mục hay
 * footer đầy đủ.
 *
 * Lý do tách khỏi layout bán hàng: ở bước này người dùng chỉ còn một việc phải
 * làm. Mỗi liên kết thừa là một cách để họ rời trang trước khi đặt hàng. Số
 * tổng đài thì giữ lại, vì đó là thứ người ta cần đúng lúc đang lăn tăn.
 */
export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="border-b border-hairline bg-card">
        <div className="container-medivia flex h-16 items-center justify-between gap-4">
          <Logo />

          <a
            href={`tel:${site.hotline.replace(/\s/g, "")}`}
            className="focus-ring flex items-center gap-2 rounded-card px-2 py-1 text-body-sm text-ink-muted transition-colors hover:text-trust-text"
          >
            <Headset size={18} className="text-trust-text" aria-hidden />
            <span>
              Cần hỗ trợ?{" "}
              <span className="text-label-md text-ink">{site.hotline}</span>
            </span>
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-hairline bg-card py-4">
        <p className="container-medivia text-body-sm text-ink-subtle">
          MediVia · Giấy phép kinh doanh dược số {site.licenseNumber} · Người chịu
          trách nhiệm chuyên môn: {site.professionalManager}
        </p>
      </footer>
    </div>
  );
}
