import { CircleCheck } from "@/lib/icons";
import { RatingStars } from "@/components/product/RatingStars";
import { formatCount, formatDate } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { Review, ReviewSummary } from "@/lib/types";

/**
 * Đánh giá khách hàng: điểm tổng + biểu đồ phân bố + danh sách nhận xét.
 *
 * Chỉ hiện nhận xét của người "đã mua tại MediVia" và nói rõ điều đó. Đánh
 * giá không xác thực mua hàng thì không đáng tin, đặc biệt với thuốc.
 */
export function ReviewSection({
  summary,
  reviews,
}: {
  summary?: ReviewSummary;
  reviews: Review[];
}) {
  if (!summary) return null;

  return (
    <section id="danh-gia" className="scroll-mt-24">
      <h2 className="mb-1 text-headline-md text-ink">Đánh giá từ khách hàng</h2>
      <p className="mb-4 text-body-sm text-ink-muted">
        {formatCount(summary.count)} đánh giá đã xác thực mua hàng
      </p>

      <div className="rounded-card border border-hairline bg-card p-4 md:p-5">
        <div className="grid gap-5 md:grid-cols-[220px_1fr] md:gap-8">
          <div className="text-center md:text-left">
            <p className="font-mono text-headline-xl tabular-nums text-ink">
              {summary.score.toFixed(1).replace(".", ",")}
            </p>
            <RatingStars score={summary.score} size={18} className="mt-1 justify-center md:justify-start" />
            <p className="mt-2 text-body-sm text-ink-muted">
              {summary.satisfactionPercent}% khách hàng cho 4 sao trở lên
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {summary.distribution.map((percent, index) => {
              const stars = 5 - index;
              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-body-sm text-ink-muted">{stars} sao</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-chip bg-recessed">
                    <span
                      className="block h-full rounded-chip bg-promo"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono text-body-sm tabular-nums text-ink-muted">
                    {percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {reviews.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-4 border-t border-divider pt-5">
            {reviews.map((review) => (
              <li key={review.id} className="flex gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-trust-wash text-label-sm text-trust-text"
                >
                  {review.initials}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-label-md text-ink">{review.author}</span>
                    <span className="inline-flex items-center gap-1 text-label-sm text-trust-text">
                      <CircleCheck size={13} aria-hidden />
                      Đã mua tại MediVia
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2.5">
                    <RatingStars score={review.score} size={13} />
                    <span className="text-body-sm text-ink-subtle">
                      {formatDate(review.date)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-body-sm text-ink-muted">{review.body}</p>
                  <ReviewMedia photos={review.photos} video={review.video} author={review.author} />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Ảnh và video khách đính kèm.
 *
 * Thẻ `<img>` chứ không phải `next/image`: tệp sinh ra lúc chạy nằm sau một
 * route handler, không phải tài sản build sẵn, nên bộ tối ưu của next/image
 * không có gì để làm — nó chỉ thêm một lớp proxy. `loading="lazy"` và kích
 * thước cố định giữ nguyên tác dụng chính là không tải ảnh ngoài màn hình.
 * Ảnh khách chụp không có tỉ lệ cố định nên ô dùng `object-cover`.
 */
function ReviewMedia({
  photos,
  video,
  author,
}: {
  photos?: string[];
  video?: string;
  author: string;
}) {
  if (!photos?.length && !video) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {photos?.map((name) => (
        <a
          key={name}
          href={mediaUrl(name)}
          target="_blank"
          rel="noreferrer"
          className="focus-ring block size-20 overflow-hidden rounded-card border border-hairline bg-recessed"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- tệp sinh lúc chạy, xem chú thích trên. */}
          <img
            src={mediaUrl(name)}
            alt={`Ảnh đánh giá của ${author}`}
            width={80}
            height={80}
            loading="lazy"
            className="size-full object-cover"
          />
        </a>
      ))}
      {video ? (
        <video
          src={mediaUrl(video)}
          controls
          preload="metadata"
          className="h-20 w-32 rounded-card border border-hairline bg-black"
        >
          <a href={mediaUrl(video)}>Xem video đánh giá của {author}</a>
        </video>
      ) : null}
    </div>
  );
}
