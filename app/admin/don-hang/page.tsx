import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard, Th } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionHeading } from "@/components/ui/Card";
import { formatDateTime, formatVnd } from "@/lib/format";
import { getDeliveryMethod } from "@/lib/data/delivery";
import { getPaymentMethod } from "@/lib/data/payment";
import {
  getOrders,
  getOrderStatusCounts,
  orderStatusHint,
  orderStatusLabel,
  type OrderStatus,
} from "@/lib/data/orders";
import { reportPeriod } from "@/lib/data/sales";
import { getRow } from "@/lib/admin/db";
import { setOrderStatus } from "@/lib/admin/actions";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { Field, Input, Select } from "@/components/ui/Field";
import { matchesQuery, readFilter } from "@/lib/admin/filter";

export const metadata: Metadata = {
  title: "Đơn hàng",
  description: "Hàng đợi đơn hàng theo trạng thái và danh sách đơn gần nhất.",
};

/**
 * Hàng đợi đơn hàng.
 *
 * Hai nguồn số khác nhau, và trang phải nói rõ chứ không để người đọc tự đoán:
 * bảng chỉ số đếm CẢ KỲ 14 NGÀY (khớp trang phân tích), còn bảng dưới chỉ có BẢY
 * đơn gần nhất. Không nói ra thì "Chờ xác nhận 38" cạnh ba dòng chờ xác nhận trông
 * như lỗi đếm.
 *
 * Tiền của mỗi đơn tính bằng `getOrderSummary()` — đúng hàm trang giỏ hàng và trang
 * thanh toán đang dùng, nên không có chuyện quản trị thấy một con số khác khách thấy.
 */

/**
 * Trạng thái đơn là chip trung tính, riêng "Chờ xác nhận" tô teal vì đó là việc
 * đang chờ người làm — cùng nghĩa teal ở khắp site.
 *
 * KHÔNG tô đỏ cho "Đã huỷ": đỏ trên site này là nguy hiểm cho sức khoẻ, không phải
 * tin xấu về kinh doanh. Huỷ đơn là chuyện bình thường của bán hàng.
 */
const statusClass: Record<OrderStatus, string> = {
  "cho-xac-nhan": "bg-trust-wash text-trust-text",
  "da-xac-nhan": "bg-recessed text-ink-muted",
  "dang-giao": "bg-recessed text-ink-muted",
  "da-giao": "bg-recessed text-ink-subtle",
  "hoan-thanh": "bg-recessed text-ink-subtle",
  // Hoàn trả là việc đang chờ tiền đi ngược ra — tô cam như mã giảm giá, KHÔNG
  // tô đỏ: đỏ trên site này là nguy hiểm cho sức khoẻ.
  "hoan-tra": "bg-promo-wash text-promo-text",
  "da-huy": "bg-recessed text-ink-subtle",
};

function StatusChip({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-chip px-2 py-0.5 text-label-sm ${statusClass[status]}`}
    >
      {orderStatusLabel[status]}
    </span>
  );
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/don-hang">) {
  const filter = readFilter(await searchParams, ["q", "trang-thai"]);
  const orders = getOrders();
  const orderStatusCounts = getOrderStatusCounts();
  const statuses = Object.keys(orderStatusCounts) as OrderStatus[];
  // Lọc chỉ đụng tới bảng bên dưới. Các thẻ số phía trên là số đơn của cả kỳ
  // báo cáo, không phải của phần đang lọc — đổi chúng theo bộ lọc là hai con số
  // khác nhau nói về cùng một thứ.
  const visible = orders.filter(
    (order) =>
      matchesQuery(filter.q, order.code, order.customer, order.phone, order.address) &&
      (!filter["trang-thai"] || order.status === filter["trang-thai"]),
  );

  return (
    <AdminShell activeHref="/admin/don-hang">
      <div className="flex flex-col gap-6">
        <header>
          <p className="text-label-sm text-ink-subtle">Kỳ báo cáo {reportPeriod.label}</p>
          <h1 className="mt-1 text-headline-xl text-ink">Đơn hàng</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Số đơn theo trạng thái tính cho cả {reportPeriod.days} ngày, khớp với trang phân
            tích doanh số. Bảng bên dưới là {orders.length} đơn gần nhất.
          </p>
        </header>

        <section aria-label="Số đơn theo trạng thái" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statuses.map((status) => (
            <StatCard
              key={status}
              label={orderStatusLabel[status]}
              value={orderStatusCounts[status].toLocaleString("vi-VN")}
              hint={orderStatusHint[status]}
              danger={status === "cho-xac-nhan"}
            />
          ))}
        </section>

        <AdminFilterBar
          action="/admin/don-hang"
          query={filter.q}
          placeholder="Mã đơn, tên khách, số điện thoại hoặc địa chỉ"
          selects={[
            {
              name: "trang-thai",
              label: "Trạng thái",
              value: filter["trang-thai"],
              options: statuses.map((status) => ({
                value: status,
                label: orderStatusLabel[status],
              })),
            },
          ]}
        />

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading
              title={
                visible.length === orders.length
                  ? `${orders.length} đơn gần nhất`
                  : `${visible.length} / ${orders.length} đơn khớp bộ lọc`
              }
            />
          </div>
          {visible.length === 0 ? (
            <p className="border-t border-hairline px-4 py-4 text-body-md text-ink-muted md:px-5">
              Không có đơn nào khớp bộ lọc đang chọn.
            </p>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-t border-hairline text-left">
              <thead className="bg-recessed">
                <tr>
                  <Th>Đơn</Th>
                  <Th>Khách</Th>
                  <Th>Giao tới</Th>
                  <Th>Đặt lúc</Th>
                  <Th>Thuốc</Th>
                  <Th>Nhận hàng</Th>
                  <Th>Thanh toán</Th>
                  <Th align="right">Tổng</Th>
                  <Th>Xử lý</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <tr
                    key={order.code}
                    id={`don-${order.code}`}
                    className="scroll-mt-24 border-t border-divider align-top"
                  >
                    <td className="px-4 py-3">
                      <span className="block font-medium tabular-nums text-body-md text-ink">
                        {order.code}
                      </span>
                      <span className="mt-1.5 block">
                        <StatusChip status={order.status} />
                      </span>
                      {order.requiresPrescription ? (
                        <span className="mt-1.5 block">
                          <Badge tone="prescription">Kê đơn</Badge>
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-body-md text-ink">{order.customer}</span>
                      <span className="mt-0.5 block tabular-nums text-body-sm text-ink-subtle">
                        {order.phone}
                      </span>
                      {order.email ? (
                        <span className="mt-0.5 block text-body-sm text-ink-subtle">
                          {order.email}
                        </span>
                      ) : null}
                    </td>
                    {/*
                      Địa chỉ là BẢN CHỤP lúc đặt, không đọc lại từ sổ địa chỉ của
                      khách: khách đổi nhà thì đơn cũ vẫn phải ghi nơi đã giao.
                      Đơn mẫu cũ không có địa chỉ — ghi rõ "không ghi" thay vì để
                      trống, vì ô trống trong bảng này đọc như lỗi tải dữ liệu.
                    */}
                    <td className="max-w-[15rem] px-4 py-3 text-body-sm text-ink-muted">
                      {order.address ?? (
                        <span className="text-ink-subtle">Đơn mẫu, không ghi địa chỉ</span>
                      )}
                      {order.note ? (
                        <span className="mt-1 block text-body-sm text-ink-subtle">
                          Ghi chú: {order.note}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-body-sm text-ink-muted">
                      {formatDateTime(order.placedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <ul className="flex flex-col gap-1">
                        {order.items.map((item) => (
                          <li key={item.line.productId} className="text-body-sm text-ink-muted">
                            <Link
                              href={`/thuoc/${item.product.slug}`}
                              className="focus-ring rounded-chip text-ink hover:text-trust-text"
                            >
                              {item.product.name}
                            </Link>{" "}
                            × {item.line.quantity} {item.line.unitLabel}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-ink-muted">
                      {getDeliveryMethod(order.deliveryMethodId).name}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-ink-muted">
                      {getPaymentMethod(order.paymentMethodId).name}
                      {order.summary.coupon ? (
                        <span className="mt-0.5 block text-ink-subtle">
                          Mã {order.summary.coupon.code}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-label-md text-ink">
                      {formatVnd(order.summary.total)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusForm order={order} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          <p className="border-t border-hairline px-4 py-3 text-body-sm text-ink-subtle">
            Tổng tiền tính bằng đúng hàm trang giỏ hàng và trang thanh toán đang dùng, gồm cả
            phí giao và mã ưu đãi — nên con số ở đây không thể lệch với hoá đơn của khách.
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}

const allStatuses: OrderStatus[] = [
  "cho-xac-nhan",
  "da-xac-nhan",
  "dang-giao",
  "da-giao",
  "hoan-thanh",
  "hoan-tra",
  "da-huy",
];

/**
 * Đổi trạng thái một đơn.
 *
 * Đơn có thuốc kê đơn bị chặn ở lớp hành động, không phải ở đây: giao diện chỉ
 * hiện cảnh báo trước cho người dùng biết vì sao sẽ bị từ chối, còn ràng buộc
 * thật nằm trong `setOrderStatus`. Ẩn lựa chọn đi thì người dùng không hiểu tại
 * sao đơn này không chuyển được, mà cũng chẳng ngăn được ai gọi thẳng action.
 */
function StatusForm({ order }: { order: ReturnType<typeof getOrders>[number] }) {
  const prescription = getRow("prescriptions", order.code);
  // Đơn đã huỷ thì không còn gì để chặn — hiện "chỉ huỷ được" trên một đơn đã huỷ
  // là câu vô nghĩa, và người đọc phải dừng lại để hiểu nó không nói về hiện tại.
  const blocked =
    order.requiresPrescription &&
    order.status !== "da-huy" &&
    prescription?.status !== "da-duyet";

  const request = order.returnRequest;

  return (
    <div className="flex flex-col gap-2">
      {request ? (
        <div className="rounded-card bg-promo-wash p-2.5">
          <p className="text-label-sm text-promo-text">
            {request.decision === "da-chap-nhan"
              ? "Đã chấp nhận hoàn trả"
              : request.decision === "tu-choi"
                ? "Đã từ chối hoàn trả"
                : "Khách yêu cầu hoàn trả"}
          </p>
          <p className="mt-0.5 text-body-sm text-ink-muted">{request.reason}</p>
          {request.note ? (
            <p className="mt-0.5 text-body-sm text-ink-subtle">{request.note}</p>
          ) : null}
        </div>
      ) : null}

      <AdminForm
        action={setOrderStatus}
        hidden={{ code: order.code }}
        submit="Cập nhật"
        size="sm"
        footer={
          blocked ? (
            <span className="text-body-sm text-danger">
              Đơn thuốc chưa duyệt — chỉ huỷ được.
            </span>
          ) : undefined
        }
      >
        <Field label="Trạng thái" id={`status-${order.code}`}>
          <Select id={`status-${order.code}`} name="status" defaultValue={order.status}>
            {allStatuses.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabel[status]}
              </option>
            ))}
          </Select>
        </Field>
        {/*
          Lý do chỉ cần khi quản trị TỰ chuyển sang hoàn trả. Khách đã xin thì lý
          do nằm sẵn trong `returnRequest` và action dùng lý do đó. Vẫn hiện ô
          trống để người xử lý thấy chỗ ghi khi đơn chưa có yêu cầu nào.
        */}
        <Field
          label="Lý do hoàn trả"
          id={`reason-${order.code}`}
          hint={request ? "Để trống sẽ dùng lý do khách đã chọn." : "Bắt buộc khi chuyển sang Hoàn trả."}
        >
          <Input id={`reason-${order.code}`} name="reason" maxLength={300} placeholder="Hàng vỡ khi giao" />
        </Field>
      </AdminForm>
    </div>
  );
}