import { Stethoscope } from "@/lib/icons";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { formatDateTime } from "@/lib/format";
import { deleteComment, editComment, submitComment } from "@/lib/shop/comment-actions";
import { readOwnCommentIds } from "@/lib/shop/comment-cookie";
import type { Comment } from "@/lib/types";

/**
 * Bình luận dưới bài viết.
 *
 * Ba trạng thái trong cùng một khối: danh sách, ô viết, và (chỉ với bình luận
 * của chính máy này) nút sửa/xoá. Quyền sửa đến từ cookie — nên câu giải thích
 * dưới ô nhập phải nói thẳng giới hạn đó, thay vì để người đọc tưởng đây là tài
 * khoản.
 *
 * Không dùng `useActionState`: action ghi xong rồi chuyển trang, vì danh sách
 * bình luận là Server Component đọc dữ liệu mới. Sửa tại chỗ thì danh sách phía
 * trên không đổi.
 */
const messages: Record<string, { text: string; ok: boolean }> = {
  ok: { text: "Đã gửi bình luận.", ok: true },
  "da-sua": { text: "Đã lưu thay đổi.", ok: true },
  "da-xoa": { text: "Đã xoá bình luận.", ok: true },
  "loi-ten": { text: "Tên cần ít nhất 2 ký tự.", ok: false },
  "loi-noi-dung": { text: "Nội dung cần ít nhất 10 ký tự.", ok: false },
  "loi-quyen": { text: "Chỉ sửa hoặc xoá được bình luận viết trên máy này.", ok: false },
  "loi-luu": { text: "Chưa lưu được bình luận, thử lại giúp mình.", ok: false },
};

export async function CommentSection({
  articleSlug,
  comments,
  messageCode,
}: {
  articleSlug: string;
  comments: Comment[];
  messageCode?: string;
}) {
  const own = new Set(await readOwnCommentIds());
  const message = messageCode ? messages[messageCode] : undefined;

  return (
    <section id="binh-luan" className="mt-8 max-w-3xl scroll-mt-24">
      <h2 className="text-headline-md text-ink">Hỏi đáp dưới bài</h2>
      <p className="mt-1 text-body-sm text-ink-muted">
        {comments.length > 0
          ? `${comments.length} câu hỏi, dược sĩ trả lời ngay dưới mỗi câu.`
          : "Chưa có câu hỏi nào. Hỏi ở ô bên dưới, dược sĩ trả lời trong ngày."}
      </p>

      {comments.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-4">
          {comments.map((comment) => {
            const mine = own.has(comment.id);
            return (
              <li key={comment.id} className="flex gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-trust-wash text-label-sm text-trust-text"
                >
                  {comment.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-label-md text-ink">{comment.author}</span>
                    <span className="text-body-sm text-ink-subtle">
                      {formatDateTime(comment.date)}
                    </span>
                    {mine ? (
                      <span className="rounded-chip bg-recessed px-2 py-0.5 text-label-sm text-ink-muted">
                        Bình luận của bạn
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-pre-line text-body-sm text-ink-muted">
                    {comment.body}
                  </p>

                  {comment.reply ? (
                    <div className="mt-2.5 rounded-card border border-hairline bg-trust-wash/60 p-3">
                      <p className="flex items-center gap-1.5 text-label-sm text-trust-text">
                        <Stethoscope size={14} aria-hidden />
                        {comment.reply.author} trả lời
                      </p>
                      <p className="mt-1 text-body-sm text-ink-muted">{comment.reply.body}</p>
                    </div>
                  ) : null}

                  {mine ? (
                    <div className="mt-2 flex flex-wrap items-start gap-3">
                      <details className="min-w-0 flex-1">
                        <summary className="focus-ring inline-flex cursor-pointer rounded-chip text-body-sm text-trust-text">
                          Sửa bình luận
                        </summary>
                        <form
                          action={editComment}
                          className="mt-2 flex flex-col gap-2 rounded-card border border-hairline bg-card p-3"
                        >
                          <input type="hidden" name="id" value={comment.id} />
                          <input type="hidden" name="articleSlug" value={articleSlug} />
                          {/* Key theo mã: mỗi bình luận một ô riêng, không dùng
                              chung id — id trùng là nhãn trỏ sai ô. */}
                          <label htmlFor={`sua-${comment.id}`} className="text-label-sm text-ink">
                            Nội dung
                          </label>
                          <Textarea
                            id={`sua-${comment.id}`}
                            name="body"
                            rows={3}
                            minLength={10}
                            maxLength={600}
                            defaultValue={comment.body}
                            required
                          />
                          <div className="flex items-center gap-2">
                            <Button type="submit" variant="outline-trust" size="sm">
                              Lưu
                            </Button>
                            <span className="text-body-sm text-ink-subtle">Tối đa 600 ký tự.</span>
                          </div>
                        </form>
                      </details>
                      <form action={deleteComment}>
                        <input type="hidden" name="id" value={comment.id} />
                        <input type="hidden" name="articleSlug" value={articleSlug} />
                        <Button type="submit" variant="ghost" size="sm">
                          Xoá
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <form
        action={submitComment}
        className="mt-5 flex flex-col gap-3 rounded-card border border-hairline bg-card p-4"
      >
        <input type="hidden" name="articleSlug" value={articleSlug} />
        <Field label="Tên của bạn" id="binh-luan-ten" required hint="Tên hiện công khai dưới bài.">
          <Input id="binh-luan-ten" name="author" maxLength={40} required placeholder="Ví dụ: Nguyễn Hải Yến" />
        </Field>
        <Field
          label="Câu hỏi"
          id="binh-luan-noi-dung"
          required
          hint="Hỏi càng cụ thể càng dễ trả lời: tuổi, triệu chứng, thuốc đang dùng. Tối thiểu 10 ký tự."
        >
          <Textarea
            id="binh-luan-noi-dung"
            name="body"
            rows={3}
            minLength={10}
            maxLength={600}
            required
            placeholder="Ví dụ: bé 4 tuổi đang sốt 38,5°C, đã uống paracetamol 2 tiếng trước, giờ còn uống thêm được không?"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="outline-trust" size="sm">
            Gửi câu hỏi
          </Button>
          <span className="text-body-sm text-ink-subtle">
            Bình luận sửa/xoá được trên đúng máy đã viết, không cần tài khoản.
          </span>
        </div>

        {message ? (
          <p
            role="status"
            className={`text-body-sm ${message.ok ? "text-trust-text" : "text-danger"}`}
          >
            {message.text}
          </p>
        ) : null}
      </form>
    </section>
  );
}
