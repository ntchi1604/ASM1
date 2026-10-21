import Link from "next/link";
import { BadgeCheck, MapPin, Phone, QrCode, ShieldCheck, type LucideIcon } from "@/lib/icons";
import { Logo } from "@/components/layout/Logo";
import { certifications } from "@/lib/data/home";
import { footerColumns, site, supplementDisclaimer } from "@/lib/data/site";
import { formatCount } from "@/lib/format";

/** Icon của 3 chứng nhận, khoá theo `certifications[].icon`. */
const certIcons: Record<string, LucideIcon> = {
  verified: BadgeCheck,
  shield: ShieldCheck,
  qr: QrCode,
};

/**
 * Footer duy nhất, nền navy đậm. Dòng giấy phép là bắt buộc, không page nào
 * được bỏ.
 *
 * Nền đậm thay vì card trắng: footer là chỗ kết thúc trang, và một khối navy
 * liền mạch cho mắt biết trang đã hết — cùng lý do Stitch dùng navy cho chân
 * trang của họ.
 */
export function SiteFooter() {
  return (
    <footer className="mt-12 bg-navy pt-12 text-white/75 md:pt-14">
      <div className="container-medivia grid gap-8 pb-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <Logo tone="white" />
          <p className="text-body-sm text-white/70">{site.tagline}</p>
          <p className="flex items-center gap-1.5 text-body-sm text-white/70">
            <Phone size={14} aria-hidden />
            Hotline{" "}
            <a
              href={`tel:${site.hotline.replace(/\s/g, "")}`}
              className="focus-ring font-semibold text-white"
            >
              {site.hotline}
            </a>
          </p>
          <p className="flex items-start gap-1.5 text-body-sm text-white/70">
            <MapPin size={14} aria-hidden className="mt-1 shrink-0" />
            {site.address}
          </p>
          <p className="text-body-sm text-white/70">
            Hệ thống {formatCount(site.pharmacyCount)} nhà thuốc toàn quốc
          </p>

          <ul className="mt-1 flex flex-wrap gap-2">
            {certifications.map((cert) => {
              const Icon = certIcons[cert.icon];
              return (
                <li
                  key={cert.label}
                  className="inline-flex items-center gap-1.5 rounded-chip border border-white/20 bg-white/10 px-2.5 py-1 text-label-sm text-white/85"
                >
                  <Icon size={14} aria-hidden />
                  {cert.label}
                </li>
              );
            })}
          </ul>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <h3 className="text-label-md font-semibold text-white">{column.title}</h3>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="focus-ring text-body-sm text-white/70 hover:text-white hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/15">
        <div className="container-medivia flex flex-col gap-2 py-5 text-body-sm text-white/60">
          <p>
            Giấy phép kinh doanh dược số {site.licenseNumber} · Người chịu trách
            nhiệm chuyên môn: {site.professionalManager}
          </p>
          <p>{supplementDisclaimer}</p>
          <p className="text-white/45">
            Thông tin trên trang chỉ mang tính tham khảo, không thay thế chẩn
            đoán và chỉ định của bác sĩ. © {new Date().getFullYear()} {site.name}.
          </p>
        </div>
      </div>
    </footer>
  );
}
