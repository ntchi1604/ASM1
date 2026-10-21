import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { ArrowRight, Search } from "@/lib/icons";
import { adminSearch } from "@/lib/admin/search";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  description: "Tìm hàng hoá, đơn hàng, khách hàng và mọi dữ liệu quản trị trong một ô.",
};

/**
 * Tìm kiếm toàn phần quản trị.
 *
 * Form GET thuần, không state, không `use client`: kết quả đến từ máy chủ và địa
 * chỉ mang theo `?q=`, nên gửi cho đồng nghiệp là họ thấy đúng màn hình đó, còn
 * bấm Back thì quay lại đúng từ khoá cũ. Một ô tìm kiểu client chỉ lọc những
 * dòng đã tải sẵn — nó không tìm được dữ liệu ở màn khác.
 */
export default async function AdminSearchPage({
  searchParams,
}: PageProps<"/admin/tim-kiem">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const results = adminSearch(query);

  return (
    <AdminShell activeHref="/admin/tim-kiem">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-headline-xl text-ink">Tìm kiếm</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Gõ tên thuốc, mã đơn, số điện thoại, tên khách, mã ưu đãi hay tiêu đề bài
            viết — không cần dấu. Kết quả bấm được, nhảy thẳng tới đúng dòng ở màn
            tương ứng.
          </p>
        </header>

        <form role="search" action="/admin/tim-kiem" className="flex max-w-2xl items-center gap-2">
          <label htmlFor="admin-search-q" className="sr-only">
            Từ khoá tìm kiếm
          </label>
          <span className="relative flex-1">
            <Search
              size={18}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-subtle"
            />
            <Input
              id="admin-search-q"
              name="q"
              type="search"
              defaultValue={query}
              autoFocus
              placeholder="Ví dụ: hapacol, MV14094821, 0912345678, GIAM50K"
              className="pl-9"
            />
          </span>
          <button
            type="submit"
            className="focus-ring h-11 rounded-card bg-trust-text px-4 text-label-md font-semibold text-white hover:bg-trust"
          >
            Tìm
          </button>
        </form>

        {query.trim() === "" ? null : results.total === 0 ? (
          <Card className="px-5 py-6">
            <p className="text-body-md text-ink">Không có kết quả cho “{results.query}”.</p>
            <p className="mt-1.5 text-body-sm text-ink-muted">
              Thử một từ ngắn hơn: tên thuốc không cần hàm lượng, số điện thoại không
              cần dấu cách.
            </p>
          </Card>
        ) : (
          <>
            <p aria-live="polite" className="text-body-sm text-ink-muted">
              {results.total} kết quả cho “{results.query}”.
            </p>

            <div className="grid gap-4 lg:grid-cols-2">
              {results.groups.map((group) => (
                <Card as="section" key={group.key} className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3 border-b border-divider px-4 py-3">
                    <h2 className="text-label-md font-semibold text-ink">
                      {group.label}
                      <span className="ml-1.5 font-normal text-ink-subtle">{group.total}</span>
                    </h2>
                    {group.total > group.items.length ? (
                      <Link
                        href={`${group.href}?q=${encodeURIComponent(results.query)}`}
                        className="focus-ring rounded-chip text-label-sm text-trust-text hover:underline"
                      >
                        Xem tất cả
                      </Link>
                    ) : null}
                  </div>
                  <ul className="flex flex-col divide-y divide-divider">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="focus-ring group flex items-center justify-between gap-3 px-4 py-3 hover:bg-recessed"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-body-md text-ink group-hover:text-trust-text">
                              {item.title}
                            </span>
                            <span className="mt-0.5 block truncate text-body-sm text-ink-subtle">
                              {item.meta}
                            </span>
                          </span>
                          <ArrowRight
                            size={16}
                            aria-hidden
                            className="shrink-0 text-ink-subtle"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
