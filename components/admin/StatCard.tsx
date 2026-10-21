import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

/**
 * Thẻ chỉ số của phần quản trị. Nền trắng, KHÔNG tím: đây là số liệu, không
 * phải nhận xét của AI — đúng luật màu của cả site.
 *
 * Stitch vẽ thêm một chấm màu ở góc (xanh lá, xanh dương, teal, hồng) và một
 * sparkline. Chấm màu ở đây bỏ: bốn màu đó không có nghĩa gì, và bảng màu
 * MediVia chỉ có bốn màu đều mang nghĩa. Đổi lại là NHÃN IN HOA nhỏ — Stitch
 * cũng có, và nó làm hàng bốn thẻ đọc nhanh hơn hẳn một hàng chữ thường.
 *
 * `tone="danger"` thay cho `danger` cũ khi cần đỏ; giữ nguyên tên cũ thì 20
 * chỗ gọi không phải sửa.
 */
export function StatCard({
  label,
  value,
  hint,
  danger,
  tone = danger ? "danger" : "default",
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  /** Đỏ khi con số này là việc phải xử lý, không phải tin thường. */
  danger?: boolean;
  tone?: "default" | "danger";
  /** Chỗ cho phần phụ, ví dụ chip phần trăm thay đổi của trang phân tích. */
  children?: ReactNode;
}) {
  const isDanger = tone === "danger";

  return (
    <Card className={`flex flex-col justify-between p-5 ${isDanger ? "border-danger/30" : ""}`}>
      <p className="text-label-sm font-medium tracking-wider text-ink-subtle uppercase">
        {label}
      </p>
      <p
        className={`mt-1.5 font-mono text-[26px] leading-tight font-extrabold tracking-tight ${
          isDanger ? "text-danger" : "text-ink"
        }`}
      >
        {value}
      </p>
      <div className="mt-2.5">
        {children}
        {hint ? <p className="text-body-sm text-ink-subtle">{hint}</p> : null}
      </div>
    </Card>
  );
}

/** Ô tiêu đề cột. Dùng chung để mọi bảng quản trị có cùng nhịp. */
export function Th({ children, align }: { children: ReactNode; align?: "right" }) {
  return (
    <th
      scope="col"
      className={`px-4 py-2.5 text-label-sm font-medium text-ink-muted ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}
