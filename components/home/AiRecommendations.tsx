import Link from "next/link";
import { ExternalLink, Sparkles } from "@/lib/icons";
import { AiBlock } from "@/components/ai/AiBlock";
import { ProductCard } from "@/components/product/ProductCard";
import { getProductBySlug } from "@/lib/data/products";

/**
 * AI gợi ý sản phẩm. Mỗi gợi ý phải kèm LÝ DO — người dùng cần biết vì sao
 * AI đề xuất, nếu không thì đây chỉ là quảng cáo đội lốt AI.
 *
 * Danh sách có cả một thuốc kê đơn (Augmentin) để chứng minh ràng buộc:
 * ProductCard tự bỏ nút thêm giỏ hàng, kể cả khi AI gợi ý.
 */
const suggestions = [
  { slug: "prospan-siro-ho", reason: "Cùng nhóm điều trị ho" },
  { slug: "vien-ngam-ho-bao-thanh", reason: "Thường mua cùng thuốc hạ sốt" },
  { slug: "xit-hong-keo-ong-propolis", reason: "Hỗ trợ giảm rát họng" },
  { slug: "augmentin-625mg", reason: "Bác sĩ thường kê khi bội nhiễm" },
];

export function AiRecommendations() {
  const items = suggestions
    .map(({ slug, reason }) => ({ product: getProductBySlug(slug), reason }))
    .filter(
      (item): item is { product: NonNullable<typeof item.product>; reason: string } =>
        Boolean(item.product),
    );

  return (
    <section className="container-medivia pb-8 md:pb-10">
      <AiBlock label="AI gợi ý" note="Cá nhân hoá an toàn">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-body-md text-ink">
            Dựa trên sản phẩm bạn vừa xem:{" "}
            <Link
              href="/thuoc/hapacol-650"
              className="focus-ring font-medium text-trust-text hover:underline"
            >
              Hapacol 650
            </Link>{" "}
            và{" "}
            <Link
              href="/thuoc/prospan-siro-ho"
              className="focus-ring font-medium text-trust-text hover:underline"
            >
              Prospan siro ho
            </Link>
          </p>
          <span className="inline-flex items-center gap-1 text-label-sm text-ai-text">
            <Sparkles size={13} aria-hidden />
            Đối soát Dược thư Quốc gia
          </span>
        </div>

        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map(({ product, reason }) => (
            <li key={product.id} className="flex flex-col gap-2">
              {/* Lý do gợi ý, đặt trên thẻ để không phá cấu trúc ProductCard. */}
              <p className="rounded-chip bg-card px-2.5 py-1 text-label-sm text-ai-text">
                {reason}
              </p>
              <div className="flex-1">
                <ProductCard product={product} />
              </div>
            </li>
          ))}
        </ul>

        <a
          href="https://dav.gov.vn"
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mt-4 inline-flex items-center gap-1.5 text-label-md text-ai-text hover:underline"
        >
          Xem thông tin gốc từ nhà sản xuất
          <ExternalLink size={15} aria-hidden />
        </a>
      </AiBlock>
    </section>
  );
}
