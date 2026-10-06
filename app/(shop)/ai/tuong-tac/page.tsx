import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AiBlock } from "@/components/ai/AiBlock";
import { AiPageShell } from "@/components/ai/AiPageShell";
import { AiSkeleton } from "@/components/ai/AiSkeleton";
import { ConfidenceBadge } from "@/components/ai/ConfidenceBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Field";
import { checkInteractions } from "@/lib/ai/interactions";
import { aiMockNotice } from "@/lib/ai/engine";
import { knownIngredients, severityLabel } from "@/lib/data/interactions";
import { getCartItems } from "@/lib/data/cart";
import { site } from "@/lib/data/site";
import {
  AlertTriangle,
  Check,
  GitCompareArrows,
  Headset,
  Info,
  ShieldAlert,
  ShieldCheck,
} from "@/lib/icons";
import type { InteractionSeverity } from "@/lib/types";

export const metadata: Metadata = {
  title: "Kiểm tra tương tác thuốc",
  description:
    "Nhập các thuốc đang dùng — kể cả thuốc mua ở nơi khác — để AI của MediVia đối soát tương tác và cảnh báo trùng hoạt chất gây quá liều.",
};

/** Tô màu theo mức độ. Nghiêm trọng phải đỏ, không được làm dịu đi. */
const severityTone: Record<InteractionSeverity, { box: string; text: string; badge: "prescription" | "promo" | "neutral" }> = {
  "nghiem-trong": { box: "border-danger/30 bg-danger-wash", text: "text-danger", badge: "prescription" },
  "trung-binh": { box: "border-promo/30 bg-promo-wash", text: "text-promo-text", badge: "promo" },
  nhe: { box: "border-hairline bg-recessed", text: "text-ink-muted", badge: "neutral" },
};

/**
 * Tính năng 7 — Cảnh báo tương tác thuốc (⭐⭐⭐⭐).
 *
 * Trang này nhận thuốc dạng CHỮ TỰ DO, không phải chọn từ danh mục. Người dùng
 * đang uống thuốc huyết áp mua ở phòng khám vẫn cần biết nó có xung đột với thuốc
 * cảm họ sắp mua hay không — nếu chỉ cho chọn thuốc MediVia bán thì tính năng này
 * bỏ sót đúng những ca nguy hiểm nhất.
 *
 * Luật đối soát dùng CHUNG `matchRules` với cảnh báo ở trang chi tiết và ở giỏ
 * hàng. Ba nơi không thể nói khác nhau về cùng một cặp thuốc.
 */
export default async function InteractionPage({
  searchParams,
}: PageProps<"/ai/tuong-tac">) {
  const { thuoc } = await searchParams;
  const raw = (Array.isArray(thuoc) ? thuoc[0] : thuoc) ?? "";
  const input = raw.trim();

  // Cho phép nạp sẵn thuốc trong giỏ: người dùng tới đây từ cảnh báo ở giỏ hàng
  // thì không phải gõ lại những thứ họ vừa chọn.
  const cartNames = getCartItems().map((item) => item.product.name);

  return (
    <AiPageShell
      icon={GitCompareArrows}
      title="Kiểm tra tương tác thuốc"
      lead="Nhập tất cả thuốc bạn đang dùng, mỗi thuốc một dòng — kể cả thuốc mua ở nơi khác. AI đối soát từng cặp và cảnh báo khi hai thuốc trùng hoạt chất."
      current="/ai/tuong-tac"
      aside={<InteractionAside />}
    >
      <Card className="p-4 md:p-5">
        <form action="/ai/tuong-tac" method="get" className="flex flex-col gap-3">
          <label htmlFor="thuoc" className="text-label-md text-ink">
            Các thuốc bạn đang dùng
          </label>
          <Textarea
            id="thuoc"
            name="thuoc"
            rows={5}
            required
            defaultValue={input}
            placeholder={"Panadol Extra\nHapacol 650\nAspirin 81mg\nmetformin"}
          />
          <p className="text-body-sm text-ink-subtle">
            Mỗi dòng một thuốc. Ghi tên thuốc hoặc tên hoạt chất đều được. Thuốc
            AI không nhận ra sẽ được liệt kê riêng chứ không bị bỏ qua im lặng.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="solid-ai" size="lg">
              Đối soát tương tác
            </Button>
            {cartNames.length > 0 ? (
              <Link
                href={`/ai/tuong-tac?thuoc=${encodeURIComponent(cartNames.join("\n"))}`}
                className="focus-ring text-label-md text-trust-text underline decoration-trust/30 underline-offset-2"
              >
                Nạp {cartNames.length} thuốc trong giỏ hàng
              </Link>
            ) : null}
          </div>
        </form>
      </Card>

      {input ? (
        <Suspense
          key={input}
          fallback={<AiSkeleton message="AI đang đối soát từng cặp thuốc…" lines={4} />}
        >
          <InteractionResultView input={input} />
        </Suspense>
      ) : (
        <Card className="p-4 md:p-5">
          <h2 className="text-headline-md text-ink">Vì sao nên kiểm tra</h2>
          <p className="mt-2 text-body-md text-ink-muted">
            Hai nguy cơ thường gặp nhất không nằm ở thuốc lạ, mà ở thuốc quen:
          </p>
          <ul className="mt-3 flex flex-col gap-2.5 text-body-md text-ink-muted">
            <li className="flex gap-2">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-chip bg-danger" />
              <span>
                <strong className="font-medium text-ink">Trùng hoạt chất.</strong>{" "}
                Uống Panadol Extra rồi uống thêm Hapacol vì “chưa đỡ” là uống hai
                lần paracetamol — đó là quá liều, không phải tăng hiệu quả.
              </span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-chip bg-danger" />
              <span>
                <strong className="font-medium text-ink">Thuốc chống đông.</strong>{" "}
                Người đang dùng warfarin uống thêm aspirin hoặc ibuprofen thì nguy
                cơ chảy máu tăng rõ rệt.
              </span>
            </li>
          </ul>
          <p className="mt-4 text-body-sm text-ink-subtle">{aiMockNotice}</p>
        </Card>
      )}
    </AiPageShell>
  );
}

async function InteractionResultView({ input }: { input: string }) {
  const result = await checkInteractions(input);
  const clean = result.pairs.length === 0 && result.duplicates.length === 0;

  return (
    <>
      {/*
        Thứ tự: trùng hoạt chất → tương tác từng cặp → thuốc không nhận ra.
        Trùng hoạt chất lên đầu vì cách xử lý là BỎ một thuốc ngay, còn tương tác
        thì phần lớn là uống cách giờ hoặc hỏi dược sĩ.
      */}
      {result.duplicates.length > 0 ? (
        <section
          className="rounded-card border border-danger/30 bg-danger-wash p-4 md:p-5"
          aria-label="Cảnh báo trùng hoạt chất"
        >
          <h2 className="flex items-center gap-2 text-headline-md text-danger">
            <ShieldAlert size={20} className="shrink-0" aria-hidden />
            Trùng hoạt chất — nguy cơ quá liều
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {result.duplicates.map((duplicate) => (
              <li key={duplicate.ingredient} className="rounded-card bg-card p-3">
                <p className="text-label-md text-ink">
                  {duplicate.names.join(" + ")} đều chứa {duplicate.ingredient}
                </p>
                <p className="mt-1 text-body-sm text-ink-muted">
                  Chỉ dùng MỘT trong số các thuốc trên tại một thời điểm. Uống cùng
                  lúc là cộng dồn liều {duplicate.ingredient.toLowerCase()}, không
                  phải tăng hiệu quả.
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AiBlock label="AI đối soát" note={`${result.drugs.length} thuốc được nhận diện`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <ul className="flex flex-wrap gap-2">
            {result.drugs.map((drug) => (
              <li key={drug.input}>
                {drug.slug ? (
                  <Link
                    href={`/thuoc/${drug.slug}`}
                    className="focus-ring inline-block rounded-chip bg-card px-3 py-1.5 text-label-sm text-trust-text hover:bg-trust-wash"
                  >
                    {drug.name}
                  </Link>
                ) : (
                  <span className="inline-block rounded-chip bg-card px-3 py-1.5 text-label-sm text-ink-muted">
                    {drug.name}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <ConfidenceBadge percent={result.confidence} />
        </div>

        {clean ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-card border border-trust/25 bg-card p-4">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
            <div>
              <p className="text-label-md text-ink">
                Không phát hiện tương tác trong dữ liệu MediVia
              </p>
              <p className="mt-1 text-body-sm text-ink-muted">
                {result.unresolved.length > 0
                  ? "Nhưng kết luận này chưa đầy đủ: còn thuốc AI chưa nhận ra ở dưới. Hãy hỏi dược sĩ trước khi dùng cùng lúc."
                  : "Bảng luật của MediVia không bao trùm mọi tương tác đã biết trong y văn. Nếu bạn đang điều trị bệnh mạn tính, vẫn nên hỏi dược sĩ."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {result.pairs.map((pair) => {
              const tone = severityTone[pair.severity];
              return (
                <li
                  key={`${pair.a.name}-${pair.b.name}`}
                  className={`rounded-card border p-4 ${tone.box}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertTriangle size={18} className={`shrink-0 ${tone.text}`} aria-hidden />
                    <h3 className={`text-headline-md ${tone.text}`}>
                      {pair.a.name} + {pair.b.name}
                    </h3>
                    <Badge tone={tone.badge}>{severityLabel[pair.severity]}</Badge>
                  </div>
                  <p className="mt-2 text-body-md text-ink">{pair.mechanism}</p>
                  <p className="mt-2 flex items-start gap-2 text-body-sm text-ink-muted">
                    <Check size={15} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
                    <span>
                      <strong className="font-medium text-ink">Nên làm: </strong>
                      {pair.advice}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </AiBlock>

      {result.unresolved.length > 0 ? (
        <Card className="p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-headline-md text-ink">
            <Info size={18} className="text-promo-text" aria-hidden />
            AI chưa nhận ra {result.unresolved.length} dòng
          </h2>
          <p className="mt-2 text-body-md text-ink-muted">
            Những dòng dưới đây KHÔNG được đưa vào kết quả đối soát ở trên. MediVia
            nói rõ điều này thay vì im lặng bỏ qua rồi kết luận “không có tương
            tác”.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {result.unresolved.map((item) => (
              <li
                key={item}
                className="rounded-chip border border-hairline bg-recessed px-3 py-1.5 text-body-sm text-ink-muted"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-body-sm text-ink-subtle">
            Thử ghi tên hoạt chất thay vì tên biệt dược, hoặc đọc tên thuốc cho
            dược sĩ qua điện thoại.
          </p>
          <Link
            href={`tel:${site.hotline.replace(/\s/g, "")}`}
            className="focus-ring mt-3 inline-flex items-center gap-2 text-label-md text-trust-text"
          >
            <Headset size={16} aria-hidden />
            {site.hotline}
          </Link>
        </Card>
      ) : null}

      <p className="text-body-sm text-ink-subtle">{aiMockNotice}</p>
    </>
  );
}

function InteractionAside() {
  return (
    <>
      <Card className="p-4">
        <h2 className="text-headline-md text-ink">Hoạt chất MediVia có luật đối soát</h2>
        <p className="mt-1.5 text-body-sm text-ink-muted">
          Danh sách này là phạm vi thật của tính năng, không phải toàn bộ y văn.
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {knownIngredients.map((ingredient) => (
            <li
              key={ingredient}
              className="rounded-chip bg-recessed px-2.5 py-1 text-body-sm text-ink-muted"
            >
              {ingredient}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <h2 className="text-headline-md text-ink">Kết quả này không thay dược sĩ</h2>
        <p className="mt-1.5 text-body-sm text-ink-muted">
          Bảng luật của MediVia chỉ chứa những cặp tương tác thường gặp nhất ở
          thuốc không kê đơn. Người đang điều trị tim mạch, tiểu đường, động kinh
          hoặc dùng thuốc chống đông cần dược sĩ xem toàn bộ danh sách thuốc.
        </p>
        <Link
          href={`tel:${site.hotline.replace(/\s/g, "")}`}
          className="focus-ring mt-3 inline-flex items-center gap-2 text-headline-md text-trust-text"
        >
          <Headset size={18} aria-hidden />
          {site.hotline}
        </Link>
      </Card>
    </>
  );
}
