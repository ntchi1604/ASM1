import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

/**
 * Khung chung cho các trang nội dung tĩnh: giới thiệu, chính sách, hướng dẫn.
 *
 * Mười trang này là chữ, không phải giao diện, nên nếu mỗi trang tự dựng tiêu đề
 * và bề rộng cột thì chúng sẽ lệch nhau về cỡ chữ, lề và khoảng cách — đúng thứ
 * dễ thấy nhất khi đặt cạnh nhau. Ở đây chốt một lần: cột chữ rộng tối đa 3xl
 * (khoảng 75 ký tự một dòng, cỡ đọc được), mỗi mục là một thẻ trắng.
 *
 * Breadcrumb chỉ hai cấp vì các trang này nằm trực tiếp dưới trang chủ, không có
 * trang cha trung gian nào để trỏ vào.
 */
export function ContentPage({
  title,
  lead,
  children,
}: {
  title: string;
  /** Một câu tóm tắt trang nói về cái gì — không lặp lại tiêu đề. */
  lead: string;
  children: ReactNode;
}) {
  return (
    <div className="container-medivia py-5 md:py-8">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: title }]} />

      <header className="mt-4 mb-6 max-w-3xl">
        <h1 className="text-headline-xl text-ink">{title}</h1>
        <p className="mt-2 text-body-lg text-ink-muted">{lead}</p>
      </header>

      <div className="flex max-w-3xl flex-col gap-4">{children}</div>
    </div>
  );
}

/** Một mục trong trang nội dung: thẻ trắng, tiêu đề cấp 2, các đoạn chữ. */
export function ContentSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-hairline bg-card p-4 md:p-5">
      <h2 className="text-headline-md text-ink">{title}</h2>
      <div className="mt-2.5 flex flex-col gap-2.5 text-body-md text-ink-muted">
        {children}
      </div>
    </section>
  );
}

/** Danh sách gạch đầu dòng, dùng trong ContentSection. */
export function ContentList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}