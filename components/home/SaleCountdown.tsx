"use client";

import { useEffect, useState } from "react";
import { Timer } from "@/lib/icons";

const pad = (n: number) => n.toString().padStart(2, "0");

/**
 * Đếm ngược tới cuối ngày. Server và lần render đầu ở client đều dùng
 * `initialSeconds` truyền vào nên không lệch hydration; chỉ sau khi mount
 * mới tính theo giờ thật của máy người dùng.
 */
export function SaleCountdown({ initialSeconds }: { initialSeconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      setSeconds(Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 1000)));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return (
    <p className="flex items-center gap-2 text-label-md text-white">
      <Timer size={16} aria-hidden />
      Kết thúc sau
      <span className="flex items-center gap-1 font-mono" aria-live="off">
        {[h, m, s].map((value, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 ? <span aria-hidden>:</span> : null}
            <span className="rounded bg-white/20 px-1.5 py-0.5 tabular-nums">
              {pad(value)}
            </span>
          </span>
        ))}
      </span>
      <span className="sr-only">
        Còn {h} giờ {m} phút {s} giây
      </span>
    </p>
  );
}
