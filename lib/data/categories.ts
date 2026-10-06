import {
  Activity,
  Baby,
  Bone,
  Droplets,
  Eye,
  Hand,
  HeartPulse,
  Layers,
  Pill,
  SprayCan,
  Thermometer,
  Wind,
  type LucideIcon,
} from "@/lib/icons";

export type Category = {
  slug: string;
  name: string;
  /** Tên hiển thị ngắn cho ô danh mục ở trang chủ. */
  shortName: string;
  icon: LucideIcon;
  /** Mô tả ngắn ở đầu trang danh mục. */
  description: string;
  /**
   * Gợi ý AI hiện trên dải tím ở trang danh mục. Chỉ đặt cho danh mục nào
   * thật sự có liên hệ chuyên môn đáng nói — không phải danh mục nào cũng
   * cần AI xen vào, và gợi ý sáo rỗng làm mất giá trị của khối AI.
   */
  aiHint?: {
    message: string;
    action?: { label: string; href: string };
  };
};

/**
 * Danh mục dùng chung cho trang chủ, breadcrumb và trang danh mục.
 * Trang chủ hiện 8 ô đầu tiên.
 */
export const categories: Category[] = [
  {
    slug: "cam-cum-ha-sot",
    name: "Thuốc cảm cúm, hạ sốt",
    shortName: "Thuốc cảm cúm",
    icon: Thermometer,
    description:
      "Thuốc hạ sốt, giảm đau, trị cảm cúm và nghẹt mũi cho người lớn và trẻ em.",
    aiHint: {
      message:
        "Bạn đang xem thuốc hạ sốt. Nếu kèm ho có đờm, cân nhắc thêm thuốc long đờm thay vì thuốc giảm ho.",
      action: { label: "Xem thuốc long đờm", href: "/danh-muc/ho-hen-suyen" },
    },
  },
  {
    slug: "tieu-hoa",
    name: "Tiêu hoá",
    shortName: "Tiêu hoá",
    icon: Droplets,
    description:
      "Men vi sinh, bù nước điện giải, thuốc dạ dày và hỗ trợ tiêu hoá.",
  },
  {
    slug: "vitamin-khoang-chat",
    name: "Vitamin và khoáng chất",
    shortName: "Vitamin & khoáng chất",
    icon: Pill,
    description:
      "Bổ sung vi chất, tăng đề kháng, hỗ trợ sức khoẻ tim mạch và thị lực.",
  },
  {
    slug: "ho-hen-suyen",
    name: "Hô hấp, ho và hen suyễn",
    shortName: "Hô hấp",
    icon: Wind,
    description: "Siro ho, viên ngậm, xịt họng và thuốc hỗ trợ đường hô hấp.",
  },
  {
    slug: "da-lieu",
    name: "Da liễu",
    shortName: "Da liễu",
    icon: SprayCan,
    description: "Thuốc bôi, kem dưỡng và sản phẩm chăm sóc các vấn đề về da.",
  },
  {
    slug: "giam-dau-khang-viem",
    name: "Đau nhức xương khớp",
    shortName: "Đau nhức xương khớp",
    icon: Bone,
    description: "Thuốc giảm đau, kháng viêm và hỗ trợ xương khớp.",
  },
  {
    slug: "me-va-be",
    name: "Mẹ và bé",
    shortName: "Mẹ và bé",
    icon: Baby,
    description: "Sản phẩm cho mẹ mang thai, cho con bú và trẻ nhỏ.",
  },
  {
    slug: "thiet-bi-y-te",
    name: "Thiết bị y tế",
    shortName: "Thiết bị y tế",
    icon: Activity,
    description: "Máy đo huyết áp, máy đo đường huyết, nhiệt kế và vật tư y tế.",
  },
  {
    slug: "tim-mach",
    name: "Tim mạch",
    shortName: "Tim mạch",
    icon: HeartPulse,
    description: "Thuốc huyết áp, chống đông và hỗ trợ tim mạch.",
    aiHint: {
      message:
        "Thuốc chống đông dễ tương tác với thuốc giảm đau kháng viêm và một số thực phẩm bổ sung. Nên kiểm tra trước khi dùng cùng lúc.",
      action: { label: "Kiểm tra tương tác thuốc", href: "/ai/tuong-tac" },
    },
  },
  {
    slug: "cham-soc-ca-nhan",
    name: "Chăm sóc cá nhân",
    shortName: "Chăm sóc cá nhân",
    icon: Hand,
    description: "Nước muối sinh lý, sản phẩm vệ sinh và chăm sóc hằng ngày.",
  },
  {
    slug: "khang-sinh",
    name: "Kháng sinh",
    shortName: "Kháng sinh",
    icon: Layers,
    description:
      "Thuốc kháng sinh kê đơn — cần đơn của bác sĩ và tư vấn dược sĩ trước khi bán.",
    aiHint: {
      message:
        "Kháng sinh chỉ có tác dụng với nhiễm khuẩn, không dùng cho cảm lạnh do virus. Dùng đủ liều kể cả khi đã đỡ.",
    },
  },
  {
    slug: "mat",
    name: "Nhỏ mắt, nhỏ tai",
    shortName: "Mắt và tai",
    icon: Eye,
    description: "Thuốc nhỏ mắt, nhỏ tai và sản phẩm vệ sinh mắt.",
  },
];

/** 8 danh mục hiện ở trang chủ. */
/**
 * Tám danh mục đầu, hiện ở lưới trang chủ.
 *
 * Là HÀM chứ không phải hằng: quản trị thêm danh mục mới thì hằng giữ nguyên tám
 * danh mục cũ tới khi khởi động lại máy chủ — danh mục vừa tạo không bao giờ lên
 * trang chủ, và người thêm tưởng mình thao tác sai.
 */
export const getFeaturedCategories = () => categories.slice(0, 8);

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
