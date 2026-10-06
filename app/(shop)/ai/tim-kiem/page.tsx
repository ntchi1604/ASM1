import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AiBlock } from "@/components/ai/AiBlock";
import { AiPageShell } from "@/components/ai/AiPageShell";
import { AiSkeleton } from "@/components/ai/AiSkeleton";
import { ConfidenceBadge } from "@/components/ai/ConfidenceBadge";
import { ProductRow } from "@/components/product/ProductRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { searchProducts } from "@/lib/ai/search";
import { aiMockNotice } from "@/lib/ai/engine";
import { Mic, ScanSearch, Search, Sparkles } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Tìm thuốc bằng câu tự nhiên",
  description:
    "Gõ cả câu như nói với dược sĩ — AI của MediVia tách điều kiện về giá, độ tuổi và dạng thuốc rồi lọc danh mục theo đúng ý bạn.",
};

const examples = [
  "thuốc ho cho trẻ em không gây buồn ngủ",
  "hạ sốt dạng viên sủi dưới 100k",
  "vitamin tăng đề kháng cho người cao tuổi",
  "nước muối rửa mũi cho bé",
];

/**
 * Tính năng 2 — Tìm thuốc bằng câu tự nhiên.
 *
 * Khác ô tìm kiếm thường ở một chỗ: các ĐIỀU KIỆN mà AI tách được từ câu đều
 * hiện thành chip, kèm đúng đoạn chữ trong câu đã sinh ra nó. Người dùng nhìn
 * chip là biết máy hiểu đúng hay không, và khi sai thì biết sai ở đâu mà sửa —
 * quan trọng hơn cả việc kết quả có chính xác hay không.
 */
export default async function AiSearchPage({
  searchParams,
}: PageProps<"/ai/tim-kiem">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  return (
    <AiPageShell
      icon={ScanSearch}
      title="Tìm thuốc bằng câu tự nhiên"
      lead="Gõ cả câu như bạn nói với dược sĩ. AI tách điều kiện về giá, độ tuổi, dạng thuốc rồi lọc trong danh mục MediVia — không tự bịa thuốc ngoài danh mục."
      current="/ai/tim-kiem"
    >
      <Card className="p-4 md:p-5">
        <form action="/ai/tim-kiem" method="get" className="flex flex-col gap-3">
          <label htmlFor="q" className="text-label-md text-ink">
            Bạn cần tìm thuốc gì?
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="q"
              name="q"
              type="search"
              required
              defaultValue={query}
              placeholder="Ví dụ: thuốc ho cho trẻ em không gây buồn ngủ"
              className="sm:flex-1"
            />
            <Button type="submit" variant="solid-ai" size="md" className="sm:w-40">
              <Search size={18} aria-hidden />
              Tìm kiếm
            </Button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-divider pt-4">
          <span className="text-label-sm text-ink-muted">Thử:</span>
          {examples.map((example) => (
            <Link
              key={example}
              href={`/ai/tim-kiem?q=${encodeURIComponent(example)}`}
              className="focus-ring inline-block rounded-chip border border-hairline bg-card px-3 py-1.5 text-body-sm text-ink-muted hover:border-ai/40 hover:text-ai-text"
            >
              {example}
            </Link>
          ))}
          <Link
            href="/ai/giong-noi"
            className="focus-ring ml-auto inline-flex items-center gap-1.5 text-label-sm text-ai-text"
          >
            <Mic size={15} aria-hidden />
            Nói thay vì gõ
          </Link>
        </div>
      </Card>

      {query ? (
        <Suspense
          key={query}
          fallback={<AiSkeleton message="AI đang đọc câu tìm kiếm của bạn…" lines={3} />}
        >
          <SearchResultView query={query} />
        </Suspense>
      ) : (
        <p className="text-body-sm text-ink-subtle">{aiMockNotice}</p>
      )}
    </AiPageShell>
  );
}

async function SearchResultView({ query }: { query: string }) {
  const result = await searchProducts(query);

  return (
    <>
      <AiBlock label="AI hiểu câu của bạn" disclaimer={false}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-2xl text-body-md text-ink">{result.understood}</p>
          <ConfidenceBadge percent={result.confidence} />
        </div>

        {result.filters.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {result.filters.map((filter) => (
              <li
                key={filter.label}
                className="inline-flex items-center gap-1.5 rounded-chip bg-card px-3 py-1.5 text-label-sm text-ai-text"
              >
                <Sparkles size={13} aria-hidden />
                {filter.label}
                {/* Hiện đúng đoạn chữ đã sinh ra điều kiện này: người dùng đối chiếu được. */}
                <span className="text-body-sm font-normal text-ink-subtle">
                  từ “{filter.from}”
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-body-sm text-ink-muted">
            AI không tách được điều kiện nào từ câu này nên đã tìm theo tên thuốc
            và hoạt chất. Thêm điều kiện như “dưới 100k”, “cho trẻ em”, “dạng
            siro” sẽ cho kết quả sát hơn.
          </p>
        )}
      </AiBlock>

      <section aria-label="Kết quả tìm kiếm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-headline-lg text-ink">
            {result.hits.length > 0
              ? `${result.hits.length} thuốc phù hợp`
              : "Không tìm thấy thuốc phù hợp"}
          </h2>
          {result.hits.length > 0 ? (
            <span className="text-body-sm text-ink-subtle">
              Sắp xếp theo mức phù hợp do AI đánh giá
            </span>
          ) : null}
        </div>

        {result.hits.length === 0 ? (
          <Card className="mt-3 p-4 md:p-5">
            <p className="text-body-md text-ink">
              MediVia chưa có thuốc nào khớp với tất cả điều kiện trong câu của
              bạn. Chúng tôi không hiện thuốc gần gần cho đủ danh sách — kết quả
              rỗng thì đúng hơn kết quả sai.
            </p>
            {result.suggestions.length > 0 ? (
              <>
                <p className="mt-4 text-label-sm text-ink-muted">Thử bỏ một điều kiện:</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {result.suggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <Link
                        href={`/ai/tim-kiem?q=${encodeURIComponent(suggestion)}`}
                        className="focus-ring inline-block rounded-chip border border-hairline px-3 py-1.5 text-body-sm text-ink-muted hover:border-ai/40 hover:text-ai-text"
                      >
                        {suggestion}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <Link
              href="/ai/tu-van"
              className="focus-ring mt-4 inline-block text-label-md text-trust-text underline decoration-trust/30 underline-offset-2"
            >
              Hoặc mô tả triệu chứng để AI gợi ý nhóm thuốc
            </Link>
          </Card>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {result.hits.map((hit) => (
              <li key={hit.product.id} className="flex flex-col gap-1.5">
                <ProductRow product={hit.product} />
                {/*
                  Lý do khớp đặt DƯỚI thẻ sản phẩm và tô tím: nó là câu của máy,
                  không phải thông tin dược đã kiểm duyệt trên thẻ.
                */}
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
