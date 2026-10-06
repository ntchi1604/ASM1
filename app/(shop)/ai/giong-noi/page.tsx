import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AiBlock } from "@/components/ai/AiBlock";
import { AiPageShell } from "@/components/ai/AiPageShell";
import { AiSkeleton } from "@/components/ai/AiSkeleton";
import { ConfidenceBadge } from "@/components/ai/ConfidenceBadge";
import { VoiceCapture } from "@/components/ai/VoiceCapture";
import { ProductRow } from "@/components/product/ProductRow";
import { Card } from "@/components/ui/Card";
import { searchByVoice, voiceExamples } from "@/lib/ai/voice";
import { aiMockNotice } from "@/lib/ai/engine";
import { Mic, ScanSearch, Sparkles, Volume2 } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Tìm thuốc bằng giọng nói",
  description:
    "Nói tên thuốc hoặc triệu chứng, AI của MediVia chuyển thành chữ rồi tìm trong danh mục — sửa được nếu nghe sai.",
};

/**
 * Tính năng 9 — Tìm thuốc bằng giọng nói.
 *
 * Luồng cho điện thoại nên trang co lại thành khung hẹp trên desktop, vẫn chỉ một
 * route.
 *
 * Điểm quan trọng về kiến trúc: trang này KHÔNG có bộ tìm kiếm riêng. Nó nhận chữ
 * rồi gọi đúng `searchProducts` mà /ai/tim-kiem dùng. Nói "thuốc ho cho trẻ em"
 * và gõ "thuốc ho cho trẻ em" cho ra cùng một kết quả — nếu khác nhau thì người
 * dùng sẽ không tin cả hai.
 */
export default async function VoiceSearchPage({
  searchParams,
}: PageProps<"/ai/giong-noi">) {
  const { noi } = await searchParams;
  const transcript = (Array.isArray(noi) ? noi[0] : noi)?.trim() ?? "";

  return (
    <AiPageShell
      icon={Mic}
      title="Tìm thuốc bằng giọng nói"
      lead="Nói tên thuốc hoặc triệu chứng. AI chuyển thành chữ, hiện chữ ra cho bạn sửa, rồi tìm bằng đúng bộ tìm kiếm của trang tìm bằng câu tự nhiên."
      current="/ai/giong-noi"
    >
      <div className="mx-auto w-full max-w-[420px] lg:max-w-[460px]">
        <Card className="p-4 md:p-5">
          <VoiceCapture defaultValue={transcript} />

          {!transcript ? (
            <div className="mt-4 border-t border-divider pt-4">
              <p className="text-label-sm text-ink-muted">Nói kiểu này thì AI hiểu:</p>
              <ul className="mt-2 flex flex-col gap-2">
                {voiceExamples.map((example) => (
                  <li key={example}>
                    <Link
                      href={`/ai/giong-noi?noi=${encodeURIComponent(example)}`}
                      className="focus-ring flex items-center gap-2 rounded-card bg-recessed px-3 py-2 text-body-sm text-ink-muted hover:text-ai-text"
                    >
                      <Volume2 size={15} className="shrink-0" aria-hidden />“{example}”
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        {transcript ? (
          <div className="mt-5 flex flex-col gap-5">
            <Suspense
              key={transcript}
              fallback={<AiSkeleton message="AI đang tìm theo câu bạn vừa nói…" lines={3} />}
            >
              <VoiceResultView transcript={transcript} />
            </Suspense>
          </div>
        ) : (
          <p className="mt-4 text-body-sm text-ink-subtle">{aiMockNotice}</p>
        )}
      </div>
    </AiPageShell>
  );
}

async function VoiceResultView({ transcript }: { transcript: string }) {
  const result = await searchByVoice(transcript);

  return (
    <>
      <AiBlock label="AI nghe được" disclaimer={false}>
        {/*
          Hai độ chắc tách riêng vì hai loại lỗi khác nhau: nghe sai tên thuốc là
          lỗi phần nghe, tìm không ra là lỗi phần tìm. Gộp thành một con số thì
          người dùng không biết phải sửa gì.
        */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-headline-md text-ink">“{result.transcript}”</p>
          <ConfidenceBadge percent={result.transcriptConfidence} />
        </div>
        <p className="mt-2 text-body-sm text-ink-muted">
          Nghe sai? Sửa lại trong ô phía trên rồi bấm Tìm — nhanh hơn nói lại cả
          câu.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ai/20 pt-3">
          <span className="text-body-sm text-ai-text">{result.search.understood}</span>
          <ConfidenceBadge percent={result.search.confidence} />
        </div>

        {result.search.filters.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {result.search.filters.map((filter) => (
              <li
                key={filter.label}
                className="inline-flex items-center gap-1.5 rounded-chip bg-card px-3 py-1.5 text-label-sm text-ai-text"
              >
                <Sparkles size={13} aria-hidden />
                {filter.label}
              </li>
            ))}
          </ul>
        ) : null}
      </AiBlock>

      <section aria-label="Kết quả tìm kiếm">
        <h2 className="text-headline-lg text-ink">
          {result.search.hits.length > 0
            ? `${result.search.hits.length} thuốc phù hợp`
            : "Không tìm thấy thuốc phù hợp"}
        </h2>

        {result.search.hits.length === 0 ? (
          <Card className="mt-3 p-4">
            <p className="text-body-md text-ink">
              MediVia chưa có thuốc nào khớp câu này. Có thể AI nghe sai một chữ —
              hãy đọc lại chữ ở trên và sửa nếu cần.
            </p>
            <Link
              href={`/ai/tim-kiem?q=${encodeURIComponent(result.transcript)}`}
              className="focus-ring mt-3 inline-flex items-center gap-1.5 text-label-md text-trust-text underline decoration-trust/30 underline-offset-2"
            >
              <ScanSearch size={16} aria-hidden />
              Mở câu này ở trang tìm kiếm để thêm điều kiện
            </Link>
          </Card>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {result.search.hits.map((hit) => (
              <li key={hit.product.id} className="flex flex-col gap-1.5">
                <ProductRow product={hit.product} />
                <p className="flex items-start gap-2 rounded-card bg-ai-wash px-3 py-2 text-body-sm text-ai-text">
                  <Sparkles size={14} className="mt-0.5 shrink-0" aria-hidden />
                  {hit.why}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-body-sm text-ink-subtle">{aiMockNotice}</p>
    </>
  );
}
