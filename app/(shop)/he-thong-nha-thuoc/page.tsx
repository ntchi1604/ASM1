import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/ContentPage";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { pharmacies } from "@/lib/data/pharmacies";
import { site } from "@/lib/data/site";
import { Clock, MapPin, Phone } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Hệ thống nhà thuốc",
  description: `Sáu nhà thuốc MediVia có địa chỉ, giờ mở cửa và số điện thoại cụ thể, trong hệ thống ${site.pharmacyCount.toLocaleString("vi-VN")} nhà thuốc.`,
};

/**
 * Hệ thống nhà thuốc.
 *
 * `site.pharmacyCount` là 1.247, nhưng trang này chỉ liệt kê sáu nhà thuốc có
 * thật trong dữ liệu mẫu — và nói thẳng ra là chỉ có sáu. Sinh ra 1.247 dòng địa
 * chỉ giả thì trang trông đầy đặn hơn, nhưng người đọc thử một địa chỉ là biết
 * ngay cả trang là bịa, kéo theo cả những chỗ khác cũng đáng ngờ.
 */
export default function PharmacySystemPage() {
  return (
    <ContentPage
      title="Hệ thống nhà thuốc"
      lead={`MediVia vận hành cùng ${site.pharmacyCount.toLocaleString("vi-VN")} nhà thuốc trên toàn quốc. Danh sách dưới đây là sáu nhà thuốc mẫu có địa chỉ và giờ mở cửa cụ thể — bản mẫu chỉ dựng sáu.`}
    >
      <Card className="p-4 md:p-5">
        <p className="text-body-md text-ink-muted">
          Đặt hàng trực tuyến rồi nhận tại quầy, hoặc gọi trước để dược sĩ giữ thuốc.
          Nhà thuốc Quận 7 có ca đêm.
        </p>
        <p className="mt-2 text-body-sm text-ink-subtle">
          Hotline toàn hệ thống:{" "}
          <span className="tabular-nums text-ink">{site.hotline}</span> · Người chịu
          trách nhiệm chuyên môn: {site.professionalManager} · Giấy phép{" "}
          {site.licenseNumber}
        </p>
      </Card>

      <ul className="flex flex-col gap-3">
        {pharmacies.map((pharmacy) => (
          <Card as="li" key={pharmacy.name} className="p-4 md:p-5">
            <h2 className="text-headline-md text-ink">{pharmacy.name}</h2>

            <dl className="mt-2.5 flex flex-col gap-1.5 text-body-md text-ink-muted">
              <div className="flex items-start gap-2">
                <dt className="sr-only">Địa chỉ</dt>
                <MapPin size={16} className="mt-1 shrink-0 text-trust-text" aria-hidden />
                <dd>
                  {pharmacy.address} · {pharmacy.district}
                </dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="sr-only">Điện thoại</dt>
                <Phone size={16} className="mt-1 shrink-0 text-trust-text" aria-hidden />
                <dd className="tabular-nums">{pharmacy.phone}</dd>
              </div>
              <div className="flex items-start gap-2">
                <dt className="sr-only">Giờ mở cửa</dt>
                <Clock size={16} className="mt-1 shrink-0 text-trust-text" aria-hidden />
                <dd>{pharmacy.hours}</dd>
              </div>
            </dl>

            <ButtonLink
              href="/danh-muc/thuoc"
              variant="outline-trust"
              size="sm"
              className="mt-3"
            >
              Xem thuốc đang bán
            </ButtonLink>
          </Card>
        ))}
      </ul>

      <p className="text-body-sm text-ink-subtle">
        Chưa có bản đồ và chưa có chức năng “tìm nhà thuốc gần tôi”: việc đó cần dữ
        liệu vị trí của người dùng, mà bản mẫu này không thu thập vị trí.
      </p>
    </ContentPage>
  );
}