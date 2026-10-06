import Link from "next/link";
import { AlertTriangle, Phone } from "@/lib/icons";
import { site } from "@/lib/data/site";
import type { RedFlag } from "@/lib/types";

/**
 * Triệu chứng nguy hiểm.
 *
 * Khối này ĐỎ, không tím — dù nó nằm trong luồng AI. Tím nghĩa là "máy gợi ý,
 * bạn cân nhắc"; ở đây thông điệp là "đừng mua thuốc, đi khám", và đó không phải
 * gợi ý để cân nhắc.
 *
 * Trang nào có khối này phải đặt nó TRƯỚC mọi gợi ý sản phẩm. Đặt dưới nghĩa là
 * người đang chảy máu không cầm được vẫn đọc thấy danh sách thuốc trước lời
 * khuyên đi cấp cứu.
 */
export function RedFlagBlock({ flags }: { flags: RedFlag[] }) {
  if (flags.length === 0) return null;

  return (
    <section
      className="rounded-card border border-danger/30 bg-danger-wash p-4 md:p-5"
      aria-label="Dấu hiệu cần đi khám ngay"
    >
      <h2 className="flex items-center gap-2 text-headline-md text-danger">
        <AlertTriangle size={20} className="shrink-0" aria-hidden />
        Nếu có những dấu hiệu này, hãy đi khám ngay
      </h2>
      <p className="mt-1.5 text-body-sm text-ink-muted">
        Những trường hợp dưới đây không tự mua thuốc được — cần người khám trực
        tiếp.
      </p>

      <ul className="mt-3 flex flex-col gap-2.5">
        {flags.map((flag) => (
          <li key={flag.label} className="flex flex-col gap-0.5">
            <span className="text-label-md text-ink">{flag.label}</span>
            <span className="text-body-sm text-ink-muted">{flag.action}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-danger/20 pt-3 text-body-sm text-ink-muted">
        <Phone size={15} className="text-danger" aria-hidden />
        Cấp cứu gọi 115. Cần dược sĩ MediVia:
        <Link
          href={`tel:${site.hotline.replace(/\s/g, "")}`}
          className="focus-ring text-label-md text-danger underline decoration-danger/30 underline-offset-2"
        >
          {site.hotline}
        </Link>
      </p>
    </section>
  );
}
