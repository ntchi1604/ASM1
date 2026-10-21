import Link from "next/link";
import { ArrowRight } from "@/lib/icons";
import { SectionHeading } from "@/components/ui/Card";
import { categoryIcons, getFeaturedCategories } from "@/lib/data/categories";

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
        {featuredCategories.map(({ slug, shortName, icon }) => {
          const Icon = categoryIcons[icon];
          return (
            <li key={slug}>
              <Link
                href={`/danh-muc/${slug}`}
                className="focus-ring group flex h-full flex-col items-center gap-2.5 rounded-card border border-hairline bg-card p-3 text-center transition-colors hover:border-trust"
              >
                {/* Giữ teal cho cả 8 ô: quy ước 4 màu của dự án cấm thêm màu
                    chỉ để trang trí. Khác Stitch ở điểm này, giống Stitch ở
                    kích thước vòng tròn và hiệu ứng phóng khi rê. */}
                <span className="flex size-12 items-center justify-center rounded-chip bg-trust-wash text-trust-text transition-transform group-hover:scale-105">
                  <Icon size={22} aria-hidden />
                </span>
                <span className="text-body-sm text-ink">{shortName}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
