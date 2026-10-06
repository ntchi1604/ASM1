import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AiBlock } from "@/components/ai/AiBlock";
import { AiPageShell } from "@/components/ai/AiPageShell";
import { AiSkeleton } from "@/components/ai/AiSkeleton";
import { ConfidenceBadge } from "@/components/ai/ConfidenceBadge";
import { RedFlagBlock } from "@/components/ai/RedFlagBlock";
import { ProductCard } from "@/components/product/ProductCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { consultSymptoms } from "@/lib/ai/consult";
import { aiMockNotice } from "@/lib/ai/engine";
import { site } from "@/lib/data/site";
import { Headset, Lightbulb, Stethoscope } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Tư vấn triệu chứng bằng AI",
  description:
    "Mô tả triệu chứng bằng tiếng Việt, AI của MediVia gợi ý nhóm thuốc phù hợp và chỉ ra dấu hiệu cần đi khám ngay.",
};

const examples = [
  "Tôi bị sốt 38.5 độ, đau đầu và nghẹt mũi hai ngày nay",
  "Đau bụng âm ỉ sau khi ăn, kèm đầy hơi và khó tiêu",
  "Ho khan về đêm, cổ họng rát nhưng không sốt",
];

/**
 * Tính năng 1 — Tư vấn triệu chứng.
 *
 * Câu mô tả nằm trong `?tc=` chứ không trong state: người dùng gửi được đường dẫn
 * kết quả cho người nhà, và nút quay lại của trình duyệt hoạt động đúng. Đây cũng
 * là cách mọi bộ lọc trong MediVia hoạt động, nên trang AI không phải một ngoại lệ.
 */
export default async function ConsultPage({
  searchParams,
}: PageProps<"/ai/tu-van">) {
  const { tc } = await searchParams;
  const query = (Array.isArray(tc) ? tc[0] : tc)?.trim() ?? "";

  return (
    <AiPageShell
      icon={Stethoscope}
      title="Tư vấn triệu chứng bằng AI"
      lead="Mô tả triệu chứng như bạn kể với dược sĩ. AI gợi ý nhóm thuốc và chỉ ra dấu hiệu cần đi khám — nhưng không chẩn đoán bệnh và không thay bác sĩ."
      current="/ai/tu-van"
      aside={<ConsultAside />}
    >
      <Card className="p-4 md:p-5">
        {/*
          Dùng GET để câu mô tả nằm trong URL. Nhược điểm là câu mô tả hiện trên
          thanh địa chỉ — chấp nhận được vì đây là triệu chứng người dùng chủ động
          gõ để tra cứu, không phải hồ sơ bệnh án. Ở trang thanh toán thì ngược
          lại: họ tên và địa chỉ đi bằng POST.
        */}
        <form action="/ai/tu-van" method="get" className="flex flex-col gap-3">
          <label htmlFor="tc" className="text-label-md text-ink">
            Bạn đang cảm thấy thế nào?
          </label>
          <Textarea
            id="tc"
            name="tc"
            rows={4}
            required
            defaultValue={query}
            placeholder="Ví dụ: sốt 38.5 độ từ tối qua, đau đầu, nghẹt mũi, không ho"
          />
          <p className="text-body-sm text-ink-subtle">
            Càng cụ thể càng tốt: bao lâu rồi, mức độ, có sốt không, đang dùng
            thuốc gì. Đừng ghi tên bệnh — hãy ghi những gì bạn cảm thấy.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="solid-ai" size="lg">
              Nhận gợi ý từ AI
            </Button>
            <span className="text-body-sm text-ink-subtle">
              Miễn phí, không cần đăng nhập
            </span>
          </div>
        </form>

        {!query ? (
          <div className="mt-4 border-t border-divider pt-4">
            <p className="text-label-sm text-ink-muted">Hoặc thử một ví dụ:</p>
            <ul className="mt-2 flex flex-col gap-2">
              {examples.map((example) => (
                <li key={example}>
                  <Link
                    href={`/ai/tu-van?tc=${encodeURIComponent(example)}`}
                    className="focus-ring block rounded-card bg-recessed px-3 py-2 text-body-sm text-ink-muted hover:text-ai-text"
                  >
                    “{example}”
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      {query ? (
        <Suspense
          key={query}
          fallback={
            <AiSkeleton message="AI đang đọc mô tả triệu chứng của bạn…" lines={4} />
          }
        >
          <ConsultResultView query={query} />
        </Suspense>
      ) : null}
    </AiPageShell>
  );
}

/**
 * Phần kết quả tách riêng thành một component async để `<Suspense>` có ranh giới
 * chờ. Nhờ vậy ô nhập hiện ngay còn kết quả tới sau — người dùng không nhìn trang
 * trắng trong lúc AI xử lý.
 */
async function ConsultResultView({ query }: { query: string }) {
  const result = await consultSymptoms(query);

  return (
    <>
      {/* Dấu hiệu nguy hiểm luôn TRƯỚC gợi ý thuốc — không đổi thứ tự này. */}
      <RedFlagBlock flags={result.redFlags} />

      <AiBlock
        label="AI gợi ý"
        note={result.groups.length > 0 ? "Gợi ý nhóm thuốc, không phải chẩn đoán" : undefined}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="max-w-2xl text-body-md text-ink">{result.reading}</p>
          <ConfidenceBadge percent={result.confidence} />
        </div>

        {result.groups.length === 0 ? (
          <div className="mt-4 rounded-card border border-ai/20 bg-card p-4">
            <p className="text-body-md text-ink">
              MediVia không gợi ý thuốc cho mô tả này. Bạn viết rõ hơn giúp:
              triệu chứng bắt đầu bao lâu rồi, có sốt không, đau ở đâu.
            </p>
            <Link
              href={`tel:${site.hotline.replace(/\s/g, "")}`}
              className="focus-ring mt-3 inline-flex items-center gap-2 text-label-md text-trust-text underline decoration-trust/30 underline-offset-2"
            >
              <Headset size={16} aria-hidden />
              Hoặc gọi dược sĩ MediVia {site.hotline}
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            {result.groups.map((group) => (
              <section key={group.title}>
                <h2 className="text-headline-md text-ink">{group.title}</h2>
                <p className="mt-1 text-body-sm text-ink-muted">{group.reason}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {group.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </AiBlock>

      {result.selfCare.length > 0 ? (
        <Card className="p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-headline-md text-ink">
            <Lightbulb size={18} className="text-trust-text" aria-hidden />
            Việc nên làm song song với thuốc
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {result.selfCare.map((item) => (
              <li key={item} className="flex gap-2 text-body-md text-ink-muted">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-chip bg-trust" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {result.followUps.length > 0 ? (
        <Card className="p-4 md:p-5">
          <h2 className="text-headline-md text-ink">Hỏi tiếp về triệu chứng này</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {result.followUps.map((question) => (
              <li key={question}>
                <Link
                  href={`/ai/chatbot?hoi=${encodeURIComponent(question)}`}
                  className="focus-ring inline-block rounded-chip border border-hairline bg-card px-3 py-1.5 text-body-sm text-ink-muted hover:border-ai/40 hover:text-ai-text"
                >
                  {question}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}

/** Cột phải: giới hạn của tính năng và đường sang người thật. */
function ConsultAside() {
  return (
    <>
      <Card className="p-4">
        <h2 className="text-headline-md text-ink">AI này không làm gì</h2>
        <ul className="mt-3 flex flex-col gap-2.5 text-body-sm text-ink-muted">
          <li>Không chẩn đoán bệnh — chỉ mô tả lại triệu chứng và gợi ý nhóm thuốc.</li>
          <li>Không tư vấn thuốc kê đơn, không gợi ý kháng sinh.</li>
          <li>Không thay việc đi khám khi triệu chứng kéo dài hoặc nặng lên.</li>
          <li>Không dùng cho phụ nữ có thai, trẻ dưới 2 tuổi và người đang điều trị bệnh mạn tính — những trường hợp này cần dược sĩ xem trực tiếp.</li>
        </ul>
      </Card>

      <Card className="p-4">
        <h2 className="text-headline-md text-ink">Nói với dược sĩ thật</h2>
        <p className="mt-1.5 text-body-sm text-ink-muted">
          {site.professionalManager} phụ trách chuyên môn. Dược sĩ trực từ 8:00
          đến 22:00 hằng ngày.
        </p>
        <Link
          href={`tel:${site.hotline.replace(/\s/g, "")}`}
          className="focus-ring mt-3 inline-flex items-center gap-2 text-headline-md text-trust-text"
        >
          <Headset size={18} aria-hidden />
          {site.hotline}
        </Link>
      </Card>

      <p className="text-body-sm text-ink-subtle">{aiMockNotice}</p>
    </>
  );
}
