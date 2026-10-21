import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  MessageCircle,
  Receipt,
  Sparkles,
  Upload,
} from "@/lib/icons";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Hero: cột trái là lời hứa dịch vụ trên nền mint, cột phải là 2 lối vào
 * nhanh — một dẫn sang AI tư vấn (tím), một dẫn sang tải đơn thuốc (teal).
 *
 * Ảnh dược sĩ đặt absolute ở 42% bên phải: ảnh được cắt từ mép trái nên mặt
 * dược sĩ luôn nằm trong khung dù khối cao thấp ra sao, không phải canh giữa
 * một ảnh có tỉ lệ cố định.
 */
export function HeroSection() {
  return (
    <section className="container-medivia grid grid-cols-12 gap-6 pt-6">
      <div className="relative col-span-12 flex flex-col justify-between overflow-hidden rounded-card border border-trust/20 bg-trust-wash p-6 md:p-8 lg:col-span-8">
        <div className="relative z-10 max-w-[360px]">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-chip bg-trust/10 px-3 py-1 text-label-sm font-medium text-trust-text">
            <BadgeCheck size={16} aria-hidden />
            Nhà thuốc đạt chuẩn GPP Bộ Y Tế
          </span>

          <h1 className="mb-3 text-headline-xl leading-tight text-navy">
            Nhà thuốc có dược sĩ và AI đồng hành
          </h1>

          <p className="mb-6 text-body-md text-ink-muted">
            Giao trong 2 giờ tại nội thành, đổi trả trong 30 ngày.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/danh-muc/thuoc">Mua thuốc ngay</ButtonLink>
            <ButtonLink href="/he-thong-nha-thuoc" variant="outline-trust">
              <MapPin size={18} aria-hidden />
              Tìm nhà thuốc gần bạn
            </ButtonLink>
          </div>
        </div>

        {/*
          `object-[65%_center]`: ảnh gốc 3:2 nằm ngang, khung ở đây gần vuông
          nên `object-cover` phải cắt hai bên. Dược sĩ đứng ở khoảng 60–75%
          chiều ngang tấm ảnh — canh về 72% giữ được cả mặt cô ấy lẫn máy tính
          bảng bên trái, là thứ duy nhất trong ảnh nói về phần mềm.

          Bắt đầu từ `md` chứ không phải `sm`: ở 640px cột chữ chỉ còn ~300px,
          tiêu đề 3 dòng thành 5 dòng và ảnh đè lên nút.

          Ảnh giữ nguyên khung chữ nhật, chỉ MÉP TRÁI tan dần vào nền mint —
          chỗ đó là nơi cột chữ chạm vào ảnh, còn mép phải và hai mép trên dưới
          vẫn là cạnh thật. Đừng dùng mask radial: nó khoét thành hình bầu dục
          và mất luôn bốn cạnh.
        */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] items-end justify-end md:flex">
          <Image
            src="/hero-duoc-si.webp"
            alt="Dược sĩ MediVia tư vấn trong nhà thuốc"
            width={600}
            height={400}
            priority
            sizes="(max-width: 1024px) 40vw, 480px"
            className="h-full w-full object-cover object-[65%_center] [mask-image:linear-gradient(to_right,transparent_0%,black_45%)]"
          />
        </div>
      </div>

      <div className="col-span-12 flex flex-col gap-4 lg:col-span-4">
        {/* Lối vào AI — tím vì dẫn tới nội dung do AI tạo. */}
        <div className="flex flex-1 flex-col justify-between rounded-card border border-ai/20 bg-gradient-to-br from-ai-wash to-card p-5 shadow-sm">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-chip bg-ai-wash px-2.5 py-0.5 text-label-sm font-semibold text-ai-text">
                <Sparkles size={15} aria-hidden />
                AI gợi ý
              </span>
              <span className="text-[11px] text-ink-subtle">Sàng lọc an toàn</span>
            </div>

            <p className="mb-3 text-[15px] font-semibold text-navy">
              Mô tả triệu chứng, AI gợi ý nhóm thuốc phù hợp
            </p>

            <p className="mb-3 flex items-center gap-2 rounded-lg border border-hairline bg-card px-2.5 py-2 text-body-sm text-ink-muted italic">
              <MessageCircle size={18} aria-hidden className="shrink-0 text-ai-text" />
              <span className="truncate">“Tôi bị ho khan 3 ngày, hơi rát cổ”</span>
            </p>
          </div>

          <ButtonLink href="/ai/tu-van" variant="solid-ai" fullWidth>
            Bắt đầu tư vấn
            <ArrowRight size={18} aria-hidden />
          </ButtonLink>
        </div>

        {/* Lối vào đơn thuốc — teal vì là nghiệp vụ dược, không phải AI. */}
        <div className="flex flex-1 flex-col justify-between rounded-card border border-hairline bg-card p-5 shadow-sm">
          <div>
            <p className="mb-2 flex items-center gap-2 text-label-sm font-medium text-trust-text">
              <Receipt size={18} aria-hidden />
              Kê đơn an toàn
            </p>
            <p className="mb-2 text-[15px] font-semibold text-navy">
              Tải đơn thuốc, dược sĩ soạn hàng
            </p>
            <p className="mb-3 text-[13px] text-ink-muted">
              Chụp ảnh toa bác sĩ, nhận báo giá chuẩn hoạt chất sau 5 phút.
            </p>
          </div>

          <ButtonLink href="/tai-don-thuoc" variant="outline-trust" fullWidth>
            <Upload size={18} aria-hidden />
            Tải đơn thuốc
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
