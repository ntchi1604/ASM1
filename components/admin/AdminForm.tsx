"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { AlertTriangle, CircleCheck, Loader } from "@/lib/icons";
import type { ActionState } from "@/lib/admin/actions";
import { cn } from "@/lib/cn";

/**
 * Vỏ form dùng chung cho MỌI thao tác ghi của phần quản trị.
 *
 * Vì sao một component chung: tám màn hình quản trị đều cần đúng bốn thứ — gửi
 * lên Server Action, hiện lỗi, hiện trạng thái đang chạy, và khoá nút khi đang
 * gửi. Viết tám lần thì tám chỗ để lệch, và chỗ dễ lệch nhất là trạng thái đang
 * chạy: quên `disabled` thì bấm hai lần là ghi hai lần.
 *
 * Đây là Client Component DUY NHẤT của phần quản trị, và nó không biết gì về
 * nghiệp vụ — nhận action từ ngoài, nên thêm màn hình mới không phải sửa tệp này.
 */
export function AdminForm({
  action,
  children,
  submit,
  variant = "solid-trust",
  size = "md",
  footer,
  className,
  hidden,
}: {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  /** Các ô nhập. Đặt trong lưới 2 cột ở màn rộng. */
  children?: ReactNode;
  submit: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  /** Nút phụ hoặc chú thích, nằm cạnh nút gửi. */
  footer?: ReactNode;
  className?: string;
  /** Trường ẩn, ví dụ khoá của dòng đang sửa. */
  hidden?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, {
    ok: true,
    message: "",
  });

  return (
    <form action={formAction} className={cn("flex flex-col gap-4", className)}>
      {hidden
        ? Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}

      {children ? (
        <div className="grid gap-4 md:grid-cols-2">{children}</div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant={variant} size={size} disabled={pending}>
          {pending ? <Loader size={16} className="animate-spin" aria-hidden /> : null}
          {pending ? "Đang lưu…" : submit}
        </Button>
        {footer}
      </div>

      {/*
        Kết quả nằm trong `aria-live` để trình đọc màn hình đọc lên: người không
        nhìn thấy đổi màu vẫn phải biết lưu thành công hay chưa. Không có nó thì
        thao tác ghi là thao tác duy nhất trên site không có phản hồi cho người
        dùng trình đọc màn hình.
      */}
      <p aria-live="polite" className="min-h-5">
        {state.message ? (
          <span
            className={cn(
              "flex items-start gap-2 text-body-sm",
              state.ok ? "text-trust-text" : "text-danger",
            )}
          >
            {state.ok ? (
              <CircleCheck size={15} className="mt-0.5 shrink-0" aria-hidden />
            ) : (
              <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
            )}
            {state.message}
          </span>
        ) : null}
      </p>
    </form>
  );
}

/**
 * Nút gửi đứng một mình, không có ô nhập — dùng cho "Xoá" và "Duyệt".
 *
 * Có `onSubmit` chặn ở phía trình duyệt cho thao tác không hoàn tác được. Đây
 * KHÔNG phải biện pháp bảo vệ — Server Action vẫn kiểm quyền — mà là để người
 * bấm nhầm một lần không mất dữ liệu.
 */
export function AdminButtonForm({
  action,
  hidden,
  submit,
  variant = "outline-trust",
  size = "sm",
  confirm,
  className,
}: {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  hidden: Record<string, string>;
  submit: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  /** Câu hỏi xác nhận. Bỏ trống với thao tác hoàn tác được. */
  confirm?: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    ok: true,
    message: "",
  });

  return (
    <form
      action={formAction}
      className={cn("inline-flex flex-col items-start gap-1", className)}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" variant={variant} size={size} disabled={pending}>
        {pending ? "Đang xử lý…" : submit}
      </Button>
      {state.message ? (
        <span
          aria-live="polite"
          className={cn("text-body-sm", state.ok ? "text-trust-text" : "text-danger")}
        >
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
