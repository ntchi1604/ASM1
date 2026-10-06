import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * solid-trust  — hành động chính (thêm giỏ hàng, đặt hàng)
 * outline-trust— hành động phụ cùng cấp (tư vấn dược sĩ)
 * solid-promo  — chỉ dùng cho khuyến mãi
 * ghost        — hành động nhẹ trong thẻ
 * solid-ai     — CHỈ trong components/ai
 */
export type ButtonVariant =
  | "solid-trust"
  | "outline-trust"
  | "solid-promo"
  | "ghost"
  | "solid-ai";

export type ButtonSize = "sm" | "md" | "lg";

const variantClass: Record<ButtonVariant, string> = {
  "solid-trust": "bg-trust text-white hover:bg-trust-text",
  "outline-trust":
    "border border-trust text-trust-text bg-card hover:bg-trust-wash",
  "solid-promo": "bg-promo text-white hover:bg-promo-text",
  ghost: "text-trust-text hover:bg-trust-wash",
  "solid-ai": "bg-ai text-white hover:bg-ai-text",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-label-sm",
  md: "h-11 px-4 text-label-md",
  lg: "h-12 px-6 text-body-md font-medium",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-card font-medium " +
  "transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonProps = CommonProps &
  Omit<ComponentProps<"button">, "children" | "className">;

export function Button({
  variant = "solid-trust",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        base,
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = CommonProps &
  Omit<ComponentProps<typeof Link>, "children" | "className">;

/** Cùng hình thức với Button nhưng điều hướng bằng Link. */
export function ButtonLink({
  variant = "solid-trust",
  size = "md",
  fullWidth = false,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        base,
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
