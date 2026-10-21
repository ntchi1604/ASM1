import Link from "next/link";
import { Sparkles } from "@/lib/icons";
import { aiTools } from "@/lib/data/home";
import { aiDisclaimer } from "@/lib/data/site";

/**
 * 6 công cụ AI — điểm khác biệt chính so với nhà thuốc trực tuyến khác.
 * Tím chỉ dùng cho nội dung do AI tạo, nên mọi đường dẫn ở đây đều tím.
 *
 * Dạng 6 cột icon tròn như Stitch: sáu công cụ ngang hàng nhau, đọc lướt
 * một dòng là hiểu, không cần mô tả. Khối chỉ là dải dẫn đường; phần giải
 * thích nằm ở từng trang đích.
 *
 * `id` để breadcrumb của cả 6 trang AI nhảy về đúng khối này thay vì rơi vào đầu
 * trang chủ, nơi không có công cụ AI nào.
 */
export function AiToolsStrip() {
  return (
    <section id="cong-cu-ai" className="container-medivia py-8 md:py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-headline text-headline-md text-navy">
          <Sparkles size={20} aria-hidden className="text-ai-text" />
          Công cụ AI hỗ trợ chọn thuốc
          <span className="rounded-chip bg-ai-wash px-2 py-0.5 text-label-sm font-semibold text-ai-text">
            Mới
          </span>
        </h2>
        <p className="text-body-sm text-ink-muted">
          Dược sĩ kiểm duyệt nội dung, AI chỉ hỗ trợ tra cứu
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {aiTools.map(({ icon: Icon, label, href, description }) => (
          <li key={href}>
            <Link
              href={href}
              title={description}
              className="focus-ring group flex h-full flex-col items-center gap-2.5 rounded-card border border-ai/20 bg-card p-3.5 text-center transition-colors hover:border-ai/50 hover:bg-ai-wash"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-chip bg-ai-wash text-ai-text transition-transform group-hover:scale-105">
                <Icon size={20} aria-hidden />
              </span>
              {/* Nhãn dài như "Tìm thuốc bằng câu tự nhiên" phải xuống 2 dòng
                  chứ không cắt cụt: cắt còn "Tìm thuốc bằng..." thì sáu thẻ
                  đọc ra như nhau, mất luôn ý nghĩa của việc chia sáu ô. */}
              <span className="line-clamp-2 text-label-md text-ink">{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-label-sm text-ink-muted">{aiDisclaimer}</p>
    </section>
  );
}
