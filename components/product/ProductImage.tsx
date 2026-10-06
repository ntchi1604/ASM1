import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Ảnh sản phẩm: luôn vuông, luôn nền trắng (quy ước cố định của thẻ sản phẩm).
 * Chưa có ảnh thật nên vẽ placeholder chữ cái đầu; khi có ảnh chỉ cần
 * gán `image` trong lib/data/products.ts, không phải sửa layout.
 */
export function ProductImage({
  src,
  name,
  brand,
  className,
  sizes = "(max-width: 768px) 45vw, 220px",
  priority = false,
}: {
  src: string;
  name: string;
  brand?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-card bg-card",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-2"
        />
      ) : (
        <PlaceholderBox name={name} brand={brand} />
      )}
    </div>
  );
}

/**
 * Chữ cái đầu của tên thuốc, tối đa hai chữ.
 *
 * Export ra ngoài vì `ProductThumb` cũng cần đúng chuỗi này cho ảnh cỡ nhỏ. Nếu
 * mỗi chỗ tự cắt tên thì cùng một sản phẩm sẽ hiện "PA" ở giỏ hàng và "PE" ở thẻ
 * sản phẩm — người dùng không đọc được đó là placeholder, họ chỉ thấy hai ô khác
 * nhau cho cùng một hộp thuốc.
 *
 * Dùng `\p{L}` chứ không phải `[a-z]`: tên thuốc tiếng Việt có dấu, và `[^a-z]`
 * sẽ ăn mất chữ Đ trong "Đại tràng" rồi trả về chữ cái sai.
 */
export function productInitials(name: string): string {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Placeholder dạng hộp thuốc: dải màu trust ở trên, chữ cái đầu ở giữa.
 * Dùng token màu qua currentColor nên vẫn tuân thủ quy tắc không hardcode hex.
 */
function PlaceholderBox({ name, brand }: { name: string; brand?: string }) {
  const initials = productInitials(name);

  return (
    <div
      aria-hidden
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-card p-3"
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-card border border-hairline">
        <div className="h-2 w-full shrink-0 bg-trust" />
        <div className="flex flex-1 flex-col items-center justify-center gap-1 bg-recessed/60">
          <span className="font-headline text-headline-lg text-trust-text">
            {initials}
          </span>
          {brand ? (
            <span className="px-2 text-center text-label-sm text-ink-subtle">
              {brand}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
