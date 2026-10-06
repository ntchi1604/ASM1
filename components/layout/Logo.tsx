import Link from "next/link";
import { Cross } from "@/lib/icons";
import { site } from "@/lib/data/site";
import { cn } from "@/lib/cn";

/** Wordmark. Dùng ở header, footer, trang admin. */
export function Logo({
  className,
  tone = "trust",
}: {
  className?: string;
  tone?: "trust" | "white";
}) {
  return (
    <Link
      href="/"
      className={cn("focus-ring flex shrink-0 items-center gap-2", className)}
      aria-label={`${site.name} — trang chủ`}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-card",
          tone === "trust" ? "bg-trust text-white" : "bg-white text-trust-text",
        )}
      >
        <Cross size={18} aria-hidden strokeWidth={2.5} />
      </span>
      <span
        className={cn(
          "font-headline text-headline-md",
          tone === "trust" ? "text-trust-text" : "text-white",
        )}
      >
        {site.name}
      </span>
    </Link>
  );
}
