import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionHeading } from "@/components/ui/Card";
import { formatDate, formatDateTime, formatFileSize } from "@/lib/format";
import {
  getPrescriptionRows,
  prescriptionMaxBytes,
  prescriptionRejectReasons,
  type PrescriptionRow,
  type PrescriptionStatus,
} from "@/lib/data/orders";
import { listRows, updateRow } from "@/lib/admin/db";
import {
  prescriptionExpiredReason,
  purgeExpiredPrescriptions,
  prescriptionUrl,
} from "@/lib/prescriptions";
import { requireSession } from "@/lib/admin/auth";
import { canApprovePrescriptions } from "@/lib/admin/users";
import {
  PrescriptionReviewForm,
  PrescriptionStatusChip,
  prescriptionStatusLabel,
} from "@/components/admin/PrescriptionReview";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { matchesQuery, readFilter } from "@/lib/admin/filter";
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
 *  1. Ảnh đơn không nằm trong đường dẫn công khai — tệp ở `.data/prescriptions`
 *     và đi qua `/api/don-thuoc/[name]`, nơi chỉ phiên `duoc-si` đọc được. Lược đồ
 *     cũng gọi nó là `storage_key`, không phải URL.
 *  2. Chỉ nhận JPG, PNG, PDF dưới 10 MB — cột dung lượng đối chiếu với hạn mức đó.
 *  3. Ảnh bị xoá sau khi đơn hoàn tất — mọi dòng đều có hạn xoá, lược đồ để NOT NULL.
 *     Hạn đó được dọn ở đầu trang này (`purgeExpiredPrescriptions`), và đặt về hôm
 *     nay ở `setOrderStatus` khi đơn đóng.
 *
 * Nút duyệt và từ chối chỉ hiện với vai trò `duoc-si`. Kiểm quyền THẬT nằm trong
 * `reviewPrescription` — người gửi không bao giờ đi qua giao diện. Tài khoản kế toán
 * mở trang này vẫn xem được hàng đợi nhưng không có nút nào để bấm.
 *
 * `reviewedBy` lấy từ PHIÊN chứ không từ form: nhật ký duyệt đơn thuốc là thứ để truy
 * trách nhiệm chuyên môn, cho form tự khai tên người duyệt thì nó thành ô chữ ai
 * điền cũng được.
 */

export default async function AdminPrescriptionsPage({
  searchParams,
}: PageProps<"/admin/duyet-don-thuoc">) {
  const session = await requireSession();
  const canReview = canApprovePrescriptions(session.role);
  const filter = readFilter(await searchParams, ["q", "trang-thai"]);

  /*
    Dọn ảnh quá hạn ở đây chứ không trong `getPrescriptionRows`: hàm đó còn chạy
    trong script sinh dữ liệu (`design/seed-postgres.mjs`) và lúc build.
    Không cần cờ "mỗi tiến trình một lần": dòng đã dọn có `storageKey` rỗng nên
    lần render sau hàm bỏ qua hết, không unlink lại.
  */
  const stale = listRows("prescriptions") as PrescriptionRow[];
  for (const code of purgeExpiredPrescriptions(stale)) {
    /*
      Hết hạn lưu ảnh mà chưa ai quyết định nghĩa là việc này không còn ai làm.
      Đóng luôn đơn thuốc với lý do khách đọc được: để nguyên `cho-duyet` thì nút
      duyệt còn đó trong khi ảnh đã mất, và khách chờ mãi một câu trả lời không tới.
      Không ghi `reviewedBy` — không dược sĩ nào duyệt đơn này, hệ thống đóng nó.
    */
    const row = stale.find((item) => item.orderCode === code);
    updateRow("prescriptions", code, {
      storageKey: "",
      ...(row?.status === "cho-duyet"
        ? { status: "tu-choi" as const, rejectReason: prescriptionExpiredReason }
        : {}),
    });
  }

  const rows = getPrescriptionRows();

  // Lọc trước rồi mới chia hai nhóm: lọc sau khi chia thì một trong hai thẻ
  // rỗng mà không nói vì sao.
  const visible = rows.filter(
    (row) =>
      matchesQuery(filter.q, row.orderCode, row.fileName, row.order.customer, row.order.phone) &&
      (!filter["trang-thai"] || row.status === filter["trang-thai"]),
  );
  const pending = visible.filter((row) => row.status === "cho-duyet");
  const decided = visible.filter((row) => row.status !== "cho-duyet");
  // Thẻ số phía trên là số của cả hàng đợi, không phải của phần đang lọc.
  const allPending = rows.filter((row) => row.status === "cho-duyet");
  const allDecided = rows.filter((row) => row.status !== "cho-duyet");

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
            value={`${allPending.length} đơn`}
            hint="Phải gọi khách trước khi soạn thuốc"
            danger={allPending.length > 0}
          />
          <StatCard label="Đã xử lý" value={`${allDecided.length} đơn`} hint="Đã duyệt hoặc từ chối" />
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

        <AdminFilterBar
          action="/admin/duyet-don-thuoc"
          query={filter.q}
          placeholder="Mã đơn, tên tệp hoặc tên khách"
          selects={[
            {
              name: "trang-thai",
              label: "Trạng thái",
              value: filter["trang-thai"],
              options: (Object.keys(prescriptionStatusLabel) as PrescriptionStatus[]).map(
                (status) => ({
                  value: status,
                  label: prescriptionStatusLabel[status],
                }),
              ),
            },
          ]}
        />

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
              {filter.q || filter["trang-thai"]
                ? "Không có đơn chờ duyệt nào khớp bộ lọc đang chọn."
                : "Không còn đơn nào chờ duyệt."}
            </p>
          ) : (
            <ul className="border-t border-hairline">
              {pending.map((row) => (
                <li
                  key={row.orderCode}
                  id={`dt-${row.orderCode}`}
                  className="scroll-mt-24 border-b border-divider last:border-b-0"
                >
                  <PrescriptionCard row={row} canReview={canReview} canViewFile={canReview} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading
              title={
                decided.length === allDecided.length
                  ? "Đã xử lý"
                  : `${decided.length} / ${allDecided.length} đơn đã xử lý khớp bộ lọc`
              }
            />
          </div>
          {decided.length === 0 ? (
            <p className="border-t border-hairline px-4 py-4 text-body-md text-ink-muted md:px-5">
              {filter.q || filter["trang-thai"]
                ? "Không có đơn đã xử lý nào khớp bộ lọc đang chọn."
                : "Chưa có đơn nào được duyệt hoặc từ chối."}
            </p>
          ) : (
          <ul className="border-t border-hairline">
            {decided.map((row) => (
              <li
                key={row.orderCode}
                id={`dt-${row.orderCode}`}
                className="scroll-mt-24 border-b border-divider last:border-b-0"
              >
                <PrescriptionCard row={row} canReview={false} canViewFile={canReview} />
              </li>
            ))}
          </ul>
          )}
        </Card>

        <Card className="p-4 md:p-5">
          <SectionHeading title="Lý do từ chối thường gặp" />
          <p className="text-body-sm text-ink-muted">
            Bốn câu dưới đây là bốn trường hợp đã hứa với khách ở trang Quy định bán thuốc kê
            đơn, và là lựa chọn mặc định khi từ chối. Đơn không rơi vào ô nào thì dược sĩ tự
            viết lý do — câu khách đọc phải đúng với đơn của họ, không phải câu gần đúng nhất.
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
              Ảnh đơn thuốc nằm trong kho riêng, không có đường dẫn công khai. Mở ảnh đi qua
              đường dẫn chỉ tài khoản dược sĩ đọc được — người khác nhận 404 chứ không phải
              trang đăng nhập — và mỗi lần mở được ghi vào{" "}
              <span className="font-mono text-ink-muted">.data/prescriptions-access.log</span>{" "}
              kèm tên dược sĩ và thời điểm.
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
  canViewFile,
}: {
  row: ReturnType<typeof getPrescriptionRows>[number];
  canReview: boolean;
  canViewFile: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between md:gap-6 md:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium tabular-nums text-body-md text-ink">{row.orderCode}</span>
          <PrescriptionStatusChip status={row.status} />
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

        <PrescriptionFile row={row} canViewFile={canViewFile} />

        {row.rejectReason ? (
          <p className="mt-2 text-body-sm text-ink-muted">
            <strong className="font-medium text-ink">Lý do từ chối: </strong>
            {row.rejectReason}
          </p>
        ) : null}
      </div>

      {canReview ? <PrescriptionReviewForm orderCode={row.orderCode} /> : null}

      <div className="shrink-0 text-body-sm text-ink-subtle md:text-right">
        {row.reviewedBy && row.reviewedAt ? (
          <>
            <p className="flex items-center gap-1.5 md:justify-end">
              <ClipboardList size={14} aria-hidden />
              <span className="text-ink-muted">{row.reviewedBy}</span>
            </p>
            <p className="mt-0.5">{formatDateTime(row.reviewedAt)}</p>
          </>
        ) : row.rejectReason ? (
          <p>Hệ thống đóng — hết hạn lưu ảnh</p>
        ) : (
          <p>Chưa có dược sĩ duyệt</p>
        )}
      </div>
    </div>
  );
}

/**
 * Xem nhanh tệp đơn thuốc ngay trong hàng đợi.
 *
 * Ở đây CHỈ là bản xem trước: ảnh bị kẹp ở 224px để mười đơn vừa một màn hình, đủ
 * để biết đơn nào là tờ giấy trắng nhoè còn đơn nào là đơn có chữ ký. Chữ trên tờ
 * đơn thì phải mở trang chi tiết — đó là lý do route `[orderCode]` tồn tại.
 *
 * Ba trạng thái, ba câu khác nhau — gộp chúng thành "không xem được" là để dược sĩ
 * đoán mò giữa "chưa từng có tệp" và "tệp bị xoá theo hạn".
 */
function PrescriptionFile({
  row,
  canViewFile,
}: {
  row: ReturnType<typeof getPrescriptionRows>[number];
  canViewFile: boolean;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      <Link
        href={`/admin/duyet-don-thuoc/${row.orderCode}`}
        className="focus-ring inline-flex w-fit items-center gap-1.5 rounded-chip text-label-sm text-trust-text underline decoration-trust/30 underline-offset-2"
      >
        Xem chi tiết đơn thuốc
      </Link>

      {!canViewFile ? (
        <p className="text-body-sm text-ink-subtle">
          Ảnh chỉ mở được bằng tài khoản dược sĩ.
        </p>
      ) : !row.storageKey ? (
        <p className="text-body-sm text-ink-subtle">
          {row.storageKey === ""
            ? "Ảnh đã xoá theo thời hạn lưu — hồ sơ duyệt vẫn còn."
            : "Không có tệp đính kèm cho đơn này."}
        </p>
      ) : row.mimeType === "application/pdf" ? (
        <p className="text-body-sm text-ink-subtle">Đơn thuốc là tệp PDF — mở ở trang chi tiết.</p>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- tệp riêng, không qua next/image
        <img
          src={prescriptionUrl(row.storageKey)}
          alt={`Đơn thuốc của đơn ${row.orderCode}`}
          className="max-h-56 w-auto max-w-full rounded-card border border-hairline object-contain"
        />
      )}
    </div>
  );
}