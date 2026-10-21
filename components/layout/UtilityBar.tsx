import Link from "next/link";
import { Phone, Smartphone, Store, Truck, type LucideIcon } from "@/lib/icons";
import { site, utilityBarLinks } from "@/lib/data/site";

/**
 * Dải trên cùng, nền teal đậm. Giống nhau trên mọi page.
 *
 * Mỗi liên kết có icon riêng như bản Stitch — một dải chữ trơn ở trên cùng
 * trông như thanh bản quyền, còn icon làm người xem đọc lướt được.
 */
const linkIcons: Record<string, LucideIcon> = {
  truck: Truck,
  store: Store,
  smartphone: Smartphone,
};

export function UtilityBar() {
  return (
    <div className="bg-trust-text text-white">
      <div className="container-medivia flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-label-sm">
        <p className="flex items-center gap-1.5">
          <Phone size={15} aria-hidden />
          <span>Tư vấn dược sĩ miễn phí</span>
          <a
            href={`tel:${site.hotline.replace(/\s/g, "")}`}
            className="focus-ring font-semibold tracking-wide underline-offset-2 hover:underline"
          >
            {site.hotline}
          </a>
        </p>

        <nav aria-label="Liên kết tiện ích" className="hidden items-center gap-3 md:flex">
          {utilityBarLinks.map((link, index) => {
            const Icon = linkIcons[link.icon];
            return (
              <span key={link.href} className="flex items-center gap-3">
                {index > 0 ? (
                  <span aria-hidden className="text-white/40">
                    |
                  </span>
                ) : null}
                <Link
                  href={link.href}
                  className="focus-ring flex items-center gap-1 text-white/90 underline-offset-2 hover:text-white hover:underline"
                >
                  <Icon size={15} aria-hidden />
                  {link.label}
                </Link>
              </span>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
