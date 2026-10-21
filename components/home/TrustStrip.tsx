import { trustPoints } from "@/lib/data/home";

/**
 * Dải 4 lời hứa dịch vụ trên một tấm card trắng nổi trên nền trang.
 * Card trắng thay vì nền lõm: khối này nằm ngay dưới hero nên nó là phần
 * tiếp nối của hero, và một tấm card có viền hairline đọc như cùng một hệ
 * với hai card lối vào bên phải hero.
 */
export function TrustStrip() {
  return (
    <section className="container-medivia">
      <ul className="grid grid-cols-2 gap-4 rounded-card border border-hairline bg-card p-4 md:p-5 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-hairline">
        {trustPoints.map(({ icon: Icon, title, note }) => (
          <li key={title} className="flex items-start gap-3 lg:px-4 lg:first:pl-0 lg:last:pr-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-trust/10 text-trust-text">
              <Icon size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-ink">{title}</p>
              <p className="text-label-sm text-ink-muted">{note}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
