import type { ReactNode } from "react";
import Link from "next/link";
import {
  ChartColumn,
  Cross,
  ExternalLink,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package,
  Pill,
  Search,
  ShieldCheck,
  FileText,
  Percent,
  MessageCircle,
  Store,
  SlidersHorizontal,
  Star,
  User,
} from "@/lib/icons";
import { requireSession } from "@/lib/admin/auth";
import { changedCounts } from "@/lib/admin/db";
import { roleLabel } from "@/lib/admin/users";
import { logout } from "@/lib/admin/actions";

/**
 * Khung trang quản trị. CỐ Ý khác hẳn khung trang bán hàng: không có giỏ hàng,
 * thanh bên là danh sách phẳng một cột. Tìm kiếm nằm ở mục riêng chứ không phải
 * ô trên thanh trên cùng — một ô ở đây chỉ tìm được trong trang đang mở.
 *
 * Thanh bên nền trắng, mục đang mở đánh dấu bằng vạch teal 4px bên trái —
 * giống bản Stitch. Nền tối ở đây từng có tác dụng tách phần quản trị khỏi
 * trang khách hàng, nhưng viền teal + nhãn "Admin" cạnh logo đã làm việc đó
 * mà không phải đảo màu cả một cột; đảo màu khiến mọi icon và nhãn phải có
 * bản trắng riêng, và bản trắng nào cũng lệch một chút so với bản gốc.
 *
 * Token màu, bo góc, thang chữ vẫn dùng chung với toàn site — nó khác về bố
 * cục, không khác về ngôn ngữ thiết kế.
 *
 * `requireSession()` gọi NGAY TRONG ĐÂY chứ không ở từng trang: mọi trang quản trị
 * đều đi qua khung này, nên đặt ở đây thì không có trang nào quên kiểm. Proxy chỉ
 * là lớp ngoài đọc cookie; đây mới là chỗ tra tài khoản thật.
 */

/**
 * `pharmacistOnly` phải khớp với `requireRole("duoc-si")` trong `lib/admin/actions.ts`.
 * Ẩn mục ở đây chỉ để người dùng không bấm vào nút rồi bị đá sang "không đủ quyền";
 * chặn thật vẫn nằm ở Server Action.
 */
const adminNav = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/tim-kiem", label: "Tìm kiếm", icon: Search },
  { href: "/admin/phan-tich", label: "Phân tích doanh số", icon: ChartColumn },
  { href: "/admin/don-hang", label: "Đơn hàng", icon: Package },
  { href: "/admin/kho-thuoc", label: "Kho thuốc", icon: Pill },
  { href: "/admin/danh-muc", label: "Danh mục", icon: LayoutGrid },
  {
    href: "/admin/duyet-don-thuoc",
    label: "Duyệt đơn thuốc",
    icon: ShieldCheck,
    pharmacistOnly: true,
  },
  { href: "/admin/uu-dai", label: "Mã ưu đãi", icon: Percent },
  { href: "/admin/nguoi-dung", label: "Khách hàng", icon: User },
  { href: "/admin/danh-gia", label: "Đánh giá", icon: Star },
  { href: "/admin/binh-luan", label: "Bình luận", icon: MessageCircle },
  { href: "/admin/bai-viet", label: "Bài viết", icon: FileText },
  { href: "/admin/trang", label: "Trang chữ", icon: SlidersHorizontal },
  { href: "/admin/nha-thuoc", label: "Nhà thuốc", icon: Store },
];

/** Chữ đầu của từ cuối trong tên — "DS. Trần Thu Hà" → "TH". */
function initials(name: string) {
  const parts = name.replace(/^(DS\.|ThS\.|BS\.)\s*/i, "").trim().split(/\s+/);
  return parts
    .slice(-2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

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
  const nav = adminNav.filter((item) => !item.pharmacistOnly || session.role === "duoc-si");

  return (
    <div className="min-h-screen bg-page lg:flex">
      {/*
        `lg:flex lg:flex-col` + `nav.lg:flex-1`: đẩy khối tài khoản xuống đáy
        cột như Stitch. Danh sách 12 mục cao hơn 600px, không có nó thì nút
        "Đăng xuất" rơi xuống dưới màn hình và người dùng phải cuộn thanh bên
        mới thấy — trong khi thứ đó lúc nào cũng phải thấy được.
      */}
      <aside className="border-b border-hairline bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-2 border-b border-divider px-4">
          <Link
            href="/admin"
            className="focus-ring flex items-center gap-2 rounded-card"
            aria-label={`${roleLabel[session.role]} — tổng quan quản trị`}
          >
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-card bg-trust-text text-white"
            >
              <Cross size={18} strokeWidth={2.75} />
            </span>
            <span className="font-headline text-headline-md font-bold tracking-tight text-trust-text">
              MediVia
            </span>
            <span className="rounded bg-recessed px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-ink-muted uppercase">
              Admin
            </span>
          </Link>
        </div>

        {/* Người đang đăng nhập, bản mobile. */}
        <div className="flex items-center gap-2.5 border-b border-divider px-4 py-3 lg:hidden">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-chip border border-trust/20 bg-trust-wash text-label-sm font-bold text-trust-text">
            {initials(session.name)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-label-sm font-semibold text-ink">
              {session.name}
            </span>
            <span className="block truncate text-label-sm text-ink-muted">
              {roleLabel[session.role]}
            </span>
          </span>
        </div>

        <nav aria-label="Điều hướng quản trị" className="p-3 lg:flex-1">
          {/* Ẩn thanh cuộn ngang: mục cuối bị cắt là dấu hiệu đủ rõ rằng còn
              nữa, còn thanh cuộn thì chiếm mất một dòng ngay dưới logo. */}
          <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:gap-0.5 lg:overflow-visible">
            {nav.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === activeHref;

              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`focus-ring flex items-center gap-3 rounded-card px-3 py-2.5 text-label-md transition-colors ${
                      isActive
                        ? // Vạch teal nằm TRONG khung thay vì `border-l-4` cộng
                          // thêm 4px: border đẩy nhãn lệch 4px so với các mục
                          // khác, và mắt nhận ra ngay hàng chữ không thẳng.
                          "relative bg-trust-wash font-semibold text-trust-text before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-1 before:rounded-full before:bg-trust"
                        : "text-ink-muted hover:bg-recessed hover:text-ink"
                    }`}
                  >
                    <Icon
                      size={18}
                      aria-hidden
                      className={isActive ? "text-trust-text" : "text-ink-subtle"}
                    />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden border-t border-divider p-3 lg:block">
          <div className="flex items-center gap-2.5 rounded-card border border-hairline bg-recessed/60 p-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-chip border border-trust/20 bg-trust-wash text-label-sm font-bold text-trust-text">
              {initials(session.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-label-sm font-bold text-ink">
                {session.name}
              </span>
              <span className="block truncate text-label-sm text-ink-muted">
                {roleLabel[session.role]}
              </span>
            </span>
          </div>

          {/*
            Số thay đổi chưa nằm trong mã nguồn. Hiện ra vì bản mẫu lưu dữ liệu quản
            trị ở tệp riêng: không nói thì người sau clone mã về, không thấy gì thay
            đổi, và tưởng các màn hình sửa kia không có tác dụng.
          */}
          {totalChanges > 0 ? (
            <p className="mt-2 px-1 text-label-sm text-ink-subtle">
              {totalChanges} thay đổi chưa vào mã
            </p>
          ) : null}

          <div className="mt-3 flex flex-col items-start gap-1.5 px-1">
            <Link
              href="/"
              className="focus-ring inline-flex items-center gap-1.5 rounded-chip text-label-sm text-ink-muted hover:text-trust-text"
            >
              Về trang bán hàng
              <ExternalLink size={14} aria-hidden />
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="focus-ring inline-flex items-center gap-1.5 rounded-chip text-label-sm text-ink-muted hover:text-trust-text"
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
