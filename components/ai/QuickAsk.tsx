import Link from "next/link";
import { ArrowRight, Send } from "@/lib/icons";
import { AiBlock } from "@/components/ai/AiBlock";

/**
 * "Hỏi nhanh về thuốc" — cửa vào chatbot dược sĩ AI (tính năng số 3) đặt ngay
 * cạnh thuốc đang xem.
 *
 * Câu hỏi gợi ý viết riêng cho từng thuốc trong product-details.ts. Gợi ý
 * chung chung kiểu "Thuốc này dùng thế nào?" thì không ai bấm, vì câu trả lời
 * đã nằm ngay trong khối tóm tắt phía trên.
 *
 * Ô nhập là form GET sang /ai/chatbot: câu hỏi đi theo URL nên chatbot mở ra
 * đã có sẵn nội dung, không bắt người dùng gõ lại.
 */
export function QuickAsk({
  questions,
  productName,
}: {
  questions: string[];
  productName: string;
}) {
  return (
    <AiBlock label="Hỏi nhanh về thuốc" note="Dược sĩ AI trả lời trong vài giây">
      <ul className="flex flex-col gap-2">
        {questions.map((question) => (
          <li key={question}>
            <Link
              href={`/ai/chatbot?hoi=${encodeURIComponent(question)}&thuoc=${encodeURIComponent(productName)}`}
              className="focus-ring flex items-center justify-between gap-3 rounded-card border border-hairline bg-card px-3.5 py-2.5 text-body-sm text-ink transition-colors hover:border-ai/40"
            >
              {question}
              <ArrowRight size={16} className="shrink-0 text-ai-text" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <form action="/ai/chatbot" method="get" className="mt-3 flex gap-2">
        <input type="hidden" name="thuoc" value={productName} />
        <input
          type="text"
          name="hoi"
          placeholder="Hỏi điều khác về thuốc này"
          aria-label={`Câu hỏi về ${productName}`}
          className="focus-ring min-w-0 flex-1 rounded-card border border-hairline bg-card px-3.5 py-2.5 text-body-sm text-ink placeholder:text-ink-subtle"
        />
        <button
          type="submit"
          aria-label="Gửi câu hỏi cho dược sĩ AI"
          className="focus-ring inline-flex items-center gap-1.5 rounded-card bg-ai px-3.5 py-2.5 text-label-md text-white transition-opacity hover:opacity-90"
        >
          <Send size={16} aria-hidden />
          Gửi
        </button>
      </form>
    </AiBlock>
  );
}
