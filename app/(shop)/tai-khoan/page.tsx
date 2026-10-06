import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/ContentPage";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, SectionHeading } from "@/components/ui/Card";
import { formatDateTime, formatVnd } from "@/lib/format";
import { getOrders, orderStatusHint, orderStatusLabel } from "@/lib/data/orders";
import { sampleCustomer, site } from "@/lib/data/site";
import { Package, User } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Tài khoản",
  description: "Hồ sơ khách mẫu và lịch sử đơn hàng gần nhất.",
};

/**
 * Tài khoản.
 *
 * KHÔNG có đăng nhập, và trang nói thẳng điều đó ngay trên đầu thay vì giả vờ.
 * Một biểu mẫu đăng nhập không kiểm được mật khẩu là biểu mẫu dạy người dùng gõ
 * mật khẩu thật vào một chỗ không bảo vệ gì — tệ hơn cả việc không có biểu mẫu.
 *
 * Vì chưa có đăng nhập nên cũng chưa có "đơn của tôi": danh sách dưới đây là các
 * đơn mẫu có số điện thoại trùng khách mẫu, không phải đơn của người đang xem.
 * Trang ghi rõ để không ai tưởng nhầm.
 */
export default function AccountPage() {
  const myOrders = getOrders().filter((order) => order.phone === sampleCustomer.phone);

  return (
    <ContentPage
      title="Tài khoản"
      lead="Bản mẫu chưa có đăng nhập — trang này hiện hồ sơ khách mẫu và các đơn mẫu trùng số điện thoại đó."
    >
      <Card className="p-4 md:p-5">
        <h2 className="flex items-center gap-2 text-label-md text-ink">
          <User size={16} className="text-trust-text" aria-hidden />
          Hồ sơ
        </h2>
        <dl className="mt-3 flex flex-col gap-2 text-body-md">
          <div className="flex flex-wrap justify-between gap-x-3">
            <dt className="text-ink-muted">Họ tên</dt>
            <dd className="text-ink">{sampleCustomer.name}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-3">
            <dt className="text-ink-muted">Điện thoại</dt>
            <dd className="tabular-nums text-ink">{sampleCustomer.phone}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-x-3">
            <dt className="text-ink-muted">Địa chỉ giao mặc định</dt>
            <dd className="max-w-md text-right text-ink">{sampleCustomer.address}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-4 md:p-5">
        <SectionHeading
          title="Đơn gần đây"
          action={
            <span className="text-body-sm text-ink-subtle">{myOrders.length} đơn</span>
          }
        />
        <ul className="flex flex-col gap-3">
          {myOrders.map((order) => (
            <li key={order.code} className="rounded-card border border-hairline p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <Link
                  href={`/tra-cuu-don-hang?ma=${order.code}`}
                  className="focus-ring rounded-chip font-medium tabular-nums text-body-md text-ink hover:text-trust-text"
                >
                  {order.code}
                </Link>
                <span className="text-body-sm text-ink-muted">
                  {orderStatusLabel[order.status]} ·{" "}
                  <span className="tabular-nums text-ink">
                    {formatVnd(order.summary.total)}
                  </span>
                </span>
              </div>
              <p className="mt-1 text-body-sm text-ink-subtle">
                {formatDateTime(order.placedAt)} · {orderStatusHint[order.status]}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
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
            </li>
          ))}
        </ul>

        {myOrders.length === 0 ? (
          <p className="text-body-md text-ink-muted">
            Không có đơn mẫu nào trùng số điện thoại này. Tra đơn bằng mã đơn ở trang{" "}
            <Link
              href="/tra-cuu-don-hang"
              className="focus-ring rounded-chip text-trust-text underline decoration-trust/30 underline-offset-2"
            >
              tra cứu đơn hàng
            </Link>
            .
          </p>
        ) : null}
      </Card>

      <Card className="flex flex-wrap items-start gap-3 p-4 md:p-5">
        <Package size={18} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-label-md text-ink">Chưa có đăng nhập</h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Muốn xem đơn, dùng{" "}
            <Link
              href="/tra-cuu-don-hang"
              className="focus-ring rounded-chip text-trust-text underline decoration-trust/30 underline-offset-2"
            >
              tra cứu đơn hàng
            </Link>{" "}
            bằng mã đơn — không cần tài khoản.
          </p>
          <p className="mt-2 text-body-sm text-ink-subtle">
            Sổ địa chỉ, điểm tích luỹ và lịch sử đơn đầy đủ cần máy chủ có đăng nhập và
            phân quyền; bản mẫu chưa có, nên không dựng giao diện cho chúng. Gọi{" "}
            <span className="tabular-nums text-ink">{site.hotline}</span> khi cần hỗ trợ.
          </p>
          <ButtonLink href="/huong-dan-mua-thuoc" variant="outline-trust" size="sm" className="mt-3">
            Xem hướng dẫn mua thuốc
          </ButtonLink>
        </div>
      </Card>
    </ContentPage>
  );
}