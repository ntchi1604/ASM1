import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminButtonForm } from "@/components/admin/AdminForm";
import { StatCard, Th } from "@/components/admin/StatCard";
import { RatingStars } from "@/components/product/RatingStars";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionHeading } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { listRows } from "@/lib/admin/db";
import { mediaUrl } from "@/lib/media";
import { setReviewHidden } from "@/lib/admin/actions";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { matchesQuery, readFilter } from "@/lib/admin/filter";
import type { Review } from "@/lib/types";

export const metadata: Metadata = {
  title: "Đánh giá",
  description: "Đánh giá khách hàng theo sản phẩm, ẩn hoặc hiện lại.",
};

/**
 * Đánh giá khách hàng.
 *
 * Đọc bằng `listRows("reviews")` chứ không import thẳng mảng mẫu: đánh giá khách
 * viết được ghi vào kho delta lúc gửi, và mảng trong mã nguồn không tự thấy
 * chúng. `lib/data/reviews.ts` chỉ giữ bản mẫu.
 *
 * Ẩn chứ không xoá — xem chú thích `setReviewHidden`.
 */
export default async function AdminReviewsPage({
  searchParams,
}: PageProps<"/admin/danh-gia">) {
  const filter = readFilter(await searchParams, ["q", "trang-thai", "sao"]);
  const rows = listRows("reviews") as unknown as Review[];
  const products = listRows("products") as unknown as { id: string; name: string; slug: string }[];

  const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  const nameOf = new Map(products.map((product) => [product.id, product.name]));
  const visibleRows = sorted.filter((review) => {
    if (!matchesQuery(filter.q, review.author, review.body, nameOf.get(review.productId))) {
      return false;
    }
    if (filter["trang-thai"] === "an" && !review.hidden) return false;
    if (filter["trang-thai"] === "hien" && review.hidden) return false;
    if (filter.sao && review.score !== Number(filter.sao)) return false;
    return true;
  });
  const hiddenCount = rows.filter((row) => row.hidden).length;
  // Bình quân tính trên đánh giá ĐANG HIỆN: đó là con số người mua nhìn thấy
  // trên trang sản phẩm, và dòng gợi ý ngay dưới tiêu đề nói đúng như vậy.
  const visible = rows.filter((row) => !row.hidden);
  const average = visible.length
    ? visible.reduce((sum, row) => sum + row.score, 0) / visible.length
    : 0;

  return (
    <AdminShell activeHref="/admin/danh-gia">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-headline-xl text-ink">Đánh giá</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Nhận xét khách gửi sau khi đơn đã giao. Ẩn một đánh giá thì nó biến khỏi
            trang sản phẩm nhưng vẫn còn ở đây để đối chiếu.
          </p>
        </header>

        <section aria-label="Chỉ số đánh giá" className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Tổng đánh giá" value={`${rows.length} đánh giá`} />
          <StatCard
            label="Điểm trung bình"
            value={`${average.toFixed(1).replace(".", ",")} / 5`}
            hint="Chỉ tính đánh giá đang hiện"
          />
          <StatCard
            label="Đang ẩn"
            value={`${hiddenCount} đánh giá`}
            hint="Không hiện trên trang sản phẩm"
            danger={hiddenCount > 0}
          />
        </section>

        <AdminFilterBar
          action="/admin/danh-gia"
          query={filter.q}
          placeholder="Tên khách, nội dung hoặc tên thuốc"
          selects={[
            {
              name: "trang-thai",
              label: "Hiển thị",
              value: filter["trang-thai"],
              options: [
                { value: "hien", label: "Đang hiện" },
                { value: "an", label: "Đang ẩn" },
              ],
            },
            {
              name: "sao",
              label: "Số sao",
              value: filter.sao,
              options: [5, 4, 3, 2, 1].map((score) => ({
                value: String(score),
                label: `${score} sao`,
              })),
            },
          ]}
        />

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading
              title={
                visibleRows.length === sorted.length
                  ? "Nhận xét gần đây"
                  : `${visibleRows.length} / ${sorted.length} đánh giá khớp bộ lọc`
              }
            />
          </div>
          {sorted.length === 0 ? (
            <p className="border-t border-hairline px-4 py-4 text-body-md text-ink-muted md:px-5">
              Chưa có đánh giá nào.
            </p>
          ) : visibleRows.length === 0 ? (
            <p className="border-t border-hairline px-4 py-4 text-body-md text-ink-muted md:px-5">
              Không có đánh giá nào khớp bộ lọc đang chọn.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-t border-hairline text-left">
                <thead className="bg-recessed">
                  <tr>
                    <Th>Sản phẩm</Th>
                    <Th>Khách</Th>
                    <Th>Sao</Th>
                    <Th>Nhận xét</Th>
                    <Th>Tệp</Th>
                    <Th>Đơn</Th>
                    <Th>Xử lý</Th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((review) => {
                    const product = products.find((item) => item.id === review.productId);
                    return (
                      <tr
                        key={review.id}
                        id={`dg-${review.id}`}
                        className="scroll-mt-24 border-t border-divider align-top"
                      >
                        <td className="px-4 py-3">
                          {product ? (
                            <Link
                              href={`/thuoc/${product.slug}`}
                              className="focus-ring rounded-chip text-body-md text-ink hover:text-trust-text"
                            >
                              {product.name}
                            </Link>
                          ) : (
                            <span className="text-body-md text-ink-muted">
                              Mặt hàng đã xoá
                            </span>
                          )}
                          {review.hidden ? (
                            <span className="mt-1.5 block">
                              <Badge tone="neutral">Đang ẩn</Badge>
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-body-sm text-ink-muted">
                          {review.author}
                          <span className="mt-0.5 block text-ink-subtle">
                            {formatDate(review.date)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <RatingStars score={review.score} size={13} />
                        </td>
                        <td className="max-w-md px-4 py-3 text-body-sm text-ink-muted">
                          {review.body}
                        </td>
                        <td className="px-4 py-3">
                          {review.photos?.length || review.video ? (
                            <a
                              href={mediaUrl(review.video ?? review.photos![0])}
                              target="_blank"
                              rel="noreferrer"
                              className="focus-ring inline-flex items-center gap-1.5 rounded-chip text-body-sm text-trust-text hover:underline"
                            >
                              {review.photos?.length ? `${review.photos.length} ảnh` : null}
                              {review.photos?.length && review.video ? " · " : null}
                              {review.video ? "video" : null}
                            </a>
                          ) : (
                            <span className="text-body-sm text-ink-subtle">Không có</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-body-sm tabular-nums text-ink-muted">
                          {review.orderCode ?? "Đánh giá mẫu"}
                        </td>
                        <td className="px-4 py-3">
                          <AdminButtonForm
                            action={setReviewHidden}
                            hidden={{ id: review.id, hidden: review.hidden ? "0" : "1" }}
                            submit={review.hidden ? "Hiện lại" : "Ẩn"}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
