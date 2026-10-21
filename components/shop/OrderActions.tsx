import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { confirmReceived, requestReturn } from "@/lib/shop/order-actions";
import { returnReasons, type ResolvedOrder } from "@/lib/data/orders";
import { formatDateTime } from "@/lib/format";
import { CircleCheck, RotateCcw } from "@/lib/icons";

/**
 * Hai việc khách làm được khi đơn đang "Đã giao": xác nhận đã nhận, hoặc xin
 * hoàn trả.
 *
 * Nút là form thường gửi thẳng Server Action, không cần JavaScript — cùng cách
 * với nút thêm giỏ hàng và bình luận. Trang này khách mở bằng điện thoại trong
 * lúc chờ shipper; nút bấm không được phụ thuộc vào việc tải xong bundle.
 */
const messages: Record<string, { text: string; ok: boolean }> = {
  "ok-da-nhan": { text: "Đã xác nhận nhận hàng. Bạn có thể đánh giá sản phẩm.", ok: true },
  "ok-hoan-tra": {
    text: "Đã gửi yêu cầu hoàn trả. MediVia gọi lại trong 24 giờ làm việc.",
    ok: true,
  },
  "da-gui-hoan-tra": { text: "Yêu cầu hoàn trả trước đó vẫn đang chờ xử lý.", ok: false },
  "loi-don": { text: "Mã đơn này không thuộc máy bạn đang dùng.", ok: false },
  "loi-trang-thai": { text: "Đơn đang ở bước khác, không thực hiện được thao tác này.", ok: false },
  "loi-ly-do": { text: "Chọn một lý do hoàn trả.", ok: false },
};

export function OrderActions({
  order,
  messageCode,
}: {
  order: ResolvedOrder;
  messageCode?: string;
}) {
  const message = messageCode ? messages[messageCode] : undefined;
  const request = order.returnRequest;
  const pending = request && !request.decision;

  return (
    <div id="don" className="mt-2 scroll-mt-24 border-t border-divider pt-4">
      {message ? (
        <p
          role="status"
          className={`mb-3 text-body-sm ${message.ok ? "text-trust-text" : "text-danger"}`}
        >
          {message.text}
        </p>
      ) : null}

      {order.status === "da-giao" ? (
        <div className="flex flex-col gap-4">
          <form action={confirmReceived} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="code" value={order.code} />
            <Button type="submit" size="sm">
              <CircleCheck size={16} aria-hidden />
              Tôi đã nhận được hàng
            </Button>
            <span className="text-body-sm text-ink-subtle">
              Quá 3 ngày không phản hồi, đơn tự động hoàn thành.
            </span>
          </form>

          {pending ? (
            <p className="rounded-card bg-recessed p-3 text-body-sm text-ink-muted">
              Yêu cầu hoàn trả đang chờ MediVia xử lý.
            </p>
          ) : (
            <details>
              <summary className="focus-ring inline-flex cursor-pointer items-center gap-1.5 rounded-chip text-body-sm text-trust-text">
                <RotateCcw size={15} aria-hidden />
                Yêu cầu hoàn trả
              </summary>
              <form action={requestReturn} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="code" value={order.code} />
                <Field label="Lý do" id={`ly-do-${order.code}`} required>
                  <Select id={`ly-do-${order.code}`} name="reasonId" required>
                    {returnReasons.map((reason) => (
                      <option key={reason.id} value={reason.id}>
                        {reason.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Mô tả thêm"
                  id={`ghi-chu-${order.code}`}
                  hint="Không bắt buộc. Càng cụ thể càng nhanh xử lý."
                >
                  <Textarea
                    id={`ghi-chu-${order.code}`}
                    name="note"
                    rows={2}
                    maxLength={300}
                    placeholder="Ví dụ: hộp bị móp, vỉ thuốc bên trong vỡ."
                  />
                </Field>
                <Button type="submit" variant="outline-trust" size="sm">
                  Gửi yêu cầu
                </Button>
              </form>
            </details>
          )}
        </div>
      ) : null}

      {order.status === "hoan-thanh" ? (
        <p className="text-body-sm text-ink-muted">
          Đơn đã hoàn thành. Vào trang sản phẩm để viết đánh giá.
        </p>
      ) : null}

      {/* Lý do hiện cho cả đơn đã xử lý xong: khách cần đọc lại mình đã báo gì. */}
      {request && order.status !== "da-giao" ? (
        <p className="mt-3 text-body-sm text-ink-muted">
          Hoàn trả · {request.reason}
          {request.decision === "tu-choi" ? " (đã từ chối)" : ""} ·{" "}
          {formatDateTime(request.requestedAt)}
        </p>
      ) : null}
    </div>
  );
}
