import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Check, Clock, Phone, ShieldCheck, Store, Truck } from "@/lib/icons";
import { ButtonLink } from "@/components/ui/Button";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { getDeliveryMethod } from "@/lib/data/delivery";
import { getOrderByCode } from "@/lib/data/orders";
import { getPaymentMethod } from "@/lib/data/payment";
import { site } from "@/lib/data/site";
import { formatVnd } from "@/lib/format";

export const metadata: Metadata = {
  title: "Đặt hàng thành công",
  description: "Đơn thuốc của bạn đã được tiếp nhận và đang chờ dược sĩ xác nhận.",
};

/**
 * Bước 3 — hoàn tất.
 *
 * Trang này nói rõ MediVia đã "tiếp nhận" đơn, chưa phải "đã xác nhận": đơn
 * thuốc còn phải qua dược sĩ. Viết "đặt hàng thành công, thuốc đang trên đường"
 * là hứa hộ một người chưa xem đơn.
 */
export default async function OrderSuccessPage({
  searchParams,
}: PageProps<"/dat-hang-thanh-cong">) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const code = first(params.don);
  // Đơn vừa đặt có trong kho; mã lạ (link cũ, gõ tay) thì vẫn hiện trang và
  // dùng hình thức gửi kèm URL — trang này không được 404 chỉ vì thiếu mã.
  const order = code ? getOrderByCode(code) : undefined;
  const delivery = order ? getDeliveryMethod(order.deliveryMethodId) : getDeliveryMethod(first(params.nhan));
  const payment = order ? getPaymentMethod(order.paymentMethodId) : getPaymentMethod(first(params.tt));
  const pickup = delivery.id === "nhan-tai-nha-thuoc";

  return (
    <div className="container-medivia py-6 md:py-10">
      <div className="mx-auto max-w-2xl">
        <CheckoutSteps current={3} />

        <div className="mt-6 rounded-card border border-hairline bg-card p-6 text-center md:p-8">
          <span className="mx-auto flex size-14 items-center justify-center rounded-chip bg-trust-wash text-trust-text">
            <Check size={28} aria-hidden />
          </span>
          <h1 className="mt-4 text-headline-xl text-ink">
            MediVia đã nhận đơn của bạn
          </h1>
          <p className="mx-auto mt-2 max-w-md text-body-md text-ink-muted">
            Dược sĩ sẽ kiểm tra đơn và gọi xác nhận với bạn trong khoảng 15 phút
            trước khi chuẩn bị thuốc.
          </p>

          {code ? (
            <p className="mt-5 inline-flex flex-col items-center gap-1 rounded-card bg-recessed px-5 py-3">
              <span className="text-label-sm text-ink-muted">Mã đơn hàng</span>
              <span className="text-headline-md text-trust-text">{code}</span>
            </p>
          ) : null}

          {order ? (
            <p className="mt-3 text-body-sm text-ink-muted">
              {order.customer} · {order.items.length} sản phẩm ·{" "}
              <span className="tabular-nums text-ink">{formatVnd(order.summary.total)}</span>
            </p>
          ) : null}
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          <InfoRow
            icon={pickup ? <Store size={18} aria-hidden /> : <Truck size={18} aria-hidden />}
            title={delivery.name}
          >
            {delivery.eta()}
            {delivery.pharmacy ? (
              <>
                {" · "}
                {delivery.pharmacy.name}, {delivery.pharmacy.address}
              </>
            ) : null}
          </InfoRow>

          <InfoRow icon={<ShieldCheck size={18} aria-hidden />} title={payment.name}>
            {payment.id === "cod"
              ? "Bạn kiểm tra thuốc và hoá đơn trước khi trả tiền cho người giao."
              : "Chúng tôi sẽ gửi liên kết thanh toán sau khi dược sĩ xác nhận đơn."}
          </InfoRow>

          <InfoRow icon={<Clock size={18} aria-hidden />} title="Nếu bạn cần đổi đơn">
            Gọi tổng đài trước khi đơn được giao đi, chúng tôi vẫn sửa được số lượng
            hoặc địa chỉ.
          </InfoRow>
        </ul>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <ButtonLink href="/" variant="solid-trust" size="lg" className="flex-1">
            Về trang chủ
          </ButtonLink>
          <ButtonLink
            href="/danh-muc/thuoc-khong-ke-don"
            variant="outline-trust"
            size="lg"
            className="flex-1"
          >
            Tiếp tục mua thuốc
          </ButtonLink>
        </div>

        <p className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-body-sm text-ink-muted">
          <Phone size={15} aria-hidden className="text-trust-text" />
          Cần dược sĩ tư vấn ngay?
          <Link
            href={`tel:${site.hotline.replace(/\s/g, "")}`}
            className="focus-ring text-label-md text-trust-text underline decoration-trust/30 underline-offset-2"
          >
            {site.hotline}
          </Link>
        </p>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 rounded-card border border-hairline bg-card p-4">
      <span className="mt-0.5 shrink-0 text-trust-text">{icon}</span>
      <span className="flex flex-col gap-0.5">
        <span className="text-label-md text-ink">{title}</span>
        <span className="text-body-sm text-ink-muted">{children}</span>
      </span>
    </li>
  );
}
