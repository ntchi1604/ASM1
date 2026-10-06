import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { aiDisclaimer } from "@/lib/data/site";
import { Bot, Lightbulb, Sparkles } from "@/lib/icons";

/**
 * Dải gợi ý AI trên trang danh mục. Không dùng AiBlock vì đây là dải mảnh
 * một dòng, nhưng vẫn giữ đúng quy tắc: nền tím, nhãn AI, và khuyến cáo —
 * để người dùng biết đây là suy luận của máy, không phải chỉ định dược.
 *
 * Nội dung là dữ liệu mẫu suy ra từ danh mục đang xem, chưa gọi model thật.
 */
export function AiCategoryHint({
  message,
  action,
}: {
  message: string;
  /** Đường dẫn liên quan, ví dụ sang danh mục thuốc long đờm. */
  action?: { label: string; href: string };
}) {
  return (
    <section
      aria-label="AI gợi ý"
      className="rounded-card border border-ai bg-ai-wash px-3.5 py-3"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-chip bg-ai px-2.5 py-1 text-label-sm text-white">
          <Sparkles size={14} aria-hidden />
          AI gợi ý
        </span>

        <p className="flex min-w-0 flex-1 items-start gap-2 text-body-sm text-ink">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-ai-text" aria-hidden />
          {message}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {action ? (
            <Link
              href={action.href}
              className="focus-ring rounded-chip border border-ai px-3 py-1.5 text-body-sm font-medium text-ai-text transition-colors hover:bg-ai hover:text-white"
            >
              {action.label}
            </Link>
          ) : null}
          <ButtonLink href="/ai/chatbot" variant="solid-ai">
            <Bot size={16} aria-hidden />
            Hỏi dược sĩ AI
          </ButtonLink>
        </div>
      </div>

      <p className="mt-2.5 border-t border-ai pt-2 text-label-sm font-normal text-ink-muted">
        {aiDisclaimer}
      </p>
    </section>
  );
}
