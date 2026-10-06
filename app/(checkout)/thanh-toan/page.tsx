import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, RotateCcw, ShieldCheck } from "@/lib/icons";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { DeliveryOptions } from "@/components/checkout/DeliveryOptions";
import { OrderItems } from "@/components/checkout/OrderItems";
import { PaymentOptions } from "@/components/checkout/PaymentOptions";
import { PrescriptionUpload } from "@/components/checkout/PrescriptionUpload";
import { OrderSummaryCard } from "@/components/cart/OrderSummaryCard";
import { getCartItems } from "@/lib/data/cart";
import { getOrderSummary } from "@/lib/data/coupons";
import { getDeliveryMethod, type DeliveryMethodId } from "@/lib/data/delivery";
import { getPaymentMethod, type PaymentMethodId } from "@/lib/data/payment";
import { placeOrder } from "./actions";

export const metadata: Metadata = {
  title: "Thanh toán",
  description:
    "Xác nhận thông tin nhận hàng, hình thức giao và phương thức thanh toán cho đơn thuốc của bạn.",
};

const provinces = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"];
const districts = ["Quận 3", "Quận 1", "Quận 10"];
const wards = ["Phường Võ Thị Sáu", "Phường Đa Kao", "Phường 5"];

/**
 * Trang thanh toán.
 *
 * Ba lựa chọn ảnh hưởng tới tiền hoặc tới đơn (mã giảm giá, hình thức nhận
 * hàng, phương thức thanh toán) đều nằm trong URL. Nhờ đó server tính lại tổng
 * tiền sau mỗi lựa chọn và trang không cần giữ trạng thái riêng — cũng là lý do
 * số tiền ở đây không thể lệch với /gio-hang.
 */
export default async function CheckoutPage({
  searchParams,
}: PageProps<"/thanh-toan">) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const couponCode = first(params.ma);
  const delivery = getDeliveryMethod(first(params.nhan));
  const payment = getPaymentMethod(first(params.tt));

  const items = getCartItems();
  const summary = getOrderSummary(couponCode, delivery.id);

  /** Giữ nguyên các lựa chọn khác khi đổi một lựa chọn. */
  const buildHref = (next: Record<string, string>) => {
    const query = new URLSearchParams();
    if (couponCode) query.set("ma", couponCode);
    query.set("nhan", delivery.id);
    query.set("tt", payment.id);
    for (const [key, value] of Object.entries(next)) query.set(key, value);
    return `/thanh-toan?${query.toString()}`;
  };

  if (items.length === 0) {
    return (
      <div className="container-medivia py-12">
        <h1 className="text-headline-xl text-ink">Chưa có gì để thanh toán</h1>
        <p className="mt-2 text-body-md text-ink-muted">
          Giỏ hàng của bạn đang trống nên chưa thể tạo đơn.
        </p>
        <Link
          href="/danh-muc/thuoc-khong-ke-don"
          className="focus-ring mt-4 inline-flex text-label-md text-trust-text underline decoration-trust/30 underline-offset-2"
        >
          Xem danh mục thuốc
        </Link>
      </div>
    );
  }

  return (
    <div className="container-medivia py-6 md:py-8">
      <h1 className="text-headline-xl text-ink">Thanh toán</h1>
      <div className="mt-4">
        <CheckoutSteps current={2} />
      </div>

      <form
        action={placeOrder}
        className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start"
      >
        {/*
          Hình thức nhận hàng và thanh toán được chọn bằng <Link> (nằm trong URL),
          nên chúng không tự có mặt trong FormData — hai ô ẩn này đưa lựa chọn
          hiện tại vào đơn. Không có chúng thì đơn gửi đi thiếu đúng hai thứ người
          dùng vừa chọn.
        */}
        <input type="hidden" name="nhan" value={delivery.id} />
        <input type="hidden" name="tt" value={payment.id} />

        <div className="flex flex-col gap-5">
          <Step number={1} title="Thông tin người nhận">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Họ và tên" id="ho-ten" required>
                <Input id="ho-ten" name="hoTen" autoComplete="name" required />
              </Field>
              <Field label="Số điện thoại" id="dien-thoai" required>
                <Input
                  id="dien-thoai"
                  name="dienThoai"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
              </Field>
              <Field
                label="Email nhận hoá đơn"
                id="email"
                hint="Không bắt buộc. Dùng để gửi hoá đơn điện tử."
                className="sm:col-span-2"
              >
                <Input id="email" name="email" type="email" autoComplete="email" />
              </Field>

              <Field label="Tỉnh / Thành phố" id="tinh" required>
                <Select id="tinh" name="tinh" defaultValue={provinces[0]} required>
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Quận / Huyện" id="quan" required>
                <Select id="quan" name="quan" defaultValue={districts[0]} required>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Phường / Xã" id="phuong" required>
                <Select id="phuong" name="phuong" defaultValue={wards[0]} required>
                  {wards.map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Địa chỉ cụ thể"
                id="dia-chi"
                hint="Số nhà, tên đường, toà nhà."
                required
              >
                <Input
                  id="dia-chi"
                  name="diaChi"
                  autoComplete="street-address"
                  required
                />
              </Field>
            </div>

            <label className="mt-3 flex items-center gap-2 text-body-sm text-ink-muted">
              <input
                type="checkbox"
                name="luuDiaChi"
                className="focus-ring size-4 accent-trust"
              />
              Lưu làm địa chỉ mặc định
            </label>
          </Step>

          <Step number={2} title="Hình thức nhận hàng">
            <DeliveryOptions
              selected={delivery.id}
              hrefFor={(id: DeliveryMethodId) => buildHref({ nhan: id })}
            />

            <Field
              label="Ghi chú cho dược sĩ"
              id="ghi-chu"
              hint="Ví dụ: bạn đang dùng thuốc khác, hoặc có tiền sử dị ứng thuốc."
              className="mt-3"
            >
              <Textarea id="ghi-chu" name="ghiChu" rows={3} />
            </Field>
          </Step>

          <Step number={3} title="Phương thức thanh toán">
            <PaymentOptions
              selected={payment.id}
              hrefFor={(id: PaymentMethodId) => buildHref({ tt: id })}
            />

            <details className="mt-3 rounded-card border border-hairline bg-card p-3.5">
              <summary className="focus-ring cursor-pointer text-label-md text-ink">
                Tôi cần hoá đơn điện tử cho công ty
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Tên công ty" id="ten-cong-ty">
                  <Input id="ten-cong-ty" name="tenCongTy" />
                </Field>
                <Field label="Mã số thuế" id="ma-so-thue">
                  <Input id="ma-so-thue" name="maSoThue" inputMode="numeric" />
                </Field>
              </div>
            </details>
          </Step>

          {/* Chỉ hiện khi giỏ có thuốc kê đơn — xem PrescriptionUpload. */}
          <PrescriptionUpload items={items} />
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <section className="rounded-card border border-hairline bg-card p-4">
            <OrderItems items={items} />
          </section>

          <OrderSummaryCard summary={summary} />

          <label className="flex items-start gap-2 text-body-sm text-ink-muted">
            <input
              type="checkbox"
              name="dongY"
              required
              className="focus-ring mt-0.5 size-4 shrink-0 accent-trust"
            />
            <span>
              Tôi đồng ý với{" "}
              <Link
                href="/dieu-khoan-su-dung"
                className="text-trust-text underline decoration-trust/30 underline-offset-2"
              >
                điều khoản mua thuốc
              </Link>{" "}
              và{" "}
              <Link
                href="/chinh-sach-bao-mat"
                className="text-trust-text underline decoration-trust/30 underline-offset-2"
              >
                chính sách bảo mật
              </Link>{" "}
              của MediVia.
            </span>
          </label>

          <Button type="submit" size="lg" fullWidth>
            Đặt hàng
            <ArrowRight size={18} aria-hidden />
          </Button>

          <ul className="flex flex-col gap-2 rounded-card border border-hairline bg-card p-4">
            <TrustItem icon={<BadgeCheck size={16} aria-hidden />}>
              Dược sĩ kiểm tra đơn trước khi giao
            </TrustItem>
            <TrustItem icon={<ShieldCheck size={16} aria-hidden />}>
              Thuốc chính hãng, có hoá đơn
            </TrustItem>
            <TrustItem icon={<RotateCcw size={16} aria-hidden />}>
              Đổi trả trong 30 ngày
            </TrustItem>
          </ul>

          <p className="text-body-sm text-ink-subtle">
            Thông tin sức khoẻ của bạn được mã hoá và chỉ dược sĩ phụ trách đơn được
            xem.
          </p>
        </div>
      </form>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-hairline bg-card p-4 md:p-5">
      <h2 className="mb-3 flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-chip bg-trust-wash text-label-sm text-trust-text">
          {number}
        </span>
        <span className="text-headline-md text-ink">{title}</span>
      </h2>
      {children}
    </section>
  );
}

function TrustItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-2 text-body-sm text-ink-muted">
      <span className="mt-0.5 shrink-0 text-trust-text">{icon}</span>
      {children}
    </li>
  );
}
