import Link from "next/link";
import { AlertTriangle, ArrowRight } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { severityLabel, type DetectedInteraction } from "@/lib/data/interactions";
import type { InteractionSeverity } from "@/lib/types";

/**
 * Cảnh báo tương tác thuốc — tính năng AI số 7.
 *
 * KHÔNG bọc trong AiBlock dù đây là kết quả máy tính ra. Lý do: khối tím là
 * quy ước "nội dung AI, đọc tham khảo", còn cảnh báo tương tác là thông tin an
 * toàn cần đọc ngay. Dùng màu đỏ theo mức nghiêm trọng để nó không bị đọc
 * bằng thái độ dành cho gợi ý AI. Nguồn dữ liệu vẫn ghi rõ ở chân khối.
 *
 * Không có nút "Bỏ qua cảnh báo" như bản thiết kế Stitch: một cú bấm làm mất
 * cảnh báo trùng liều Paracetamol là thứ không nên tồn tại. Người dùng vẫn mua
 * được bình thường — cảnh báo chỉ thông báo, không chặn.
 */
export function InteractionAlert({
  interactions,
}: {
  interactions: DetectedInteraction[];
}) {
  if (interactions.length === 0) return null;

  return (
    <section
      aria-label="Cảnh báo tương tác thuốc"
      className="rounded-card border border-danger/30 bg-danger-wash p-4 md:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-label-md text-danger">
          <AlertTriangle size={16} aria-hidden />
          Cảnh báo tương tác với giỏ hàng của bạn
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {interactions.map((item) => (
          <li
            key={`${item.withProduct.id}-${item.drugA}-${item.drugB}`}
            className="rounded-card border border-hairline bg-card p-3.5"
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <SeverityBadge severity={item.severity} />
              <span className="text-label-md text-ink">{item.withProduct.name}</span>
            </div>
            <p className="text-body-sm text-ink-muted">{item.mechanism}</p>
            <p className="mt-2 text-body-sm text-ink">
              <span className="text-label-sm text-ink-muted">Nên làm: </span>
              {item.advice}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-danger/20 pt-3">
        <Link
          href="/ai/tuong-tac"
          className="focus-ring inline-flex items-center gap-1.5 text-label-md text-danger underline decoration-danger/40 underline-offset-2"
        >
          Xem chi tiết tương tác
          <ArrowRight size={14} aria-hidden />
        </Link>
        <span className="text-body-sm text-ink-muted">
          Đối chiếu theo hoạt chất từ cơ sở dữ liệu tương tác của MediVia. Hỏi dược sĩ nếu bạn
          đang dùng thêm thuốc khác chưa có trong giỏ.
        </span>
      </div>
    </section>
  );
}

const severityStyles: Record<InteractionSeverity, string> = {
  "nghiem-trong": "bg-danger text-white",
  "trung-binh": "bg-promo-wash text-promo-text",
  nhe: "bg-recessed text-ink-muted",
};

function SeverityBadge({ severity }: { severity: InteractionSeverity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-chip px-2.5 py-0.5 text-label-sm",
        severityStyles[severity],
      )}
    >
      {severityLabel[severity]}
    </span>
  );
}
