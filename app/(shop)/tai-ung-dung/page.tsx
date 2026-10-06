import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/ContentPage";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/lib/data/site";
import { BellRing, Camera, Phone, QrCode, ScanSearch, Truck } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Tải ứng dụng MediVia",
  description:
    "Ứng dụng điện thoại đang trong giai đoạn thiết kế — chưa có bản cài đặt để tải.",
};

const features = [
  {
    icon: ScanSearch,
    title: "Tra thuốc bằng câu nói",
    body: "Mô tả triệu chứng bằng tiếng Việt tự nhiên, AI tách thành điều kiện rồi lọc danh mục.",
  },
  {
    icon: Camera,
    title: "Chụp vỉ thuốc để nhận diện",
    body: "Đưa camera vào vỉ thuốc, ứng dụng trả về các ứng viên kèm độ tin cậy — không dùng để tự uống.",
  },
  {
    icon: Truck,
    title: "Theo dõi đơn theo thời gian thực",
    body: "Đơn đang ở bước nào, dược sĩ đã gọi chưa, shipper còn bao xa.",
  },
  {
    icon: QrCode,
    title: "Thẻ thuốc của tôi",
    body: "Lưu lại thuốc đang dùng để lần sau kiểm tra tương tác nhanh hơn.",
  },
  {
    icon: BellRing,
    title: "Nhắc uống thuốc",
    body: "Nhắc theo giờ và theo số ngày bác sĩ chỉ định — hết liệu trình mới ngưng.",
  },
];

/**
 * Tải ứng dụng.
 *
 * KHÔNG có nút "Tải trên App Store" / "Google Play". Ứng dụng chưa tồn tại, và
 * một nút dẫn tới cửa hàng ứng dụng không có gì là nút chết — người dùng bấm, thấy
 * lỗi, rồi mất tin vào cả những nút còn lại trên site.
 *
 * Trang vẫn có lý do tồn tại: mục "Tải ứng dụng" nằm trên thanh tiện ích ở mọi
 * trang, nên nó phải dẫn tới một chỗ nói rõ tình trạng thật. Bỏ mục đó khỏi thanh
 * tiện ích là phương án khác, nhưng rồi sẽ có người thêm lại.
 */
export default function MobileAppPage() {
  return (
    <ContentPage
      title="Tải ứng dụng MediVia"
      lead="Ứng dụng điện thoại đang trong giai đoạn thiết kế. Chưa có bản cài đặt, nên trang này chưa có nút tải."
    >
      <Card className="border-danger/30 bg-danger-wash p-4 md:p-5">
        <h2 className="text-headline-md text-ink">Chưa có bản cài đặt</h2>
        <p className="mt-2 text-body-md text-ink-muted">
          MediVia hiện chỉ chạy trên trình duyệt và đã dùng tốt trên điện thoại. Không
          có ứng dụng nào trên App Store hay Google Play mang tên MediVia — nếu bạn thấy
          một ứng dụng như vậy, đó không phải của chúng tôi.
        </p>
        <ButtonLink href="/" size="sm" className="mt-3">
          Mở bản web trên điện thoại
        </ButtonLink>
      </Card>

      <Card className="p-4 md:p-5">
        <h2 className="text-headline-md text-ink">Dự kiến có gì</h2>
        <p className="mt-1.5 text-body-sm text-ink-muted">
          Danh sách này là dự kiến, không phải tính năng đã chạy.
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {features.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-card bg-recessed text-trust-text">
                <Icon size={18} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-label-md text-ink">{title}</p>
                <p className="mt-0.5 text-body-sm text-ink-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4 md:p-5">
        <h2 className="text-headline-md text-ink">Trong lúc chờ</h2>
        <ul className="mt-2.5 flex flex-col gap-2 text-body-md text-ink-muted">
          <li>
            <Link
              href="/tra-cuu-don-hang"
              className="focus-ring rounded-chip text-trust-text underline decoration-trust/30 underline-offset-2"
            >
              Tra cứu đơn hàng
            </Link>{" "}
            — bằng mã đơn, không cần tài khoản.
          </li>
          <li>
            <Link
              href="/ai/giong-noi"
              className="focus-ring rounded-chip text-trust-text underline decoration-trust/30 underline-offset-2"
            >
              Tìm thuốc bằng giọng nói
            </Link>{" "}
            — dùng micro của điện thoại ngay trên trình duyệt.
          </li>
          <li className="flex items-start gap-2">
            <Phone size={16} className="mt-1 shrink-0 text-trust-text" aria-hidden />
            <span>
              Hotline{" "}
              <span className="tabular-nums text-ink">{site.hotline}</span> — dược sĩ
              trực trong giờ mở cửa.
            </span>
          </li>
        </ul>
      </Card>
    </ContentPage>
  );
}