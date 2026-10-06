"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "@/lib/icons";
import { mainNav } from "@/lib/data/site";
import { cn } from "@/lib/cn";

/** 7 mục cố định + lối vào cụm tính năng AI. Thứ tự không đổi giữa các page. */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Danh mục chính"
      className="border-b border-hairline bg-card"
    >
      <div className="container-medivia flex h-11 items-center gap-1 overflow-x-auto">
        {mainNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring shrink-0 rounded-card px-3 py-1.5 text-label-md whitespace-nowrap",
                active
                  ? "bg-trust-wash text-trust-text"
                  : "text-ink-muted hover:bg-recessed hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}

        <Link
          href="/ai/tu-van"
          className={cn(
            "focus-ring ml-auto flex shrink-0 items-center gap-1.5 rounded-chip border border-ai/30 bg-ai-wash px-3 py-1 text-label-md text-ai-text whitespace-nowrap",
            "hover:bg-ai/10",
          )}
        >
          <Sparkles size={14} aria-hidden />
          Trợ lý AI
        </Link>
      </div>
    </nav>
  );
}
