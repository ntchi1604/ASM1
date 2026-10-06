import type { ReactNode } from "react";
import Link from "next/link";
import {
  ChartColumn,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  Pill,
  ShieldCheck,
  FileText,
  Percent,
  Store,
  SlidersHorizontal,
} from "@/lib/icons";
import { Logo } from "@/components/layout/Logo";
import { requireSession } from "@/lib/admin/auth";
import { changedCounts } from "@/lib/admin/db";
import { roleLabel } from "@/lib/admin/users";
import { logout } from "@/lib/admin/actions";

/**
 * Khung trang quản trị. CỐ Ý khác hẳn khung trang bán hàng: không có ô tìm kiếm,
 * không có giỏ hàng, nền tối ở thanh bên.
 *
 * Lý do khác biệt này là chủ ý, không phải thiếu đồng bộ: người dùng phải nhìn một
 * cái là biết mình đang ở phần quản trị nội bộ, không phải trang khách hàng thấy.
 * Nhưng token màu, bo góc, thang chữ vẫn dùng chung với toàn site — nên nó khác về
 * bố cục, không khác về ngôn ngữ thiết kế.
 *
 * `requireSession()` gọi NGAY TRONG ĐÂY chứ không ở từng trang: mọi trang quản trị
 * đều đi qua khung này, nên đặt ở đây thì không có trang nào quên kiểm. Proxy chỉ
 * là lớp ngoài đọc cookie; đây mới là chỗ tra tài khoản thật.
 */

const adminNav = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/phan-tich", label: "Phân tích doanh số", icon: ChartColumn },
  { href: "/admin/don-hang", label: "Đơn hàng", icon: Package },
  { href: "/admin/kho-thuoc", label: "Kho thuốc", icon: Pill },
  { href: "/admin/duyet-don-thuoc", label: "Duyệt đơn thuốc", icon: ShieldCheck },
  { href: "/admin/uu-dai", label: "Mã ưu đãi", icon: Percent },
  { href: "/admin/bai-viet", label: "Bài viết", icon: FileText },
  { href: "/admin/trang", label: "Trang chữ", icon: SlidersHorizontal },
  { href: "/admin/nha-thuoc", label: "Nhà thuốc", icon: Store },
];

export async function AdminShell({
  children,
  activeHref,
}: {
  children: ReactNode;
  activeHref: string;
}) {
  const session = await requireSession();
  const changed = changedCounts();
  const totalChanges = changed.updated + changed.added + changed.removed;

  return (
    <div className="min-h-screen bg-page lg:flex">
      <aside className="border-b border-hairline bg-ink lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-4 lg:block">
          {/* Logo tự render <Link> bên trong — không bọc thêm Link, sẽ lồng thẻ <a>. */}
          <Logo tone="white" />
          <p className="mt-0 text-label-sm text-white/60 lg:mt-2">Quản trị nội bộ</p>
        </div>

        {/* Người đang đăng nhập. Hiện ở mobile thay vì nằm dưới thanh bên. */}
        <div className="border-y border-white/10 px-4 py-3 lg:hidden">
          <p className="text-label-sm text-white/80">{session.name}</p>
          <p className="text-label-sm text-white/50">{roleLabel[session.role]}</p>
        </div>

        <nav aria-label="Điều hướng quản trị" className="px-2 py-4">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === activeHref;

              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`focus-ring flex items-center gap-2.5 rounded-card px-3 py-2.5 text-label-md transition-colors ${
                      isActive
                        ? "bg-white/12 text-white"
                        : "text-white/70 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <Icon size={18} aria-hidden />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden border-t border-white/10 px-4 py-4 lg:block">
          <p className="text-label-sm text-white/50">{roleLabel[session.role]}</p>
          <p className="mt-1 text-label-md text-white/80">{session.name}</p>

          {/*
            Số thay đổi chưa nằm trong mã nguồn. Hiện ra vì bản mẫu lưu dữ liệu quản
            trị ở tệp riêng: không nói thì người sau clone mã về, không thấy gì thay
            đổi, và tưởng các màn hình sửa kia không có tác dụng.
          */}
          {totalChanges > 0 ? (
            <p className="mt-2 text-label-sm text-white/50">
              {totalChanges} thay đổi chưa vào mã
            </p>
          ) : null}

          <div className="mt-3 flex flex-col items-start gap-2">
            <Link
              href="/"
              className="focus-ring inline-flex items-center gap-1.5 rounded-chip text-label-sm text-white/70 hover:text-white"
            >
              Về trang bán hàng
              <ExternalLink size={14} aria-hidden />
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="focus-ring inline-flex items-center gap-1.5 rounded-chip text-label-sm text-white/70 hover:text-white"
              >
                <LogOut size={14} aria-hidden />
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        {/* Đăng xuất ở mobile — thanh bên thu gọn nên khối dưới bị ẩn. */}
        <div className="mb-4 flex justify-end lg:hidden">
          <form action={logout}>
            <button
              type="submit"
              className="focus-ring inline-flex items-center gap-1.5 rounded-chip text-label-sm text-ink-muted hover:text-ink"
            >
              <LogOut size={14} aria-hidden />
              Đăng xuất
            </button>
          </form>
        </div>
        {children}
      </main>
    </div>
  );
}
