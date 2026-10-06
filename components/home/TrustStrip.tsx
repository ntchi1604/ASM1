import { trustPoints } from "@/lib/data/home";

/** Dải 4 lời hứa dịch vụ. Nền lõm để tách khỏi hero mà không cần đổ bóng. */
export function TrustStrip() {
  return (
    <section className="border-b border-hairline bg-recessed">
      <div className="container-medivia grid grid-cols-2 gap-4 py-5 lg:grid-cols-4">
        {trustPoints.map(({ icon: Icon, title, note }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-trust-wash text-trust-text">
              <Icon size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-ink">{title}</p>
              <p className="text-label-sm text-ink-muted">{note}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
