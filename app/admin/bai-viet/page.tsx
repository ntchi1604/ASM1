import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard, Th } from "@/components/admin/StatCard";
import { Card, SectionHeading } from "@/components/ui/Card";
import { AdminButtonForm, AdminForm } from "@/components/admin/AdminForm";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { formatDate } from "@/lib/format";
import { articles } from "@/lib/data/home";
import { deleteArticle, saveArticle } from "@/lib/admin/actions";

export const metadata: Metadata = {
  title: "Bài viết",
  description: "Góc sức khoẻ: danh sách bài và mẫu thêm bài mới.",
};

/**
 * Góc sức khoẻ.
 *
 * Đường dẫn (`slug`) là khoá của bài, không sửa được sau khi tạo: đổi đường dẫn là
 * bài cũ mất liên kết, và mọi chỗ đã dẫn tới nó thành liên kết chết. Sửa bài thì
 * sửa tiêu đề, đoạn trích, tác giả; muốn đường dẫn khác thì xoá rồi tạo lại.
 *
 * Ngày để dạng `yyyy-mm-dd` chứ không phải ô chọn ngày có định dạng theo máy người
 * dùng: ô chọn ngày gửi lên theo định dạng vùng, và một bài ghi "09/12/2026" ở máy
 * này thành "12/09/2026" ở máy khác khi lưu.
 */

const tagOptions = [
  "Dược lý ứng dụng",
  "Cảnh báo dùng thuốc",
  "Chăm sóc tại nhà",
  "Dinh dưỡng",
  "Góc sức khoẻ",
];

export default function AdminArticlesPage() {
  const totalMinutes = articles.reduce((sum, article) => sum + article.readingMinutes, 0);
  const authors = new Set(articles.map((article) => article.author)).size;

  return (
    <AdminShell activeHref="/admin/bai-viet">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-headline-xl text-ink">Bài viết</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Bài trong Góc sức khoẻ. Bài viết hiện ở trang chủ và trang Góc sức khoẻ sau khi
            lưu — cả hai đọc cùng danh sách này.
          </p>
        </header>

        <section aria-label="Chỉ số bài viết" className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Bài đang đăng" value={`${articles.length} bài`} />
          <StatCard label="Tác giả" value={`${authors} người`} />
          <StatCard
            label="Tổng thời lượng đọc"
            value={`${totalMinutes} phút`}
            hint="Cộng thời lượng ước tính của cả bài"
          />
        </section>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading title="Bài đang đăng" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-t border-hairline text-left">
              <thead className="bg-recessed">
                <tr>
                  <Th>Bài</Th>
                  <Th>Tác giả</Th>
                  <Th>Ngày</Th>
                  <Th align="right">Đọc</Th>
                  <Th>Xử lý</Th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.slug} className="border-t border-divider align-top">
                    <td className="px-4 py-3">
                      <Link
                        href={`/goc-suc-khoe/${article.slug}`}
                        className="focus-ring rounded-chip text-body-md text-ink hover:text-trust-text"
                      >
                        {article.title}
                      </Link>
                      <span className="mt-0.5 block text-body-sm text-ink-subtle">
                        {article.tag} · /{article.slug}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-ink-muted">{article.author}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-body-sm text-ink-muted">
                      {formatDate(article.date)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-body-sm text-ink-muted">
                      {article.readingMinutes} phút
                    </td>
                    <td className="px-4 py-3">
                      <AdminButtonForm
                        action={deleteArticle}
                        hidden={{ slug: article.slug }}
                        submit="Xoá"
                        confirm={`Xoá bài "${article.title}"? Đường dẫn này sẽ thành trang lỗi.`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading title="Sửa bài" />
            <p className="mt-1.5 max-w-2xl text-body-sm text-ink-muted">
              Mở bài cần sửa. Đường dẫn không đổi được — đổi đường dẫn là mọi liên kết đã trỏ
              tới bài thành liên kết chết.
            </p>
          </div>
          <ul className="border-t border-hairline">
            {articles.map((article) => (
              <li key={article.slug} className="border-b border-divider last:border-b-0">
                <details>
                  <summary className="focus-ring flex cursor-pointer items-center justify-between gap-2 px-4 py-3 hover:bg-recessed md:px-5">
                    <span className="min-w-0 text-body-md text-ink">{article.title}</span>
                    <span className="shrink-0 text-label-sm text-trust-text">Sửa</span>
                  </summary>
                  <div className="border-t border-hairline bg-recessed/40 px-4 py-4 md:px-5">
                    <ArticleForm article={article} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <details>
            <summary className="focus-ring flex cursor-pointer items-center justify-between gap-2 p-4 hover:bg-recessed md:p-5">
              <span>
                <span className="block text-headline-md text-ink">Thêm bài mới</span>
                <span className="mt-0.5 block text-body-sm text-ink-muted">
                  Bài mới hiện ở đầu danh sách Góc sức khoẻ.
                </span>
              </span>
              <span className="shrink-0 text-label-sm text-trust-text">Mở</span>
            </summary>
            <div className="border-t border-hairline px-4 py-4 md:px-5">
              <ArticleForm />
            </div>
          </details>
        </Card>
      </div>
    </AdminShell>
  );
}

/**
 * Một form cho cả sửa lẫn thêm: chỉ khác ở giá trị mặc định. Hai form riêng thì
 * thêm một ô mới phải nhớ sửa cả hai chỗ, và chỗ hay bị quên là form sửa.
 */
function ArticleForm({
  article,
}: {
  article?: (typeof articles)[number];
}) {
  const id = article?.slug ?? "new";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AdminForm
      action={saveArticle}
      submit={article ? "Lưu bài" : "Thêm bài"}
      footer={
        article ? (
          <span className="text-body-sm text-ink-subtle">Đường dẫn giữ nguyên: /{article.slug}</span>
        ) : undefined
      }
    >
      <Field
        label="Đường dẫn"
        id={`slug-${id}`}
        required={!article}
        hint={
          article
            ? "Không đổi được."
            : "Chữ thường, số, gạch ngang. Ví dụ: uong-nuoc-du-mua-nang."
        }
      >
        <Input
          id={`slug-${id}`}
          name="slug"
          required={!article}
          readOnly={Boolean(article)}
          defaultValue={article?.slug}
          className={article ? "bg-recessed" : undefined}
          placeholder="uong-nuoc-du-mua-nang"
        />
      </Field>

      <Field label="Nhãn" id={`tag-${id}`} hint="Chọn một nhãn có sẵn để lọc được ở Góc sức khoẻ.">
        <Input
          id={`tag-${id}`}
          name="tag"
          list={`tags-${id}`}
          defaultValue={article?.tag ?? tagOptions[0]}
        />
      </Field>
      <datalist id={`tags-${id}`}>
        {tagOptions.map((tag) => (
          <option key={tag} value={tag} />
        ))}
      </datalist>

      <Field label="Tiêu đề" id={`title-${id}`} required className="md:col-span-2">
        <Input id={`title-${id}`} name="title" required defaultValue={article?.title} />
      </Field>

      <Field
        label="Đoạn trích"
        id={`excerpt-${id}`}
        className="md:col-span-2"
        hint="Hiện dưới tiêu đề ở thẻ bài. Một câu, nói bài giải quyết việc gì."
      >
        <Textarea id={`excerpt-${id}`} name="excerpt" rows={2} defaultValue={article?.excerpt} />
      </Field>

      <Field label="Tác giả" id={`author-${id}`}>
        <Input id={`author-${id}`} name="author" defaultValue={article?.author} />
      </Field>

      <Field label="Ngày đăng" id={`date-${id}`} hint="Dạng yyyy-mm-dd.">
        <Input
          id={`date-${id}`}
          name="date"
          type="date"
          defaultValue={article?.date ?? today}
        />
      </Field>

      <Field label="Số phút đọc" id={`minutes-${id}`} hint="Ước tính, tối thiểu 1.">
        <Input
          id={`minutes-${id}`}
          name="readingMinutes"
          type="number"
          min={1}
          step={1}
          defaultValue={article?.readingMinutes ?? 4}
        />
      </Field>
    </AdminForm>
  );
}
