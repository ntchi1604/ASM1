import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionHeading } from "@/components/ui/Card";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  getPrescriptionRows,
  prescriptionMaxBytes,
  prescriptionRejectReasons,
  type PrescriptionStatus,
} from "@/lib/data/orders";
import { requireSession } from "@/lib/admin/auth";
import { canApprovePrescriptions } from "@/lib/admin/users";
import { reviewPrescription } from "@/lib/admin/actions";
import { AdminButtonForm, AdminForm } from "@/components/admin/AdminForm";
import { Field, Select } from "@/components/ui/Field";
import { AlertTriangle, ClipboardList, Clock, FileText, ShieldCheck } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Duyệt đơn thuốc",
  description: "Hàng đợi đơn thuốc kê đơn chờ dược sĩ duyệt trước khi soạn hàng.",
};

/**
 * Hàng đợi duyệt đơn thuốc.
 *
 * Đây là màn hình giữ ba lời hứa đã nói với khách ở trang Quy định bán thuốc kê đơn,
 * nên ba lời hứa đó hiện thành chữ trên trang chứ không nằm trong chú thích mã:
 *  1. Ảnh đơn không nằm trong đường dẫn công khai — trang này chỉ hiện TÊN TỆP, và
 *     nói rõ tệp nằm trong kho riêng. Lược đồ cũng gọi nó là `storage_key`, không
 *     phải URL. Hiện ảnh ở đây là tự tay tạo đường dẫn công khai cho đơn thuốc.
 *  2. Chỉ nhận JPG, PNG, PDF dưới 10 MB — cột dung lượng đối chiếu với hạn mức đó.
 *  3. Ảnh bị xoá sau khi đơn hoàn tất — mọi dòng đều có hạn xoá, lược đồ để NOT NULL.
 *
 * Nút duyệt và từ chối chỉ hiện với vai trò `duoc-si`. Kiểm quyền THẬT nằm trong
 * `reviewPrescription` — người gửi không bao giờ đi qua giao diện. Tài khoản kế toán
 * mở trang này vẫn xem được hàng đợi nhưng không có nút nào để bấm.
 *
 * `reviewedBy` lấy từ PHIÊN chứ không từ form: nhật ký duyệt đơn thuốc là thứ để truy
 * trách nhiệm chuyên môn, cho form tự khai tên người duyệt thì nó thành ô chữ ai
 * điền cũng được.
 */

const statusLabel: Record<PrescriptionStatus, string> = {
  "cho-duyet": "Chờ duyệt",
  "da-duyet": "Đã duyệt",
  "tu-choi": "Từ chối",
};

const statusClass: Record<PrescriptionStatus, string> = {
  "cho-duyet": "bg-trust-wash text-trust-text",
  "da-duyet": "bg-recessed text-ink-muted",
  "tu-choi": "bg-recessed text-ink-muted",
};

/**
 * Dung lượng tệp: "1,2 MB" — cùng một cách viết ở mọi dòng.
 *
 * Chia cho 1.048.576 (MiB) chứ không phải 1.000.000: hạn mức của lược đồ là
 * 10.485.760 byte, và mọi câu đã hứa với khách đều ghi "dưới 10 MB". Chia theo
 * hệ thập phân thì chính dòng hạn mức hiện "10,5 MB" — trông như hệ thống cho
 * phép nhiều hơn mức nó thực sự nhận.
 */
function formatFileSize(bytes: number): string {
  return `${(bytes / 1_048_576).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;
}

export default async function AdminPrescriptionsPage() {
  const session = await requireSession();
  const canReview = canApprovePrescriptions(session.role);
  const rows = getPrescriptionRows();
  const pending = rows.filter((row) => row.status === "cho-duyet");
  const decided = rows.filter((row) => row.status !== "cho-duyet");

  return (
    <AdminShell activeHref="/admin/duyet-don-thuoc">
      <div className="flex flex-col gap-6">
        <header>
          <p className="text-label-sm text-ink-subtle">
            Hạn mức ảnh: JPG, PNG, PDF dưới {formatFileSize(prescriptionMaxBytes)}
          </p>
          <h1 className="mt-1 text-headline-xl text-ink">Duyệt đơn thuốc</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Thuốc kê đơn chỉ được soạn sau khi dược sĩ đối chiếu đơn của bác sĩ với giỏ hàng.
            Dược sĩ gọi xác nhận trong khoảng 15 phút kể từ lúc khách gửi đơn.
          </p>
        </header>

        <section aria-label="Chỉ số đơn thuốc" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Chờ duyệt"
            value={`${pending.length} đơn`}
            hint="Phải gọi khách trước khi soạn thuốc"
            danger={pending.length > 0}
          />
          <StatCard label="Đã xử lý" value={`${decided.length} đơn`} hint="Trong danh sách mẫu" />
          <StatCard
            label="Thời hạn lưu ảnh"
            value="Xoá sau khi đơn hoàn tất"
            hint="Không có ảnh đơn thuốc nào được lưu vĩnh viễn"
          />
        </section>

        <Card className="border-danger/30 bg-danger-wash p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-headline-md text-danger">
            <AlertTriangle size={18} aria-hidden />
            Không bán khi chưa duyệt xong
          </h2>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Đơn có thuốc kê đơn không được chuyển sang soạn hàng khi đơn thuốc còn ở trạng thái
            chờ duyệt. Nghi ngờ đơn không hợp lệ thì từ chối và gọi khách, không tự suy diễn
            thay bác sĩ.
          </p>
        </Card>

        {/*
          Kế toán mở được trang này nhưng không duyệt được. Nói thẳng vai trò nào
          duyệt được thay vì để nút biến mất không lời giải thích — người dùng chỉ
          tưởng giao diện lỗi.
        */}
        {!canReview ? (
          <Card className="flex flex-wrap items-start gap-3 p-4 md:p-5">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
            <p className="max-w-2xl text-body-md text-ink-muted">
              Bạn đang đăng nhập với vai trò kế toán nên chỉ xem được hàng đợi. Duyệt đơn thuốc
              kê đơn cần chứng chỉ hành nghề — đăng nhập bằng tài khoản dược sĩ để xử lý.
            </p>
          </Card>
        ) : null}

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading
              title={`${pending.length} đơn chờ duyệt`}
              action={
                <span className="flex items-center gap-1.5 text-body-sm text-ink-subtle">
                  <Clock size={15} aria-hidden />
                  Gọi trong 15 phút
                </span>
              }
            />
          </div>

          {pending.length === 0 ? (
            <p className="border-t border-hairline px-4 py-6 text-body-md text-ink-muted">
              Không còn đơn nào chờ duyệt.
            </p>
          ) : (
            <ul className="border-t border-hairline">
              {pending.map((row) => (
                <li key={row.orderCode} className="border-b border-divider last:border-b-0">
                  <PrescriptionCard row={row} canReview={canReview} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading title="Đã xử lý" />
          </div>
          <ul className="border-t border-hairline">
            {decided.map((row) => (
              <li key={row.orderCode} className="border-b border-divider last:border-b-0">
                <PrescriptionCard row={row} canReview={false} />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 md:p-5">
          <SectionHeading title="Lý do từ chối được dùng" />
          <p className="text-body-sm text-ink-muted">
            Dược sĩ chọn trong danh sách này chứ không gõ tự do — lý do từ chối là câu khách đọc
            để biết phải sửa gì, và câu gõ tự do thì mỗi người viết một kiểu.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {prescriptionRejectReasons.map((reason) => (
              <li key={reason} className="flex gap-2 text-body-md text-ink">
                <span aria-hidden className="text-ink-subtle">
                  •
                </span>
                {reason}
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-body-sm text-ink-subtle">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
            <span>
              Ảnh đơn thuốc nằm trong kho riêng, không có đường dẫn công khai. Trang này chỉ
              hiện tên tệp và hạn xoá; mở ảnh để duyệt là việc trong phần mềm nội bộ có ghi
              nhật ký truy cập.
            </span>
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}

function PrescriptionCard({
  row,
  canReview,
}: {
  row: ReturnType<typeof getPrescriptionRows>[number];
  canReview: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between md:gap-6 md:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium tabular-nums text-body-md text-ink">{row.orderCode}</span>
          <span
            className={`inline-flex items-center whitespace-nowrap rounded-chip px-2 py-0.5 text-label-sm ${statusClass[row.status]}`}
          >
            {statusLabel[row.status]}
          </span>
        </div>

        <p className="mt-1 text-body-sm text-ink-muted">
          {row.order.customer} ·{" "}
          <span className="tabular-nums">{row.order.phone}</span> · gửi lúc{" "}
          {formatDateTime(row.submittedAt)}
        </p>

        {/* Thuốc kê đơn trong đơn — thứ dược sĩ phải đối chiếu với tờ đơn. */}
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {row.order.prescriptionProducts.map((product) => (
            <li key={product.id}>
              <Link href={`/thuoc/${product.slug}`} className="focus-ring rounded-chip">
                <Badge tone="prescription">{product.name}</Badge>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-sm text-ink-subtle">
          <FileText size={14} aria-hidden />
          <span className="text-ink-muted">{row.fileName}</span>
          <span>
            {row.mimeType.replace("image/", "").replace("application/", "").toUpperCase()} ·{" "}
            {formatFileSize(row.sizeBytes)}
          </span>
          <span>· xoá sau {formatDate(row.deleteAfter)}</span>
        </p>

        {row.rejectReason ? (
          <p className="mt-2 text-body-sm text-ink-muted">
            <strong className="font-medium text-ink">Lý do từ chối: </strong>
            {row.rejectReason}
          </p>
        ) : null}
      </div>

      {canReview ? <ReviewForm orderCode={row.orderCode} /> : null}

      <div className="shrink-0 text-body-sm text-ink-subtle md:text-right">
        {row.reviewedBy && row.reviewedAt ? (
          <>
            <p className="flex items-center gap-1.5 md:justify-end">
              <ClipboardList size={14} aria-hidden />
              <span className="text-ink-muted">{row.reviewedBy}</span>
            </p>
            <p className="mt-0.5">{formatDateTime(row.reviewedAt)}</p>
          </>
        ) : (
          <p>Chưa có dược sĩ duyệt</p>
        )}
      </div>
    </div>
  );
}

/**
 * Hai nút quyết định của một đơn thuốc chờ duyệt.
 *
 * Tách thành hai form chứ không một form hai nút: nút từ chối cần ô chọn lý do, và
 * gộp chung thì lý do từ chối nằm ngay cạnh nút duyệt — bấm duyệt mà trong đầu còn
 * đang nghĩ tới lý do là chuyện xảy ra được. Tách ra thì mỗi nút một việc.
 *
 * Duyệt không hỏi lại: nó là quyết định thường gặp, hỏi lại chỉ làm chậm hàng đợi.
 * Từ chối thì bắt buộc chọn lý do, vì lý do là câu khách dùng để biết phải sửa gì.
 */
function ReviewForm({ orderCode }: { orderCode: string }) {
  return (
    <div className="flex shrink-0 flex-col gap-3 md:w-72">
      <AdminButtonForm
        action={reviewPrescription}
        hidden={{ orderCode, decision: "duyet" }}
        submit="Duyệt đơn này"
        variant="solid-trust"
        size="sm"
      />

      <AdminForm
        action={reviewPrescription}
        hidden={{ orderCode, decision: "tu-choi" }}
        submit="Từ chối"
        variant="outline-trust"
        size="sm"
      >
        <Field label="Lý do từ chối" id={`reason-${orderCode}`} required>
          <Select id={`reason-${orderCode}`} name="rejectReason" required defaultValue="">
            <option value="" disabled>
              Chọn lý do…
            </option>
            {prescriptionRejectReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </Select>
        </Field>
      </AdminForm>
    </div>
  );
}