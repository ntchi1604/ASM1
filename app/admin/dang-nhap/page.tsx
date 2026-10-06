import type { Metadata } from "next";
import { AdminForm } from "@/components/admin/AdminForm";
import { Field, Input } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/layout/Logo";
import { ShieldCheck } from "@/lib/icons";
import { login } from "@/lib/admin/actions";
import { adminUsers, roleLabel } from "@/lib/admin/users";

export const metadata: Metadata = {
  title: "Đăng nhập quản trị",
  robots: { index: false, follow: false },
};

/**
 * Trang đăng nhập quản trị.
 *
 * Tài khoản mẫu in thẳng ra đây. Giấu đi thì không ai vào được bản mẫu, mà giấu
 * cũng không bảo vệ được gì: chúng nằm trong `lib/admin/users.ts` và cả tệp đó
 * nằm trong mã nguồn. Có cơ sở dữ liệu thì bảng tài khoản mới là chỗ chứa thật,
 * và khối này phải bị xoá.
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Logo />
        </div>

        <Card className="mt-6 p-5 md:p-6">
          <h1 className="text-headline-lg text-ink">Đăng nhập quản trị</h1>
          <p className="mt-1.5 text-body-md text-ink-muted">
            Khu vực nội bộ. Khách mua thuốc không cần đăng nhập.
          </p>

          <AdminForm action={login} submit="Đăng nhập" className="mt-5">
            <Field label="Tên đăng nhập" id="username" required>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                required
                autoFocus
                defaultValue="duocsi"
              />
            </Field>
            <Field label="Mật khẩu" id="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                defaultValue="duocsi123"
              />
            </Field>
          </AdminForm>
        </Card>

        <Card className="mt-4 p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-label-md text-ink">
            <ShieldCheck size={16} className="text-trust-text" aria-hidden />
            Tài khoản của bản mẫu
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {adminUsers.map((user) => (
              <li key={user.username} className="text-body-sm text-ink-muted">
                <span className="font-medium tabular-nums text-ink">{user.username}</span> /{" "}
                <span className="tabular-nums">{user.password}</span>
                <span className="block text-ink-subtle">
                  {user.name} · {roleLabel[user.role]}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-body-sm text-ink-subtle">
            Kế toán không duyệt được đơn thuốc — duyệt đơn thuốc kê đơn cần chứng chỉ hành nghề.
          </p>
        </Card>
      </div>
    </div>
  );
}
