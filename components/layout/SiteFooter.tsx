import Link from "next/link";
import { MapPin, Phone } from "@/lib/icons";
import { Logo } from "@/components/layout/Logo";
import { footerColumns, site, supplementDisclaimer } from "@/lib/data/site";
import { formatCount } from "@/lib/format";

/** Footer duy nhất. Dòng giấy phép là bắt buộc, không page nào được bỏ. */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-hairline bg-card">
      <div className="container-medivia grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="text-body-sm text-ink-muted">{site.tagline}</p>
          <p className="flex items-center gap-1.5 text-body-sm text-ink-muted">
            <Phone size={14} aria-hidden />
            Hotline{" "}
            <a
              href={`tel:${site.hotline.replace(/\s/g, "")}`}
              className="focus-ring font-semibold text-trust-text"
            >
              {site.hotline}
            </a>
          </p>
          <p className="flex items-start gap-1.5 text-body-sm text-ink-muted">
            <MapPin size={14} aria-hidden className="mt-1 shrink-0" />
            {site.address}
          </p>
          <p className="text-body-sm text-ink-muted">
            Hệ thống {formatCount(site.pharmacyCount)} nhà thuốc toàn quốc
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <h3 className="text-label-md text-ink">{column.title}</h3>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="focus-ring text-body-sm text-ink-muted hover:text-trust-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-divider">
        <div className="container-medivia flex flex-col gap-2 py-5 text-body-sm text-ink-muted">
          <p>
            Giấy phép kinh doanh dược số {site.licenseNumber} · Người chịu trách
            nhiệm chuyên môn: {site.professionalManager}
          </p>
          <p>{supplementDisclaimer}</p>
          <p className="text-ink-subtle">
            Thông tin trên trang chỉ mang tính tham khảo, không thay thế chẩn
            đoán và chỉ định của bác sĩ. © {new Date().getFullYear()} {site.name}.
          </p>
        </div>
      </div>
    </footer>
  );
}
