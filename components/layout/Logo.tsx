import Link from "next/link";
import { Cross } from "@/lib/icons";
import { site } from "@/lib/data/site";
import { cn } from "@/lib/cn";

/**
 * Wordmark lấy đúng từ bản Stitch: chữ "MediVia" màu navy, chấm của chữ `i`
 * tô teal, và một ô teal bo góc chứa dấu thập tự đứng sau.
 *
 * Dựng bằng chữ thật chứ không phải ảnh: một ảnh SVG cho mỗi tông màu là bốn
 * tệp phải giữ đồng bộ, trong khi đây chỉ là một chuỗi cộng một ô màu.
 */
export function Logo({
  className,
  tone = "trust",
}: {
  className?: string;
  tone?: "trust" | "white";
}) {
  const light = tone === "white";

  return (
    <Link
      href="/"
      className={cn("focus-ring flex shrink-0 items-center gap-1.5", className)}
      aria-label={`${site.name} — trang chủ`}
    >
      <span
        className={cn(
          "font-headline text-headline-md font-bold tracking-tight",
          light ? "text-white" : "text-navy",
        )}
      >
        MediV
        <span className="relative inline-flex items-center">
          i
          <span
            aria-hidden
            className={cn(
              "absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-chip",
              light ? "bg-trust-wash" : "bg-trust-text",
            )}
          />
        </span>
        a
      </span>
      <span
        aria-hidden
        className={cn(
          "ml-0.5 flex size-5 items-center justify-center rounded",
          light ? "bg-trust text-white" : "bg-trust-text text-white",
        )}
      >
        <Cross size={13} strokeWidth={2.75} />
      </span>
    </Link>
  );
}
