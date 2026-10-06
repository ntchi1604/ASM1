import Link from "next/link";
import { Sparkles } from "@/lib/icons";
import { aiTools } from "@/lib/data/home";
import { aiDisclaimer } from "@/lib/data/site";

/**
 * 6 công cụ AI — điểm khác biệt chính so với nhà thuốc trực tuyến khác.
 * Toàn khối dùng tím vì mọi đường dẫn ở đây đều ra nội dung do AI tạo.
 *
 * `id` để breadcrumb của cả 6 trang AI nhảy về đúng khối này thay vì rơi vào đầu
 * trang chủ, nơi không có công cụ AI nào.
 */
export function AiToolsStrip() {
  return (
    <section id="cong-cu-ai" className="container-medivia py-8 md:py-10">
      <div className="rounded-card border border-ai/25 bg-ai-wash p-4 md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-chip bg-ai px-2.5 py-1 text-label-sm text-white">
              <Sparkles size={14} aria-hidden />
              Công cụ AI của MediVia
            </span>
            <span className="rounded-chip bg-promo px-2 py-0.5 text-label-sm text-white">
              Mới
            </span>
          </div>
          <p className="text-body-sm text-ink-muted">
            Dược sĩ kiểm duyệt nội dung, AI chỉ hỗ trợ tra cứu
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {aiTools.map(({ icon: Icon, label, href, description }) => (
            <li key={href}>
              <Link
                href={href}
                className="focus-ring flex h-full items-start gap-3 rounded-card border border-ai/20 bg-card p-3 transition-colors hover:border-ai/50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-ai-wash text-ai-text">
                  <Icon size={20} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-body-md font-medium text-ink">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-body-sm text-ink-muted">
                    {description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-4 border-t border-ai/20 pt-3 text-body-sm text-ink-muted">
          {aiDisclaimer}
        </p>
      </div>
    </section>
  );
}
