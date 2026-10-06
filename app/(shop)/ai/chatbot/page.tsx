import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AiBlock } from "@/components/ai/AiBlock";
import { AiPageShell } from "@/components/ai/AiPageShell";
import { AiSkeleton } from "@/components/ai/AiSkeleton";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { askPharmacist, starterQuestions } from "@/lib/ai/chat";
import { aiMockNotice } from "@/lib/ai/engine";
import { site } from "@/lib/data/site";
import { ArrowRight, Bot, Headset, Send, ShieldAlert, User } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Chatbot dược sĩ AI",
  description:
    "Hỏi đáp nhanh về thuốc với AI của MediVia. Những câu hỏi cần chuyên môn thật được chuyển sang dược sĩ thay vì trả lời máy móc.",
};

/**
 * Tính năng 3 — Chatbot dược sĩ AI.
 *
 * Đây là "chatbot" nhưng KHÔNG giữ lịch sử hội thoại nhiều lượt. Lý do: mỗi câu
 * trả lời về thuốc phải đứng vững một mình. Hội thoại nhiều lượt khiến câu sau
 * dựa vào câu trước, và khi người dùng chia sẻ hay quay lại trang thì ngữ cảnh
 * mất, chỉ còn câu trả lời trống nghĩa. Một câu hỏi — một câu trả lời đầy đủ,
 * nằm trong URL, chia sẻ được cho người nhà đọc.
 *
 * Nhận `?hoi=` và `?thuoc=` vì khối QuickAsk ở trang chi tiết thuốc đã gửi đúng
 * hai tham số này từ trước.
 */
export default async function ChatbotPage({
  searchParams,
}: PageProps<"/ai/chatbot">) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const question = first(params.hoi)?.trim() ?? "";
  const aboutProduct = first(params.thuoc)?.trim();

  return (
    <AiPageShell
      icon={Bot}
      title="Chatbot dược sĩ AI"
      lead="Hỏi nhanh về cách dùng, tác dụng phụ, thời điểm uống. Những câu cần chuyên môn thật — liều cho trẻ, thai kỳ, thuốc kê đơn — được chuyển sang dược sĩ chứ không trả lời bằng máy."
      current="/ai/chatbot"
      aside={<ChatbotAside />}
    >
      <Card className="p-4 md:p-5">
        <form action="/ai/chatbot" method="get" className="flex flex-col gap-3">
          {/*
            Giữ ngữ cảnh thuốc qua các lượt hỏi: người dùng vào đây từ trang chi
            tiết Hapacol thì câu hỏi tiếp theo vẫn hiểu là hỏi về Hapacol.
          */}
          {aboutProduct ? (
            <input type="hidden" name="thuoc" value={aboutProduct} />
          ) : null}

          <label htmlFor="hoi" className="text-label-md text-ink">
            {aboutProduct ? `Hỏi về ${aboutProduct}` : "Bạn muốn hỏi gì?"}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="hoi"
              name="hoi"
              required
              defaultValue={question}
              placeholder="Ví dụ: thuốc này uống trước hay sau ăn?"
              className="sm:flex-1"
            />
            <Button type="submit" variant="solid-ai" className="sm:w-32">
              <Send size={17} aria-hidden />
              Gửi
            </Button>
          </div>
        </form>

        {aboutProduct ? (
          <p className="mt-3 text-body-sm text-ink-subtle">
            Đang hỏi trong ngữ cảnh: <span className="text-ink-muted">{aboutProduct}</span>{" "}
            <Link href="/ai/chatbot" className="focus-ring text-trust-text underline decoration-trust/30 underline-offset-2">
              Hỏi câu chung
            </Link>
          </p>
        ) : null}
      </Card>

      {question ? (
        <Suspense
          key={`${question}|${aboutProduct ?? ""}`}
          fallback={<AiSkeleton message="Dược sĩ AI đang soạn câu trả lời…" lines={3} />}
        >
          <AnswerView question={question} aboutProduct={aboutProduct} />
        </Suspense>
      ) : (
        <Card className="p-4 md:p-5">
          <h2 className="text-headline-md text-ink">Câu hỏi thường gặp</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {starterQuestions.map((starter) => (
              <li key={starter}>
                <Link
                  href={`/ai/chatbot?hoi=${encodeURIComponent(starter)}`}
                  className="focus-ring flex items-center justify-between gap-3 rounded-card bg-recessed px-3 py-2.5 text-body-md text-ink-muted hover:text-ai-text"
                >
                  {starter}
                  <ArrowRight size={16} className="shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-body-sm text-ink-subtle">{aiMockNotice}</p>
        </Card>
      )}
    </AiPageShell>
  );
}

async function AnswerView({
  question,
  aboutProduct,
}: {
  question: string;
  aboutProduct?: string;
}) {
  const answer = await askPharmacist(question, aboutProduct);

  return (
    <>
      {/* Câu hỏi hiện lại để trang đọc được như một đoạn hội thoại, dù chỉ một lượt. */}
      <div className="flex justify-end">
        <p className="flex max-w-xl items-start gap-2 rounded-card bg-trust-wash px-4 py-3 text-body-md text-ink">
          <User size={16} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
          {question}
        </p>
      </div>

      <AiBlock
        label="Dược sĩ AI"
        note={answer.needsPharmacist ? "Câu này cần dược sĩ thật" : undefined}
        disclaimer={!answer.needsPharmacist}
      >
        <div className="flex flex-col gap-3">
          {answer.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-body-md text-ink">
              {paragraph}
            </p>
          ))}

          {answer.bullets && answer.bullets.length > 0 ? (
            <ul className="flex flex-col gap-2 rounded-card bg-card p-3.5">
              {answer.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-body-md text-ink-muted">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-chip bg-ai" />
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}

          {answer.relatedSlug ? (
            <Link
              href={`/thuoc/${answer.relatedSlug}`}
              className="focus-ring inline-flex items-center gap-1.5 text-label-md text-trust-text underline decoration-trust/30 underline-offset-2"
            >
              Xem thông tin đầy đủ đã kiểm duyệt
              <ArrowRight size={15} aria-hidden />
            </Link>
          ) : null}
        </div>
      </AiBlock>

      {/*
        Khối chuyển dược sĩ tô TEAL, không tím: nội dung của nó không phải câu AI
        sinh ra mà là một đường đi tới người thật. Tô tím thì người dùng đọc thành
        "máy vẫn đang nói".
      */}
      {answer.needsPharmacist ? (
        <section
          className="rounded-card border border-trust/30 bg-trust-wash p-4 md:p-5"
          aria-label="Chuyển dược sĩ"
        >
          <h2 className="flex items-center gap-2 text-headline-md text-trust-text">
            <ShieldAlert size={19} className="shrink-0" aria-hidden />
            Câu hỏi này MediVia chuyển cho dược sĩ
          </h2>
          {answer.handoffReason ? (
            <p className="mt-1.5 text-body-md text-ink-muted">{answer.handoffReason}</p>
          ) : null}
          <p className="mt-2 text-body-sm text-ink-muted">
            Dược sĩ trực 8:00–22:00 hằng ngày. {site.professionalManager} phụ trách
            chuyên môn.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href={`tel:${site.hotline.replace(/\s/g, "")}`} variant="solid-trust">
              <Headset size={17} aria-hidden />
              Gọi {site.hotline}
            </ButtonLink>
            <ButtonLink href="/ai/tu-van" variant="outline-trust">
              Mô tả triệu chứng thay vì hỏi
            </ButtonLink>
          </div>
        </section>
      ) : null}

      {answer.followUps.length > 0 ? (
        <Card className="p-4 md:p-5">
          <h2 className="text-headline-md text-ink">Hỏi tiếp</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {answer.followUps.map((followUp) => (
              <li key={followUp}>
                <Link
                  href={{
                    pathname: "/ai/chatbot",
                    query: aboutProduct
                      ? { hoi: followUp, thuoc: aboutProduct }
                      : { hoi: followUp },
                  }}
                  className="focus-ring inline-block rounded-chip border border-hairline bg-card px-3 py-1.5 text-body-sm text-ink-muted hover:border-ai/40 hover:text-ai-text"
                >
                  {followUp}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <p className="text-body-sm text-ink-subtle">{aiMockNotice}</p>
    </>
  );
}

function ChatbotAside() {
  return (
    <>
      <Card className="p-4">
        <h2 className="text-headline-md text-ink">Bốn loại câu hỏi luôn chuyển dược sĩ</h2>
        <p className="mt-1.5 text-body-sm text-ink-muted">
          Giới hạn này cài trong hệ thống, không phụ thuộc cách bạn đặt câu hỏi.
        </p>
        <ul className="mt-3 flex flex-col gap-2.5 text-body-sm text-ink-muted">
          <li>Liều thuốc cho trẻ theo cân nặng — sai một chữ số là ngộ độc.</li>
          <li>Phụ nữ có thai và đang cho con bú.</li>
          <li>Thuốc kê đơn và kháng sinh.</li>
          <li>Dấu hiệu nghi nặng: khó thở, tức ngực, co giật, lơ mơ.</li>
        </ul>
      </Card>

      <Card className="p-4">
        <h2 className="text-headline-md text-ink">Mỗi câu trả lời đứng riêng</h2>
        <p className="mt-1.5 text-body-sm text-ink-muted">
          Chatbot này không dựa vào lượt hỏi trước. Cách đó có vẻ kém tiện, nhưng
          đổi lại mỗi câu trả lời về thuốc là đầy đủ một mình — bạn gửi đường dẫn
          cho người nhà đọc thì họ hiểu đúng, không thiếu ngữ cảnh.
        </p>
      </Card>
    </>
  );
}
