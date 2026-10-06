import Link from "next/link";
import { Lightbulb, Plus, Stethoscope } from "@/lib/icons";
import { AiBlock } from "@/components/ai/AiBlock";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ProductThumb } from "@/components/product/ProductThumb";
import { getDefaultUnit } from "@/lib/data/products";
import { formatPricePerUnit } from "@/lib/format";
import type { SuggestedProduct } from "@/lib/data/bought-together";

/**
 * Gợi ý mua kèm ở trang giỏ hàng — tính năng AI số 4.
 *
 * Dạng hàng ngang gọn, không dùng lại thẻ sản phẩm to như trang chi tiết: ở đây
 * việc chính của người dùng là thanh toán, gợi ý không được cao bằng khối tiền.
 *
 * Câu căn cứ nói đúng thứ dữ liệu có thật — "các thuốc trong giỏ" — chứ không
 * đoán bệnh ("Đơn của bạn đang điều trị sốt") như bản thiết kế: giỏ hàng không
 * phải đơn thuốc và MediVia không chẩn đoán.
 */
export function CartSuggestions({ items }: { items: SuggestedProduct[] }) {
  if (items.length === 0) return null;

  return (
    <AiBlock label="AI gợi ý" note="Dựa trên các thuốc đang có trong giỏ của bạn">
      <h2 className="mb-3 text-headline-md text-ink">Nhiều người mua thêm</h2>

      <ul className="flex flex-col gap-2">
        {items.map(({ product, reason }) => {
          const unit = getDefaultUnit(product);
          const href = `/thuoc/${product.slug}`;

          return (
            <li
              key={product.id}
              className="flex items-center gap-3 rounded-card border border-hairline bg-card p-2.5"
            >
              <ProductThumb product={product} size="md" />

              <div className="min-w-0 flex-1">
                <p className="flex items-start gap-1.5 text-label-sm text-ai-text">
                  <Lightbulb size={13} className="mt-px shrink-0" aria-hidden />
                  {reason}
                </p>
                <h3 className="line-clamp-2-name mt-0.5 text-body-sm text-ink">
                  <Link href={href} className="focus-ring hover:text-trust-text">
                    {product.name}
                  </Link>
                </h3>
                <p className="mt-0.5 font-mono text-body-sm tabular-nums text-ink">
                  {formatPricePerUnit(unit.price, unit.label)}
                </p>
              </div>

              {/*
                Nhánh kê đơn giống mọi chỗ khác hiện sản phẩm, dù `getCartSuggestions`
                đã lọc tại nguồn. Xem lý do đầy đủ ở BoughtTogether: ràng buộc pháp lý
                không nên chỉ nằm ở lớp dữ liệu.
              */}
              {product.prescriptionRequired ? (
                <ButtonLink href={href} variant="outline-trust" size="sm">
                  <Stethoscope size={15} aria-hidden />
                  Cần đơn
                </ButtonLink>
              ) : (
                <Button variant="outline-trust" size="sm">
                  <Plus size={15} aria-hidden />
                  Thêm
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </AiBlock>
  );
}
