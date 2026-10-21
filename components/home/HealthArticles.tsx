import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "@/lib/icons";
import { SectionHeading } from "@/components/ui/Card";
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

      <ul className="grid gap-6 md:grid-cols-3">
        {articles.map((article) => (
          <li key={article.slug} className="group">
            <article className="flex h-full flex-col">
              <Link
                href={`/goc-suc-khoe/${article.slug}`}
                className="focus-ring block overflow-hidden rounded-card"
                tabIndex={-1}
              >
                <Image
                  src={article.image}
                  alt=""
                  width={480}
                  height={270}
                  sizes="(max-width: 768px) 100vw, 380px"
                  className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>

              <p className="mt-3 text-label-sm font-semibold tracking-wider text-trust-text uppercase">
                {article.tag}
              </p>

              <h3 className="mt-1.5 font-headline text-[16px] leading-snug font-bold text-ink">
                <Link
                  href={`/goc-suc-khoe/${article.slug}`}
                  className="focus-ring hover:text-trust-text"
                >
                  {article.title}
                </Link>
              </h3>

              <p className="mt-2 text-[13px] text-ink-muted">{article.excerpt}</p>

              <p className="mt-auto flex items-center gap-2 border-t border-divider pt-3 text-label-sm text-ink-subtle">
                <span>
                  {article.author} · {formatDate(article.date)}
                </span>
                <span className="ml-auto inline-flex items-center gap-1">
                  <Clock size={13} aria-hidden />
                  {article.readingMinutes} phút
                </span>
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
