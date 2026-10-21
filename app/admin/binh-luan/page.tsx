import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminButtonForm, AdminForm } from "@/components/admin/AdminForm";
import { StatCard, Th } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Field, Textarea } from "@/components/ui/Field";
import { formatDateTime } from "@/lib/format";
import { listRows } from "@/lib/admin/db";
import { replyToComment, setCommentHidden } from "@/lib/admin/actions";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { matchesQuery, readFilter } from "@/lib/admin/filter";
import type { Comment } from "@/lib/types";

export const metadata: Metadata = {
  title: "Bình luận",
  description: "Câu hỏi dưới bài viết, trả lời và ẩn bình luận.",
};

/**
 * Quản lý bình luận Góc sức khoẻ.
 *
 * Đọc bằng `listRows("comments")` chứ không import mảng mẫu: bình luận khách
 * viết nằm trong kho delta, mảng trong mã nguồn không thấy chúng.
 *
 * Hai thao tác: trả lời và ẩn. Không có nút xoá — cùng lý do với đánh giá, nội
 * dung khách viết phải còn để đối chiếu, và tác giả đã tự xoá được từ bài viết.
 */
export default async function AdminCommentsPage({
  searchParams,
}: PageProps<"/admin/binh-luan">) {
  const filter = readFilter(await searchParams, ["q", "trang-thai"]);
  const rows = listRows("comments") as unknown as Comment[];
  const articles = listRows("articles") as unknown as { slug: string; title: string }[];

  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  const titleOf = new Map(articles.map((article) => [article.slug, article.title]));
  const visibleRows = sorted.filter((comment) => {
    if (!matchesQuery(filter.q, comment.author, comment.body, titleOf.get(comment.articleSlug))) {
      return false;
    }
    if (filter["trang-thai"] === "chua-tra-loi" && (comment.reply || comment.hidden)) return false;
    if (filter["trang-thai"] === "an" && !comment.hidden) return false;
    return true;
  });
  const hiddenCount = rows.filter((row) => row.hidden).length;
  const unanswered = rows.filter((row) => !row.reply && !row.hidden).length;

  return (
    <AdminShell activeHref="/admin/binh-luan">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-headline-xl text-ink">Bình luận</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Câu hỏi người đọc gửi dưới bài viết. Trả lời ngay dưới câu hỏi; ẩn thì bình
            luận biến khỏi bài nhưng vẫn còn ở đây để đối chiếu.
          </p>
        </header>

        <section aria-label="Chỉ số bình luận" className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Tổng bình luận" value={`${rows.length} câu hỏi`} />
          <StatCard
            label="Chưa trả lời"
            value={`${unanswered} câu hỏi`}
            hint="Không tính bình luận đang ẩn"
            danger={unanswered > 0}
          />
          <StatCard
            label="Đang ẩn"
            value={`${hiddenCount} bình luận`}
            hint="Không hiện dưới bài viết"
            danger={hiddenCount > 0}
          />
        </section>

        <AdminFilterBar
          action="/admin/binh-luan"
          query={filter.q}
          placeholder="Tên người gửi, nội dung hoặc tên bài viết"
          selects={[
            {
              name: "trang-thai",
              label: "Trạng thái",
              value: filter["trang-thai"],
              options: [
                { value: "chua-tra-loi", label: "Chưa trả lời" },
                { value: "an", label: "Đang ẩn" },
              ],
            },
          ]}
        />

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading
              title={
                visibleRows.length === sorted.length
                  ? "Bình luận gần đây"
                  : `${visibleRows.length} / ${sorted.length} bình luận khớp bộ lọc`
              }
            />
          </div>
          {sorted.length === 0 ? (
            <p className="border-t border-hairline px-4 py-4 text-body-md text-ink-muted md:px-5">
              Chưa có bình luận nào.
            </p>
          ) : visibleRows.length === 0 ? (
            <p className="border-t border-hairline px-4 py-4 text-body-md text-ink-muted md:px-5">
              Không có bình luận nào khớp bộ lọc đang chọn.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-divider border-t border-hairline">
              {visibleRows.map((comment) => {
                const article = articles.find((item) => item.slug === comment.articleSlug);
                return (
                  <li
                    key={comment.id}
                    id={`bl-${comment.id}`}
                    className="scroll-mt-24 px-4 py-4 md:px-5"
                  >
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="text-label-md text-ink">{comment.author}</span>
                      <span className="text-body-sm text-ink-subtle">
                        {formatDateTime(comment.date)}
                      </span>
                      {comment.hidden ? <Badge tone="neutral">Đang ẩn</Badge> : null}
                      {!comment.reply && !comment.hidden ? (
                        <Badge tone="promo">Chưa trả lời</Badge>
                      ) : null}
                    </div>

                    <p className="mt-1 whitespace-pre-line text-body-md text-ink-muted">
                      {comment.body}
                    </p>
                    <p className="mt-1 text-body-sm text-ink-subtle">
                      {article ? (
                        <Link
                          href={`/goc-suc-khoe/${comment.articleSlug}#binh-luan`}
                          className="focus-ring rounded-chip hover:text-trust-text"
                        >
                          {article.title}
                        </Link>
                      ) : (
                        <>Bài viết đã xoá ({comment.articleSlug})</>
                      )}
                    </p>

                    {comment.reply ? (
                      <div className="mt-2.5 rounded-card bg-trust-wash/60 p-3">
                        <p className="text-label-sm text-trust-text">
                          {comment.reply.author} đã trả lời ·{" "}
                          {formatDateTime(comment.reply.date)}
                        </p>
                        <p className="mt-1 text-body-sm text-ink-muted">{comment.reply.body}</p>
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start">
                      <details className="min-w-0 flex-1">
                        <summary className="focus-ring inline-flex cursor-pointer rounded-chip text-body-sm text-trust-text">
                          {comment.reply ? "Sửa câu trả lời" : "Trả lời"}
                        </summary>
                        <div className="mt-2">
                          <AdminForm
                            action={replyToComment}
                            hidden={{ id: comment.id }}
                            submit={comment.reply ? "Lưu câu trả lời" : "Gửi trả lời"}
                          >
                            <Field label="Nội dung trả lời" id={`tra-loi-${comment.id}`} className="md:col-span-2">
                              <Textarea
                                id={`tra-loi-${comment.id}`}
                                name="body"
                                rows={2}
                                minLength={10}
                                maxLength={600}
                                required
                                defaultValue={comment.reply?.body}
                                placeholder="Trả lời ngắn, nói rõ khi nào cần đi khám."
                              />
                            </Field>
                          </AdminForm>
                        </div>
                      </details>

                      <AdminButtonForm
                        action={setCommentHidden}
                        hidden={{ id: comment.id, hidden: comment.hidden ? "0" : "1" }}
                        submit={comment.hidden ? "Hiện lại" : "Ẩn"}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading title="Đếm theo bài" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-t border-hairline text-left">
              <thead className="bg-recessed">
                <tr>
                  <Th>Bài viết</Th>
                  <Th align="right">Hiện</Th>
                  <Th align="right">Chờ trả lời</Th>
                  <Th align="right">Đang ẩn</Th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => {
                  const own = rows.filter((row) => row.articleSlug === article.slug);
                  return (
                    <tr key={article.slug} className="border-t border-divider">
                      <td className="px-4 py-3">
                        <Link
                          href={`/goc-suc-khoe/${article.slug}`}
                          className="focus-ring rounded-chip text-body-md text-ink hover:text-trust-text"
                        >
                          {article.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-body-sm text-ink-muted">
                        {own.filter((row) => !row.hidden).length}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-body-sm text-ink-muted">
                        {own.filter((row) => !row.hidden && !row.reply).length}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-body-sm text-ink-muted">
                        {own.filter((row) => row.hidden).length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
