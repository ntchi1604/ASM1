import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/ContentPage";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { articles } from "@/lib/data/home";
import { formatDate } from "@/lib/format";
import { Clock, Sparkles, Stethoscope } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Góc sức khoẻ",
  description:
    "Bài viết dùng thuốc an toàn, viết và kiểm duyệt bởi dược sĩ đại học.",
};

/**
 * Góc sức khoẻ — danh sách bài viết.
 *
 * Bài ở đây do DƯỢC SĨ viết, không phải AI. Nên cả trang KHÔNG dùng màu tím: tím
 * trên site này nghĩa là "nội dung do máy tạo, cần kiểm chứng", và dùng tím cho
 * bài đã kiểm duyệt là làm mất nghĩa của màu đó ở đúng những chỗ cần nó.
 *
 * Khối AI duy nhất được phép có mặt là lời mời tra tương tác — và đó là công cụ,
 * không phải nội dung.
 */
export default function HealthArticlesPage() {
  return (
    <ContentPage
      title="Góc sức khoẻ"
      lead="Kiến thức dùng thuốc đúng liều, an toàn. Bài viết do dược sĩ đại học viết và kiểm duyệt — không phải nội dung do AI tạo."
    >
      <ul className="flex flex-col gap-3">
        {articles.map((article) => (
          <Card as="li" key={article.slug} className="p-4 md:p-5">
            <span className="inline-block rounded-chip bg-trust-wash px-2 py-0.5 text-label-sm text-trust-text">
              {article.tag}
            </span>

            <h2 className="mt-2.5 font-headline text-headline-md text-ink">
              <Link
                href={`/goc-suc-khoe/${article.slug}`}
                className="focus-ring rounded-chip hover:text-trust-text"
              >
                {article.title}
              </Link>
            </h2>

            <p className="mt-2 text-body-md text-ink-muted">{article.excerpt}</p>

            <p className="mt-3 text-label-sm text-ink-subtle">
              {article.author} · {formatDate(article.date)}
              <span className="ml-2 inline-flex items-center gap-1">
                <Clock size={13} aria-hidden />
                {article.readingMinutes} phút đọc
              </span>
            </p>
          </Card>
        ))}
      </ul>

      <Card className="flex flex-wrap items-start gap-3 p-4 md:p-5">
        <Stethoscope size={18} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-label-md text-ink">Bài viết không thay cho khám bệnh</h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Bài viết nói về nguyên tắc chung. Bệnh nền, thuốc đang dùng và tuổi của mỗi
            người khác nhau, nên cùng một triệu chứng có thể cần xử lý khác nhau.
          </p>
          <p className="mt-2 text-body-sm text-ink-subtle">
            Đang dùng nhiều thuốc?{" "}
            <Link
              href="/ai/tuong-tac"
              className="focus-ring inline-flex items-center gap-1 rounded-chip text-trust-text underline decoration-trust/30 underline-offset-2"
            >
              <Sparkles size={13} aria-hidden />
              Kiểm tra tương tác
            </Link>{" "}
            trước khi thêm bất kỳ loại nào.
          </p>
          <ButtonLink href="/lien-he" variant="outline-trust" size="sm" className="mt-3">
            Hỏi dược sĩ
          </ButtonLink>
        </div>
      </Card>
    </ContentPage>
  );
}