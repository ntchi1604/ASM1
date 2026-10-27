import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/ContentPage";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime, formatVnd } from "@/lib/format";
import {
  getOrderByCode,
  getPrescriptionByOrderCode,
  orderStatusLabel,
  orderStatusHint,
  type PrescriptionStatus,
} from "@/lib/data/orders";
import { Package, Phone } from "@/lib/icons";
import { site } from "@/lib/data/site";
import { readPlacedOrderCodes } from "@/lib/shop/placed-orders";
import { OrderActions } from "@/components/shop/OrderActions";

export const metadata: Metadata = {
  title: "Tra cứu đơn hàng",
  description: "Nhập mã đơn để xem trạng thái, thuốc trong đơn và số tiền phải trả.",
};

/**
 * Tra cứu đơn hàng.
 *
 * Tra bằng MÃ ĐƠN, không bằng số điện thoại. Mã đơn chỉ người đặt mới biết; số
 * điện thoại thì ai cũng đoán được, và tra bằng số điện thoại là biến trang này
 * thành công cụ dò xem người khác đang mua thuốc gì — dữ liệu sức khoẻ của người
 * khác, đúng thứ mà chính sách bảo mật hứa không để lộ.
 *
 * Trạng thái lấy từ `lib/data/orders.ts`, cùng nguồn với trang quản trị đơn hàng.
 * Trang này tự đoán trạng thái là có ngày nó nói "đang giao" trong khi quản trị
 * nói "chờ xác nhận" cho cùng một đơn.
 */
export default async function OrderLookupPage({
  searchParams,
}: PageProps<"/tra-cuu-don-hang">) {
  const params = await searchParams;
  const raw = params.ma;
  const code = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const order = code ? getOrderByCode(code) : undefined;
  const rawState = params["trang-thai"];
  const actionState = Array.isArray(rawState) ? rawState[0] : rawState;

  /*
    Nút "đã nhận hàng" / "hoàn trả" chỉ hiện với đơn trên MÁY NÀY. Tra được mã đơn
    không có nghĩa là chủ đơn — mở nút cho mọi mã là mời người đọc tin nhắn của
    người khác bấm đóng đơn hộ.
  */
  const owned = order ? (await readPlacedOrderCodes()).includes(order.code) : false;

  return (
    <ContentPage
      title="Tra cứu đơn hàng"
      lead="Nhập mã đơn MediVia gửi trong tin nhắn xác nhận để xem đơn đang ở bước nào."
    >
      <Card className="p-4 md:p-5">
        <form action="/tra-cuu-don-hang" method="get">
          <Field
            label="Mã đơn hàng"
            id="ma"
            hint="Dạng MV15092814 — in trên tin nhắn xác nhận đơn."
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                id="ma"
                name="ma"
                required
                defaultValue={code}
                placeholder="MV15092814"
                autoComplete="off"
                className="sm:flex-1"
              />
              <Button type="submit" className="sm:w-36">
                Tra cứu
              </Button>
            </div>
          </Field>
        </form>

        <p className="mt-3 border-t border-divider pt-3 text-body-sm text-ink-subtle">
          Ví dụ có thật trong bản mẫu:{" "}
          <Link
            href="/tra-cuu-don-hang?ma=MV15092814"
            className="focus-ring rounded-chip text-trust-text underline decoration-trust/30 underline-offset-2"
          >
            MV15092814
          </Link>
        </p>
      </Card>

      {code && !order ? (
        <Card className="p-4 md:p-5">
          <h2 className="text-headline-md text-ink">
            Không tìm thấy đơn nào mang mã này
          </h2>
          <p className="mt-2 text-body-md text-ink-muted">
            Kiểm tra lại mã đơn trong tin nhắn xác nhận. Bản mẫu chỉ lưu bảy đơn gần
            nhất, nên mã đơn cũ hơn cũng sẽ không tra được.
          </p>
          <p className="mt-3 flex items-start gap-2 text-body-sm text-ink-muted">
            <Phone size={16} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
            <span>
              Vẫn không tra được thì gọi{" "}
              <span className="tabular-nums text-ink">{site.hotline}</span> và đọc mã
              đơn — không cần đọc tên thuốc qua điện thoại.
            </span>
          </p>
        </Card>
      ) : null}

      {order ? (
        <Card className="p-4 md:p-5">
          <SectionHeading
            title={order.code}
            action={
              <span className="inline-flex items-center whitespace-nowrap rounded-chip bg-recessed px-2.5 py-1 text-label-sm text-ink-muted">
                {orderStatusLabel[order.status]}
              </span>
            }
          />

          <p className="text-body-md text-ink-muted">
            {orderStatusHint[order.status]} · đặt lúc{" "}
            {formatDateTime(order.placedAt)}
          </p>

          {/*
            Địa chỉ giao chỉ hiện với đơn khách tự đặt — đơn mẫu cũ không lưu.
            Đây là trang tra được bằng mã đơn, nên nó KHÔNG in email; số điện
            thoại cũng vậy. Địa chỉ là thứ người nhận hàng cần để biết đơn đi đâu.
          */}
          {order.address ? (
            <dl className="mt-4 flex flex-col gap-1.5 border-t border-divider pt-4 text-body-md">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-ink-subtle">Giao tới</dt>
                <dd className="min-w-0 text-ink-muted">{order.address}</dd>
              </div>
            </dl>
          ) : null}

          <ul className="mt-4 flex flex-col gap-2.5 border-t border-divider pt-4">
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
                  <span className="tabular-nums text-ink">
                    {formatVnd(item.lineTotal)}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {order.requiresPrescription ? (
            <PrescriptionStatusBlock orderCode={order.code} />
          ) : null}

          <div className="mt-4 flex flex-col gap-1.5 border-t border-divider pt-4 text-body-md">
            <p className="flex justify-between gap-3 text-ink-muted">
              <span>Tạm tính</span>
              <span className="tabular-nums text-ink">
                {formatVnd(order.summary.subtotal)}
              </span>
            </p>
            <p className="flex justify-between gap-3 text-ink-muted">
              <span>
                Phí giao · {order.summary.delivery.name}
              </span>
              <span className="tabular-nums text-ink">
                {order.summary.shipping === 0
                  ? "Miễn phí"
                  : formatVnd(order.summary.shipping)}
              </span>
            </p>
            <p className="flex justify-between gap-3 pt-1 text-headline-md text-ink">
              <span>Tổng</span>
              <span className="tabular-nums">{formatVnd(order.summary.total)}</span>
            </p>
          </div>

          <p className="mt-3 text-body-sm text-ink-subtle">
            Số tiền tính bằng đúng hàm trang giỏ hàng và trang thanh toán đang dùng —
            xem{" "}
            <Link
              href="/gio-hang"
              className="focus-ring rounded-chip text-trust-text underline decoration-trust/30 underline-offset-2"
            >
              giỏ hàng của bạn
            </Link>
            .
          </p>

          {owned ? <OrderActions order={order} messageCode={actionState} /> : null}
        </Card>
      ) : null}

      <Card className="flex flex-wrap items-start gap-3 p-4 md:p-5">
        <Package size={18} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-label-md text-ink">Tra bằng mã đơn, không bằng số điện thoại</h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Số điện thoại ai cũng đoán được. Cho tra đơn bằng số điện thoại nghĩa là
            ai cũng dò được người khác đang mua thuốc gì.
          </p>
          <ButtonLink href="/huong-dan-mua-thuoc" variant="outline-trust" size="sm" className="mt-3">
            Xem hướng dẫn mua thuốc
          </ButtonLink>
        </div>
      </Card>
    </ContentPage>
  );
}

/**
 * Đơn thuốc của đơn hàng — trạng thái duyệt, và lý do từ chối nếu có.
 *
 * Khối này là lý do tồn tại của cả luồng duyệt phía sau: khách gửi ảnh đơn để
 * được giao thuốc, nên họ phải đọc được kết quả ở đúng chỗ họ tra đơn. Lý do từ
 * chối in NGUYÊN VĂN câu dược sĩ viết — viết lại cho mượt là che mất chi tiết
 * duy nhất khách cần để sửa.
 *
 * Đơn có thuốc kê đơn mà chưa có dòng đơn thuốc là đơn đặt trước khi sửa luồng
 * này; nói đúng chuyện đó thay vì hiện "chờ duyệt" cho một tệp không tồn tại.
 */
function PrescriptionStatusBlock({ orderCode }: { orderCode: string }) {
  const row = getPrescriptionByOrderCode(orderCode);

  if (!row) {
    return (
      <p className="mt-4 rounded-card border border-hairline bg-recessed px-4 py-3 text-body-sm text-ink-muted">
        Đơn có thuốc kê đơn nhưng chưa có ảnh đơn đính kèm. Gọi{" "}
        <span className="tabular-nums text-ink">{site.hotline}</span> để dược sĩ hướng
        dẫn bổ sung.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-card border border-hairline bg-card px-4 py-3">
      <p className="flex flex-wrap items-center gap-2 text-label-md text-ink">
        <Badge tone="prescription">Đơn thuốc</Badge>
        <span className="text-ink-muted">{prescriptionStatusLabel[row.status]}</span>
      </p>

      {row.status === "cho-duyet" ? (
        <p className="mt-1.5 text-body-sm text-ink-muted">
          Dược sĩ đang xem đơn của bạn và sẽ gọi xác nhận. Thuốc kê đơn chỉ được soạn
          sau khi đơn thuốc hợp lệ.
        </p>
      ) : null}

      {row.status === "da-duyet" ? (
        <p className="mt-1.5 text-body-sm text-ink-muted">
          Đơn thuốc đã được dược sĩ duyệt
          {row.reviewedBy ? ` (${row.reviewedBy})` : ""}. Đơn hàng được soạn theo đúng
          đơn này.
        </p>
      ) : null}

      {row.status === "tu-choi" ? (
        <>
          <p className="mt-1.5 text-body-sm text-ink">
            <span className="text-ink-subtle">Lý do: </span>
            {row.rejectReason}
          </p>
          <p className="mt-1.5 text-body-sm text-ink-muted">
            Gửi lại ảnh đơn đã sửa hoặc gọi{" "}
            <span className="tabular-nums text-ink">{site.hotline}</span> để được hướng
            dẫn.
          </p>
        </>
      ) : null}
    </div>
  );
}

const prescriptionStatusLabel: Record<PrescriptionStatus, string> = {
  "cho-duyet": "Chờ duyệt",
  "da-duyet": "Đã duyệt",
  "tu-choi": "Bị từ chối",
};