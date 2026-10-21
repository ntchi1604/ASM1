import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/article/CommentSection";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { articles } from "@/lib/data/home";
import { getArticleBySlug, getOtherArticles } from "@/lib/data/articles";
import { getComments } from "@/lib/data/comments";
import { formatDate } from "@/lib/format";
import { AlertTriangle, Clock, Stethoscope } from "@/lib/icons";

/**
 * Chi tiết bài viết.
 *
 * Không có `dynamicParams = false`: route này nằm DƯỚI `/goc-suc-khoe`, không
 * tranh chấp với route động một cấp `[page]` ở `(shop)`, nên không có nguy cơ
 * nuốt đường dẫn lạ. Slug lạ đã bị `getArticleBySlug` chặn bằng `notFound()`.
 */
export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/goc-suc-khoe/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Không tìm thấy bài viết" };
  return { title: article.meta.title, description: article.meta.excerpt };
}

export default async function HealthArticlePage({
  params,
  searchParams,
}: PageProps<"/goc-suc-khoe/[slug]">) {
  const { slug } = await params;
  const { "binh-luan": commentCode } = await searchParams;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const { meta, blocks } = article;

  return (
    <div className="container-medivia py-5 md:py-8">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Góc sức khoẻ", href: "/goc-suc-khoe" },
          { label: meta.title },
        ]}
      />

      <article className="mt-4 max-w-3xl">
        <span className="inline-block rounded-chip bg-trust-wash px-2 py-0.5 text-label-sm text-trust-text">
          {meta.tag}
        </span>
        <h1 className="mt-3 text-headline-xl text-ink">{meta.title}</h1>
        <p className="mt-2 text-body-lg text-ink-muted">{meta.excerpt}</p>
        <p className="mt-3 text-label-sm text-ink-subtle">
          {meta.author} · {formatDate(meta.date)}
          <span className="ml-2 inline-flex items-center gap-1">
            <Clock size={13} aria-hidden />
            {meta.readingMinutes} phút đọc
          </span>
        </p>

        <div className="mt-6 flex flex-col gap-4 rounded-card border border-hairline bg-card p-4 md:p-6">
          {blocks.map((block, index) => {
            if (block.kind === "warning") {
              return (
                <p
                  key={index}
                  className="flex items-start gap-2.5 rounded-card border border-danger/30 bg-danger-wash p-3.5 text-body-md text-ink"
                >
                  <AlertTriangle size={17} className="mt-0.5 shrink-0 text-danger" aria-hidden />
                  <span>{block.text}</span>
                </p>
              );
            }
            if (block.kind === "list") {
              return (
                <ul key={index} className="flex list-disc flex-col gap-2 pl-5 text-body-md text-ink-muted">
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={index} className="text-body-md text-ink-muted">
                {block.text}
              </p>
            );
          })}
        </div>
      </article>

      <aside className="mt-6 flex max-w-3xl flex-wrap items-start gap-3 rounded-card border border-hairline bg-card p-4">
        <Stethoscope size={18} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-label-md text-ink">Bài viết không thay cho khám bệnh</h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Cùng một triệu chứng ở hai người có bệnh nền khác nhau có thể cần xử lý khác
            nhau. Đang dùng thuốc theo đơn? Hỏi bác sĩ hoặc dược sĩ trước khi thêm bất kỳ
            loại nào.
          </p>
          <ButtonLink href="/lien-he" variant="outline-trust" size="sm" className="mt-3">
            Liên hệ dược sĩ
          </ButtonLink>
        </div>
      </aside>

      <CommentSection
        articleSlug={slug}
        comments={getComments(slug)}
        messageCode={typeof commentCode === "string" ? commentCode : undefined}
      />

      <section className="mt-8 max-w-3xl">
        <h2 className="text-headline-md text-ink">Đọc tiếp</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {getOtherArticles(slug).map((other) => (
            <Card as="li" key={other.slug} className="p-4">
              <h3 className="font-headline text-body-lg font-medium text-ink">
                <Link
                  href={`/goc-suc-khoe/${other.slug}`}
                  className="focus-ring rounded-chip hover:text-trust-text"
                >
                  {other.title}
                </Link>
              </h3>
              <p className="mt-2 text-body-sm text-ink-muted">{other.excerpt}</p>
            </Card>
          ))}
        </ul>
      </section>
    </div>
  );
}