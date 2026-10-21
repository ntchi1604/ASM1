import Link from "next/link";
import { Search, X } from "@/lib/icons";
import { Input, Select } from "@/components/ui/Field";

export type FilterSelect = {
  name: string;
  label: string;
  value?: string;
  /** Giá trị rỗng = "tất cả", luôn đứng đầu. */
  options: { value: string; label: string }[];
};

/**
 * Thanh lọc dùng chung cho mọi màn quản trị.
 *
 * Form GET thuần, không `use client`: bộ lọc nằm trong địa chỉ nên gửi link cho
 * đồng nghiệp là họ thấy đúng màn hình đang xem, bấm Back quay lại đúng bộ lọc
 * cũ, và tải lại trang không mất lựa chọn. Lọc phía client chỉ sửa được những
 * dòng đã tải sẵn — nó không lọc được dữ liệu máy chủ chưa gửi xuống.
 *
 * Ô chọn tự gửi khi đổi? Không. Cần JS, mà thêm JS cho một hàng select là đánh
 * đổi thứ chạy được ở mọi nơi lấy một cú bấm nút "Lọc" — cùng lắm là Enter.
 */
export function AdminFilterBar({
  action,
  query,
  placeholder,
  selects = [],
}: {
  action: string;
  query?: string;
  placeholder: string;
  selects?: FilterSelect[];
}) {
  const active = Boolean(query) || selects.some((select) => select.value);

  return (
    <form
      role="search"
      action={action}
      className="flex flex-wrap items-center gap-2 rounded-card border border-hairline bg-card p-3"
    >
      <span className="relative min-w-48 flex-1">
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-subtle"
        />
        <label htmlFor="admin-filter-q" className="sr-only">
          Tìm trong danh sách
        </label>
        <Input
          id="admin-filter-q"
          name="q"
          type="search"
          defaultValue={query ?? ""}
          placeholder={placeholder}
          className="pl-9"
        />
      </span>

      {selects.map((select) => (
        <span key={select.name} className="min-w-40">
          <label htmlFor={`admin-filter-${select.name}`} className="sr-only">
            {select.label}
          </label>
          <Select
            id={`admin-filter-${select.name}`}
            name={select.name}
            defaultValue={select.value ?? ""}
            title={select.label}
          >
            <option value="">{select.label}: tất cả</option>
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </span>
      ))}

      <button
        type="submit"
        className="focus-ring h-11 rounded-card bg-trust-text px-4 text-label-md font-semibold text-white hover:bg-trust"
      >
        Lọc
      </button>

      {active ? (
        <Link
          href={action}
          className="focus-ring inline-flex h-11 items-center gap-1.5 rounded-card px-3 text-label-sm text-ink-muted hover:bg-recessed hover:text-ink"
        >
          <X size={15} aria-hidden />
          Xoá lọc
        </Link>
      ) : null}
    </form>
  );
}
