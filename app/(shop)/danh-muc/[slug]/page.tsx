import { notFound } from "next/navigation";
import { CategoryBoughtTogether } from "@/components/ai/CategoryBoughtTogether";
import { ActiveFilterBar } from "@/components/category/ActiveFilterBar";
import { AiCategoryHint } from "@/components/category/AiCategoryHint";
import { FilterSidebar } from "@/components/category/FilterSidebar";
import { SortBar } from "@/components/category/SortBar";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductRow } from "@/components/product/ProductRow";
import { SupplementDisclaimer } from "@/components/product/SupplementDisclaimer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import {
  applyFilters,
  buildCategoryHref,
  countActiveFilters,
  paginate,
  parseFilterState,
  parsePage,
  parseView,
  sortProducts,
} from "@/lib/category-query";
import { categories } from "@/lib/data/categories";
import { collections, resolveCollection } from "@/lib/data/collections";
import { formatCount } from "@/lib/format";
import { Bot, ShieldCheck } from "@/lib/icons";

/** Prerender sẵn 12 danh mục và 2 bộ sưu tập — danh sách đóng, biết trước lúc build. */
export function generateStaticParams() {
  return [...categories, ...collections].map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps<"/danh-muc/[slug]">) {
  const { slug } = await params;
  const entry = resolveCollection(slug);
  if (!entry) return { title: "Không tìm thấy danh mục" };
  // Không thêm "MediVia" ở đây: layout gốc đã có template "%s · MediVia".
  return { title: entry.meta.name, description: entry.meta.description };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/danh-muc/[slug]">) {
  // params và searchParams đều là Promise ở Next 16 nên phải await.
  const [{ slug }, rawSearch] = await Promise.all([params, searchParams]);

  const entry = resolveCollection(slug);
  if (!entry) notFound();

  const { meta, products: categoryProducts } = entry;
  const basePath = `/danh-muc/${meta.slug}`;
  const state = parseFilterState(rawSearch);
  const view = parseView(rawSearch);

  const filtered = applyFilters(categoryProducts, state);
  const sorted = sortProducts(filtered, state.sort);
  const { items, totalPages, page } = paginate(sorted, parsePage(rawSearch));

  const activeCount = countActiveFilters(state);
  const hasSupplement = items.some((p) => p.type === "supplement");

  return (
    <div className="container-medivia py-5">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Thuốc", href: "/danh-muc/thuoc" },
          { label: meta.name },
        ]}
      />

      <header className="mt-4 mb-5">
        <h1 className="text-headline-lg text-ink">{meta.name}</h1>
        <p className="mt-1.5 text-body-sm text-ink-muted">
          {/* Khi đang lọc thì số đứng trước phải là số kết quả thật, không
              phải tổng danh mục — nói "11 sản phẩm" trong lúc chỉ hiện 4 cái
              là báo sai. Giữ tổng ở sau để người dùng biết đã lọc bỏ bao nhiêu. */}
          {activeCount > 0
            ? `${formatCount(sorted.length)} trong ${formatCount(categoryProducts.length)} sản phẩm • Đã lọc theo ${activeCount} điều kiện`
            : `${formatCount(categoryProducts.length)} sản phẩm`}
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-body-sm text-trust-text">
          <ShieldCheck size={16} aria-hidden />
          100% thuốc chính hãng, có dược sĩ kiểm duyệt
        </p>
      </header>

      <div className="flex flex-col gap-5 lg:flex-row">
        <FilterSidebar
          basePath={basePath}
          categoryProducts={categoryProducts}
          state={state}
          view={view}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ActiveFilterBar
            basePath={basePath}
            categoryProducts={categoryProducts}
            state={state}
            view={view}
          />

          <SortBar
            basePath={basePath}
            state={state}
            view={view}
            resultCount={filtered.length}
          />

          {meta.aiHint ? (
            <AiCategoryHint message={meta.aiHint.message} action={meta.aiHint.action} />
          ) : null}

          {items.length === 0 ? (
            <EmptyState clearHref={buildCategoryHref(basePath, state, view, { clearAll: true })} />
          ) : view === "list" ? (
            <ul className="flex flex-col gap-3">
              {items.map((product) => (
                <li key={product.id}>
                  <ProductRow product={product} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {items.map((product, index) => (
                <li key={product.id} className="flex">
                  <ProductCard product={product} priority={index < 4} />
                </li>
              ))}
            </ul>
          )}

          {hasSupplement ? <SupplementDisclaimer /> : null}

          {totalPages > 1 ? (
            <div className="pt-1">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                buildHref={(target) =>
                  buildCategoryHref(basePath, state, view, { page: target })
                }
              />
            </div>
          ) : null}
        </div>
      </div>

      {/*
        Khối gợi ý tràn hết chiều rộng, nằm NGOÀI hàng flex chứa sidebar: gợi ý
        chéo danh mục không thuộc về cột kết quả đang bị bộ lọc thu hẹp, và ở màn
        rộng thì nhét vào cột đó sẽ ra lưới 4 cột hẹp hơn lưới sản phẩm ngay trên
        nó — hai lưới lệch nhau vài chục pixel trông như lỗi dựng trang.

        Điều kiện là danh mục có sản phẩm, không phải có kết quả sau lọc: 4 danh mục
        (da-lieu, me-va-be, thiet-bi-y-te, mat) hiện chưa có hàng và đã có EmptyState
        dẫn sang dược sĩ AI, thêm khối bán kèm bên dưới một danh mục trống là mời mua
        thứ chẳng liên quan gì đến trang người dùng vừa mở.

        Bộ sưu tập không có dữ liệu bán kèm nên `getCategoryBoughtTogether` trả
        undefined và khối tự ẩn — điều kiện dưới đây không cần biết trang đang là
        danh mục hay bộ sưu tập.
      */}
      {categoryProducts.length > 0 ? (
        <div className="mt-6">
          <CategoryBoughtTogether categorySlug={meta.slug} />
        </div>
      ) : null}
    </div>
  );
}

/** Lọc quá tay thì dẫn ra, không để người dùng nhìn màn hình trắng. */
function EmptyState({ clearHref }: { clearHref: string }) {
  return (
    <div className="rounded-card border border-hairline bg-card px-6 py-12 text-center">
      <p className="text-body-md font-medium text-ink">
        Không có sản phẩm nào khớp các điều kiện đang chọn
      </p>
      <p className="mx-auto mt-1.5 max-w-md text-body-sm text-ink-muted">
        Thử bỏ một vài điều kiện, hoặc mô tả triệu chứng để dược sĩ AI gợi ý thuốc phù hợp.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        <ButtonLink href={clearHref} variant="outline-trust">
          Bỏ hết điều kiện lọc
        </ButtonLink>
        <ButtonLink href="/ai/chatbot" variant="solid-ai">
          <Bot size={18} aria-hidden />
          Hỏi dược sĩ AI
        </ButtonLink>
      </div>
    </div>
  );
}
