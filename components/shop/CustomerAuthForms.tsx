import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { login, register } from "@/lib/shop/customer-actions";

/**
 * Hai form xác thực của khách, dùng chung ở `/dang-nhap`, `/dang-ky` và trang tài
 * khoản của khách chưa đăng nhập. Một bản duy nhất để nhãn, thứ tự trường và
 * kiểm tra phía trình duyệt không lệch nhau giữa các chỗ.
 *
 * `idPrefix` chỉ để hai form đứng cạnh nhau trên cùng một trang mà không trùng
 * `id` — trùng `id` thì `<label for>` trỏ sai ô và bấm vào nhãn là focus nhầm form.
 *
 * `returnTo` là đích quay về khi lỗi; server action chỉ chấp nhận `/tai-khoan`.
 */

const linkClass =
  "focus-ring rounded-chip text-trust-text underline decoration-trust/30 underline-offset-2";

export function LoginForm({
  error,
  returnTo,
  idPrefix = "",
}: {
  error?: string;
  returnTo?: string;
  idPrefix?: string;
}) {
  const id = (name: string) => `${idPrefix}${name}`;
  return (
    <>
      {error ? (
        <p role="alert" className="mb-4 rounded-card bg-danger-wash px-3 py-2 text-body-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={login} className="flex flex-col gap-3">
        {returnTo ? <input type="hidden" name="quayLai" value={returnTo} /> : null}
        <Field label="Số điện thoại" id={id("phone")} required>
          <Input
            id={id("phone")}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            autoFocus
            placeholder="0912 345 678"
          />
        </Field>
        <Field label="Mật khẩu" id={id("password")} required>
          <Input
            id={id("password")}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>
        <Button type="submit">Đăng nhập</Button>
      </form>

      <p className="mt-4 border-t border-hairline pt-3 text-body-sm text-ink-muted">
        Chưa có tài khoản?{" "}
        <Link href="/dang-ky" className={linkClass}>
          Đăng ký
        </Link>{" "}
        hoặc tra đơn bằng{" "}
        <Link href="/tra-cuu-don-hang" className={linkClass}>
          mã đơn
        </Link>
        .
      </p>
    </>
  );
}

export function RegisterForm({
  error,
  returnTo,
  idPrefix = "",
}: {
  error?: string;
  returnTo?: string;
  idPrefix?: string;
}) {
  const id = (name: string) => `${idPrefix}${name}`;
  return (
    <>
      {error ? (
        <p role="alert" className="mb-4 rounded-card bg-danger-wash px-3 py-2 text-body-sm text-danger">
          {error}
        </p>
      ) : null}

      <form action={register} className="flex flex-col gap-3">
        {returnTo ? <input type="hidden" name="quayLai" value={returnTo} /> : null}
        <Field label="Họ và tên" id={id("name")} required>
          {/* Không `autoFocus` ở đây: hai form có thể đứng cạnh nhau trên cùng
              trang, và trình duyệt chỉ tôn trọng cái đầu tiên — form đăng nhập. */}
          <Input id={id("name")} name="name" autoComplete="name" required />
        </Field>
        <Field
          label="Số điện thoại"
          id={id("phone")}
          required
          hint="Dùng số này để đăng nhập lần sau."
        >
          <Input
            id={id("phone")}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="0912 345 678"
          />
        </Field>
        <Field label="Mật khẩu" id={id("password")} required hint="Ít nhất 6 ký tự.">
          <Input
            id={id("password")}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </Field>
        <Button type="submit" variant="outline-trust">
          Tạo tài khoản
        </Button>
      </form>

      <p className="mt-4 border-t border-hairline pt-3 text-body-sm text-ink-muted">
        Đã có tài khoản?{" "}
        <Link href="/dang-nhap" className={linkClass}>
          Đăng nhập
        </Link>
        .
      </p>
    </>
  );
}
