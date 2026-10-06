import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard } from "@/components/admin/StatCard";
import { Card, SectionHeading } from "@/components/ui/Card";
import { AdminButtonForm, AdminForm } from "@/components/admin/AdminForm";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { staticPages } from "@/lib/data/pages";
import { formatSections } from "@/lib/admin/page-text";
import { deletePage, savePage } from "@/lib/admin/actions";

export const metadata: Metadata = {
  title: "Trang chữ",
  description: "Nội dung các trang giới thiệu, chính sách và hướng dẫn.",
};

/**
 * Trang chữ (trang tĩnh).
 *
 * Ô nội dung dùng định dạng chữ chứ không phải JSON — lý do ở `lib/admin/page-text.ts`.
 * Cú pháp in ngay trên trang, không giấu sau một liên kết trợ giúp: người sửa mở
 * trang này ra là phải biết gõ gì, không phải đi tìm.
 *
 * Mười trang render bằng cùng một bố cục ở `app/(shop)/[page]`, nên sửa ở đây là
 * sửa đúng cái khách đọc, không phải bản nháp của một bố cục khác.
 */

const syntaxHelp = [
  { code: "## Tiêu đề mục", meaning: "Mở một mục mới. Mục đầu tiên bắt buộc bắt đầu bằng dòng này." },
  { code: "Chữ thường", meaning: "Một đoạn văn." },
  { code: "- Gạch đầu dòng", meaning: "Một dòng trong danh sách." },
];

export default function AdminPagesPage() {
  const totalSections = staticPages.reduce((sum, page) => sum + page.sections.length, 0);

  return (
    <AdminShell activeHref="/admin/trang">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-headline-xl text-ink">Trang chữ</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Giới thiệu, chính sách và hướng dẫn. Sửa xong là khách đọc được ngay ở địa chỉ của
            trang đó.
          </p>
        </header>

        <section aria-label="Chỉ số trang" className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Trang đang đăng" value={`${staticPages.length} trang`} />
          <StatCard label="Tổng số mục" value={`${totalSections} mục`} />
          <StatCard
            label="Bố cục"
            value="Dùng chung"
            hint="Mọi trang render bằng cùng một bố cục, sửa chữ không đổi được bố cục"
          />
        </section>

        <Card className="p-4 md:p-5">
          <SectionHeading title="Cách gõ nội dung" />
          <dl className="mt-3 flex flex-col gap-2">
            {syntaxHelp.map((item) => (
              <div key={item.code} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <dt>
                  <code className="rounded bg-recessed px-1.5 py-0.5 text-label-sm text-ink">
                    {item.code}
                  </code>
                </dt>
                <dd className="text-body-sm text-ink-muted">{item.meaning}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-body-sm text-ink-subtle">
            Chữ nằm trước mục đầu tiên sẽ bị bỏ qua — nội dung nào cũng phải thuộc một mục.
          </p>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading title="Sửa trang" />
          </div>
          <ul className="border-t border-hairline">
            {staticPages.map((page) => (
              <li key={page.slug} className="border-b border-divider last:border-b-0">
                <details>
                  <summary className="focus-ring flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-recessed md:px-5">
                    <span className="min-w-0">
                      <span className="block text-body-md text-ink">{page.title}</span>
                      <span className="mt-0.5 block text-body-sm text-ink-subtle">
                        /{page.slug} · {page.sections.length} mục
                      </span>
                    </span>
                    <span className="shrink-0 text-label-sm text-trust-text">Sửa</span>
                  </summary>

                  <div className="border-t border-hairline bg-recessed/40 px-4 py-4 md:px-5">
                    <AdminForm
                      action={savePage}
                      hidden={{ slug: page.slug }}
                      submit="Lưu trang"
                      footer={
                        <Link
                          href={`/${page.slug}`}
                          className="focus-ring rounded-chip text-body-sm text-trust-text hover:underline"
                        >
                          Xem trang
                        </Link>
                      }
                    >
                      <Field label="Tiêu đề trang" id={`title-${page.slug}`} required>
                        <Input
                          id={`title-${page.slug}`}
                          name="title"
                          required
                          defaultValue={page.title}
                        />
                      </Field>

                      <Field
                        label="Dòng dẫn"
                        id={`lead-${page.slug}`}
                        hint="Một hai câu tóm tắt, hiện ngay dưới tiêu đề."
                      >
                        <Textarea
                          id={`lead-${page.slug}`}
                          name="lead"
                          rows={2}
                          defaultValue={page.lead}
                        />
                      </Field>

                      <Field
                        label="Nội dung"
                        id={`sections-${page.slug}`}
                        required
                        className="md:col-span-2"
                        hint="Mỗi mục bắt đầu bằng ## Tiêu đề. Dòng bắt đầu bằng - là gạch đầu dòng."
                      >
                        <Textarea
                          id={`sections-${page.slug}`}
                          name="sections"
                          required
                          rows={16}
                          defaultValue={formatSections(page.sections)}
                          className="font-mono text-body-sm"
                          spellCheck={false}
                        />
                      </Field>
                    </AdminForm>

                    <div className="mt-4 border-t border-hairline pt-4">
                      <AdminButtonForm
                        action={deletePage}
                        hidden={{ slug: page.slug }}
                        submit="Xoá trang"
                        confirm={`Xoá trang "${page.title}"? Địa chỉ /${page.slug} sẽ thành trang lỗi.`}
                      />
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AdminShell>
  );
}
