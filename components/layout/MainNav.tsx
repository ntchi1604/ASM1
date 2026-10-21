"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "@/lib/icons";
import { mainNav } from "@/lib/data/site";
import { cn } from "@/lib/cn";

/**
 * 7 mục cố định + lối vào cụm tính năng AI. Thứ tự không đổi giữa các page.
 *
 * Dạng tab gạch chân giống Stitch: mục đang mở có gạch teal 2px, các mục còn
 * lại là chữ xám đổi màu khi rê. Bản trước tô nền cả mục đang mở, và một khối
 * nền xanh nằm cạnh "Trợ lý AI" cũng có nền — hai khối nền cạnh nhau thì mắt
 * không còn biết khối nào là trạng thái, khối nào là nút.
 */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Danh mục chính" className="border-t border-hairline bg-card">
      <div className="container-medivia flex h-11 items-center gap-6 overflow-x-auto">
        {mainNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring flex h-full shrink-0 items-center border-b-2 text-label-md whitespace-nowrap transition-colors",
                active
                  ? "border-trust text-trust-text"
                  : "border-transparent text-ink-muted hover:text-trust-text",
              )}
            >
              {item.label}
            </Link>
          );
        })}

        <Link
          href="/ai/tu-van"
          className="focus-ring ml-auto flex shrink-0 items-center gap-1.5 rounded-chip bg-ai-wash px-3 py-1 text-label-md text-ai-text whitespace-nowrap hover:bg-ai/10"
        >
          <Sparkles size={14} aria-hidden />
          Trợ lý AI
        </Link>
      </div>
    </nav>
  );
}
