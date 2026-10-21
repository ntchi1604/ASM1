import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ContentPage } from "@/components/layout/ContentPage";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, SectionHeading } from "@/components/ui/Card";
import { ChipLink } from "@/components/ui/Chip";
import { formatDateTime, formatVnd } from "@/lib/format";
import {
  getOrderByCode,
  getOrders,
  orderStatusHint,
  orderStatusLabel,
  type OrderStatus,
} from "@/lib/data/orders";
import { getActiveCoupons } from "@/lib/data/coupons";
import { districts, provinces, wards } from "@/lib/data/address";
import { site } from "@/lib/data/site";
import { readPlacedOrderCodes } from "@/lib/shop/placed-orders";
import { getCustomer } from "@/lib/shop/customer-auth";
import { logout } from "@/lib/shop/customer-actions";
import {
  ChevronRight,
  Clock,
  Gift,
  LogOut,
  MapPin,
  Package,
  Truck,
  Wallet,
} from "@/lib/icons";
import { defaultAddress, readAddresses, type SavedAddress } from "@/lib/shop/address-book";
import {
  deleteAddress,
  makeDefaultAddress,
  saveAddress,
} from "@/lib/shop/address-actions";
import { Field, Input, Select } from "@/components/ui/Field";
import { LoginForm, RegisterForm } from "@/components/shop/CustomerAuthForms";

export const metadata: Metadata = {
  title: "Tài khoản",
  description: "Đăng nhập hoặc đăng ký để xem đơn hàng, sổ địa chỉ và voucher.",
  robots: { index: false, follow: false },
};

/** Kết quả thao tác sổ địa chỉ, đọc từ `?dia-chi=`. */
const addressMessages: Record<string, { text: string; ok: boolean }> = {
  "da-them": { text: "Đã thêm địa chỉ.", ok: true },
  "da-sua": { text: "Đã cập nhật địa chỉ.", ok: true },
  "da-xoa": { text: "Đã xoá địa chỉ.", ok: true },
  "da-mac-dinh": { text: "Đã chọn địa chỉ mặc định.", ok: true },
  day: { text: "Sổ địa chỉ đã đủ 5 chỗ. Xoá bớt một địa chỉ trước.", ok: false },
  "khong-thay": { text: "Địa chỉ này không còn trong sổ.", ok: false },
  loi: { text: "Thông tin địa chỉ chưa hợp lệ. Kiểm tra tên, số điện thoại và số nhà.", ok: false },
};

/** Kết quả đăng nhập/đăng xuất, đọc từ `?tai-khoan=`. */
const accountMessages: Record<string, { text: string; ok: boolean }> = {
  "da-dang-ky": { text: "Đã tạo tài khoản và đăng nhập.", ok: true },
  "da-dang-xuat": { text: "Đã đăng xuất khỏi máy này.", ok: true },
};

/** Lỗi của hai form đứng ngay trên trang này, đọc từ `?loi=`. */
const registerErrors: Record<string, string> = {
  "thong-tin": "Kiểm tra lại họ tên, số điện thoại và mật khẩu (ít nhất 6 ký tự).",
  "da-co": "Số điện thoại này đã có tài khoản. Đăng nhập thay vì đăng ký lại.",
};

/**
 * Màu của nhãn trạng thái đơn.
 *
 * Teal là "đã xong việc" (đã xác nhận, đã giao), đỏ là "cần đọc" (hoàn trả,
 * huỷ), xám là "đang chờ". Không dùng tím — tím trên site này chỉ có nghĩa là
 * nội dung do AI tạo.
 */
const statusTone: Record<OrderStatus, string> = {
  "cho-xac-nhan": "bg-recessed text-ink-muted",
  "da-xac-nhan": "bg-trust-wash text-trust-text",
  "dang-giao": "bg-promo-wash text-promo-text",
  "da-giao": "bg-trust-wash text-trust-text",
  "hoan-thanh": "bg-trust text-white",
  "hoan-tra": "bg-danger-wash text-danger",
  "da-huy": "bg-danger-wash text-danger",
};

/** Chữ cái đầu của tên khách, tối đa hai chữ — cùng quy tắc với placeholder sản phẩm. */
function nameInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** Form thêm và form sửa dùng chung — cùng trường, cùng kiểm tra. */
function AddressForm({ address }: { address?: SavedAddress }) {
  const id = address?.id ?? "new";
  return (
    <form action={saveAddress} className="grid gap-3 md:grid-cols-2">
      {address ? <input type="hidden" name="id" value={address.id} /> : null}
      <Field label="Họ và tên" id={`ten-${id}`} required>
        <Input id={`ten-${id}`} name="name" defaultValue={address?.name} required />
      </Field>
      <Field label="Số điện thoại" id={`sdt-${id}`} required>
        <Input
          id={`sdt-${id}`}
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={address?.phone}
          required
        />
      </Field>
      <Field label="Tỉnh / Thành phố" id={`tinh-${id}`} required>
        <Select id={`tinh-${id}`} name="province" defaultValue={address?.province ?? provinces[0]} required>
          {provinces.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Quận / Huyện" id={`quan-${id}`} required>
        <Select id={`quan-${id}`} name="district" defaultValue={address?.district ?? districts[0]} required>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Phường / Xã" id={`phuong-${id}`} required>
        <Select id={`phuong-${id}`} name="ward" defaultValue={address?.ward ?? wards[0]} required>
          {wards.map((ward) => (
            <option key={ward} value={ward}>
              {ward}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Địa chỉ cụ thể" id={`nha-${id}`} required hint="Số nhà, tên đường, toà nhà.">
        <Input id={`nha-${id}`} name="street" defaultValue={address?.street} required />
      </Field>
      <label className="flex items-center gap-2 text-body-sm text-ink-muted md:col-span-2">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault ?? false}
          className="focus-ring size-4 accent-trust"
        />
        Dùng làm địa chỉ giao mặc định
      </label>
      <div className="md:col-span-2">
        <Button type="submit" size="sm" variant={address ? "outline-trust" : "solid-trust"}>
          {address ? "Lưu địa chỉ" : "Thêm địa chỉ"}
        </Button>
      </div>
    </form>
  );
}

/** Danh sách đơn, có bộ lọc theo trạng thái. Dùng cho cả hai chế độ. */
function OrdersSection({
  orders,
  counts,
  shown,
  validFilter,
}: {
  orders: ReturnType<typeof getOrders>;
  counts: Partial<Record<OrderStatus, number>>;
  shown: ReturnType<typeof getOrders>;
  validFilter?: OrderStatus;
}) {
  return (
    <Card className="p-4 md:p-5">
      <SectionHeading
        title="Đơn hàng"
        action={
          <span className="text-body-sm text-ink-subtle">
            {validFilter ? `${shown.length}/${orders.length} đơn` : `${orders.length} đơn`}
          </span>
        }
      />

      <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <li>
          <ChipLink href="/tai-khoan" active={!validFilter} count={orders.length}>
            Tất cả
          </ChipLink>
        </li>
        {(Object.keys(orderStatusLabel) as OrderStatus[]).map((status) => (
          <li key={status}>
            <ChipLink
              href={`/tai-khoan?trang-thai=${status}`}
              active={validFilter === status}
              count={counts[status] ?? 0}
            >
              {orderStatusLabel[status]}
            </ChipLink>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-col gap-3">
        {shown.map((order) => (
          <article
            key={order.code}
            className="rounded-card border border-hairline p-3 transition-colors hover:border-trust/40 md:p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/tra-cuu-don-hang?ma=${order.code}`}
                  className="focus-ring rounded-chip font-medium tabular-nums text-body-md text-ink hover:text-trust-text"
                >
                  {order.code}
                </Link>
                <p className="mt-0.5 text-body-sm text-ink-subtle">
                  {formatDateTime(order.placedAt)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`rounded-chip px-2 py-0.5 text-label-sm ${statusTone[order.status]}`}
                >
                  {orderStatusLabel[order.status]}
                </span>
                <span className="tabular-nums text-body-md text-ink">
                  {formatVnd(order.summary.total)}
                </span>
              </div>
            </div>

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {order.items.map((item) => (
                <li key={`${item.product.id}-${item.unit.label}`}>
                  <Link href={`/thuoc/${item.product.slug}`} className="focus-ring rounded-chip">
                    <Badge tone={item.product.prescriptionRequired ? "prescription" : "neutral"}>
                      {item.product.name} × {item.line.quantity}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-divider pt-2.5">
              <span className="text-body-sm text-ink-subtle">{orderStatusHint[order.status]}</span>
              <span className="flex items-center gap-3">
                {/* `hoan-thanh` là `da-giao` quá 3 ngày tự đóng — cả hai đều đã
                    nhận hàng và đều đánh giá được, xem `getReviewableOrders`. */}
                {(order.status === "da-giao" || order.status === "hoan-thanh") &&
                order.items.length > 0 ? (
                  <Link
                    href={`/thuoc/${order.items[0].product.slug}#danh-gia`}
                    className="focus-ring rounded-chip text-body-sm text-trust-text underline decoration-trust/30 underline-offset-2"
                  >
                    Đánh giá
                  </Link>
                ) : null}
                <Link
                  href={`/tra-cuu-don-hang?ma=${order.code}`}
                  className="focus-ring inline-flex items-center gap-0.5 rounded-chip text-body-sm font-medium text-trust-text"
                >
                  Xem chi tiết
                  <ChevronRight size={14} aria-hidden />
                </Link>
              </span>
            </div>
          </article>
        ))}
      </div>

      {shown.length === 0 && orders.length > 0 ? (
        <p className="mt-3 text-body-md text-ink-muted">
          Không có đơn nào ở trạng thái “{orderStatusLabel[validFilter!]}”.{" "}
          <Link
            href="/tai-khoan"
            className="focus-ring rounded-chip text-trust-text underline decoration-trust/30 underline-offset-2"
          >
            Xem tất cả đơn
          </Link>
          .
        </p>
      ) : null}

      {orders.length === 0 ? (
        <div className="mt-4 rounded-card bg-recessed/60 p-4 text-center">
          <Package size={24} className="mx-auto text-ink-subtle" aria-hidden />
          <p className="mt-2 text-body-md text-ink">Chưa có đơn nào.</p>
          <p className="mt-1 text-body-sm text-ink-muted">
            Đơn đặt bằng số điện thoại này sẽ hiện ở đây.
          </p>
          <ButtonLink href="/" size="sm" variant="solid-trust" className="mt-3">
            Mua thuốc
          </ButtonLink>
        </div>
      ) : null}
    </Card>
  );
}

/** Sổ địa chỉ: danh sách, sửa, đặt mặc định, xoá, thêm. */
function AddressBookSection({
  addresses,
  message,
  compact = false,
}: {
  addresses: SavedAddress[];
  message?: { text: string; ok: boolean };
  compact?: boolean;
}) {
  return (
    <div id="so-dia-chi" className="scroll-mt-24">
      <Card className="p-4 md:p-5">
        <SectionHeading
          title="Sổ địa chỉ"
          action={<span className="text-body-sm text-ink-subtle">{addresses.length}/5</span>}
        />
        {message ? (
          <p
            role="status"
            className={`-mt-2 mb-3 text-body-sm ${message.ok ? "text-trust-text" : "text-danger"}`}
          >
            {message.text}
          </p>
        ) : null}

        {addresses.length === 0 ? (
          <p className="text-body-md text-ink-muted">
            Chưa lưu địa chỉ nào. Địa chỉ lưu ở đây được điền sẵn khi thanh toán.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {addresses.map((address) => (
              <li key={address.id} className="rounded-card border border-hairline p-3">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                  <p className="flex flex-wrap items-center gap-2 text-body-md text-ink">
                    <span className="font-medium">{address.name}</span>
                    <span className="tabular-nums text-body-sm text-ink-muted">{address.phone}</span>
                    {address.isDefault ? <Badge tone="promo">Mặc định</Badge> : null}
                  </p>
                </div>
                <p className="mt-1 text-body-sm text-ink-muted">
                  {address.street}, {address.ward}, {address.district}, {address.province}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    href={`/thanh-toan?dia-chi=${address.id}`}
                    className="focus-ring rounded-chip text-body-sm font-medium text-trust-text"
                  >
                    Mua với địa chỉ này
                  </Link>
                  <details className="min-w-0">
                    <summary className="focus-ring inline-flex cursor-pointer rounded-chip text-body-sm text-ink-muted">
                      Sửa
                    </summary>
                    <div className="mt-3 w-full border-t border-divider pt-3">
                      <AddressForm address={address} />
                    </div>
                  </details>
                  {!address.isDefault ? (
                    <form action={makeDefaultAddress}>
                      <input type="hidden" name="id" value={address.id} />
                      <button
                        type="submit"
                        className="focus-ring rounded-chip text-body-sm text-ink-muted hover:text-trust-text"
                      >
                        Đặt mặc định
                      </button>
                    </form>
                  ) : null}
                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <button
                      type="submit"
                      className="focus-ring rounded-chip text-body-sm text-danger"
                    >
                      Xoá
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        {addresses.length < 5 ? (
          <details className="mt-3 rounded-card border border-hairline">
            <summary className="focus-ring flex cursor-pointer items-center justify-between gap-2 p-3 hover:bg-recessed">
              <span className="flex items-center gap-2 text-body-md text-ink">
                <MapPin size={16} className="text-trust-text" aria-hidden />
                Thêm địa chỉ mới
              </span>
              <span className="text-label-sm text-trust-text">Mở</span>
            </summary>
            <div className="border-t border-hairline px-3 py-4">
              <AddressForm />
            </div>
          </details>
        ) : null}

        {compact ? null : (
          <p className="mt-3 text-body-sm text-ink-subtle">
            Sổ địa chỉ lưu trên máy này bằng cookie HttpOnly — bản mẫu chưa gắn sổ vào
            tài khoản, nên đổi máy là sổ không theo.
          </p>
        )}
      </Card>
    </div>
  );
}

/** Kho voucher dùng chung. */
function VoucherSection({ compact = false }: { compact?: boolean }) {
  const active = getActiveCoupons();
  return (
    <Card className="p-4 md:p-5">
      <SectionHeading
        title="Kho voucher"
        action={<span className="text-body-sm text-ink-subtle">{active.length} mã</span>}
      />
      <ul className="flex flex-col gap-2">
        {active.map((coupon) => (
          <li
            key={coupon.code}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-card border border-hairline p-3"
          >
            <div className="flex min-w-0 items-start gap-3">
              <Gift size={18} className="mt-0.5 shrink-0 text-promo-text" aria-hidden />
              <div className="min-w-0">
                <p className="font-mono text-label-md text-ink">{coupon.code}</p>
                <p className="mt-0.5 text-body-sm text-ink-muted">{coupon.description}</p>
              </div>
            </div>
            <Link
              href={`/gio-hang?ma=${coupon.code}`}
              className="focus-ring shrink-0 rounded-chip border border-trust px-3 py-1.5 text-body-sm font-medium text-trust-text transition-colors hover:bg-trust hover:text-white"
            >
              Dùng
            </Link>
          </li>
        ))}
      </ul>
      {compact ? null : (
        <p className="mt-3 text-body-sm text-ink-subtle">
          Mã được áp ở giỏ hàng và kiểm lại ở bước thanh toán; đơn chưa đủ giá trị tối
          thiểu sẽ được báo rõ thay vì trừ nhầm.
        </p>
      )}
    </Card>
  );
}

/**
 * Tài khoản.
 *
 * Hai chế độ, cùng một trang. ĐÃ đăng nhập: bố cục bảng điều khiển — hồ sơ ở
 * trên, đơn hàng chiếm cột chính, địa chỉ và voucher ở cột phụ. CHƯA đăng nhập:
 * cột nội dung hẹp như các trang chữ, hai form đăng nhập và đăng ký đứng ngay
 * trên trang, không bịa hồ sơ của bất kỳ ai.
 *
 * Đơn của tài khoản lấy theo SỐ ĐIỆN THOẠI (đơn thật có ghi số trong `orders`),
 * cộng đơn vừa đặt trên máy này qua cookie mã đơn. Hai nguồn gộp lại và loại
 * trùng theo mã đơn.
 *
 * Sổ địa chỉ vẫn ở cookie HttpOnly chứ không gắn vào tài khoản: bản mẫu dùng
 * chung một kho cho cả khách vãng lai lẫn khách đã đăng nhập, và đổi sang bảng
 * `customer_addresses` là việc của lúc có cơ sở dữ liệu.
 *
 * Lọc theo trạng thái bằng `?trang-thai=` chứ không bằng state: cùng một lý do
 * với bộ lọc danh mục — chia sẻ được, back/forward đúng, không cần JavaScript.
 */
export default async function AccountPage({
  searchParams,
}: PageProps<"/tai-khoan">) {
  const params = await searchParams;
  const rawStatus = params["trang-thai"];
  // Chỉ nhận khoá có thật trong `orderStatusLabel`; giá trị lạ rơi về "tất cả"
  // thay vì dựng một ô lọc trống không bấm được.
  const statusFilter = (
    Array.isArray(rawStatus) ? rawStatus[0] : rawStatus
  ) as OrderStatus | undefined;
  const validFilter = statusFilter && statusFilter in orderStatusLabel ? statusFilter : undefined;

  const customer = await getCustomer();
  const placed = (await readPlacedOrderCodes())
    .map(getOrderByCode)
    .filter((order) => order !== undefined);
  const placedCodes = new Set(placed.map((order) => order.code));
  // Đơn mẫu ghi số có dấu cách ("0912 345 678"), đơn thật ghi số liền — so sau
  // khi bỏ dấu cách, nếu không đăng nhập bằng tài khoản mẫu lại không thấy đơn mẫu.
  const normPhone = (value: string) => value.replace(/[\s.-]/g, "");
  // Khách chưa đăng nhập không có số điện thoại nào để đối chiếu: chỉ thấy đơn
  // vừa đặt trên chính máy này (cookie mã đơn), không thấy đơn của người khác.
  const myPhone = customer ? normPhone(customer.phone) : "";
  const myOrders = [
    ...placed,
    ...getOrders().filter(
      (order) => myPhone !== "" && normPhone(order.phone) === myPhone && !placedCodes.has(order.code),
    ),
  ];
  const counts = myOrders.reduce<Partial<Record<OrderStatus, number>>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});
  const shownOrders = validFilter
    ? myOrders.filter((order) => order.status === validFilter)
    : myOrders;
  const activeCount =
    (counts["cho-xac-nhan"] ?? 0) + (counts["da-xac-nhan"] ?? 0) + (counts["dang-giao"] ?? 0);
  const doneCount = (counts["da-giao"] ?? 0) + (counts["hoan-thanh"] ?? 0);

  const addresses = await readAddresses();
  const primaryAddress = defaultAddress(addresses);
  const primary = primaryAddress
    ? `${primaryAddress.street}, ${primaryAddress.ward}, ${primaryAddress.district}, ${primaryAddress.province}`
    : "Chưa có địa chỉ giao mặc định.";
  const addressState = Array.isArray(params["dia-chi"]) ? params["dia-chi"][0] : params["dia-chi"];
  const addressMessage = addressState ? addressMessages[addressState] : undefined;
  const accountState = Array.isArray(params["tai-khoan"])
    ? params["tai-khoan"][0]
    : params["tai-khoan"];
  const accountMessage = accountState ? accountMessages[accountState] : undefined;
  // Form đăng nhập/đăng ký đứng ngay trên trang này, nên lỗi quay về đây chứ
  // không đẩy người dùng sang trang khác rồi bắt họ quay lại.
  const rawError = Array.isArray(params.loi) ? params.loi[0] : params.loi;
  const loginError = rawError === "sai" ? "Số điện thoại hoặc mật khẩu không đúng." : undefined;
  const registerError = registerErrors[rawError ?? ""];

  /*
    ---------------------------------------------------------------- Đã đăng nhập
  */
  if (customer) {
    return (
      <div className="container-medivia py-5 md:py-8">
        <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "Tài khoản" }]} />

        {/* Hồ sơ: nền trust-wash để tách khỏi các thẻ dữ liệu bên dưới. */}
        <Card className="mt-4 overflow-hidden border-trust/25 bg-trust-wash">
          <div className="flex flex-wrap items-center gap-4 p-4 md:p-5">
            <span
              aria-hidden
              className="grid size-14 shrink-0 place-items-center rounded-full bg-trust font-headline text-headline-md text-white"
            >
              {nameInitials(customer.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body-sm text-trust-text">Xin chào,</p>
              <h1 className="mt-0.5 text-headline-md text-ink md:text-headline-lg">{customer.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-ink-muted">
                <span className="tabular-nums">{customer.phone}</span>
                <span className="hidden h-3 w-px bg-ink-subtle/40 sm:block" aria-hidden />
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} aria-hidden />
                  {primaryAddress ? "Địa chỉ đã lưu" : "Chưa lưu địa chỉ"}
                </span>
              </p>
            </div>
            <form action={logout}>
              {/* Hẹp thì chỉ còn biểu tượng: tên khách cần chỗ hơn nhãn nút. */}
              <button
                type="submit"
                aria-label="Đăng xuất"
                className="focus-ring inline-flex items-center gap-1.5 rounded-chip border border-trust/40 bg-card px-2.5 py-2 text-body-sm font-medium text-ink-muted transition-colors hover:border-danger/40 hover:text-danger sm:px-3"
              >
                <LogOut size={15} aria-hidden />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </form>
          </div>

          {accountMessage ? (
            <p
              role="status"
              className={`border-t border-trust/20 px-4 py-2.5 text-body-sm md:px-5 ${
                accountMessage.ok ? "text-trust-text" : "text-danger"
              }`}
            >
              {accountMessage.text}
            </p>
          ) : null}
        </Card>

        {/* Bốn ô số liệu — cùng nhịp với bảng điều khiển quản trị. */}
        <section aria-label="Tóm tắt tài khoản" className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SummaryTile icon={Package} label="Tổng đơn" value={myOrders.length} hint="Cả đơn đang xử lý và đã xong" />
          <SummaryTile icon={Truck} label="Đang xử lý" value={activeCount} hint="Chờ xác nhận, đã xác nhận, đang giao" tone="promo" />
          <SummaryTile icon={Wallet} label="Đã hoàn tất" value={doneCount} hint="Đã giao hoặc hoàn thành" />
          <SummaryTile icon={Gift} label="Voucher" value={getActiveCoupons().length} hint="Dùng được ở giỏ hàng" tone="promo" />
        </section>

        {/* `grid-cols-1` (minmax(0,1fr)) chứ không để track tự co: dải chip
            cuộn ngang có min-content rất lớn, track `auto` sẽ nới cột ra khỏi
            màn hình thay vì để dải chip tự cuộn. */}
        <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-4">
            <OrdersSection
              orders={myOrders}
              counts={counts}
              shown={shownOrders}
              validFilter={validFilter}
            />

            <Card className="flex flex-wrap items-start gap-3 p-4 md:p-5">
              <MapPin size={18} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
              <div className="min-w-0">
                <h2 className="text-label-md text-ink">Địa chỉ giao mặc định</h2>
                <p className="mt-1 text-body-sm text-ink-muted">{primary}</p>
                <Link
                  href="#so-dia-chi"
                  className="focus-ring mt-2 inline-flex items-center gap-0.5 rounded-chip text-body-sm font-medium text-trust-text"
                >
                  Sửa trong sổ địa chỉ
                  <ChevronRight size={14} aria-hidden />
                </Link>
              </div>
            </Card>
          </div>

          <aside className="flex flex-col gap-4">
            <AddressBookSection addresses={addresses} message={addressMessage} compact />
            <VoucherSection compact />
            <Card className="flex flex-wrap items-start gap-3 bg-recessed/50 p-4">
              <Clock size={17} className="mt-0.5 shrink-0 text-ink-subtle" aria-hidden />
              <div className="min-w-0">
                <h2 className="text-label-md text-ink">Cần hỗ trợ</h2>
                <p className="mt-1 text-body-sm text-ink-muted">
                  Đổi mật khẩu và điểm tích luỹ chưa có trong bản mẫu. Gọi{" "}
                  <span className="tabular-nums text-ink">{site.hotline}</span>.
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    );
  }

  /*
    -------------------------------------------------------------- Chưa đăng nhập
    Không bịa hồ sơ: chưa biết khách là ai thì trang này là hai form thật. Form
    đứng ngay đây thay vì chỉ có nút dẫn sang `/dang-nhap` — bấm "Tài khoản" mà
    nhận một trang chỉ có thêm một nút bấm nữa là hai lần bấm cho một việc.

    Đơn vừa đặt trên máy này vẫn hiện bên dưới: đặt hàng không bắt buộc tài
    khoản, và người không đăng nhập vẫn cần xem lại đơn mình vừa đặt.
  */
  return (
    <ContentPage
      title="Tài khoản"
      lead="Đăng nhập để xem đơn hàng, sổ địa chỉ và voucher của bạn. Chưa có tài khoản thì đăng ký bằng số điện thoại."
    >
      {accountMessage ? (
        <p
          role="status"
          className={`rounded-card px-3 py-2 text-body-sm ${
            accountMessage.ok ? "bg-trust-wash text-trust-text" : "bg-danger-wash text-danger"
          }`}
        >
          {accountMessage.text}
        </p>
      ) : null}

      <Card className="p-4 md:p-5">
        <h2 className="text-headline-md text-ink">Đăng nhập</h2>
        <div className="mt-3">
          <LoginForm error={loginError} returnTo="/tai-khoan" idPrefix="login-" />
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        <h2 className="text-headline-md text-ink">Đăng ký</h2>
        <p className="mt-1 text-body-sm text-ink-muted">
          Tạo tài khoản mất chưa tới một phút, chỉ cần số điện thoại.
        </p>
        <div className="mt-3">
          <RegisterForm error={registerError} returnTo="/tai-khoan" idPrefix="register-" />
        </div>
      </Card>

      {myOrders.length > 0 ? (
        <OrdersSection
          orders={myOrders}
          counts={counts}
          shown={shownOrders}
          validFilter={validFilter}
        />
      ) : null}

      <Card className="flex flex-wrap items-start gap-3 p-4 md:p-5">
        <Package size={18} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-label-md text-ink">Muốn tra đơn mà không cần tài khoản</h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Dùng{" "}
            <Link
              href="/tra-cuu-don-hang"
              className="focus-ring rounded-chip text-trust-text underline decoration-trust/30 underline-offset-2"
            >
              tra cứu đơn hàng
            </Link>{" "}
            bằng mã đơn — không cần đăng nhập.
          </p>
          <ButtonLink href="/huong-dan-mua-thuoc" variant="outline-trust" size="sm" className="mt-3">
            Xem hướng dẫn mua thuốc
          </ButtonLink>
        </div>
      </Card>
    </ContentPage>
  );
}

/** Ô số liệu nhỏ trong dải tóm tắt. */
function SummaryTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "trust",
}: {
  icon: typeof Package;
  label: string;
  value: number;
  hint: string;
  tone?: "trust" | "promo";
}) {
  return (
    <div className="rounded-card border border-hairline bg-card p-4">
      <p className="flex items-center gap-2 text-body-sm text-ink-muted">
        <Icon
          size={15}
          className={tone === "promo" ? "text-promo-text" : "text-trust-text"}
          aria-hidden
        />
        {label}
      </p>
      <p className="mt-1.5 text-headline-lg text-ink tabular-nums">{value}</p>
      <p className="mt-0.5 text-body-sm text-ink-subtle">{hint}</p>
    </div>
  );
}
