import type { ReactNode } from "react";
import type { LucideIcon } from "@/lib/icons";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AiToolSwitcher } from "@/components/ai/AiToolSwitcher";

/**
 * Khung chung cho 6 trang AI.
 *
 * Sáu tính năng AI được làm ở sáu thời điểm khác nhau, nên nếu mỗi trang tự vẽ
 * tiêu đề và breadcrumb thì sáu trang sẽ lệch nhau — đúng thứ phải tránh. Trang
 * AI chỉ còn việc điền phần thân.
 *
 * Thanh chuyển công cụ luôn có ở cuối: người dùng thường không biết mình cần
 * tính năng nào cho tới khi thử một cái. Bắt họ quay về trang chủ để đổi sang
 * tính năng khác là bắt họ làm lại từ đầu.
 */
export function AiPageShell({
  icon: Icon,
  title,
  lead,
  current,
  children,
  aside,
}: {
  icon: LucideIcon;
  title: string;
  /** Một câu nói rõ tính năng này làm gì và KHÔNG làm gì. */
  lead: string;
  /** Đường dẫn của chính trang này, để thanh chuyển công cụ tự ẩn nó đi. */
  current: string;
  children: ReactNode;
  /** Cột phải trên desktop. Bỏ trống thì phần thân chiếm toàn bộ chiều ngang. */
  aside?: ReactNode;
}) {
  return (
    <div className="container-medivia py-5 md:py-7">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Công cụ AI", href: "/#cong-cu-ai" },
          { label: title },
        ]}
      />

      <header className="mt-4 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-card bg-ai-wash text-ai-text">
          <Icon size={22} aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-headline-xl text-ink">{title}</h1>
          <p className="mt-1 max-w-2xl text-body-md text-ink-muted">{lead}</p>
        </div>
      </header>

      <div
        className={
          aside
            ? "mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
            : "mt-6"
        }
      >
        <div className="flex min-w-0 flex-col gap-5">{children}</div>
        {aside ? (
          <div className="flex flex-col gap-4 lg:sticky lg:top-6">{aside}</div>
        ) : null}
      </div>

      <AiToolSwitcher current={current} />
    </div>
  );
}
