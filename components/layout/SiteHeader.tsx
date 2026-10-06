import type { ReactNode } from "react";
import Link from "next/link";
import { MapPin, ShoppingCart, User } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/layout/Logo";
import { SearchBar } from "@/components/layout/SearchBar";
import { MainNav } from "@/components/layout/MainNav";
import { UtilityBar } from "@/components/layout/UtilityBar";
import { getCartCount } from "@/lib/data/cart";

/**
 * Header duy nhất của site: nền trắng, sticky, hairline dưới.
 * (Bản gen từ Stitch có 2 biến thể khác nhau — đã chốt dùng bản này.)
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-card">
      <UtilityBar />

      <div className="border-b border-hairline">
        {/*
          Hàng này ĐỔI SỐ DÒNG theo bề rộng, không phải chỉ ẩn/hiện nút.

          Dưới md: dòng 1 là logo + giỏ hàng, dòng 2 là ô tìm kiếm chiếm hết chiều
          ngang. Lý do là ô tìm kiếm không thể vừa dòng cùng logo ở khung 390px —
          chip "AI" + input + ba nút mic/ảnh/tìm cần khoảng 220px là ít nhất còn
          đọc được chữ đang gõ, mà nhồi cả ba khối vào một dòng thì trước đây làm
          hàng header rộng 533px và cả trang bị cuộn ngang.

          Từ md trở lên: một dòng cao 16 như cũ, `flex-nowrap` + `md:order-none`
          trả thứ tự về đúng nguồn (logo — tìm kiếm — ba lối vào). Mốc là md chứ
          không phải lg vì ở 768px một dòng đã dư chỗ (logo 122 + giỏ 67 + lề còn
          để lại hơn 500px cho ô tìm kiếm), mà header sticky thì mỗi dòng thừa là
          52px nội dung bị đẩy xuống trên mọi trang.
        */}
        <div className="container-medivia flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5 md:h-16 md:flex-nowrap md:py-0">
          <Logo />

          {/*
            Ô tìm kiếm xuống dòng cuối ở mobile bằng `order-last`: thứ tự trong
            nguồn để logo — tìm kiếm — lối vào là thứ tự của bản desktop, nên phải
            đẩy bằng order thay vì viết lại cây DOM cho từng breakpoint. Một cây
            DOM cho cả hai khổ thì không có chuyện hai bản lệch nội dung nhau.
          */}
          <SearchBar className="order-last w-full md:order-none md:w-auto md:flex-1" />

          {/*
            MỘT khối lối vào duy nhất cho cả hai khổ, không phải hai khối rồi
            ẩn/hiện: nếu tách riêng bản mobile thì badge số lượng giỏ hàng, nhãn,
            hay đường dẫn có thể sửa lệch một bên. Ở mobile chỉ giữ giỏ hàng —
            "Nhà thuốc" và "Tài khoản" đã có trong footer và trang tài khoản, còn
            giỏ hàng thì không thể thiếu trên một trang bán thuốc.
          */}
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <HeaderAction
              href="/he-thong-nha-thuoc"
              label="Nhà thuốc"
              icon={<MapPin size={20} aria-hidden />}
              className="hidden lg:flex"
            />
            <HeaderAction
              href="/tai-khoan"
              label="Tài khoản"
              icon={<User size={20} aria-hidden />}
              className="hidden lg:flex"
            />
            <HeaderAction
              href="/gio-hang"
              label="Giỏ hàng"
              icon={<ShoppingCart size={20} aria-hidden />}
              badge={getCartCount()}
            />
          </div>
        </div>
      </div>

      <MainNav />
    </header>
  );
}

function HeaderAction({
  href,
  label,
  icon,
  badge,
  className,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  /** Chỉ để bật/tắt theo breakpoint. Không dùng để đổi hình thức của nút. */
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring relative flex min-w-16 flex-col items-center gap-0.5 rounded-card px-2 py-1 text-ink-muted hover:bg-recessed hover:text-trust-text",
        className,
      )}
    >
      {icon}
      <span className="text-label-sm">{label}</span>
      {badge && badge > 0 ? (
        <span
          className="absolute top-0 right-1 flex h-4 min-w-4 items-center justify-center rounded-chip bg-promo px-1 font-mono text-label-sm text-white tabular-nums"
          aria-label={`${badge} sản phẩm trong giỏ`}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
