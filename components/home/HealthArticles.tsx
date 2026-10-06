import Link from "next/link";
import { ArrowRight, Clock } from "@/lib/icons";
import { Card, SectionHeading } from "@/components/ui/Card";
import { articles } from "@/lib/data/home";
import { formatDate } from "@/lib/format";

export function HealthArticles() {
  return (
    <section className="container-medivia pb-10 md:pb-14">
      <SectionHeading
        title="Góc sức khoẻ và lời khuyên dược sĩ"
        action={
          <Link
            href="/goc-suc-khoe"
            className="focus-ring inline-flex items-center gap-1.5 text-label-md text-trust-text hover:underline"
          >
            Xem thêm bài viết
            <ArrowRight size={16} aria-hidden />
          </Link>
        }
      />

      <p className="-mt-2 mb-4 text-body-sm text-ink-muted">
        Kiến thức dùng thuốc đúng liều, an toàn — viết và kiểm duyệt bởi dược sĩ
        đại học.
      </p>

      <ul className="grid gap-4 md:grid-cols-3">
        {articles.map((article) => (
          <Card as="li" key={article.slug} className="flex flex-col p-4">
            <span className="self-start rounded-chip bg-trust-wash px-2 py-0.5 text-label-sm text-trust-text">
              {article.tag}
            </span>

            <h3 className="mt-3 font-headline text-body-lg font-medium text-ink">
              <Link
                href={`/goc-suc-khoe/${article.slug}`}
                className="focus-ring hover:text-trust-text"
              >
                {article.title}
              </Link>
            </h3>

            <p className="mt-2 text-body-sm text-ink-muted">{article.excerpt}</p>

            <p className="mt-auto pt-3 text-label-sm text-ink-subtle">
              {article.author} · {formatDate(article.date)}
              <span className="ml-2 inline-flex items-center gap-1">
                <Clock size={13} aria-hidden />
                {article.readingMinutes} phút đọc
              </span>
            </p>
          </Card>
        ))}
      </ul>
    </section>
  );
}
