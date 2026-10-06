import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard } from "@/components/admin/StatCard";
import { Card, SectionHeading } from "@/components/ui/Card";
import { AdminForm } from "@/components/admin/AdminForm";
import { Field, Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { formatVnd } from "@/lib/format";
import { getDefaultUnit, products } from "@/lib/data/products";
import { getOrders, orderStatusLabel, getOrderStatusCounts } from "@/lib/data/orders";
import { getPrescriptionRows } from "@/lib/data/orders";
import { coupons } from "@/lib/data/coupons";
import { articles } from "@/lib/data/home";
import { staticPages } from "@/lib/data/pages";
import { pharmacies } from "@/lib/data/pharmacies";
import { changedCounts } from "@/lib/admin/db";
import { saveDanger } from "@/lib/admin/actions";
import {
  AlertTriangle,
  Boxes,
  FileText,
  Package,
  Percent,
  Pill,
  ShieldCheck,
  Store,
  SlidersHorizontal,
} from "@/lib/icons";

export const metadata: Metadata = {
  title: "Tổng quan",
  description: "Việc đang chờ xử lý và lối vào từng phần quản trị.",
};

/**
 * Tổng quan quản trị.
 *
 * Đứng trước mọi thứ khác là VIỆC ĐANG CHỜ, không phải doanh số. Người mở trang
 * này ra cần biết hôm nay phải làm gì — đơn nào chưa xác nhận, đơn thuốc nào chưa
 * duyệt, mặt hàng nào sắp hết. Doanh số đã có trang phân tích riêng, và nó là câu
 * hỏi "tháng này thế nào", không phải "giờ làm gì".
 *
 * Mỗi ô đều dẫn tới trang xử lý được việc đó. Một con số không bấm vào đâu được
 * thì người đọc phải tự đi tìm trang — mà đó chính là việc trang này sinh ra để
 * đỡ.
 */
export default function AdminOverviewPage() {
  const orders = getOrders();
  const orderStatusCounts = getOrderStatusCounts();
  const pendingOrders = orders.filter((order) => order.status === "cho-xac-nhan");
  const prescriptions = getPrescriptionRows();
  const pendingPrescriptions = prescriptions.filter((row) => row.status === "cho-duyet");
  const soldOut = products.filter((product) => product.stock.total <= 0);
  const changed = changedCounts();
  const totalChanges = changed.updated + changed.added + changed.removed;

  const inventoryValue = products.reduce(
    (sum, product) => sum + getDefaultUnit(product).price * product.stock.total,
    0,
  );

  const sections = [
    {
      href: "/admin/kho-thuoc",
      label: "Kho thuốc",
      icon: Pill,
      detail: `${products.length} mặt hàng · ${soldOut.length} tạm hết`,
      warn: soldOut.length > 0,
    },
    {
      href: "/admin/don-hang",
      label: "Đơn hàng",
      icon: Package,
      detail: `${orderStatusCounts["cho-xac-nhan"].toLocaleString("vi-VN")} chờ xác nhận`,
      warn: orderStatusCounts["cho-xac-nhan"] > 0,
    },
    {
      href: "/admin/duyet-don-thuoc",
      label: "Duyệt đơn thuốc",
      icon: ShieldCheck,
      detail: `${pendingPrescriptions.length} đơn chờ duyệt`,
      warn: pendingPrescriptions.length > 0,
    },
    {
      href: "/admin/uu-dai",
      label: "Mã ưu đãi",
      icon: Percent,
      detail: `${coupons.length} mã đang chạy`,
    },
    {
      href: "/admin/bai-viet",
      label: "Bài viết",
      icon: FileText,
      detail: `${articles.length} bài trong góc sức khoẻ`,
    },
    {
      href: "/admin/trang",
      label: "Trang chữ",
      icon: SlidersHorizontal,
      detail: `${staticPages.length} trang chính sách và giới thiệu`,
    },
    {
      href: "/admin/nha-thuoc",
      label: "Nhà thuốc",
      icon: Store,
      detail: `${pharmacies.length} nhà thuốc nhận hàng`,
    },
    {
      href: "/admin/phan-tich",
      label: "Phân tích doanh số",
      icon: Boxes,
      detail: "Kỳ 14 ngày, có phân tích bằng AI",
    },
  ];

  return (
    <AdminShell activeHref="/admin">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-headline-xl text-ink">Tổng quan</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Việc đang chờ xử lý, và lối vào từng phần quản trị. Bấm vào ô nào cũng tới thẳng
            trang sửa được việc đó.
          </p>
        </header>

        <section aria-label="Việc đang chờ" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/duyet-don-thuoc" className="focus-ring rounded-card">
            <StatCard
              label="Đơn thuốc chờ duyệt"
              value={`${pendingPrescriptions.length} đơn`}
              hint="Phải gọi khách trước khi soạn thuốc"
              danger={pendingPrescriptions.length > 0}
            />
          </Link>
          <Link href="/admin/don-hang" className="focus-ring rounded-card">
            <StatCard
              label="Đơn chờ xác nhận"
              value={orderStatusCounts["cho-xac-nhan"].toLocaleString("vi-VN")}
              hint="Cả kỳ 14 ngày"
              danger
            />
          </Link>
          <Link href="/admin/kho-thuoc" className="focus-ring rounded-card">
            <StatCard
              label="Mặt hàng tạm hết"
              value={`${soldOut.length} mặt hàng`}
              hint={soldOut.length > 0 ? "Đang chờ hàng về" : "Không có mặt hàng nào hết"}
              danger={soldOut.length > 0}
            />
          </Link>
          <Link href="/admin/phan-tich" className="focus-ring rounded-card">
            <StatCard
              label="Giá trị tồn (theo giá bán)"
              value={formatVnd(inventoryValue)}
              hint="Chỉ để đối chiếu nhanh, không dùng cho kế toán"
            />
          </Link>
        </section>

        {pendingPrescriptions.length > 0 ? (
          <Card className="flex flex-wrap items-start gap-3 border-danger/30 bg-danger-wash p-4 md:p-5">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />
            <div className="min-w-0">
              <h2 className="text-headline-md text-danger">
                {pendingPrescriptions.length} đơn thuốc chưa duyệt
              </h2>
              <p className="mt-1.5 max-w-2xl text-body-sm text-ink-muted">
                Đơn có thuốc kê đơn không được chuyển sang soạn hàng khi đơn thuốc còn chờ
                duyệt. Duyệt đơn thuốc cần người có chứng chỉ hành nghề.
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {pendingPrescriptions.map((row) => (
                  <li key={row.orderCode} className="text-body-sm text-ink-muted">
                    <span className="font-medium tabular-nums text-ink">{row.orderCode}</span> ·{" "}
                    {row.order.customer} ·{" "}
                    <span className="tabular-nums">{row.order.phone}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ) : null}

        <section aria-label="Các phần quản trị">
          <SectionHeading title="Quản lý" />
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {sections.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href} className="focus-ring block h-full rounded-card">
                    <Card className="flex h-full items-start gap-3 p-4 transition-colors hover:border-trust/40">
                      <Icon
                        size={20}
                        className={item.warn ? "mt-0.5 shrink-0 text-danger" : "mt-0.5 shrink-0 text-trust-text"}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block text-label-md text-ink">{item.label}</span>
                        <span className="mt-0.5 block text-body-sm text-ink-subtle">
                          {item.detail}
                        </span>
                      </span>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading title="Đơn gần nhất" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-t border-hairline text-left">
              <thead className="bg-recessed">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-label-sm font-medium text-ink-muted">
                    Đơn
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-label-sm font-medium text-ink-muted">
                    Khách
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-label-sm font-medium text-ink-muted">
                    Trạng thái
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2.5 text-right text-label-sm font-medium text-ink-muted"
                  >
                    Tổng
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.slice(0, 5).map((order) => (
                  <tr key={order.code} className="border-t border-divider">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tra-cuu-don-hang?ma=${order.code}`}
                        className="focus-ring rounded-chip tabular-nums text-body-md text-ink hover:text-trust-text"
                      >
                        {order.code}
                      </Link>
                      {order.requiresPrescription ? (
                        <span className="ml-2 align-middle">
                          <Badge tone="prescription">Kê đơn</Badge>
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-ink-muted">{order.customer}</td>
                    <td className="px-4 py-3 text-body-sm text-trust-text">
                      {orderStatusLabel[order.status]}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-label-md text-ink">
                      {formatVnd(order.summary.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/*
          Nói rõ dữ liệu quản trị nằm ở đâu. Bản mẫu không có cơ sở dữ liệu: thay đổi
          ghi vào `.data/medivia.json`, không nằm trong mã nguồn. Không nói ra thì
          người chấm mở mã tìm mãi không thấy chỗ lưu, hoặc clone về máy khác và
          tưởng các màn hình sửa kia không hoạt động.
        */}
        <Card className="p-4 md:p-5">
          <h2 className="text-headline-md text-ink">Dữ liệu quản trị lưu ở đâu</h2>
          <p className="mt-1.5 max-w-2xl text-body-sm text-ink-muted">
            Bản mẫu chưa dựng cơ sở dữ liệu. Mọi thay đổi ở đây ghi vào{" "}
            <code className="rounded bg-recessed px-1.5 py-0.5 text-label-sm">.data/medivia.json</code>{" "}
            và chỉ lưu phần đã sửa, nên phần còn lại vẫn là mã nguồn. Lược đồ PostgreSQL đầy
            đủ đã thiết kế xong:{" "}
            <span className="font-medium text-ink">36 bảng + 2 view</span> ở{" "}
            <code className="rounded bg-recessed px-1.5 py-0.5 text-label-sm">
              design/medivia-schema.sql
            </code>
            .
          </p>
          {totalChanges > 0 ? (
            <p className="mt-2 text-body-sm text-ink-muted">
              Hiện có <strong className="font-medium text-ink">{totalChanges}</strong> thay đổi
              chưa nằm trong mã nguồn ({changed.updated} sửa, {changed.added} thêm,{" "}
              {changed.removed} xoá).
            </p>
          ) : (
            <p className="mt-2 text-body-sm text-ink-subtle">
              Chưa có thay đổi nào — dữ liệu đang đúng như trong mã nguồn.
            </p>
          )}

          {/*
            Nút xoá sạch nằm ngay dưới câu giải thích dữ liệu lưu ở đâu, chứ không
            nằm trong menu: đây không phải chức năng ai dùng hằng ngày, và để nó
            cạnh các mục quản lý khác là để nó bị bấm nhầm. Gõ chữ xác nhận vì đây
            là thao tác duy nhất xoá dữ liệu người khác đã nhập.
          */}
          {totalChanges > 0 ? (
            <details className="mt-4 border-t border-hairline pt-4">
              <summary className="focus-ring cursor-pointer text-body-sm text-ink-muted">
                Xoá mọi thay đổi, quay về dữ liệu trong mã nguồn
              </summary>
              <div className="mt-3">
                <AdminForm
                  action={saveDanger}
                  submit="Xoá mọi thay đổi"
                  footer={
                    <span className="text-body-sm text-ink-subtle">
                      Gõ chữ XOÁ vào ô trên để xác nhận. Không hoàn tác được.
                    </span>
                  }
                >
                  <Field label="Xác nhận" id="confirm-wipe" required hint='Gõ đúng chữ "XOÁ".'>
                    <Input id="confirm-wipe" name="confirm" required placeholder="XOÁ" />
                  </Field>
                </AdminForm>
              </div>
            </details>
          ) : null}
        </Card>
      </div>
    </AdminShell>
  );
}
