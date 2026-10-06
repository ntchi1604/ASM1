import Link from "next/link";
import { ChevronRight } from "@/lib/icons";

/**
 * Đường dẫn phân cấp. Mục cuối là trang hiện tại nên không phải link và
 * mang aria-current để trình đọc màn hình biết vị trí.
 */

export type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Đường dẫn" className="text-body-sm">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="focus-ring rounded text-ink-muted transition-colors hover:text-trust-text"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="font-medium text-ink"
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight size={14} className="text-ink-subtle" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
