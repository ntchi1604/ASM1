import Link from "next/link";
import { buildCategoryHref, type ViewMode } from "@/lib/category-query";
import { buildFilterGroups, countMatches, type FilterState } from "@/lib/filters";
import { cn } from "@/lib/cn";
import { Check, SlidersHorizontal } from "@/lib/icons";
import type { Product } from "@/lib/types";

/**
 * Sidebar bộ lọc. Mỗi lựa chọn là một link đổi URL nên lọc được khi
 * JavaScript chưa tải, và số đếm bên phải đếm từ dữ liệu thật — lựa chọn
 * không có hàng nào hiện 0 và bị làm mờ thay vì biến mất, để người dùng
 * biết bộ lọc đó có tồn tại.
 */
export function FilterSidebar({
  basePath,
  categoryProducts,
  state,
  view,
}: {
  basePath: string;
  /** Toàn bộ sản phẩm của danh mục, chưa lọc — dùng để đếm. */
  categoryProducts: Product[];
  state: FilterState;
  view: ViewMode;
}) {
  const groups = buildFilterGroups(categoryProducts);

  return (
    <aside aria-label="Bộ lọc sản phẩm" className="w-full lg:w-[248px] lg:shrink-0">
      <div className="rounded-card border border-hairline bg-card">
        <div className="flex items-center gap-2 border-b border-divider px-4 py-3">
          <SlidersHorizontal size={16} className="text-trust-text" aria-hidden />
          <h2 className="text-label-md text-ink">Bộ lọc</h2>
        </div>

        <PriceFilter basePath={basePath} state={state} view={view} />

        {groups.map((group) => (
          <fieldset key={group.key} className="border-b border-divider px-4 py-3.5 last:border-b-0">
            <legend className="mb-2.5 text-label-md text-ink">{group.title}</legend>
            <ul className="space-y-0.5">
              {group.options.map((option) => {
                const count = countMatches(categoryProducts, option);
                const checked = state[group.key].includes(option.value);
                return (
                  <li key={option.value}>
                    <Link
                      href={buildCategoryHref(basePath, state, view, {
                        toggle: { key: group.key, value: option.value },
                      })}
                      aria-pressed={checked}
                      className={cn(
                        "focus-ring group -mx-1.5 flex items-start gap-2.5 rounded-card px-1.5 py-1.5 transition-colors",
                        count === 0 && !checked ? "opacity-45" : "hover:bg-recessed",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors",
                          checked
                            ? "border-trust bg-trust text-white"
                            : "border-hairline bg-card group-hover:border-trust",
                        )}
                      >
                        {checked ? <Check size={11} strokeWidth={3} aria-hidden /> : null}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-body-sm",
                            checked ? "font-medium text-trust-text" : "text-ink",
                          )}
                        >
                          {option.label}
                        </span>
                        {option.note ? (
                          <span className="mt-0.5 block text-label-sm font-normal text-ink-subtle">
                            {option.note}
                          </span>
                        ) : null}
                      </span>

                      <span className="mt-0.5 shrink-0 text-label-sm font-normal text-ink-subtle tabular-nums">
                        {count}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </div>
    </aside>
  );
}

/**
 * Khoảng giá. Là form GET nên hoạt động không cần JavaScript; các điều kiện
 * lọc khác đi kèm dưới dạng input ẩn để không bị mất khi bấm Áp dụng.
 */
function PriceFilter({
  basePath,
  state,
  view,
}: {
  basePath: string;
  state: FilterState;
  view: ViewMode;
}) {
  const hidden: { name: string; value: string }[] = [];
  if (state.type.length) hidden.push({ name: "type", value: state.type.join(",") });
  if (state.dosageForm.length) hidden.push({ name: "dang", value: state.dosageForm.join(",") });
  if (state.audience.length) hidden.push({ name: "doi-tuong", value: state.audience.join(",") });
  if (state.brand.length) hidden.push({ name: "thuong-hieu", value: state.brand.join(",") });
  if (state.origin.length) hidden.push({ name: "nuoc", value: state.origin.join(",") });
  if (state.sort !== "lien-quan") hidden.push({ name: "sort", value: state.sort });
  if (view !== "grid") hidden.push({ name: "xem", value: view });

  return (
    <form action={basePath} method="get" className="border-b border-divider px-4 py-3.5">
      <fieldset>
        <legend className="mb-2.5 text-label-md text-ink">Khoảng giá</legend>

        {hidden.map((field) => (
          <input key={field.name} type="hidden" name={field.name} value={field.value} />
        ))}

        <div className="flex items-center gap-2">
          <PriceInput name="gia-tu" label="Giá từ" placeholder="0" defaultValue={state.priceFrom} />
          <span className="text-ink-subtle" aria-hidden>
            –
          </span>
          <PriceInput
            name="gia-den"
            label="Giá đến"
            placeholder="1.000.000"
            defaultValue={state.priceTo}
          />
        </div>

        <button
          type="submit"
          className="focus-ring mt-2.5 w-full rounded-card border border-trust py-1.5 text-label-md text-trust-text transition-colors hover:bg-trust-wash"
        >
          Áp dụng
        </button>
      </fieldset>
    </form>
  );
}

function PriceInput({
  name,
  label,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: number;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={name} className="sr-only">
        {label}
      </label>
      <span
        className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-body-sm text-ink-subtle"
        aria-hidden
      >
        ₫
      </span>
      <input
        id={name}
        name={name}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="focus-ring w-full rounded-card border border-hairline bg-card py-1.5 pr-2 pl-6 text-body-sm text-ink tabular-nums placeholder:text-ink-subtle"
      />
    </div>
  );
}
