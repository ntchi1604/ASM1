import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatCard, Th } from "@/components/admin/StatCard";
import { Card, SectionHeading } from "@/components/ui/Card";
import { AdminButtonForm, AdminForm } from "@/components/admin/AdminForm";
import { Field, Input } from "@/components/ui/Field";
import { pharmacies } from "@/lib/data/pharmacies";
import { deletePharmacy, savePharmacy } from "@/lib/admin/actions";
import { AlertTriangle, Store } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Nhà thuốc",
  description: "Danh sách nhà thuốc trong hệ thống và nhà thuốc nhận hàng tại quầy.",
};

/**
 * Nhà thuốc.
 *
 * Đổi TÊN là đổi khoá của dòng — tên nhà thuốc là khoá trong dữ liệu. Hành động
 * `savePharmacy` xử lý việc đó bằng cách xoá dòng cũ rồi thêm dòng mới, và form
 * gửi kèm `originalName` để biết dòng nào đang sửa. Không có `originalName` thì
 * đổi tên sẽ tạo thêm một nhà thuốc và để lại nhà thuốc cũ.
 *
 * Nhà thuốc ĐẦU DANH SÁCH là nhà thuốc nhận hàng tại quầy ở trang thanh toán.
 * Cảnh báo đó in thẳng trên trang: xoá hoặc đổi nó là đổi địa chỉ khách đến lấy
 * hàng, và không có gì trên giao diện nói ra điều đó.
 */
export default function AdminPharmaciesPage() {
  const pickup = pharmacies[0];

  return (
    <AdminShell activeHref="/admin/nha-thuoc">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-headline-xl text-ink">Nhà thuốc</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            {pharmacies.length} nhà thuốc trong hệ thống. Danh sách này hiện ở trang Hệ thống nhà
            thuốc; nhà thuốc đầu danh sách còn là nơi khách tới lấy hàng khi chọn nhận tại quầy.
          </p>
        </header>

        <section aria-label="Chỉ số nhà thuốc" className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Nhà thuốc" value={`${pharmacies.length} nhà thuốc`} />
          <StatCard
            label="Có ca đêm"
            value={`${pharmacies.filter((item) => item.hours.includes("24")).length} nhà thuốc`}
            hint="Mở 24/24"
          />
          <StatCard
            label="Nhận hàng tại quầy"
            value={pickup?.name ?? "—"}
            hint="Nhà thuốc đầu danh sách"
            danger
          />
        </section>

        <Card className="flex flex-wrap items-start gap-3 border-promo/30 bg-promo-wash p-4 md:p-5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-promo-text" aria-hidden />
          <div className="min-w-0">
            <h2 className="text-headline-md text-ink">Nhà thuốc đầu danh sách là điểm nhận hàng</h2>
            <p className="mt-1.5 max-w-2xl text-body-sm text-ink-muted">
              Trang thanh toán lấy địa chỉ của nhà thuốc đầu danh sách làm điểm khách tới lấy hàng.
              Đổi tên hoặc địa chỉ của nhà thuốc đó là đổi chỉ đường khách nhận. Muốn chọn nhà thuốc
              khác thì đưa nó lên đầu danh sách.
            </p>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading
              title="Danh sách"
              action={
                <span className="flex items-center gap-1.5 text-body-sm text-ink-subtle">
                  <Store size={15} aria-hidden />
                  {pharmacies.length} nhà thuốc
                </span>
              }
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-t border-hairline text-left">
              <thead className="bg-recessed">
                <tr>
                  <Th>Nhà thuốc</Th>
                  <Th>Quận</Th>
                  <Th>Điện thoại</Th>
                  <Th>Giờ mở cửa</Th>
                  <Th>Xử lý</Th>
                </tr>
              </thead>
              <tbody>
                {pharmacies.map((pharmacy) => (
                  <tr key={pharmacy.name} className="border-t border-divider align-top">
                    <td className="px-4 py-3">
                      <span className="block text-body-md text-ink">{pharmacy.name}</span>
                      <span className="mt-0.5 block text-body-sm text-ink-subtle">
                        {pharmacy.address}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-ink-muted">{pharmacy.district}</td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums text-body-sm text-ink-muted">
                      {pharmacy.phone}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-body-sm text-ink-muted">
                      {pharmacy.hours}
                    </td>
                    <td className="px-4 py-3">
                      <AdminButtonForm
                        action={deletePharmacy}
                        hidden={{ name: pharmacy.name }}
                        submit="Xoá"
                        confirm={`Xoá "${pharmacy.name}" khỏi danh sách?`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-hairline px-4 py-3 text-body-sm text-ink-subtle">
            Trang Hệ thống nhà thuốc cũng ghi rõ đây là danh sách mẫu, còn{" "}
            <Link href="/he-thong-nha-thuoc" className="focus-ring rounded-chip text-trust-text hover:underline">
              con số toàn quốc
            </Link>{" "}
            là con số của nhà thuốc, không phải số dòng trong bảng này.
          </p>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading title="Sửa nhà thuốc" />
            <p className="mt-1.5 max-w-2xl text-body-sm text-ink-muted">
              Đổi tên nhà thuốc sẽ cập nhật đúng dòng đó, không tạo thêm dòng mới.
            </p>
          </div>
          <ul className="border-t border-hairline">
            {pharmacies.map((pharmacy) => (
              <li key={pharmacy.name} className="border-b border-divider last:border-b-0">
                <details>
                  <summary className="focus-ring flex cursor-pointer items-center justify-between gap-2 px-4 py-3 hover:bg-recessed md:px-5">
                    <span className="min-w-0 text-body-md text-ink">{pharmacy.name}</span>
                    <span className="shrink-0 text-label-sm text-trust-text">Sửa</span>
                  </summary>
                  <div className="border-t border-hairline bg-recessed/40 px-4 py-4 md:px-5">
                    <PharmacyForm pharmacy={pharmacy} />
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
                <span className="block text-headline-md text-ink">Thêm nhà thuốc</span>
                <span className="mt-0.5 block text-body-sm text-ink-muted">
                  Nhà thuốc mới nằm cuối danh sách.
                </span>
              </span>
              <span className="shrink-0 text-label-sm text-trust-text">Mở</span>
            </summary>
            <div className="border-t border-hairline px-4 py-4 md:px-5">
              <PharmacyForm />
            </div>
          </details>
        </Card>
      </div>
    </AdminShell>
  );
}

function PharmacyForm({
  pharmacy,
}: {
  pharmacy?: (typeof pharmacies)[number];
}) {
  const id = pharmacy ? pharmacy.name.replace(/\s+/g, "-").toLowerCase() : "new";

  return (
    <AdminForm
      action={savePharmacy}
      hidden={pharmacy ? { originalName: pharmacy.name } : undefined}
      submit={pharmacy ? "Lưu nhà thuốc" : "Thêm nhà thuốc"}
    >
      <Field label="Tên nhà thuốc" id={`name-${id}`} required>
        <Input id={`name-${id}`} name="name" required defaultValue={pharmacy?.name} />
      </Field>

      <Field label="Địa chỉ" id={`address-${id}`} required>
        <Input id={`address-${id}`} name="address" required defaultValue={pharmacy?.address} />
      </Field>

      <Field label="Quận / thành phố" id={`district-${id}`} required>
        <Input id={`district-${id}`} name="district" required defaultValue={pharmacy?.district} />
      </Field>

      <Field label="Điện thoại" id={`phone-${id}`} required>
        <Input id={`phone-${id}`} name="phone" required defaultValue={pharmacy?.phone} />
      </Field>

      <Field
        label="Giờ mở cửa"
        id={`hours-${id}`}
        required
        className="md:col-span-2"
        hint='Ghi thẳng câu hiện cho khách, ví dụ "07:00 – 22:00 hằng ngày" hoặc "24/24 — có ca đêm".'
      >
        <Input id={`hours-${id}`} name="hours" required defaultValue={pharmacy?.hours} />
      </Field>
    </AdminForm>
  );
}
