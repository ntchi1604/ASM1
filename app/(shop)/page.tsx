import { HeroSection } from "@/components/home/HeroSection";
import { TrustStrip } from "@/components/home/TrustStrip";
import { AiToolsStrip } from "@/components/home/AiToolsStrip";
import { FlashSale } from "@/components/home/FlashSale";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { AiRecommendations } from "@/components/home/AiRecommendations";
import { HealthArticles } from "@/components/home/HealthArticles";

/**
 * Trang chủ. Thứ tự section theo bản thiết kế Stitch 01-trang-chu:
 * hero → lời hứa dịch vụ → công cụ AI → giảm giá → danh mục → AI gợi ý → bài viết.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <AiToolsStrip />
      <FlashSale />
      <CategoryGrid />
      <AiRecommendations />
      <HealthArticles />
    </>
  );
}
