import Link from "next/link";
import { ArrowRight } from "@/lib/icons";
import { SectionHeading } from "@/components/ui/Card";
import { getFeaturedCategories } from "@/lib/data/categories";

export function CategoryGrid() {
  // Gọi trong thân hàm: gọi ở phạm vi module là chốt cứng tám danh mục lúc khởi
  // động, và danh mục quản trị thêm sau đó không bao giờ lên được trang chủ.
  const featuredCategories = getFeaturedCategories();

  return (
    <section className="container-medivia pb-8 md:pb-10">
      <SectionHeading
        title="Danh mục nổi bật"
        action={
          <Link
            href="/danh-muc/thuoc"
            className="focus-ring inline-flex items-center gap-1.5 text-label-md text-trust-text hover:underline"
          >
            Xem tất cả
            <ArrowRight size={16} aria-hidden />
          </Link>
        }
      />

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {featuredCategories.map(({ slug, shortName, icon: Icon }) => (
          <li key={slug}>
            <Link
              href={`/danh-muc/${slug}`}
              className="focus-ring flex h-full flex-col items-center gap-2 rounded-card border border-hairline bg-card p-3 text-center transition-colors hover:border-trust"
            >
              <span className="flex size-12 items-center justify-center rounded-chip bg-trust-wash text-trust-text">
                <Icon size={22} aria-hidden />
              </span>
              <span className="text-body-sm text-ink">{shortName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
