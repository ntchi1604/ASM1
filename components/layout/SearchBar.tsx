"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, Mic, Search, Sparkles } from "@/lib/icons";
import { searchPlaceholder } from "@/lib/data/site";
import { cn } from "@/lib/cn";

/**
 * Ô tìm kiếm dùng chung. Chip "AI" tím và hai icon tím (mic, camera) là
 * ba lối vào tính năng AI — đây là chỗ duy nhất màu tím xuất hiện ở header.
 */
export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = query.trim();
        router.push(
          trimmed ? `/ai/tim-kiem?q=${encodeURIComponent(trimmed)}` : "/ai/tim-kiem",
        );
      }}
      className={cn(
        "flex h-11 items-center gap-2 rounded-card border border-hairline bg-card px-3",
        /*
          `min-w-0` là bắt buộc, không phải để cho đẹp: form này luôn là flex item
          (header truyền `flex-1`), và một flex item mặc định có `min-width: auto`
          nên không co xuống dưới bề rộng nội tại của nó. Ô `<input type="search">`
          có bề rộng nội tại ~191px từ `size=20`, cộng chip AI và ba nút là 379px —
          ở khung 390px thì hàng header cần 533px và tràn ra ngoài viewport, kéo
          theo cả trang bị cuộn ngang. `min-w-0` ở input là không đủ: nó chỉ cho
          input co trong form, còn form vẫn giữ sàn của chính nó.
        */
        "min-w-0",
        "focus-within:border-trust",
        className,
      )}
    >
      <span className="flex shrink-0 items-center gap-1 rounded-chip bg-ai-wash px-2 py-0.5 text-label-sm text-ai-text">
        <Sparkles size={12} aria-hidden />
        AI
      </span>

      <label htmlFor="site-search" className="sr-only">
        Tìm thuốc theo triệu chứng hoặc tên
      </label>
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={searchPlaceholder}
        className="min-w-0 flex-1 bg-transparent text-body-sm text-ink outline-none placeholder:text-ink-subtle"
      />

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => router.push("/ai/giong-noi")}
          aria-label="Tìm thuốc bằng giọng nói"
          className="focus-ring rounded-chip p-1.5 text-ai hover:bg-ai-wash"
        >
          <Mic size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => router.push("/ai/nhan-dien")}
          aria-label="Nhận diện thuốc bằng ảnh"
          className="focus-ring rounded-chip p-1.5 text-ai hover:bg-ai-wash"
        >
          <Camera size={18} aria-hidden />
        </button>
        <button
          type="submit"
          aria-label="Tìm kiếm"
          className="focus-ring rounded-card bg-trust p-2 text-white hover:bg-trust-text"
        >
          <Search size={18} aria-hidden />
        </button>
      </div>
    </form>
  );
}
