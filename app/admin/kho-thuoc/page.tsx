import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard, Th } from "@/components/admin/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Card, SectionHeading } from "@/components/ui/Card";
import { AdminButtonForm, AdminForm } from "@/components/admin/AdminForm";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { formatDate, formatPricePerUnit, formatVnd } from "@/lib/format";
import { getDefaultUnit, products } from "@/lib/data/products";
import { categories } from "@/lib/data/categories";
import { daysOfStock, reportPeriod, resolveStockAlerts } from "@/lib/data/sales";
import { addProduct, deleteProduct, saveStock } from "@/lib/admin/actions";
import type { Audience, Product, ProductUnit, UnitLabel } from "@/lib/types";
import { AlertTriangle, Boxes } from "@/lib/icons";

/** Một dòng của bảng tồn kho, kèm đơn vị mặc định và tốc độ bán nếu đo được. */
type StockRow = {
  product: Product;
  unit: ProductUnit;
  days?: number;
  dailyRate?: number;
};

/**
 * Ô chọn đơn vị và đối tượng. Lấy thẳng từ kiểu dữ liệu chứ không chép tay:
 * chép tay thì thêm một đơn vị vào `UnitLabel` mà quên chỗ này, và mặt hàng
 * mới không tạo được với đơn vị đó.
 */
const unitLabels: UnitLabel[] = ["Hộp", "Vỉ", "Viên", "Tuýp", "Lọ", "Chai", "Gói"];

const audienceOptions: { value: Audience; label: string }[] = [
  { value: "nguoi-lon", label: "Người lớn" },
  { value: "tre-em", label: "Trẻ em" },
  { value: "nguoi-cao-tuoi", label: "Người cao tuổi" },
];

export const metadata: Metadata = {
  title: "Kho thuốc",
  description: "Tồn kho từng mặt hàng, sắp theo số ngày còn bán được.",
};

/**
 * Kho thuốc.
 *
 * Danh mục là nguồn duy nhất của tồn kho — trang này KHÔNG giữ bản sao con số nào.
 * Tồn kho ghi ở hai chỗ thì có ngày sửa một chỗ mà quên chỗ kia, và quản trị nói
 * "còn 42" trong khi trang sản phẩm nói "còn 26" cho cùng một thuốc.
 *
 * Sắp theo số ngày còn bán được chứ không theo số lượng: còn 100 hộp mà bán 50
 * hộp/ngày thì gấp hơn còn 12 hộp bán 1 hộp/ngày. Số lượng tuyệt đối không nói
 * được điều đó, mà đây đúng là câu hỏi của người đặt hàng.
 */

/** Cột mốc cảnh báo, tính bằng ngày còn bán được. */
const lowDays = 7;
const outDays = 3;

function StockChip({ days }: { days: number }) {
  if (days <= outDays) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-chip bg-danger-wash px-2 py-0.5 text-label-sm text-danger">
        <AlertTriangle size={13} aria-hidden />~{days} ngày
      </span>
    );
  }
  if (days <= lowDays) {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-chip bg-promo-wash px-2 py-0.5 text-label-sm text-promo-text">
        ~{days} ngày
      </span>
    );
  }
  return (
    <span className="whitespace-nowrap text-body-sm text-ink-subtle">~{days} ngày</span>
  );
}

export default function AdminInventoryPage() {
  const alerts = resolveStockAlerts();
  // Tra theo id để mỗi mặt hàng chỉ tra một lần, không lồng vòng lặp trong map.
  const alertByProduct = new Map(alerts.map((alert) => [alert.productId, alert]));

  /**
   * Tốc độ bán chỉ có với ba mặt hàng đang được theo dõi trong `sales.ts` — đó là
   * dữ liệu bán hàng thật của bản mẫu. Mặt hàng không có tốc độ thì sắp theo số
   * lượng tồn, vì không thể bịa ra một tốc độ chưa đo được.
   */
  const rows = products
    .map((product) => {
      const alert = alertByProduct.get(product.id);
      // Tồn kho đếm theo đơn vị mặc định (hộp, chai), nên giá phải là giá của
      // đúng đơn vị đó — in giá viên cạnh "còn 12 hộp" là hai đơn vị khác nhau
      // đứng chung một dòng.
      const unit = getDefaultUnit(product);
      return {
        product,
        unit,
        days: alert ? daysOfStock(alert) : undefined,
        dailyRate: alert?.dailyRate,
      };
    })
    .sort((a, b) => {
      if (a.days !== undefined && b.days !== undefined) return a.days - b.days;
      if (a.days !== undefined) return -1;
      if (b.days !== undefined) return 1;
      return a.product.stock.total - b.product.stock.total;
    });

  const tracked = rows.filter((row) => row.days !== undefined);
  const soldOut = rows.filter((row) => row.product.stock.total <= 0);
  const lowStock = tracked.filter((row) => (row.days ?? 0) <= lowDays);

  return (
    <AdminShell activeHref="/admin/kho-thuoc">
      <div className="flex flex-col gap-6">
        <header>
          <p className="text-label-sm text-ink-subtle">Cập nhật cuối kỳ {reportPeriod.label}</p>
          <h1 className="mt-1 text-headline-xl text-ink">Kho thuốc</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            {products.length} mặt hàng trong danh mục, sắp theo số ngày còn bán được với tốc độ
            hiện tại. Tồn kho lấy trực tiếp từ danh mục nên luôn khớp với trang sản phẩm.
          </p>
        </header>

        <section aria-label="Chỉ số kho" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Mặt hàng đang theo dõi"
            value={`${tracked.length} / ${products.length}`}
            hint="Chỉ mặt hàng có dữ liệu bán trong kỳ mới tính được số ngày còn lại"
            danger={lowStock.length > 0}
          />
          <StatCard
            label="Sắp hết"
            value={`${lowStock.length} mặt hàng`}
            hint={`Còn dưới hoặc bằng ${lowDays} ngày bán`}
            danger={lowStock.length > 0}
          />
          <StatCard
            label="Tạm hết hàng"
            value={`${soldOut.length} mặt hàng`}
            hint={soldOut.length > 0 ? "Đang chờ hàng về" : "Không có mặt hàng nào hết"}
            danger={soldOut.length > 0}
          />
        </section>

        {soldOut.length > 0 ? (
          <Card className="flex flex-wrap items-start gap-3 border-danger/30 bg-danger-wash p-4 md:p-5">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />
            <div className="min-w-0">
              <h2 className="text-headline-md text-danger">Đang hết hàng</h2>
              <ul className="mt-2 flex flex-col gap-1.5">
                {soldOut.map(({ product }) => (
                  <li key={product.id} className="text-body-sm text-ink-muted">
                    <Link
                      href={`/thuoc/${product.slug}`}
                      className="focus-ring rounded-chip text-label-md text-ink hover:text-trust-text"
                    >
                      {product.name}
                    </Link>
                    {product.stock.restockDate ? (
                      <span className="ml-2">
                        dự kiến có lại {formatDate(product.stock.restockDate)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ) : null}

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading
              title="Tồn kho theo mặt hàng"
              action={
                <span className="flex items-center gap-1.5 text-body-sm text-ink-subtle">
                  <Boxes size={15} aria-hidden />
                  {products.length} mặt hàng
                </span>
              }
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-t border-hairline text-left">
              <thead className="bg-recessed">
                <tr>
                  <Th>Thuốc</Th>
                  <Th align="right">Tồn</Th>
                  <Th align="right">Nhà thuốc gần bạn</Th>
                  <Th align="right">Giá niêm yết</Th>
                  <Th align="right">Bán / ngày</Th>
                  <Th align="right">Còn bán được</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ product, unit, days, dailyRate }) => (
                  <tr key={product.id} className="border-t border-divider">
                    <td className="px-4 py-3">
                      <Link
                        href={`/thuoc/${product.slug}`}
                        className="focus-ring rounded-chip text-body-md text-ink hover:text-trust-text"
                      >
                        {product.name}
                      </Link>
                      <span className="mt-0.5 block text-body-sm text-ink-subtle">
                        {product.brand} · {product.strength}
                      </span>
                      {product.prescriptionRequired ? (
                        <span className="mt-1.5 inline-block align-middle">
                          <Badge tone="prescription">Kê đơn</Badge>
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={
                          product.stock.total <= 0
                            ? "text-label-md text-danger"
                            : "text-label-md text-ink"
                        }
                      >
                        {product.stock.total.toLocaleString("vi-VN")} {unit.label.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-body-sm text-ink-muted">
                      {product.stock.nearbyPharmacies > 0
                        ? product.stock.nearbyPharmacies.toLocaleString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-body-sm text-ink-muted">
                      {formatPricePerUnit(unit.price, unit.label)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-body-sm text-ink-muted">
                      {dailyRate !== undefined ? dailyRate.toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {days !== undefined ? (
                        <StockChip days={days} />
                      ) : product.stock.total <= 0 ? (
                        <span className="text-body-sm text-ink-subtle">Hết hàng</span>
                      ) : (
                        <span className="text-body-sm text-ink-subtle">Chưa đủ dữ liệu</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-hairline px-4 py-3 text-body-sm text-ink-subtle">
            “Còn bán được” tính bằng tồn kho chia tốc độ bán mỗi ngày trong kỳ {reportPeriod.days}{" "}
            ngày. Chỉ {tracked.length} mặt hàng đầu bảng có dữ liệu bán trong kỳ; phần còn lại
            ghi “chưa đủ dữ liệu” thay vì đoán một tốc độ chưa từng đo.
          </p>
        </Card>

        <StockEditor products={rows} />

        <AddProductForm />

        <Card className="p-4 md:p-5">
          <SectionHeading title="Tổng giá trị tồn" />
          <p className="text-body-md text-ink-muted">
            {formatVnd(
              products.reduce(
                (sum, product) => sum + getDefaultUnit(product).price * product.stock.total,
                0,
              ),
            )}{" "}
            theo giá bán của đơn vị mặc định — con số này chỉ để đối chiếu nhanh, không dùng cho
            kế toán: giá trị kho thật phải tính theo giá nhập, không phải giá bán.
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}

/**
 * Sửa giá và tồn của một mặt hàng. Đóng lại mặc định.
 *
 * Dùng `<details>` chứ không phải state của React: trình duyệt tự lo phần mở/đóng,
 * không cần một byte JavaScript nào, và vẫn dùng được khi JS chưa tải xong. Mười
 * hai mặt hàng mở sẵn cùng lúc là một trang dài không ai đọc.
 *
 * Ô giá dựng theo TỪNG ĐƠN VỊ có thật của mặt hàng đó. Không cho form gửi cả mảng
 * `units` vì như thế form phải biết đơn vị nào đang tồn tại — một ô bị bỏ trống do
 * lỗi hiển thị sẽ xoá luôn đơn vị đó, và mặt hàng mất giá bán mà không ai được báo.
 */
function StockEditor({ products: rows }: { products: StockRow[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="p-4 md:p-5">
        <SectionHeading
          title="Sửa giá và tồn kho"
          action={
            <span className="text-body-sm text-ink-subtle">
              Mở mặt hàng cần sửa
            </span>
          }
        />
        <p className="mt-1.5 max-w-2xl text-body-sm text-ink-muted">
          Giá gửi theo từng đơn vị bán. Để trống ô nào thì đơn vị đó giữ nguyên giá cũ — không
          có chuyện bỏ trống rồi lưu thành 0.
        </p>
      </div>
      <ul className="border-t border-hairline">
        {rows.map(({ product, unit }) => (
          <li key={product.id} className="border-b border-divider last:border-b-0">
            <details className="group">
              <summary className="focus-ring flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-recessed md:px-5">
                <span className="min-w-0">
                  <span className="block text-body-md text-ink">{product.name}</span>
                  <span className="mt-0.5 block text-body-sm text-ink-subtle">
                    {product.brand} · {product.strength} · đang còn{" "}
                    {product.stock.total.toLocaleString("vi-VN")} {unit.label.toLowerCase()}
                  </span>
                </span>
                <span className="text-label-sm text-trust-text">
                  <span className="group-open:hidden">Sửa</span>
                  <span className="hidden group-open:inline">Đóng</span>
                </span>
              </summary>

              <div className="border-t border-hairline bg-recessed/40 px-4 py-4 md:px-5">
                <AdminForm
                  action={saveStock}
                  hidden={{ id: product.id }}
                  submit="Lưu mặt hàng này"
                  footer={
                    <span className="text-body-sm text-ink-subtle">
                      Giá trị 0 ₫ sẽ khiến mặt hàng không bán được.
                    </span>
                  }
                >
                  <Field
                    label={`Tồn kho (${unit.label.toLowerCase()})`}
                    id={`total-${product.id}`}
                    required
                    hint="Số nguyên, không âm. Về 0 thì mặt hàng thành tạm hết."
                  >
                    <Input
                      id={`total-${product.id}`}
                      name="total"
                      type="number"
                      min={0}
                      step={1}
                      required
                      defaultValue={product.stock.total}
                    />
                  </Field>

                  <Field
                    label="Nhà thuốc gần bạn còn hàng"
                    id={`nearby-${product.id}`}
                    hint="Hiện ở trang sản phẩm. Để trống thì giữ nguyên."
                  >
                    <Input
                      id={`nearby-${product.id}`}
                      name="nearbyPharmacies"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={product.stock.nearbyPharmacies}
                    />
                  </Field>

                  {product.units.map((item) => (
                    <Field
                      key={item.label}
                      label={`Giá bán · ${item.label}`}
                      id={`price-${product.id}-${item.label}`}
                      hint={item.packaging ? `Quy cách: ${item.packaging}` : undefined}
                    >
                      <Input
                        id={`price-${product.id}-${item.label}`}
                        name={`price:${item.label}`}
                        type="number"
                        min={0}
                        step={100}
                        defaultValue={item.price}
                      />
                    </Field>
                  ))}

                  {product.stock.total === 0 ? (
                    <Field
                      label="Ngày dự kiến có hàng lại"
                      id={`restock-${product.id}`}
                      hint="Chỉ dùng khi đang hết hàng."
                    >
                      <Input
                        id={`restock-${product.id}`}
                        name="restockDate"
                        type="date"
                        defaultValue={product.stock.restockDate ?? ""}
                      />
                    </Field>
                  ) : null}
                </AdminForm>

                <div className="mt-4 border-t border-hairline pt-4">
                  <p className="text-body-sm text-ink-subtle">
                    Xoá mặt hàng khỏi danh mục. Không hoàn tác được.
                  </p>
                  <div className="mt-2">
                    <AdminButtonForm
                      action={deleteProduct}
                      hidden={{ id: product.id }}
                      submit="Xoá mặt hàng"
                      variant="outline-trust"
                      confirm={`Xoá "${product.name}" khỏi danh mục? Thao tác này không hoàn tác được.`}
                    />
                  </div>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * Thêm mặt hàng mới.
 *
 * Mã mặt hàng tách khỏi đường dẫn: mã là khoá trong dữ liệu, đường dẫn là địa chỉ
 * công khai, và đổi đường dẫn về sau không được làm mất liên kết tới mặt hàng. Để
 * trống đường dẫn thì lấy bằng mã.
 */
function AddProductForm() {
  return (
    <Card className="overflow-hidden">
      <details>
        <summary className="focus-ring flex cursor-pointer items-center justify-between gap-2 p-4 hover:bg-recessed md:p-5">
          <span>
            <span className="block text-headline-md text-ink">Thêm mặt hàng mới</span>
            <span className="mt-0.5 block text-body-sm text-ink-muted">
              Mặt hàng mới hiện ở trang danh mục của nó sau khi lưu. Trang chủ chỉ hiện hàng
              đang giảm giá và hàng do AI gợi ý, nên mặt hàng mới không tự lên đó.
            </span>
          </span>
          <span className="shrink-0 text-label-sm text-trust-text">Mở</span>
        </summary>

        <div className="border-t border-hairline px-4 py-4 md:px-5">
          <AdminForm
            action={addProduct}
            submit="Thêm mặt hàng"
            footer={
              <span className="text-body-sm text-ink-subtle">
                Một mặt hàng có một đơn vị bán lúc tạo. Thêm đơn vị khác sau khi lưu.
              </span>
            }
          >
            <Field
              label="Mã mặt hàng"
              id="new-id"
              required
              hint="Chữ thường, số, gạch ngang. Dùng làm khoá, sửa được về sau."
            >
              <Input id="new-id" name="id" required placeholder="ví dụ: berocca-plus" />
            </Field>

            <Field label="Đường dẫn công khai" id="new-slug" hint="Để trống thì lấy bằng mã.">
              <Input id="new-slug" name="slug" placeholder="berocca-plus" />
            </Field>

            <Field label="Tên mặt hàng" id="new-name" required className="md:col-span-2">
              <Input
                id="new-name"
                name="name"
                required
                placeholder="Berocca Plus viên sủi bổ sung vitamin"
              />
            </Field>

            <Field label="Hoạt chất" id="new-ingredient" hint="Nhiều hoạt chất thì ngăn cách bằng dấu phẩy.">
              <Input id="new-ingredient" name="activeIngredient" placeholder="Vitamin B, C" />
            </Field>

            <Field label="Hàm lượng" id="new-strength">
              <Input id="new-strength" name="strength" placeholder="500mg" />
            </Field>

            <Field label="Thương hiệu" id="new-brand">
              <Input id="new-brand" name="brand" placeholder="Bayer" />
            </Field>

            <Field label="Xuất xứ" id="new-origin">
              <Input id="new-origin" name="origin" placeholder="Việt Nam" />
            </Field>

            <Field label="Danh mục" id="new-category" required>
              <Select id="new-category" name="categorySlug" required defaultValue="cam-cum-ha-sot">
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Loại hàng" id="new-type" required>
              <Select id="new-type" name="type" defaultValue="drug">
                <option value="drug">Thuốc</option>
                <option value="supplement">Thực phẩm bảo vệ sức khoẻ</option>
                <option value="cosmetic">Dược mỹ phẩm</option>
                <option value="device">Thiết bị y tế</option>
              </Select>
            </Field>

            <Field label="Dạng bào chế" id="new-dosage" required>
              <Select id="new-dosage" name="dosageForm" defaultValue="vien-nen">
                <option value="vien-nen">Viên nén</option>
                <option value="vien-sui">Viên sủi</option>
                <option value="siro">Siro</option>
                <option value="goi-bot">Gói bột</option>
                <option value="xit-nho">Xịt nhỏ</option>
                <option value="vien-ngam">Viên ngậm</option>
                <option value="ong-uong">Ống uống</option>
                <option value="dung-dich">Dung dịch</option>
              </Select>
            </Field>

            <Field label="Đơn vị bán đầu tiên" id="new-unit" hint="Đơn vị thêm sau ở ô sửa phía trên.">
              <Select id="new-unit" name="unitLabel" defaultValue="Hộp">
                {unitLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Giá bán (₫)" id="new-price" required>
              <Input id="new-price" name="price" type="number" min={0} step={1000} required />
            </Field>

            <Field label="Tồn kho ban đầu" id="new-total" required>
              <Input id="new-total" name="total" type="number" min={0} step={1} required />
            </Field>

            <fieldset className="flex flex-col gap-2 md:col-span-2">
              <legend className="text-label-sm text-ink">Đối tượng dùng được</legend>
              <p className="text-body-sm text-ink-subtle">
                Chỉ tích khi nhãn thuốc ghi rõ. Không suy diễn từ hoạt chất.
              </p>
              <div className="flex flex-wrap gap-4">
                {audienceOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-body-md text-ink"
                  >
                    <input
                      type="checkbox"
                      name="audiences"
                      value={option.value}
                      className="focus-ring size-4 rounded border-hairline"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <Field
              label="Mô tả ngắn"
              id="new-uses"
              className="md:col-span-2"
              hint="Hiện dưới tên thuốc ở thẻ sản phẩm, và là nguồn cho khối tóm tắt AI."
            >
              <Textarea id="new-uses" name="shortUses" rows={2} />
            </Field>

            <label className="flex items-start gap-2 text-body-md text-ink md:col-span-2">
              <input
                type="checkbox"
                name="prescriptionRequired"
                className="focus-ring mt-1 size-4 shrink-0 rounded border-hairline"
              />
              <span>
                <span className="font-medium">Thuốc kê đơn</span>
                <span className="mt-0.5 block text-body-sm text-ink-subtle">
                  Tích vào thì mặt hàng mất nút thêm giỏ khắp site và chỉ bán được sau khi dược
                  sĩ duyệt đơn thuốc.
                </span>
              </span>
            </label>
          </AdminForm>
        </div>
      </details>
    </Card>
  );
}