import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard } from "@/components/admin/StatCard";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AdminButtonForm, AdminForm } from "@/components/admin/AdminForm";
import { Field, Input } from "@/components/ui/Field";
import { formatVnd } from "@/lib/format";
import { coupons } from "@/lib/data/coupons";
import { deleteCoupon, saveCoupon } from "@/lib/admin/actions";
import { Percent } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Mã ưu đãi",
  description: "Danh sách mã giảm giá và mẫu thêm mã mới.",
};

/**
 * Mã ưu đãi.
 *
 * Điều kiện áp dụng là SỐ (`minSubtotal`) chứ không phải câu chữ trong mô tả — bản
 * mẫu gốc đã ghi vậy và đó là lý do ô "đơn tối thiểu" ở đây là ô số riêng, không
 * phải chỗ để viết lại câu mô tả. Mã chỉ có câu chữ thì vẫn áp được cho đơn chưa
 * đủ điều kiện, và người dùng chỉ phát hiện ở bước thanh toán.
 *
 * Một mã sửa được tại chỗ: điền đúng mã đang có vào ô "Mã" rồi lưu, không cần xoá
 * rồi tạo lại — xoá rồi tạo lại thì mã biến mất khỏi giỏ hàng của người đang mua.
 */

const kindLabel = { amount: "Giảm tiền", freeship: "Miễn phí giao hàng" } as const;

export default function AdminCouponsPage() {
  const amountCoupons = coupons.filter((coupon) => coupon.kind === "amount");
  const biggest = amountCoupons.reduce(
    (max, coupon) => (coupon.amount > max ? coupon.amount : max),
    0,
  );

  return (
    <AdminShell activeHref="/admin/uu-dai">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-headline-xl text-ink">Mã ưu đãi</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Mã dùng được ngay ở trang giỏ hàng và trang thanh toán sau khi lưu. Điều kiện đơn
            tối thiểu là con số dùng để tính, không phải câu chữ trong mô tả.
          </p>
        </header>

        <section aria-label="Chỉ số ưu đãi" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Mã đang chạy" value={`${coupons.length} mã`} />
          <StatCard
            label="Mã giảm tiền"
            value={`${amountCoupons.length} mã`}
            hint="Phần còn lại là miễn phí giao hàng"
          />
          <StatCard
            label="Mức giảm cao nhất"
            value={biggest > 0 ? formatVnd(biggest) : "—"}
            hint="Trên mỗi đơn đủ điều kiện"
          />
        </section>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading
              title="Sửa mã đang có"
              action={
                <span className="flex items-center gap-1.5 text-body-sm text-ink-subtle">
                  <Percent size={15} aria-hidden />
                  {coupons.length} mã
                </span>
              }
            />
          </div>
          <ul className="border-t border-hairline">
            {coupons.map((coupon) => (
              <li key={coupon.code} className="border-b border-divider last:border-b-0">
                <details>
                  <summary className="focus-ring flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-recessed md:px-5">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium tabular-nums text-body-md text-ink">
                          {coupon.code}
                        </span>
                        <Badge tone={coupon.kind === "freeship" ? "neutral" : "promo"}>
                          {kindLabel[coupon.kind]}
                        </Badge>
                      </span>
                      <span className="mt-0.5 block text-body-sm text-ink-subtle">
                        {coupon.description}
                      </span>
                    </span>
                    <span className="text-label-sm text-trust-text">Sửa</span>
                  </summary>

                  <div className="border-t border-hairline bg-recessed/40 px-4 py-4 md:px-5">
                    <AdminForm
                      action={saveCoupon}
                      submit="Lưu mã"
                      footer={
                        <span className="text-body-sm text-ink-subtle">
                          Số tiền giảm phải nhỏ hơn đơn tối thiểu.
                        </span>
                      }
                    >
                      <Field label="Mã" id={`code-${coupon.code}`} required hint="Chữ in, số, gạch ngang.">
                        <Input
                          id={`code-${coupon.code}`}
                          name="code"
                          required
                          defaultValue={coupon.code}
                        />
                      </Field>

                      <Field label="Loại" id={`kind-${coupon.code}`} required>
                        <Input
                          id={`kind-${coupon.code}`}
                          name="kind"
                          readOnly
                          defaultValue={coupon.kind}
                          className="bg-recessed"
                        />
                      </Field>

                      {coupon.kind === "amount" ? (
                        <Field label="Số tiền giảm (₫)" id={`amount-${coupon.code}`} required>
                          <Input
                            id={`amount-${coupon.code}`}
                            name="amount"
                            type="number"
                            min={0}
                            step={1000}
                            required
                            defaultValue={coupon.amount}
                          />
                        </Field>
                      ) : null}

                      <Field label="Đơn tối thiểu (₫)" id={`min-${coupon.code}`} required>
                        <Input
                          id={`min-${coupon.code}`}
                          name="minSubtotal"
                          type="number"
                          min={0}
                          step={1000}
                          required
                          defaultValue={coupon.minSubtotal}
                        />
                      </Field>

                      <Field
                        label="Mô tả"
                        id={`desc-${coupon.code}`}
                        required
                        className="md:col-span-2"
                        hint="Khách đọc câu này ở ô nhập mã — nói rõ mức giảm và điều kiện."
                      >
                        <Input
                          id={`desc-${coupon.code}`}
                          name="description"
                          required
                          defaultValue={coupon.description}
                        />
                      </Field>
                    </AdminForm>

                    <div className="mt-4 border-t border-hairline pt-4">
                      <AdminButtonForm
                        action={deleteCoupon}
                        hidden={{ code: coupon.code }}
                        submit="Xoá mã"
                        confirm={`Xoá mã ${coupon.code}? Khách đang nhập mã này sẽ không dùng được nữa.`}
                      />
                    </div>
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
                <span className="block text-headline-md text-ink">Thêm mã mới</span>
                <span className="mt-0.5 block text-body-sm text-ink-muted">
                  Điền đúng mã đang có ở đây cũng thành sửa mã đó, không tạo bản trùng.
                </span>
              </span>
              <span className="shrink-0 text-label-sm text-trust-text">Mở</span>
            </summary>
            <div className="border-t border-hairline px-4 py-4 md:px-5">
              <AdminForm action={saveCoupon} submit="Thêm mã">
                <Field label="Mã" id="new-code" required hint="Ví dụ: GIAM100K">
                  <Input id="new-code" name="code" required placeholder="GIAM100K" />
                </Field>
                <Field
                  label="Loại"
                  id="new-kind"
                  required
                  hint='Gõ "amount" để giảm tiền, "freeship" để miễn phí giao hàng.'
                >
                  <Input id="new-kind" name="kind" required defaultValue="amount" />
                </Field>
                <Field label="Số tiền giảm (₫)" id="new-amount" hint="Bỏ trống nếu là freeship.">
                  <Input id="new-amount" name="amount" type="number" min={0} step={1000} />
                </Field>
                <Field label="Đơn tối thiểu (₫)" id="new-min" required>
                  <Input id="new-min" name="minSubtotal" type="number" min={0} step={1000} required />
                </Field>
                <Field label="Mô tả" id="new-desc" required className="md:col-span-2">
                  <Input
                    id="new-desc"
                    name="description"
                    required
                    placeholder="Giảm 100.000 ₫ cho đơn từ 500.000 ₫"
                  />
                </Field>
              </AdminForm>
            </div>
          </details>
        </Card>
      </div>
    </AdminShell>
  );
}
