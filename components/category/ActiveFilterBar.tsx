import Link from "next/link";
import { RemovableChip } from "@/components/ui/Chip";
import { buildCategoryHref, type ViewMode } from "@/lib/category-query";
import { buildFilterGroups, type FilterState } from "@/lib/filters";
import { formatVnd } from "@/lib/format";
import { ListFilter } from "@/lib/icons";
import type { Product } from "@/lib/types";

/**
 * Dải chip hiện các điều kiện đang lọc, mỗi chip bỏ được. Nhãn chip lấy từ
 * cùng định nghĩa với sidebar nên không bao giờ lệch chữ.
 */
export function ActiveFilterBar({
  basePath,
  categoryProducts,
  state,
  view,
}: {
  basePath: string;
  categoryProducts: Product[];
  state: FilterState;
  view: ViewMode;
}) {
  const chips: { key: string; label: string; href: string; removeLabel: string }[] = [];

  buildFilterGroups(categoryProducts).forEach((group) => {
    state[group.key].forEach((value) => {
      const option = group.options.find((o) => o.value === value);
      if (!option) return;
      chips.push({
        key: `${group.key}-${value}`,
        label: option.label,
        href: buildCategoryHref(basePath, state, view, { toggle: { key: group.key, value } }),
        removeLabel: `Bỏ lọc ${option.label}`,
      });
    });
  });

  if (state.priceFrom || state.priceTo) {
    const from = state.priceFrom ? formatVnd(state.priceFrom) : formatVnd(0);
    chips.push({
      key: "price",
      label: state.priceTo ? `${from} – ${formatVnd(state.priceTo)}` : `Từ ${from}`,
      href: buildCategoryHref(
        basePath,
        { ...state, priceFrom: undefined, priceTo: undefined },
        view,
      ),
      removeLabel: "Bỏ lọc khoảng giá",
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-card border border-hairline bg-card px-3.5 py-3">
      <span className="inline-flex items-center gap-1.5 text-body-sm text-ink-muted">
        <ListFilter size={14} aria-hidden />
        Đang lọc
      </span>

      {chips.map((chip) => (
        <RemovableChip key={chip.key} href={chip.href} removeLabel={chip.removeLabel}>
          {chip.label}
        </RemovableChip>
      ))}

      <Link
        href={buildCategoryHref(basePath, state, view, { clearAll: true })}
        className="focus-ring ml-auto rounded text-body-sm text-ink-muted underline decoration-dotted underline-offset-4 transition-colors hover:text-danger"
      >
        Bỏ tất cả
      </Link>
    </div>
  );
}
