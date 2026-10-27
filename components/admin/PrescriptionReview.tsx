import { AdminButtonForm, AdminForm } from "@/components/admin/AdminForm";
import { Field, Input, Select } from "@/components/ui/Field";
import {
  prescriptionRejectReasons,
  type PrescriptionStatus,
} from "@/lib/data/orders";
import { reviewPrescription } from "@/lib/admin/actions";

/**
 * Ba mảnh dùng chung giữa hàng đợi và trang chi tiết một đơn thuốc: nhãn trạng
 * thái, chip trạng thái, và form quyết định.
 *
 * Tách ra khi trang chi tiết xuất hiện — hai bản chép tay của form từ chối là hai
 * chỗ để lệch nhau về số ô, về giới hạn 255 ký tự, về câu nào thắng câu nào. Mà
 * đây là form ghi lý do khách đọc, lệch một chữ là lệch lời giải thích cho một
 * người đang cần thuốc.
 */

export const prescriptionStatusLabel: Record<PrescriptionStatus, string> = {
  "cho-duyet": "Chờ duyệt",
  "da-duyet": "Đã duyệt",
  "tu-choi": "Từ chối",
};

const prescriptionStatusClass: Record<PrescriptionStatus, string> = {
  "cho-duyet": "bg-trust-wash text-trust-text",
  "da-duyet": "bg-recessed text-ink-muted",
  "tu-choi": "bg-recessed text-ink-muted",
};

/** "Chờ duyệt" là việc đang chờ người làm nên tô teal — cùng nghĩa teal khắp site. */
export function PrescriptionStatusChip({ status }: { status: PrescriptionStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-chip px-2 py-0.5 text-label-sm ${prescriptionStatusClass[status]}`}
    >
      {prescriptionStatusLabel[status]}
    </span>
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
 *
 * Từ chối có HAI đường ghi lý do: chọn câu có sẵn, hoặc tự viết. Bốn câu có sẵn là
 * đúng bốn trường hợp đã hứa ở trang Quy định, nhưng đơn thật không phải lúc nào
 * cũng rơi vào một trong bốn ô — dược sĩ gặp đơn photo mất góc, đơn của bác sĩ
 * chuyên khoa khác, đơn ghi tay không đọc được. Bắt chọn gần đúng nhất thì câu
 * khách đọc không còn là lý do thật. Ô tự viết thắng ô chọn; cả hai đều để trống
 * thì server trả lỗi.
 */
export function PrescriptionReviewForm({
  orderCode,
  className,
}: {
  orderCode: string;
  className?: string;
}) {
  return (
    <div className={className ?? "flex shrink-0 flex-col gap-3 md:w-72"}>
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
        className="md:[&>div]:grid-cols-1"
      >
        <Field label="Lý do có sẵn" id={`reason-${orderCode}`}>
          <Select id={`reason-${orderCode}`} name="rejectReason" defaultValue="">
            <option value="">Chọn lý do…</option>
            {prescriptionRejectReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Hoặc tự viết lý do"
          id={`reason-khac-${orderCode}`}
          hint="Ghi đè lý do phía trên. Tối đa 255 ký tự."
        >
          <Input
            id={`reason-khac-${orderCode}`}
            name="rejectReasonKhac"
            maxLength={255}
            placeholder="Ví dụ: ảnh đơn thiếu trang 2, không thấy liều dùng"
          />
        </Field>
      </AdminForm>
    </div>
  );
}
