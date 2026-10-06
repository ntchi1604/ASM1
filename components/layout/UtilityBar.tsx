import Link from "next/link";
import { Phone } from "@/lib/icons";
import { site, utilityBarLinks } from "@/lib/data/site";

/** Dải trên cùng, nền teal đậm. Giống nhau trên mọi page. */
export function UtilityBar() {
  return (
    <div className="bg-trust-text text-white">
      <div className="container-medivia flex h-9 items-center justify-between gap-4 text-label-sm">
        <p className="flex items-center gap-1.5">
          <Phone size={14} aria-hidden />
          <span>Tư vấn dược sĩ miễn phí</span>
          <a href={`tel:${site.hotline.replace(/\s/g, "")}`} className="focus-ring font-semibold underline-offset-2 hover:underline">
            {site.hotline}
          </a>
        </p>

        <nav aria-label="Liên kết tiện ích" className="hidden items-center gap-3 md:flex">
          {utilityBarLinks.map((link, index) => (
            <span key={link.href} className="flex items-center gap-3">
              {index > 0 ? <span aria-hidden className="text-white/50">·</span> : null}
              <Link href={link.href} className="focus-ring underline-offset-2 hover:underline">
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}
