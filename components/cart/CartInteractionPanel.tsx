import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldCheck } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { severityLabel, type CartInteraction } from "@/lib/data/interactions";
import type { InteractionSeverity } from "@/lib/types";

/**
 * Soát tương tác cho cả giỏ hàng — tính năng AI số 7 ở ngữ cảnh giỏ hàng.
 *
 * Khác khối ở trang chi tiết: mỗi cảnh báo phải gọi tên CẢ HAI thuốc, vì ở đây
 * người dùng đang nhìn một danh sách và cần biết cặp nào xung đột với cặp nào.
 *
 * Số vấn đề trong tiêu đề đếm từ dữ liệu thật, không gõ cứng: nói "2 vấn đề"
 * trong khi chỉ hiện 1 là báo sai chính chỗ không được phép sai.
 */
export function CartInteractionPanel({
  interactions,
}: {
  interactions: CartInteraction[];
}) {
  if (interactions.length === 0) {
    return (
      <section
        aria-label="Kết quả soát tương tác"
        className="flex items-start gap-2.5 rounded-card border border-trust/25 bg-trust-wash p-4"
      >
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
        <div>
          <p className="text-label-md text-ink">
            Không phát hiện tương tác giữa các thuốc trong giỏ
          </p>
          <p className="mt-0.5 text-body-sm text-ink-muted">
            Đã đối chiếu theo hoạt chất. Vẫn nên hỏi dược sĩ nếu bạn đang dùng thêm
            thuốc khác chưa có trong giỏ.
          </p>
        </div>
      </section>
    );
  }

  const severe = interactions.filter((item) => item.severity === "nghiem-trong").length;

  return (
    <section
      aria-label="Cảnh báo tương tác trong giỏ hàng"
      className="rounded-card border border-danger/30 bg-danger-wash p-4 md:p-5"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />
        <div>
          <p className="text-label-md text-danger">
            Phát hiện {interactions.length}{" "}
            {interactions.length === 1 ? "vấn đề" : "vấn đề"} trong giỏ hàng của bạn
            {severe > 0 ? `, trong đó ${severe} nghiêm trọng` : ""}
          </p>
          <p className="mt-0.5 text-body-sm text-ink-muted">
            Nên kiểm tra liều dùng trước khi đặt mua.
          </p>
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-3">
        {interactions.map((item) => (
          <li
            key={`${item.productA.id}-${item.productB.id}`}
            className="rounded-card border border-hairline bg-card p-3.5"
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <SeverityBadge severity={item.severity} />
              <span className="text-label-md text-ink">
                {item.productA.name} + {item.productB.name}
              </span>
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
          Tra cứu chi tiết tương tác
          <ArrowRight size={14} aria-hidden />
        </Link>
        <span className="text-body-sm text-ink-muted">
          Đối chiếu theo hoạt chất từ cơ sở dữ liệu của MediVia, không thay thế tư vấn
          của dược sĩ.
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
