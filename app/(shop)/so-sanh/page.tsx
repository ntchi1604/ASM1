import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { ProductImage } from "@/components/product/ProductImage";
import { Badge } from "@/components/ui/Badge";
import { clearCompare, toggleCompare } from "@/lib/shop/compare-actions";
import { MAX_COMPARE, readCompareProducts } from "@/lib/shop/compare-cookie";
import { compareRows } from "@/lib/product-compare";
import { Delete, GitCompareArrows } from "@/lib/icons";

export const metadata: Metadata = {
  title: "So sánh sản phẩm",
  description: "Đặt cạnh nhau giá, quy cách, hoạt chất và số đăng ký của tối đa bốn sản phẩm.",
};

/**
 * Bảng so sánh.
 *
 * Bảng cuộn ngang trên điện thoại thay vì xếp dọc từng sản phẩm: so sánh là đọc
 * NGANG một dòng trên nhiều cột. Xếp dọc thì "hoạt chất của A" nằm cách "hoạt
 * chất của B" hai màn hình, và người đọc phải nhớ để đối chiếu — đúng cái việc
 * trang này sinh ra để khỏi phải làm.
 *
 * Cột đầu là nhãn và dính bên trái khi cuộn: cuộn tới cột thứ tư mà mất nhãn thì
 * không biết dòng đang đọc là hạn dùng hay số đăng ký.
 */
export default async function ComparePage() {
  const products = await readCompareProducts();
  // Mỗi sản phẩm một bảng dòng; nhãn lấy từ sản phẩm đầu, thứ tự dòng cố định
  // nên các cột luôn thẳng hàng.
  const columns = products.map(compareRows);
  const labels = (columns[0] ?? []).map((row) => row.label);

  return (
    <div className="container-medivia py-6 md:py-8">
      <Breadcrumb items={[{ label: "Trang chủ", href: "/" }, { label: "So sánh" }]} />

      <h1 className="mt-3 text-headline-xl text-ink">So sánh sản phẩm</h1>
      <p className="mt-1 text-body-md text-ink-muted">
        {products.length > 0
          ? `${products.length}/${MAX_COMPARE} sản phẩm đang so sánh`
          : "Chưa chọn sản phẩm nào"}
      </p>

      {products.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-card border border-hairline bg-card px-6 py-14 text-center">
          <span className="text-ink-subtle">
            <GitCompareArrows size={40} aria-hidden />
          </span>
          <p className="text-headline-md text-ink">Bảng so sánh đang trống</p>
          <p className="max-w-md text-body-md text-ink-muted">
            Mở một sản phẩm rồi bấm “So sánh”. Chọn tối đa {MAX_COMPARE} sản phẩm để
            đặt giá, quy cách và hoạt chất cạnh nhau.
          </p>
          <ButtonLink href="/danh-muc/cam-cum-ha-sot" className="mt-2">
            Xem danh mục thuốc
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-card border border-hairline bg-card">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <caption className="sr-only">
                So sánh {products.length} sản phẩm theo giá, tình trạng và thông tin dược
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-40 bg-card p-3 align-bottom">
                    <span className="text-label-sm text-ink-subtle">Sản phẩm</span>
                  </th>
                  {products.map((product) => (
                    <th
                      key={product.id}
                      scope="col"
                      className="min-w-52 border-l border-divider p-3 align-bottom"
                    >
                      <Link href={`/thuoc/${product.slug}`} className="focus-ring block rounded-card">
                        <ProductImage
                          src={product.image}
                          name={product.name}
                          brand={product.brand}
                        />
                      </Link>
                      <Link
                        href={`/thuoc/${product.slug}`}
                        className="focus-ring mt-2 block font-headline text-body-sm font-medium text-ink hover:text-trust-text"
                      >
                        {product.name}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {product.prescriptionRequired ? (
                          <Badge tone="prescription">Kê đơn</Badge>
                        ) : (
                          <Badge tone="neutral">OTC</Badge>
                        )}
                        {product.type === "supplement" ? (
                          <Badge tone="supplement">TPBS</Badge>
                        ) : null}
                      </div>
                      <form action={toggleCompare} className="mt-2">
                        <input type="hidden" name="productId" value={product.id} />
                        <button
                          type="submit"
                          className="focus-ring inline-flex items-center gap-1 rounded-chip text-label-sm text-ink-subtle hover:text-danger"
                        >
                          <Delete size={13} aria-hidden />
                          Bỏ khỏi bảng
                        </button>
                      </form>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {labels.map((label, rowIndex) => (
                  <tr key={label} className="border-t border-divider">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-card p-3 text-body-sm font-normal text-ink-muted"
                    >
                      {label}
                    </th>
                    {products.map((product, columnIndex) => (
                      <td
                        key={product.id}
                        className="border-l border-divider p-3 text-body-sm text-ink"
                      >
                        {columns[columnIndex][rowIndex]?.value ?? "Đang cập nhật"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ButtonLink href="/danh-muc/cam-cum-ha-sot" variant="outline-trust" size="sm">
              Thêm sản phẩm khác
            </ButtonLink>
            <form action={clearCompare}>
              <button
                type="submit"
                className="focus-ring rounded-chip text-label-sm text-ink-subtle underline decoration-hairline underline-offset-2 hover:text-danger"
              >
                Bỏ tất cả
              </button>
            </form>
            <span className="text-body-sm text-ink-subtle">
              Bảng nằm trên máy này và chỉ so sánh thông tin đã công bố, không phải
              khuyến nghị dùng thuốc.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
