import { BadgeCheck, ArrowRight, MapPin, Sparkles, Upload } from "@/lib/icons";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { site } from "@/lib/data/site";

/**
 * Hero: cột trái là lời hứa dịch vụ, cột phải là 2 lối vào nhanh —
 * một dẫn sang AI tư vấn (tím), một dẫn sang tải đơn thuốc (teal).
 */
export function HeroSection() {
  return (
    <section className="border-b border-hairline bg-card">
      <div className="container-medivia grid gap-8 py-8 md:py-12 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-chip bg-trust-wash px-3 py-1 text-label-sm text-trust-text">
            <BadgeCheck size={15} aria-hidden />
            Nhà thuốc đạt chuẩn GPP Bộ Y Tế
          </span>

          <h1 className="mt-4 text-headline-xl text-ink">{site.tagline}</h1>

          <p className="mt-3 max-w-xl text-body-lg text-ink-muted">
            Giao trong 2 giờ tại nội thành, đổi trả trong 30 ngày. Mỗi đơn thuốc
            đều có dược sĩ đại học kiểm tra trước khi giao.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/danh-muc/thuoc" size="lg">
              Mua thuốc ngay
            </ButtonLink>
            <ButtonLink href="/he-thong-nha-thuoc" variant="outline-trust" size="lg">
              <MapPin size={18} aria-hidden />
              Tìm nhà thuốc gần bạn
            </ButtonLink>
          </div>
        </div>

        <div className="grid gap-4">
          {/* Lối vào AI — tím vì dẫn tới nội dung do AI tạo. */}
          <Card className="border-ai/25 bg-ai-wash p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-chip bg-ai px-2.5 py-1 text-label-sm text-white">
                <Sparkles size={14} aria-hidden />
                AI gợi ý
              </span>
              <span className="text-body-sm text-ai-text">Sàng lọc an toàn</span>
            </div>

            <p className="mt-3 text-body-md font-medium text-ink">
              Mô tả triệu chứng, AI gợi ý nhóm thuốc phù hợp
            </p>

            <p className="mt-2 rounded-card bg-card/70 px-3 py-2 text-body-sm text-ink-muted italic">
              “Tôi bị ho khan 3 ngày, hơi rát cổ”
            </p>

            <ButtonLink
              href="/ai/tu-van"
              variant="solid-ai"
              fullWidth
              className="mt-4"
            >
              Bắt đầu tư vấn
              <ArrowRight size={18} aria-hidden />
            </ButtonLink>
          </Card>

          {/* Lối vào đơn thuốc — teal vì là nghiệp vụ dược, không phải AI. */}
          <Card className="p-4">
            <p className="text-body-md font-medium text-ink">
              Kê đơn an toàn — dược sĩ soạn hàng
            </p>
            <p className="mt-2 text-body-sm text-ink-muted">
              Chụp ảnh toa bác sĩ, nhận báo giá chuẩn hoạt chất sau 5 phút.
            </p>
            <ButtonLink
              href="/tai-don-thuoc"
              variant="outline-trust"
              fullWidth
              className="mt-4"
            >
              <Upload size={18} aria-hidden />
              Tải đơn thuốc
            </ButtonLink>
          </Card>
        </div>
      </div>
    </section>
  );
}
