import Link from "next/link";
import { AiBlock } from "@/components/ai/AiBlock";
import { ProductImage } from "@/components/product/ProductImage";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { SuggestedProduct } from "@/lib/data/bought-together";
import { getDefaultUnit } from "@/lib/data/products";
import { formatPricePerUnit } from "@/lib/format";
import { Lightbulb, ShoppingCart, Stethoscope } from "@/lib/icons";

/**
 * Lưới "thường được mua cùng" — phần hiển thị dùng chung cho trang chi tiết
 * thuốc và trang danh mục.
 *
 * Vì sao tách ra khỏi `BoughtTogether`: hai trang cùng hiện một khối gợi ý, và
 * yêu cầu của dự án là các page phải đồng bộ. Nếu mỗi trang tự dựng lưới thì chỉ
 * cần một lần sửa lệch — đổi cỡ chữ giá, bỏ nhánh thuốc kê đơn, dịch icon lý do
 * xuống dưới tên — là hai khối trông như hai tính năng khác nhau. Gộp về một chỗ
 * thì không sửa lệch được nữa: đây là cùng cơ chế đã dùng cho `ProductThumb`.
 *
 * Chỉ nhận dữ liệu đã giải xong, không tự gọi hàm tra dữ liệu: bên gọi quyết định
 * lấy gợi ý theo sản phẩm hay theo danh mục, còn component này chỉ vẽ.
 */
export function SuggestionGrid({
  title,
  basis,
  items,
  note,
}: {
  /** Tiêu đề khối. Khác nhau giữa hai trang vì căn cứ gợi ý khác nhau thật. */
  title: string;
  /** Câu giải thích căn cứ, hiện cạnh nhãn AI. */
  basis: string;
  items: SuggestedProduct[];
  /** Ghi chú thêm dưới tiêu đề, hiện khi cần nói rõ phạm vi gợi ý. */
  note?: string;
}) {
  return (
    <AiBlock label="AI gợi ý" note={basis}>
      <h2 className="text-headline-md text-ink">{title}</h2>
      {note ? <p className="mt-1 text-body-sm text-ink-muted">{note}</p> : null}

      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ product, reason }) => {
          const unit = getDefaultUnit(product);
          const href = `/thuoc/${product.slug}`;

          return (
            <li
              key={product.id}
              className="flex flex-col overflow-hidden rounded-card border border-hairline bg-card"
            >
              {/*
                Lý do mua kèm nằm TRÊN tên sản phẩm, không phải dưới: người đọc cần
                biết "tại sao lại gợi ý cái này" trước khi đọc tên và giá, nếu không
                thì khối này chỉ là một dãy sản phẩm bán thêm.
              */}
              <p className="flex items-start gap-1.5 border-b border-divider px-3 py-2 text-label-sm text-ai-text">
                <Lightbulb size={14} className="mt-px shrink-0" aria-hidden />
                {reason}
              </p>

              <Link href={href} className="focus-ring block">
                <ProductImage
                  src={product.image}
                  name={product.name}
                  brand={product.brand}
                />
              </Link>

              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <h3 className="line-clamp-2-name font-headline text-body-sm font-medium text-ink">
                  <Link href={href} className="focus-ring hover:text-trust-text">
                    {product.name}
                  </Link>
                </h3>

                <p className="mt-auto font-mono text-body-sm font-semibold tabular-nums text-ink">
                  {formatPricePerUnit(unit.price, unit.label)}
                </p>

                {/*
                  Nhánh kê đơn giống ProductCard và ProductRow, dù cả hai hàm tra dữ
                  liệu đều đã lọc `prescriptionRequired` tại nguồn. Giữ ở đây là phòng
                  vệ hai lớp có chủ ý: hàm dữ liệu có thể bị đổi, có thể được gọi từ
                  nguồn gợi ý khác sau này, và cái giá của việc sai là một nút "Thêm
                  vào giỏ" trên thuốc phải có đơn bác sĩ. Ràng buộc pháp lý thì không
                  nên chỉ nằm ở một lớp.
                */}
                {product.prescriptionRequired ? (
                  <ButtonLink href={href} variant="outline-trust" size="sm" fullWidth>
                    <Stethoscope size={16} aria-hidden />
                    Cần đơn bác sĩ
                  </ButtonLink>
                ) : (
                  <Button variant="outline-trust" size="sm" fullWidth>
                    <ShoppingCart size={16} aria-hidden />
                    Thêm vào giỏ
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </AiBlock>
  );
}
