import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, ExternalLink, Pill } from "@/lib/icons";
import { AiBlock } from "@/components/ai/AiBlock";
import type { ProductDetail } from "@/lib/types";

/**
 * Tóm tắt thông tin thuốc — tính năng AI số 6.
 *
 * Ba nhóm cố định theo đúng thứ tự người đang cần thuốc muốn đọc: dùng để làm
 * gì → dùng thế nào → cần lưu ý. Nhóm "cần lưu ý" tô đỏ vì đây là phần duy
 * nhất có thể gây hại nếu bỏ qua.
 *
 * Link về tài liệu gốc nằm ngay trên đầu: nội dung AI tóm tắt phải luôn truy
 * ngược được về nguồn, nếu không thì không ai kiểm tra được nó đúng hay sai.
 */
export function AiSummary({ detail }: { detail: ProductDetail }) {
  return (
    <AiBlock label="Tóm tắt dễ hiểu" note="Trích xuất từ tờ hướng dẫn sử dụng, dược sĩ MediVia đã rà soát">
      <p className="mb-4 text-body-sm">
        <Link
          href="#thong-tin-chi-tiet"
          className="focus-ring inline-flex items-center gap-1.5 text-ai-text underline decoration-ai/40 underline-offset-2"
        >
          {detail.manufacturerSourceLabel}
          <ExternalLink size={14} aria-hidden />
        </Link>
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryGroup
          icon={<Activity size={16} aria-hidden />}
          title="Dùng để làm gì"
          items={detail.uses}
        />
        <SummaryGroup
          icon={<Pill size={16} aria-hidden />}
          title="Dùng thế nào"
          items={detail.dosage}
        />
        <SummaryGroup
          icon={<AlertTriangle size={16} aria-hidden />}
          title="Cần lưu ý"
          items={detail.cautions}
          tone="danger"
        />
      </div>
    </AiBlock>
  );
}

function SummaryGroup({
  icon,
  title,
  items,
  tone = "normal",
}: {
  icon: ReactNode;
  title: string;
  items: string[];
  tone?: "normal" | "danger";
}) {
  const danger = tone === "danger";

  return (
    <div className="rounded-card border border-hairline bg-card p-3.5">
      <p
        className={
          danger
            ? "mb-2 flex items-center gap-2 text-label-md text-danger"
            : "mb-2 flex items-center gap-2 text-label-md text-ink"
        }
      >
        <span className={danger ? "text-danger" : "text-trust-text"}>{icon}</span>
        {title}
      </p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-body-sm text-ink-muted">
            <span
              aria-hidden
              className={
                danger
                  ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-danger"
                  : "mt-1.5 size-1.5 shrink-0 rounded-full bg-trust"
              }
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
