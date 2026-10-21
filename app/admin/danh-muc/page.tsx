import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard, Th } from "@/components/admin/StatCard";
import { Card, SectionHeading } from "@/components/ui/Card";
import { AdminButtonForm, AdminForm } from "@/components/admin/AdminForm";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import {
  categoryIconKeys,
  categoryIconLabels,
  categoryIcons,
  type Category,
} from "@/lib/data/categories";
import { requireSession } from "@/lib/admin/auth";
import { listRows } from "@/lib/admin/db";
import { deleteCategory, saveCategory } from "@/lib/admin/actions";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { matchesQuery, readFilter } from "@/lib/admin/filter";

export const metadata: Metadata = {
  title: "Danh mục",
  description: "Danh mục thuốc: thêm, sửa, xoá và thứ tự ô ở trang chủ.",
};

/**
 * Quản lý danh mục.
 *
 * Đọc bằng `listRows("categories")` chứ không import thẳng mảng mẫu — mảng mẫu
 * đã được kho delta sửa tại chỗ, và đọc thẳng thì bỏ qua phần thêm/xoá đã lưu.
 *
 * Đường dẫn không đổi được sau khi tạo: mọi mặt hàng trỏ vào nó bằng
 * `categorySlug`, đổi đường dẫn là cả danh mục rỗng ruột. Xem `saveCategory`.
 */
export default async function AdminCategoriesPage({
  searchParams,
}: PageProps<"/admin/danh-muc">) {
  const session = await requireSession();
  const canDelete = session.role === "duoc-si";
  const filter = readFilter(await searchParams, ["q", "rong"]);
  const rows = listRows("categories") as unknown as Category[];
  const products = listRows("products") as unknown as {
    categorySlug: string;
  }[];
  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);

  // Cùng một danh sách cho cả bảng và danh sách sửa bên dưới: hai chỗ hiện cùng
  // dữ liệu, lọc một chỗ mà chỗ kia vẫn đủ là người dùng tưởng bộ lọc hỏng.
  const visible = sorted.filter((category) => {
    if (!matchesQuery(filter.q, category.name, category.shortName, category.slug, category.description)) {
      return false;
    }
    const empty = products.every((product) => product.categorySlug !== category.slug);
    if (filter.rong === "co" && !empty) return false;
    if (filter.rong === "khong" && empty) return false;
    return true;
  });

  const countOf = (slug: string) =>
    products.filter((product) => product.categorySlug === slug).length;
  const emptyCount = rows.filter((row) => countOf(row.slug) === 0).length;

  return (
    <AdminShell activeHref="/admin/danh-muc">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-headline-xl text-ink">Danh mục</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Cách phân loại hàng hoá theo bệnh và nhóm sản phẩm. Tám danh mục có thứ
            tự nhỏ nhất hiện ở lưới trang chủ; tất cả đều có trang riêng.
          </p>
        </header>

        <section aria-label="Chỉ số danh mục" className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Danh mục" value={`${rows.length} danh mục`} />
          <StatCard
            label="Đang hiện ở trang chủ"
            value={`${Math.min(8, rows.length)} ô`}
            hint="Tám danh mục có thứ tự nhỏ nhất"
          />
          <StatCard
            label="Danh mục rỗng"
            value={`${emptyCount} danh mục`}
            hint="Không có mặt hàng nào đang trỏ vào"
            danger={emptyCount > 0}
          />
        </section>

        <AdminFilterBar
          action="/admin/danh-muc"
          query={filter.q}
          placeholder="Tên danh mục hoặc đường dẫn"
          selects={[
            {
              name: "rong",
              label: "Mặt hàng",
              value: filter.rong,
              options: [
                { value: "co", label: "Danh mục rỗng" },
                { value: "khong", label: "Có mặt hàng" },
              ],
            },
          ]}
        />

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading
              title={
                visible.length === sorted.length
                  ? "Danh sách danh mục"
                  : `${visible.length} / ${sorted.length} danh mục khớp bộ lọc`
              }
            />
          </div>
          {visible.length === 0 ? (
            <p className="border-t border-hairline px-4 py-4 text-body-md text-ink-muted md:px-5">
              Không có danh mục nào khớp bộ lọc đang chọn.
            </p>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-t border-hairline text-left">
              <thead className="bg-recessed">
                <tr>
                  <Th>Thứ tự</Th>
                  <Th>Danh mục</Th>
                  <Th>Sản phẩm</Th>
                  <Th>Gợi ý AI</Th>
                  <Th>Xử lý</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((category) => {
                  const Icon = categoryIcons[category.icon];
                  const count = countOf(category.slug);
                  return (
                    <tr
                      key={category.slug}
                      id={`dm-${category.slug}`}
                      className="scroll-mt-24 border-t border-divider align-top"
                    >
                      <td className="px-4 py-3 tabular-nums text-body-sm text-ink-muted">
                        {category.sortOrder}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-chip bg-trust-wash text-trust-text">
                            <Icon size={16} aria-hidden />
                          </span>
                          <span className="min-w-0">
                            <Link
                              href={`/danh-muc/${category.slug}`}
                              className="focus-ring rounded-chip text-body-md text-ink hover:text-trust-text"
                            >
                              {category.name}
                            </Link>
                            <span className="mt-0.5 block text-body-sm text-ink-subtle">
                              /{category.slug}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-body-sm text-ink-muted">
                        {count}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-ink-muted">
                        {category.aiHint ? "Có" : <span className="text-ink-subtle">Không</span>}
                      </td>
                      <td className="px-4 py-3">
                        {canDelete ? (
                          <AdminButtonForm
                            action={deleteCategory}
                            hidden={{ slug: category.slug }}
                            submit="Xoá"
                            confirm={
                              count > 0
                                ? undefined
                                : `Xoá danh mục "${category.name}"? Đường dẫn /${category.slug} sẽ thành trang lỗi.`
                            }
                          />
                        ) : (
                          <span className="text-body-sm text-ink-subtle">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading title="Sửa danh mục" />
            <p className="mt-1.5 max-w-2xl text-body-sm text-ink-muted">
              Mở danh mục cần sửa. Đường dẫn không đổi được — mọi mặt hàng đang trỏ
              vào đó bằng đường dẫn này.
            </p>
          </div>
          <ul className="border-t border-hairline">
            {visible.map((category) => (
              <li key={category.slug} className="border-b border-divider last:border-b-0">
                <details>
                  <summary className="focus-ring flex cursor-pointer items-center justify-between gap-2 px-4 py-3 hover:bg-recessed md:px-5">
                    <span className="min-w-0 text-body-md text-ink">{category.name}</span>
                    <span className="shrink-0 text-label-sm text-trust-text">Sửa</span>
                  </summary>
                  <div className="border-t border-hairline bg-recessed/40 px-4 py-4 md:px-5">
                    <CategoryForm category={category} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <details>
            <summary className="focus-ring flex cursor-pointer items-center justify-between gap-2 p-4 hover:bg-recessed md:p-5">
              <span>
                <span className="block text-headline-md text-ink">Thêm danh mục</span>
                <span className="mt-0.5 block text-body-sm text-ink-muted">
                  Danh mục mới có trang riêng ngay; lên lưới trang chủ khi thứ tự đủ nhỏ.
                </span>
              </span>
              <span className="shrink-0 text-label-sm text-trust-text">Mở</span>
            </summary>
            <div className="border-t border-hairline px-4 py-4 md:px-5">
              <CategoryForm />
            </div>
          </details>
        </Card>
      </div>
    </AdminShell>
  );
}

/**
 * Một form cho cả sửa lẫn thêm: chỉ khác ở giá trị mặc định. Hai form riêng thì
 * thêm một ô mới phải nhớ sửa cả hai chỗ, và chỗ hay bị quên là form sửa.
 */
function CategoryForm({ category }: { category?: Category }) {
  const id = category?.slug ?? "new";

  return (
    <AdminForm
      action={saveCategory}
      submit={category ? "Lưu danh mục" : "Thêm danh mục"}
      footer={
        category ? (
          <span className="text-body-sm text-ink-subtle">
            Đường dẫn giữ nguyên: /{category.slug}
          </span>
        ) : undefined
      }
    >
      <Field
        label="Đường dẫn"
        id={`slug-${id}`}
        required={!category}
        hint={
          category
            ? "Không đổi được."
            : "Chữ thường, số, gạch ngang. Ví dụ: ho-hap."
        }
      >
        <Input
          id={`slug-${id}`}
          name="slug"
          required={!category}
          readOnly={Boolean(category)}
          defaultValue={category?.slug}
          className={category ? "bg-recessed" : undefined}
          placeholder="ho-hap"
        />
      </Field>

      <Field
        label="Thứ tự"
        id={`sort-${id}`}
        hint="Số nhỏ đứng trước. Tám danh mục nhỏ nhất hiện ở trang chủ."
      >
        <Input
          id={`sort-${id}`}
          name="sortOrder"
          type="number"
          step={1}
          defaultValue={category?.sortOrder ?? 99}
        />
      </Field>

      <Field label="Tên đầy đủ" id={`name-${id}`} required>
        <Input id={`name-${id}`} name="name" required defaultValue={category?.name} />
      </Field>

      <Field
        label="Tên ngắn"
        id={`short-${id}`}
        required
        hint="Hiện trong ô 48px ở lưới trang chủ. Giữ dưới 20 ký tự."
      >
        <Input
          id={`short-${id}`}
          name="shortName"
          required
          maxLength={20}
          defaultValue={category?.shortName}
        />
      </Field>

      <Field label="Icon" id={`icon-${id}`} hint="Icon hiện ở lưới trang chủ và bảng này.">
        <Select id={`icon-${id}`} name="icon" defaultValue={category?.icon ?? "pill"}>
          {categoryIconKeys.map((key) => (
            <option key={key} value={key}>
              {categoryIconLabels[key]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Mô tả" id={`desc-${id}`} className="md:col-span-2" hint="Hiện dưới tiêu đề trang danh mục.">
        <Textarea
          id={`desc-${id}`}
          name="description"
          rows={2}
          defaultValue={category?.description}
        />
      </Field>

      {/*
        Ba ô gợi ý AI đứng riêng một nhóm: đây là khối màu tím duy nhất trên
        trang danh mục, và nó chỉ có tác dụng khi có câu chữ chuyên môn thật.
      */}
      <Field
        label="Gợi ý AI"
        id={`hint-${id}`}
        className="md:col-span-2"
        hint="Để trống nếu danh mục không có lời khuyên chuyên môn nào đáng nói — khối AI sẽ tự ẩn."
      >
        <Textarea
          id={`hint-${id}`}
          name="hintMessage"
          rows={2}
          defaultValue={category?.aiHint?.message}
        />
      </Field>

      <Field label="Nhãn nút gợi ý" id={`hint-label-${id}`} hint="Bỏ trống thì gợi ý chỉ có câu chữ, không có nút.">
        <Input
          id={`hint-label-${id}`}
          name="hintLabel"
          defaultValue={category?.aiHint?.action?.label}
        />
      </Field>

      <Field label="Địa chỉ nút gợi ý" id={`hint-href-${id}`} hint="Dạng /danh-muc/ten-danh-muc hoặc /ai/ten-tinh-nang.">
        <Input
          id={`hint-href-${id}`}
          name="hintHref"
          defaultValue={category?.aiHint?.action?.href}
          placeholder="/danh-muc/ho-hen-suyen"
        />
      </Field>
    </AdminForm>
  );
}
