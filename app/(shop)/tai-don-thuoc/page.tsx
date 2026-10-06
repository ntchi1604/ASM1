import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/ContentPage";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { products } from "@/lib/data/products";
import { prescriptionMaxBytes } from "@/lib/data/orders";
import { site } from "@/lib/data/site";
import { Clock, FileCheck, ShieldCheck, Upload } from "@/lib/icons";

export const metadata: Metadata = {
  title: "Tải đơn thuốc",
  description:
    "Gửi ảnh đơn của bác sĩ để dược sĩ đối chiếu và soạn thuốc kê đơn theo đúng chỉ định.",
};

/**
 * Tải đơn thuốc — lối vào cho khách ĐÃ CÓ đơn của bác sĩ, khác với ô tải ảnh ở
 * trang thanh toán (chỉ hiện khi giỏ đã có thuốc kê đơn).
 *
 * Trang này KHÔNG có ô tải tệp. Một ô tải hoạt động được nhưng không gửi tệp đi
 * đâu cả là ô tải nói dối: khách tưởng đã gửi đơn, dược sĩ không nhận được gì, và
 * đơn thuốc kê đơn nằm im. Chỗ tải thật nằm ở bước thanh toán, sau khi giỏ đã có
 * thuốc — nên trang này giải thích đường đi và mở đúng đường đó.
 */
export default function UploadPrescriptionPage() {
  const prescriptionProducts = products.filter((product) => product.prescriptionRequired);

  return (
    <ContentPage
      title="Tải đơn thuốc"
      lead="Có đơn của bác sĩ trong tay? Thêm thuốc vào giỏ, tới bước thanh toán MediVia sẽ hỏi ảnh đơn — dược sĩ đối chiếu rồi mới soạn hàng."
    >
      <Card className="border-danger/30 bg-danger-wash p-4 md:p-5">
        <h2 className="text-headline-md text-ink">Thuốc kê đơn không bán không đơn</h2>
        <p className="mt-2 text-body-md text-ink-muted">
          MediVia không có nút “thêm vào giỏ” cho thuốc kê đơn. Thuốc chỉ được soạn
          sau khi dược sĩ xem đơn của bác sĩ và gọi xác nhận với bạn.
        </p>
      </Card>

      <Card className="p-4 md:p-5">
        <h2 className="text-headline-md text-ink">Bốn bước</h2>
        <ol className="mt-3 flex flex-col gap-3 text-body-md text-ink-muted">
          {[
            "Chọn thuốc kê đơn cần mua trong danh mục MediVia.",
            "Tới bước thanh toán — ô tải ảnh đơn xuất hiện vì giỏ đã có thuốc kê đơn.",
            "Chụp hoặc chọn ảnh đơn: JPG, PNG hoặc PDF, dưới 10 MB.",
            "Dược sĩ gọi xác nhận trong khoảng 15 phút, rồi mới soạn và giao thuốc.",
          ].map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-chip bg-trust-wash text-label-sm text-trust-text">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <p className="mt-4 flex items-start gap-2 text-body-sm text-ink-muted">
          <Upload size={16} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
          <span>
            Hạn mức {(prescriptionMaxBytes / 1_048_576).toLocaleString("vi-VN", {
              maximumFractionDigits: 0,
            })}{" "}
            MB là hạn mức thật của hệ thống, không phải câu ước lệ — ảnh lớn hơn sẽ bị
            từ chối ngay lúc chọn tệp.
          </span>
        </p>
      </Card>

      <Card className="p-4 md:p-5">
        <h2 className="text-headline-md text-ink">Dữ liệu sức khoẻ của bạn</h2>
        <ul className="mt-2.5 flex flex-col gap-2 text-body-md text-ink-muted">
          <li className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-1 shrink-0 text-trust-text" aria-hidden />
            <span>
              Ảnh đơn nằm trong kho riêng, <strong className="font-medium text-ink">không
              có đường dẫn công khai</strong> — không ai mở được ảnh đơn của bạn bằng
              cách đoán link.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <FileCheck size={16} className="mt-1 shrink-0 text-trust-text" aria-hidden />
            <span>
              Chỉ dược sĩ duyệt đơn xem được, và mỗi lần mở đều có ghi nhật ký truy cập.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Clock size={16} className="mt-1 shrink-0 text-trust-text" aria-hidden />
            <span>
              Ảnh bị xoá sau khi đơn hoàn tất. Không có ảnh đơn thuốc nào được lưu vĩnh
              viễn.
            </span>
          </li>
        </ul>
        <Link
          href="/quy-dinh-thuoc-ke-don"
          className="focus-ring mt-4 inline-block rounded-chip text-label-md text-trust-text underline decoration-trust/30 underline-offset-2"
        >
          Đọc đầy đủ quy định bán thuốc kê đơn
        </Link>
      </Card>

      {prescriptionProducts.length > 0 ? (
        <Card className="p-4 md:p-5">
          <h2 className="text-headline-md text-ink">
            {prescriptionProducts.length} thuốc kê đơn đang bán
          </h2>
          <p className="mt-2 text-body-sm text-ink-muted">
            Cần đơn của bác sĩ cho từng loại dưới đây.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {prescriptionProducts.map((product) => (
              <li key={product.id}>
                <Link href={`/thuoc/${product.slug}`} className="focus-ring rounded-chip">
                  <Badge tone="prescription">{product.name}</Badge>
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href="/danh-muc/thuoc" className="mt-4" size="sm">
            Xem danh mục thuốc
          </ButtonLink>
        </Card>
      ) : null}

      <p className="text-body-sm text-ink-subtle">
        Chưa gửi được đơn trước khi chọn thuốc? Gọi{" "}
        <span className="tabular-nums text-ink">{site.hotline}</span> — dược sĩ tra giúp
        hoạt chất trong đơn rồi hướng dẫn chọn đúng thuốc.
      </p>
    </ContentPage>
  );
}