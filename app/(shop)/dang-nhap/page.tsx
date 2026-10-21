import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/ContentPage";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "@/components/shop/CustomerAuthForms";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập bằng số điện thoại để xem đơn hàng và sổ địa chỉ của bạn.",
  robots: { index: false, follow: false },
};

/**
 * Đăng nhập khách hàng.
 *
 * Cùng một câu báo lỗi cho sai số và sai mật khẩu — xem `lib/shop/customer-actions.ts`.
 * Trang đăng nhập quản trị nằm ở `/admin/dang-nhap`, tách hẳn khỏi trang này.
 */
export default async function CustomerLoginPage({
  searchParams,
}: PageProps<"/dang-nhap">) {
  const params = await searchParams;
  const raw = params.loi;
  const error = (Array.isArray(raw) ? raw[0] : raw) === "sai";

  return (
    <ContentPage
      title="Đăng nhập"
      lead="Dùng số điện thoại đã đăng ký. Không cần email, không cần mã xác nhận."
    >
      <Card className="p-4 md:p-5">
        <LoginForm error={error ? "Số điện thoại hoặc mật khẩu không đúng." : undefined} />
      </Card>

      <Card className="p-4 md:p-5">
        <p className="text-body-sm text-ink-muted">
          Tài khoản mẫu của bản mẫu:{" "}
          <span className="tabular-nums text-ink">0912 345 678</span> / mật khẩu{" "}
          <span className="tabular-nums text-ink">medivia123</span>.
        </p>
      </Card>
    </ContentPage>
  );
}
