import Link from "next/link";
import { cn } from "@/lib/cn";
import { ChevronLeft, ChevronRight } from "@/lib/icons";

/**
 * Phân trang bằng link thật để hoạt động không cần JavaScript và mỗi trang
 * có URL riêng. buildHref do trang gọi cung cấp nên các tham số lọc hiện
 * tại được giữ nguyên khi chuyển trang.
 */

/** Rút gọn dãy số trang: luôn giữ trang đầu, trang cuối và lân cận trang hiện tại. */
function pageItems(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = [1, total, current, current - 1, current + 1];
  const sorted = [...new Set(wanted)]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push("gap");
    items.push(page);
  });
  return items;
}

const cellBase = "grid size-9 place-items-center rounded-card border text-body-sm transition-colors";

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-1.5">
      <PageArrow
        href={buildHref(currentPage - 1)}
        enabled={currentPage > 1}
        label="Trang trước"
        icon="prev"
      />

      {pageItems(currentPage, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1.5 text-ink-subtle" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            aria-label={`Trang ${item}`}
            aria-current={item === currentPage ? "page" : undefined}
            className={cn(
              "focus-ring tabular-nums",
              cellBase,
              item === currentPage
                ? "border-trust bg-trust font-semibold text-white"
                : "border-hairline bg-card text-ink-muted hover:border-trust hover:text-trust-text",
            )}
          >
            {item}
          </Link>
        ),
      )}

      <PageArrow
        href={buildHref(currentPage + 1)}
        enabled={currentPage < totalPages}
        label="Trang sau"
        icon="next"
      />
    </nav>
  );
}

function PageArrow({
  href,
  enabled,
  label,
  icon,
}: {
  href: string;
  enabled: boolean;
  label: string;
  icon: "prev" | "next";
}) {
  const Icon = icon === "prev" ? ChevronLeft : ChevronRight;
  const glyph = <Icon size={16} aria-hidden />;

  // Không có trang trước/sau: render span để không tạo link dẫn tới hư không.
  if (!enabled) {
    return (
      <span aria-hidden className={cn(cellBase, "border-divider bg-recessed text-ink-subtle")}>
        {glyph}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "focus-ring",
        cellBase,
        "border-hairline bg-card text-ink-muted hover:border-trust hover:text-trust-text",
      )}
    >
      {glyph}
    </Link>
  );
}
