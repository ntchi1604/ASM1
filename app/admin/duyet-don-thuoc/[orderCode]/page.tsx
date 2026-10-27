import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  PrescriptionReviewForm,
  PrescriptionStatusChip,
} from "@/components/admin/PrescriptionReview";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { formatDate, formatDateTime, formatFileSize, formatVnd } from "@/lib/format";
import { getDeliveryMethod } from "@/lib/data/delivery";
import { getPaymentMethod } from "@/lib/data/payment";
import {
  getOrderByCode,
  getPrescriptionByOrderCode,
  orderStatusLabel,
} from "@/lib/data/orders";
import { prescriptionUrl } from "@/lib/prescriptions";
import { requireSession } from "@/lib/admin/auth";
import { canApprovePrescriptions } from "@/lib/admin/users";
import { ArrowLeft, ExternalLink, FileText, ShieldCheck } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Chi tiết đơn thuốc",
  description: "Ảnh đơn thuốc cỡ đầy đủ và toàn bộ hồ sơ đơn hàng đi kèm.",
};

/**
 * Chi tiết MỘT đơn thuốc — chỗ dược sĩ thật sự đối chiếu.
 *
 * Hàng đợi chỉ đủ để quyết định xem đơn nào trước: ở đó ảnh bị giới hạn chiều cao
 * để mười đơn vừa một màn hình, mà đơn thuốc thì phải đọc được chữ ký, liều dùng
 * và số lượng — ba thứ nằm ở ba góc tờ giấy. Ảnh thu nhỏ 224px không đọc được
 * chúng, và phóng to ảnh trong trình duyệt thì mất luôn phần đối chiếu bên cạnh.
 *
 * Nên trang này đặt ảnh CỠ ĐẦY ĐỦ cạnh đúng những gì cần đối chiếu: thuốc kê đơn
 * khách đặt, địa chỉ giao, thời điểm gửi, hạn xoá ảnh. Dược sĩ không phải mở hai
 * tab và tự nhớ số lượng bên này để so với bên kia.
 *
 * Quyền: `requireSession` cho cả hai vai trò xem, còn form quyết định chỉ hiện với
 * `duoc-si` — kiểm quyền THẬT vẫn nằm trong `reviewPrescription`. Ảnh đi qua
 * `/api/don-thuoc` nên nó tự trả 404 cho người không có phiên dược sĩ.
 */
export default async function AdminPrescriptionDetailPage({
  params,
}: PageProps<"/admin/duyet-don-thuoc/[orderCode]">) {
  const session = await requireSession();
  const { orderCode } = await params;

  const row = getPrescriptionByOrderCode(orderCode);
  const order = getOrderByCode(orderCode);
  if (!row || !order) notFound();

  // Quyền ĐỌC và quyền QUYẾT ĐỊNH là hai chuyện khác nhau: đơn đã duyệt xong vẫn
  // xem được ảnh, nhưng không còn nút nào để bấm.
  const canViewFile = canApprovePrescriptions(session.role);
  const canReview = canViewFile && row.status === "cho-duyet";
  const href = canViewFile && row.storageKey ? prescriptionUrl(row.storageKey) : undefined;
  const isImage = row.mimeType !== "application/pdf";

  return (
    <AdminShell activeHref="/admin/duyet-don-thuoc">
      <div className="flex flex-col gap-6">
        <div>
          <Link
            href="/admin/duyet-don-thuoc"
            className="focus-ring inline-flex items-center gap-1.5 rounded-chip text-label-sm text-trust-text"
          >
            <ArrowLeft size={15} aria-hidden />
            Về hàng đợi duyệt đơn
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-headline-xl tabular-nums text-ink">{row.orderCode}</h1>
            <PrescriptionStatusChip status={row.status} />
          </div>
          <p className="mt-1 text-body-md text-ink-muted">
            {order.customer} · <span className="tabular-nums">{order.phone}</span> · gửi lúc{" "}
            {formatDateTime(row.submittedAt)}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="p-4 md:p-5">
            <SectionHeading
              title="Ảnh đơn thuốc"
              action={
                href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="focus-ring inline-flex items-center gap-1.5 rounded-chip text-label-sm text-trust-text underline decoration-trust/30 underline-offset-2"
                  >
                    <ExternalLink size={14} aria-hidden />
                    Mở tab mới
                  </a>
                ) : undefined
              }
            />

            {href && isImage ? (
              <a href={href} target="_blank" rel="noreferrer" className="focus-ring block rounded-card">
                {/* eslint-disable-next-line @next/next/no-img-element -- tệp riêng, không qua next/image */}
                <img
                  src={href}
                  alt={`Đơn thuốc của đơn ${row.orderCode}`}
                  className="mx-auto max-h-[80vh] w-auto max-w-full rounded-card border border-hairline object-contain"
                />
              </a>
            ) : href ? (
              <div className="rounded-card border border-hairline bg-recessed px-4 py-6 text-center">
                <FileText size={28} className="mx-auto text-ink-subtle" aria-hidden />
                <p className="mt-2 text-body-md text-ink-muted">
                  Đơn thuốc là tệp PDF — mở ở tab riêng để đọc.
                </p>
                <ButtonLink href={href} target="_blank" rel="noreferrer" size="sm" className="mt-3">
                  Mở tệp PDF
                </ButtonLink>
              </div>
            ) : (
              <p className="rounded-card border border-hairline bg-recessed px-4 py-6 text-body-md text-ink-muted">
                {!canViewFile
                  ? "Ảnh đơn thuốc chỉ mở được bằng tài khoản dược sĩ. Hồ sơ duyệt và đơn hàng vẫn xem được bên dưới."
                  : row.storageKey === ""
                    ? "Ảnh đã xoá theo thời hạn lưu — hồ sơ duyệt vẫn còn nguyên bên dưới."
                    : "Không có tệp đính kèm cho đơn này."}
              </p>
            )}

            <p className="mt-3 flex items-start gap-2 text-body-sm text-ink-subtle">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
              <span>
                Ảnh đi qua đường dẫn chỉ tài khoản dược sĩ đọc được; mỗi lần mở được ghi
                vào <span className="font-mono text-ink-muted">.data/prescriptions-access.log</span>.
              </span>
            </p>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="p-4 md:p-5">
              <SectionHeading title="Tệp khách gửi" />
              <dl className="flex flex-col gap-2 text-body-sm">
                <Row label="Tên tệp" value={row.fileName} />
                <Row
                  label="Định dạng"
                  value={row.mimeType.replace("image/", "").replace("application/", "").toUpperCase()}
                />
                <Row label="Dung lượng" value={formatFileSize(row.sizeBytes)} />
                <Row label="Gửi lúc" value={formatDateTime(row.submittedAt)} />
                <Row label="Xoá ảnh sau" value={formatDate(row.deleteAfter)} />
                <Row
                  label="Mã lưu trữ"
                  value={row.storageKey || "—"}
                  mono
                />
              </dl>
            </Card>

            <Card className="p-4 md:p-5">
              <SectionHeading title="Quyết định" />
              {row.reviewedBy && row.reviewedAt ? (
                <dl className="flex flex-col gap-2 text-body-sm">
                  <Row label="Dược sĩ duyệt" value={row.reviewedBy} />
                  <Row label="Thời điểm" value={formatDateTime(row.reviewedAt)} />
                  {row.rejectReason ? <Row label="Lý do từ chối" value={row.rejectReason} /> : null}
                </dl>
              ) : row.rejectReason ? (
                // Không có người duyệt mà vẫn có lý do: đơn bị đóng vì hết hạn lưu
                // ảnh. Nói rõ hệ thống đóng, không để dược sĩ tưởng đồng nghiệp làm.
                <dl className="flex flex-col gap-2 text-body-sm">
                  <Row label="Người quyết định" value="Hệ thống — hết hạn lưu ảnh" />
                  <Row label="Lý do từ chối" value={row.rejectReason} />
                </dl>
              ) : (
                <p className="text-body-sm text-ink-muted">Chưa có dược sĩ duyệt đơn này.</p>
              )}

              {canReview ? (
                <PrescriptionReviewForm
                  orderCode={row.orderCode}
                  className="mt-4 flex flex-col gap-3 border-t border-divider pt-4"
                />
              ) : null}
            </Card>
          </div>
        </div>

        <Card className="p-4 md:p-5">
          <SectionHeading
            title="Đơn hàng đi kèm"
            action={
              <span className="text-label-sm text-ink-muted">{orderStatusLabel[order.status]}</span>
            }
          />

          <dl className="grid gap-3 text-body-sm md:grid-cols-2">
            <Row label="Người đặt" value={order.customer} />
            <Row label="Điện thoại" value={order.phone} mono />
            {order.email ? <Row label="Email" value={order.email} /> : null}
            <Row label="Đặt lúc" value={formatDateTime(order.placedAt)} />
            <Row label="Địa chỉ giao" value={order.address ?? "Đơn mẫu, không ghi địa chỉ"} />
            <Row label="Nhận hàng" value={getDeliveryMethod(order.deliveryMethodId).name} />
            <Row label="Thanh toán" value={getPaymentMethod(order.paymentMethodId).name} />
            {order.note ? <Row label="Ghi chú" value={order.note} /> : null}
          </dl>

          <div className="mt-4 border-t border-divider pt-4">
            <p className="text-label-md text-ink">Thuốc trong đơn</p>
            <ul className="mt-2 flex flex-col gap-2">
              {order.items.map((item) => (
                <li
                  key={`${item.product.id}-${item.unit.label}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
                >
                  <span className="min-w-0 text-body-md text-ink">
                    <Link
                      href={`/thuoc/${item.product.slug}`}
                      className="focus-ring rounded-chip hover:text-trust-text"
                    >
                      {item.product.name}
                    </Link>
                    {item.product.prescriptionRequired ? (
                      <span className="ml-2 inline-block align-middle">
                        <Badge tone="prescription">Kê đơn</Badge>
                      </span>
                    ) : null}
                  </span>
                  <span className="text-body-sm text-ink-muted">
                    {item.unit.label} × {item.line.quantity} ·{" "}
                    <span className="tabular-nums text-ink">{formatVnd(item.lineTotal)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between gap-3 border-t border-divider pt-3 text-body-md text-ink">
              <span>Tổng đơn</span>
              <span className="tabular-nums">{formatVnd(order.summary.total)}</span>
            </p>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="w-32 shrink-0 text-ink-subtle">{label}</dt>
      <dd className={`min-w-0 break-words text-ink-muted ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
