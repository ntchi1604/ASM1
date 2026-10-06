import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AiBlock } from "@/components/ai/AiBlock";
import { AiPageShell } from "@/components/ai/AiPageShell";
import { AiSkeleton } from "@/components/ai/AiSkeleton";
import { ConfidenceBadge } from "@/components/ai/ConfidenceBadge";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { ProductImage } from "@/components/product/ProductImage";
import { identifyFromPhoto, photoTips } from "@/lib/ai/identify";
import { aiMockNotice } from "@/lib/ai/engine";
import { getDefaultUnit } from "@/lib/data/products";
import { site } from "@/lib/data/site";
import { AlertTriangle, ArrowRight, Camera, Headset, Info, Upload } from "@/lib/icons";
import { identifyPhoto } from "./actions";

export const metadata: Metadata = {
  title: "Nhận diện thuốc bằng ảnh",
  description:
    "Chụp vỉ thuốc để AI của MediVia đọc chữ trên vỉ và đưa ra các thuốc có thể khớp, kèm độ tin cậy của từng ứng viên.",
};

/** Ảnh mẫu để xem được tính năng mà không cần chụp. Tên tệp chọn kịch bản. */
const samples = [
  { file: "vi-thuoc-ro.jpg", label: "Vỉ thuốc chụp rõ" },
  { file: "vien-sui-effer.jpg", label: "Tuýp viên sủi" },
  { file: "siro-prospan.jpg", label: "Chai siro" },
  { file: "anh-mo-thieu-sang.jpg", label: "Ảnh mờ, thiếu sáng" },
];

/**
 * Tính năng 5 — Nhận diện thuốc bằng ảnh (⭐⭐⭐⭐).
 *
 * Là luồng sinh ra cho điện thoại: người dùng đang cầm vỉ thuốc và cái máy ảnh ở
 * cùng một tay. Trên desktop trang co lại thành một khung hẹp giữa màn hình thay
 * vì kéo giãn ra 1280px — một khung tải ảnh rộng cả màn hình không giúp gì cả.
 * Vẫn là MỘT route, không tách trang mobile riêng: hai route thì sẽ có ngày lệch
 * nội dung.
 */
export default async function IdentifyPage({
  searchParams,
}: PageProps<"/ai/nhan-dien">) {
  const { anh } = await searchParams;
  const fileName = (Array.isArray(anh) ? anh[0] : anh)?.trim() ?? "";

  return (
    <AiPageShell
      icon={Camera}
      title="Nhận diện thuốc bằng ảnh"
      lead="Chụp mặt có chữ của vỉ thuốc. AI đọc chữ trên ảnh và đưa ra các thuốc có thể khớp — luôn kèm độ tin cậy, và luôn nhiều hơn một ứng viên."
      current="/ai/nhan-dien"
    >
      {/* Khung hẹp: luồng này thiết kế cho điện thoại, desktop chỉ căn giữa lại. */}
      <div className="mx-auto w-full max-w-[420px] lg:max-w-[440px]">
        <Card className="p-4 md:p-5">
          <form action={identifyPhoto} className="flex flex-col gap-3">
            <label htmlFor="anh" className="text-label-md text-ink">
              Ảnh vỉ hoặc hộp thuốc
            </label>
            {/*
              capture="environment" mở thẳng camera sau trên điện thoại thay vì
              mở thư viện ảnh — người dùng đang cầm vỉ thuốc, họ cần chụp chứ
              không cần chọn.
            */}
            <input
              id="anh"
              name="anh"
              type="file"
              accept="image/*"
              capture="environment"
              required
              className="focus-ring w-full rounded-card border border-dashed border-hairline bg-recessed p-3 text-body-sm text-ink-muted file:mr-3 file:rounded-chip file:border-0 file:bg-ai file:px-3 file:py-1.5 file:text-label-sm file:text-white"
            />
            <Button type="submit" variant="solid-ai" size="lg" fullWidth>
              <Upload size={18} aria-hidden />
              Nhận diện thuốc
            </Button>
            <p className="text-body-sm text-ink-subtle">
              MediVia không lưu ảnh của bạn. Ảnh chỉ dùng để nhận diện trong lần
              này.
            </p>
          </form>

          <div className="mt-4 border-t border-divider pt-4">
            <h2 className="text-label-md text-ink">Chụp thế nào để AI đọc được</h2>
            <ul className="mt-2 flex flex-col gap-1.5">
              {photoTips.map((tip) => (
                <li key={tip} className="flex gap-2 text-body-sm text-ink-muted">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-chip bg-trust" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 border-t border-divider pt-4">
            <p className="text-label-sm text-ink-muted">
              Không có sẵn vỉ thuốc? Xem thử với ảnh mẫu:
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {samples.map((sample) => (
                <li key={sample.file}>
                  <Link
                    href={`/ai/nhan-dien?anh=${encodeURIComponent(sample.file)}`}
                    className="focus-ring inline-block rounded-chip border border-hairline bg-card px-3 py-1.5 text-body-sm text-ink-muted hover:border-ai/40 hover:text-ai-text"
                  >
                    {sample.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {fileName ? (
          <div className="mt-5 flex flex-col gap-5">
            <Suspense
              key={fileName}
              fallback={
                <AiSkeleton message="AI đang đọc chữ trên ảnh vỉ thuốc…" lines={3} />
              }
            >
              <IdentifyResultView fileName={fileName} />
            </Suspense>
          </div>
        ) : (
          <p className="mt-4 text-body-sm text-ink-subtle">{aiMockNotice}</p>
        )}
      </div>
    </AiPageShell>
  );
}

async function IdentifyResultView({ fileName }: { fileName: string }) {
  const result = await identifyFromPhoto(fileName);

  return (
    <>
      {/*
        Câu bắt buộc đối chiếu nằm NGAY TRÊN danh sách ứng viên, không ở chân
        trang. Người dùng đang cầm vỉ thuốc trong tay: nhắc họ đọc lại vỉ chỉ có
        tác dụng nếu câu nhắc đến trước tên thuốc mà máy đoán.
      */}
      <section
        className="rounded-card border border-danger/30 bg-danger-wash p-4"
        aria-label="Bắt buộc đối chiếu"
      >
        <p className="flex items-start gap-2 text-body-md text-ink">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />
          <span>
            <strong className="font-medium text-danger">Đối chiếu trước khi uống. </strong>
            {result.mustVerify}
          </span>
        </p>
      </section>

      <AiBlock label="AI nhận diện" note={`${result.candidates.length} ứng viên`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-label-sm text-ai-text">Chữ AI đọc được trên ảnh</p>
            {/* Hiện nguyên văn: người dùng so với vỉ trong tay là biết máy đọc đúng chưa. */}
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {result.readText.map((text) => (
                <li
                  key={text}
                  className="rounded-chip bg-card px-2.5 py-1 font-mono text-body-sm text-ink"
                >
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <ConfidenceBadge percent={result.confidence} />
        </div>

        {result.limitation ? (
          <p className="mt-3 flex items-start gap-2 rounded-card bg-card p-3 text-body-sm text-ink-muted">
            <Info size={15} className="mt-0.5 shrink-0 text-promo-text" aria-hidden />
            {result.limitation}
          </p>
        ) : null}

        <ul className="mt-4 flex flex-col gap-3">
          {result.candidates.map((candidate) => {
            const unit = getDefaultUnit(candidate.product);
            return (
              <li key={candidate.product.id} className="rounded-card bg-card p-3">
                <div className="flex gap-3">
                  <Link
                    href={`/thuoc/${candidate.product.slug}`}
                    className="focus-ring w-[76px] shrink-0 self-start"
                  >
                    <ProductImage
                      src={candidate.product.image}
                      name={candidate.product.name}
                      brand={candidate.product.brand}
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ConfidenceBadge percent={candidate.percent} />
                      {candidate.product.prescriptionRequired ? (
                        <Badge tone="prescription">Thuốc kê đơn</Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-1.5 font-headline text-body-md font-medium text-ink">
                      <Link
                        href={`/thuoc/${candidate.product.slug}`}
                        className="focus-ring hover:text-trust-text"
                      >
                        {candidate.product.name}
                      </Link>
                    </h3>
                    <p className="mt-0.5 text-body-sm text-ink-muted">
                      {candidate.product.activeIngredient}
                      {candidate.product.strength ? ` · ${candidate.product.strength}` : ""}
                    </p>
                    <Price
                      amount={unit.price}
                      unit={unit.label}
                      originalPrice={unit.originalPrice}
                      prescriptionRequired={candidate.product.prescriptionRequired}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {/* Căn cứ nhận diện: để người dùng tự đánh giá, không chỉ tin con số. */}
                <ul className="mt-3 flex flex-col gap-1 border-t border-divider pt-2.5">
                  {candidate.evidence.map((item) => (
                    <li key={item} className="flex gap-2 text-body-sm text-ink-muted">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-chip bg-ai" />
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </AiBlock>

      <Card className="p-4">
        <h2 className="text-headline-md text-ink">Không thuốc nào đúng?</h2>
        <p className="mt-1.5 text-body-sm text-ink-muted">
          Đọc tên trên vỉ cho dược sĩ nghe là cách nhanh và chắc nhất. Nếu vỉ đã
          mất chữ, mang vỉ tới nhà thuốc MediVia gần nhất.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <ButtonLink href={`tel:${site.hotline.replace(/\s/g, "")}`} variant="solid-trust" size="sm">
            <Headset size={16} aria-hidden />
            Gọi {site.hotline}
          </ButtonLink>
          <ButtonLink href="/ai/tim-kiem" variant="outline-trust" size="sm">
            Tìm bằng tên thuốc
            <ArrowRight size={15} aria-hidden />
          </ButtonLink>
        </div>
      </Card>

      <p className="text-body-sm text-ink-subtle">{aiMockNotice}</p>
    </>
  );
}
