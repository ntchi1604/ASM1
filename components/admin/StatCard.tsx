import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

/**
 * Thẻ chỉ số của phần quản trị. Nền trắng, KHÔNG tím: đây là số liệu, không
 * phải nhận xét của AI — đúng luật màu của cả site.
 *
 * Tách ra dùng chung vì cả ba trang quản trị đều mở đầu bằng một hàng bốn thẻ
 * như thế này; ba bản chép tay là ba chỗ để lệch cỡ chữ.
 */
export function StatCard({
  label,
  value,
  hint,
  danger,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  /** Đỏ khi con số này là việc phải xử lý, không phải tin thường. */
  danger?: boolean;
  /** Chỗ cho phần phụ, ví dụ chip phần trăm thay đổi của trang phân tích. */
  children?: ReactNode;
}) {
  return (
    <Card className={`p-4 ${danger ? "border-danger/30" : ""}`}>
      <p className="text-label-sm text-ink-subtle">{label}</p>
      <p className={`mt-1 text-headline-lg ${danger ? "text-danger" : "text-ink"}`}>{value}</p>
      {children}
      {hint ? <p className="mt-2 text-body-sm text-ink-subtle">{hint}</p> : null}
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