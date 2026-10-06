import Link from "next/link";
import { MessageCircle, Phone, Stethoscope } from "@/lib/icons";
import { site } from "@/lib/data/site";

/**
 * Thẻ dược sĩ trực. Màu teal (tin cậy), KHÔNG phải tím — đây là người thật,
 * không phải AI. Đặt cạnh khối AI để người dùng thấy rõ hai lựa chọn khác nhau
 * và biết khi nào cần hỏi người.
 *
 * `advice` viết theo từng thuốc: nhắc đúng nhóm nguy cơ của thuốc đang xem thì
 * mới có ích, còn "hãy hỏi dược sĩ" chung chung thì không.
 */
export function PharmacistCard({ advice }: { advice: string }) {
  return (
    <section
      aria-label="Tư vấn dược sĩ"
      className="rounded-card border border-trust/25 bg-trust-wash p-4"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-trust text-white"
        >
          <Stethoscope size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-label-md text-ink">{site.professionalManager}</p>
          <p className="text-body-sm text-ink-muted">Dược lâm sàng · {site.name}</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-label-sm text-trust-text">
            <span aria-hidden className="size-2 rounded-full bg-trust" />
            Đang trực tuyến 24/7
          </p>
        </div>
      </div>

      <p className="mt-3 text-body-sm text-ink">{advice}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`tel:${site.hotline.replace(/\s/g, "")}`}
          className="focus-ring inline-flex items-center gap-1.5 rounded-card border border-trust bg-card px-3 py-2 text-label-md text-trust-text transition-colors hover:bg-trust-wash"
        >
          <Phone size={16} aria-hidden />
          Gọi {site.hotline}
        </a>
        <Link
          href="/ai/chatbot"
          className="focus-ring inline-flex items-center gap-1.5 rounded-card bg-trust px-3 py-2 text-label-md text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle size={16} aria-hidden />
          Chat với dược sĩ
        </Link>
      </div>
    </section>
  );
}
