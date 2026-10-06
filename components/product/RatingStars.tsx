import { Star } from "@/lib/icons";
import { cn } from "@/lib/cn";

/**
 * Dãy sao. Nửa sao vẽ bằng cách phủ một sao đầy bị cắt theo phần trăm — không
 * cần icon "star_half" riêng, nên 4,7 sao hiện đúng 4,7 chứ không làm tròn.
 *
 * Điểm số luôn đọc được cho trình đọc màn hình qua aria-label; các sao là
 * trang trí.
 */
export function RatingStars({
  score,
  size = 16,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${score.toFixed(1).replace(".", ",")} trên 5 sao`}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        // Phần sao thứ index được tô: 1 = đầy, 0 = rỗng, 0,5 = nửa.
        const fill = Math.max(0, Math.min(1, score - index));
        return (
          <span key={index} className="relative inline-flex" aria-hidden>
            <Star size={size} className="text-ink-subtle/40" />
            {fill > 0 ? (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star size={size} className="fill-current text-promo" />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
