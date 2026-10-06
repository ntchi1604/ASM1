import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AiSummary } from "@/components/ai/AiSummary";
import { BoughtTogether } from "@/components/ai/BoughtTogether";
import { InteractionAlert } from "@/components/ai/InteractionAlert";
import { QuickAsk } from "@/components/ai/QuickAsk";
import { PharmacistCard } from "@/components/product/PharmacistCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfoTable } from "@/components/product/ProductInfoTable";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { PrescriptionNotice } from "@/components/product/PrescriptionNotice";
import { RatingStars } from "@/components/product/RatingStars";
import { ReviewSection } from "@/components/product/ReviewSection";
import { SupplementDisclaimer } from "@/components/product/SupplementDisclaimer";
import { UnitSelector } from "@/components/product/UnitSelector";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { StockStatus } from "@/components/ui/StockStatus";
import { getCategoryBySlug } from "@/lib/data/categories";
import { getCartProductIds } from "@/lib/data/cart";
import { findInteractions } from "@/lib/data/interactions";
import { getProductDetail } from "@/lib/data/product-details";
import { getDefaultUnit, getProductBySlug, products } from "@/lib/data/products";
import { getReviewSummary, getReviews } from "@/lib/data/reviews";
import { formatCount } from "@/lib/format";
import {
  BadgeCheck,
  RotateCcw,
  ShoppingCart,
  Stethoscope,
  Store,
  Zap,
} from "@/lib/icons";
import type { Product, ProductUnit } from "@/lib/types";

/** Prerender toàn bộ sản phẩm — danh mục đóng, biết trước ở lúc build. */
export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/thuoc/[slug]">) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Không tìm thấy sản phẩm" };
  // Không thêm "MediVia": layout gốc đã có template "%s · MediVia".
  return {
    title: product.name,
    description: `${product.shortUses} Hoạt chất ${product.activeIngredient} ${product.strength}, ${product.brand}.`,
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/thuoc/[slug]">) {
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);

  const product = getProductBySlug(slug);
  if (!product) notFound();

  const basePath = `/thuoc/${product.slug}`;
  const selectedUnit = parseUnit(product, rawSearch.dv);
  const detail = getProductDetail(product.id);
  const category = getCategoryBySlug(product.categorySlug);
  const summary = getReviewSummary(product.id);
  const reviews = getReviews(product.id);
  // Cảnh báo tương tác so với giỏ hàng THẬT, không phải danh sách minh hoạ.
  const interactions = findInteractions(product, getCartProductIds());
  const soldOut = product.stock.total <= 0;

  return (
    <div className="container-medivia flex flex-col gap-6 py-5">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Thuốc", href: "/danh-muc/thuoc" },
          ...(category
            ? [{ label: category.name, href: `/danh-muc/${category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      {/* Khối mua hàng: ảnh trái, thông tin + hành động phải. */}
      <div className="grid gap-6 lg:grid-cols-[420px_1fr] lg:gap-8">
        <ProductGallery product={product} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {product.prescriptionRequired ? (
              <Badge tone="prescription">Thuốc kê đơn</Badge>
            ) : (
              <Badge tone="neutral">Không kê đơn (OTC)</Badge>
            )}
            {product.type === "supplement" ? (
              <Badge tone="supplement">TPBS</Badge>
            ) : null}
            <span className="text-body-sm text-ink-muted">{product.brand}</span>
          </div>

          <h1 className="font-headline text-headline-lg text-ink">{product.name}</h1>

          <p className="text-body-sm text-ink-muted">
            Hoạt chất {product.activeIngredient} {product.strength} · {product.brand} ·{" "}
            {product.origin}
            {detail ? ` · SĐK ${detail.registrationNumber}` : ""}
          </p>

          {product.rating ? (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-body-sm text-ink-muted">
              <RatingStars score={product.rating.score} size={16} />
              <span className="font-mono tabular-nums text-ink">
                {product.rating.score.toFixed(1).replace(".", ",")}
              </span>
              <span aria-hidden>•</span>
              <a href="#danh-gia" className="focus-ring rounded hover:text-trust-text">
                {formatCount(product.rating.count)} đánh giá
              </a>
            </div>
          ) : null}

          <div className="rounded-card border border-hairline bg-card p-4">
            <Price
              amount={selectedUnit.price}
              unit={
                selectedUnit.packaging
                  ? `${selectedUnit.label} ${selectedUnit.packaging}`
                  : selectedUnit.label
              }
              originalPrice={selectedUnit.originalPrice}
              prescriptionRequired={product.prescriptionRequired}
              size="lg"
            />

            <UnitSelector
              product={product}
              selected={selectedUnit}
              basePath={basePath}
            />

            {/* Thuốc kê đơn: không có bộ chọn số lượng và không có nút thêm giỏ
                hàng. Cùng quy tắc mà ProductCard áp dụng ở trang danh mục. */}
            {product.prescriptionRequired ? (
              <div className="mt-4 flex flex-col gap-2">
                <ButtonLink href="/ai/chatbot" variant="outline-trust" size="lg" fullWidth>
                  <Stethoscope size={18} aria-hidden />
                  Tư vấn dược sĩ
                </ButtonLink>
                <PrescriptionNotice productName={product.name} />
              </div>
            ) : soldOut ? (
              <div className="mt-4">
                <StockStatus
                  total={product.stock.total}
                  nearbyPharmacies={product.stock.nearbyPharmacies}
                  unit={selectedUnit.label}
                  restockDate={product.stock.restockDate}
                />
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-label-md text-ink">Số lượng:</span>
                  <QuantityStepper max={product.stock.total} />
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button variant="solid-trust" size="lg" fullWidth>
                    <ShoppingCart size={18} aria-hidden />
                    Thêm vào giỏ
                  </Button>
                  <ButtonLink
                    href="/thanh-toan"
                    variant="outline-trust"
                    size="lg"
                    fullWidth
                  >
                    <Zap size={18} aria-hidden />
                    Mua ngay
                  </ButtonLink>
                </div>
              </>
            )}
          </div>

          {!soldOut ? (
            <ul className="grid gap-2 text-body-sm text-ink-muted sm:grid-cols-2">
              <ServiceItem icon={<Store size={16} aria-hidden />}>
                {`Còn ${formatCount(product.stock.total)} ${selectedUnit.label.toLowerCase()} tại ${product.stock.nearbyPharmacies} nhà thuốc gần bạn`}
              </ServiceItem>
              <ServiceItem icon={<Zap size={16} aria-hidden />}>
                Giao 2 giờ nội thành TP. Hồ Chí Minh
              </ServiceItem>
              <ServiceItem icon={<RotateCcw size={16} aria-hidden />}>
                Đổi trả trong 30 ngày
              </ServiceItem>
              <ServiceItem icon={<BadgeCheck size={16} aria-hidden />}>
                Thuốc chính hãng, có hoá đơn
              </ServiceItem>
            </ul>
          ) : null}

          {product.type === "supplement" ? <SupplementDisclaimer /> : null}
        </div>
      </div>

      {/* Cảnh báo an toàn đứng TRƯỚC các khối AI: đây là thông tin cần đọc
          ngay, không phải nội dung tham khảo. */}
      <InteractionAlert interactions={interactions} />

      <PharmacistCard
        advice={
          product.prescriptionRequired
            ? "Gửi đơn thuốc của bác sĩ để dược sĩ kiểm tra liều và hướng dẫn cách dùng trước khi giao."
            : "Hỏi dược sĩ nếu bạn có tiền sử bệnh gan, đang mang thai hoặc đang dùng thuốc khác."
        }
      />

      {detail ? (
        <>
          <QuickAsk questions={detail.quickQuestions} productName={product.name} />
          <AiSummary detail={detail} />
        </>
      ) : null}

      <ProductInfoTable product={product} detail={detail} />

      <BoughtTogether productId={product.id} />

      <ReviewSection summary={summary} reviews={reviews} />
    </div>
  );
}

/**
 * Đơn vị đang chọn đọc từ `?dv=`. Giá trị lạ thì rơi về đơn vị bán mặc định
 * thay vì notFound() — link cũ hoặc link bị sửa tay vẫn mở được trang, chỉ là
 * hiện đơn vị mặc định.
 */
function parseUnit(product: Product, raw: string | string[] | undefined): ProductUnit {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const match = product.units.find((unit) => unit.label === value);
  return match ?? getDefaultUnit(product);
}

function ServiceItem({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0 text-trust-text">{icon}</span>
      {children}
    </li>
  );
}
