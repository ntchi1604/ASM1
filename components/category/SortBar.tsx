import Link from "next/link";
import { buildCategoryHref, type ViewMode } from "@/lib/category-query";
import { sortOptions, type FilterState } from "@/lib/filters";
import { cn } from "@/lib/cn";
import { ArrowUpDown, LayoutGrid, ListView } from "@/lib/icons";

/**
 * Thanh sắp xếp và chuyển kiểu xem. Cũng dùng link để trạng thái nằm trong
 * URL, đồng bộ với bộ lọc.
 */
export function SortBar({
  basePath,
  state,
  view,
  resultCount,
}: {
  basePath: string;
  state: FilterState;
  view: ViewMode;
  /** Số sản phẩm sau khi lọc. */
  resultCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-card border border-hairline bg-card px-3.5 py-2.5">
      <span className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted">
        <ArrowUpDown size={14} aria-hidden />
        Sắp xếp
      </span>

      <div role="group" aria-label="Sắp xếp sản phẩm" className="flex flex-wrap items-center gap-1">
        {sortOptions.map((option) => {
          const active = state.sort === option.key;
          return (
            <Link
              key={option.key}
              href={buildCategoryHref(basePath, state, view, { sort: option.key })}
              aria-current={active ? "true" : undefined}
              className={cn(
                "focus-ring rounded-chip px-3 py-1.5 text-body-sm transition-colors",
                active
                  ? "bg-trust-wash font-medium text-trust-text"
                  : "text-ink-muted hover:bg-recessed hover:text-ink",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-body-sm text-ink-muted sm:inline">
          {resultCount} sản phẩm
        </span>
        <div
          role="group"
          aria-label="Kiểu hiển thị"
          className="flex items-center gap-0.5 rounded-card border border-hairline p-0.5"
        >
          <ViewToggle
            href={buildCategoryHref(basePath, state, view, { view: "grid" })}
            active={view === "grid"}
            label="Xem dạng lưới"
            icon="grid"
          />
          <ViewToggle
            href={buildCategoryHref(basePath, state, view, { view: "list" })}
            active={view === "list"}
            label="Xem dạng danh sách"
            icon="list"
          />
        </div>
      </div>
    </div>
  );
}

function ViewToggle({
  href,
  active,
  label,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: "grid" | "list";
}) {
  const Icon = icon === "grid" ? LayoutGrid : ListView;
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "true" : undefined}
      className={cn(
        "focus-ring grid size-7 place-items-center rounded-card transition-colors",
        active ? "bg-trust text-white" : "text-ink-subtle hover:bg-recessed hover:text-ink",
      )}
    >
      <Icon size={15} aria-hidden />
    </Link>
  );
}
