import Link from "next/link";
import { aiTools } from "@/lib/data/home";

/**
 * Chuyển sang công cụ AI khác. Đọc từ `aiTools` — cùng nguồn với khối ở trang
 * chủ và menu AI ở header, nên ba nơi không thể lệch danh sách.
 *
 * Tự bỏ công cụ đang mở khỏi danh sách: một liên kết trỏ về đúng trang đang xem
 * chỉ làm người dùng bấm rồi thấy không có gì thay đổi.
 */
export function AiToolSwitcher({ current }: { current: string }) {
  const others = aiTools.filter((tool) => tool.href !== current);

  return (
    <section className="mt-8 border-t border-hairline pt-5">
      <h2 className="text-label-md text-ink-muted">Công cụ AI khác</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {others.map(({ icon: Icon, label, href }) => (
          <li key={href}>
            <Link
              href={href}
              className="focus-ring flex items-center gap-1.5 rounded-chip border border-ai/25 bg-card px-3 py-1.5 text-body-sm text-ink transition-colors hover:border-ai/50 hover:bg-ai-wash"
            >
              <Icon size={15} className="text-ai-text" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
