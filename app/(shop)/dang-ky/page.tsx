import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/ContentPage";
import { Card } from "@/components/ui/Card";
import { RegisterForm } from "@/components/shop/CustomerAuthForms";

export const metadata: Metadata = {
  title: "Đăng ký",
  description: "Tạo tài khoản bằng số điện thoại để lưu địa chỉ và xem lại đơn hàng.",
  robots: { index: false, follow: false },
};

const errors: Record<string, string> = {
  "thong-tin": "Kiểm tra lại họ tên, số điện thoại và mật khẩu (ít nhất 6 ký tự).",
  "da-co": "Số điện thoại này đã có tài khoản. Đăng nhập thay vì đăng ký lại.",
};

/**
 * Đăng ký khách hàng.
 *
 * Không có OTP: bản mẫu chưa gửi được tin nhắn. Hệ quả phải nói thẳng — ai biết
 * số điện thoại của người khác cũng đăng ký trước được. Chạy thật thì bước xác
 * nhận số là bắt buộc, không phải tuỳ chọn.
 */
export default async function CustomerRegisterPage({
  searchParams,
}: PageProps<"/dang-ky">) {
  const params = await searchParams;
  const raw = params.loi;
  const error = errors[String(Array.isArray(raw) ? raw[0] : raw)];

  return (
    <ContentPage
      title="Đăng ký"
      lead="Chỉ cần số điện thoại và mật khẩu. Tài khoản giữ sổ địa chỉ và lịch sử đơn của bạn."
    >
      <Card className="p-4 md:p-5">
        <RegisterForm error={error} />
      </Card>

      <Card className="p-4 md:p-5">
        <p className="text-body-sm text-ink-subtle">
          Bản mẫu chưa gửi tin nhắn xác nhận số điện thoại. Chạy thật thì bước xác
          nhận bằng OTP là bắt buộc trước khi tài khoản dùng được. Mật khẩu được băm
          bằng scrypt trước khi lưu.
        </p>
      </Card>
    </ContentPage>
  );
}
