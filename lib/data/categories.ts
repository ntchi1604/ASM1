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

/**
 * Icon danh mục để dạng KHOÁ CHỮ, không phải component.
 *
 * Bản trước giữ thẳng `LucideIcon` trong dữ liệu, và điều đó chặn màn hình quản
 * trị: `FormData` chỉ mang được chuỗi, nên không có cách nào gửi một component
 * React lên máy chủ. Khoá chữ cũng đúng với lược đồ SQL — bảng `categories`
 * không có cột icon, và một cột `varchar` liệt kê khoá là thứ chép được sang
 * PostgreSQL mà không phải đổi kiểu.
 */
export const categoryIconKeys = [
  "thermometer",
  "droplets",
  "pill",
  "wind",
  "spray-can",
  "bone",
  "baby",
  "activity",
  "heart-pulse",
  "hand",
  "layers",
  "eye",
] as const;

export type CategoryIcon = (typeof categoryIconKeys)[number];

export const categoryIcons: Record<CategoryIcon, LucideIcon> = {
  thermometer: Thermometer,
  droplets: Droplets,
  pill: Pill,
  wind: Wind,
  "spray-can": SprayCan,
  bone: Bone,
  baby: Baby,
  activity: Activity,
  "heart-pulse": HeartPulse,
  hand: Hand,
  layers: Layers,
  eye: Eye,
};

/** Nhãn tiếng Việt cho ô chọn icon ở màn hình quản trị. */
export const categoryIconLabels: Record<CategoryIcon, string> = {
  thermometer: "Nhiệt kế",
  droplets: "Giọt nước",
  pill: "Viên thuốc",
  wind: "Làn gió",
  "spray-can": "Bình xịt",
  bone: "Xương",
  baby: "Em bé",
  activity: "Nhịp sóng",
  "heart-pulse": "Tim đập",
  hand: "Bàn tay",
  layers: "Các lớp",
  eye: "Con mắt",
};

export function isCategoryIcon(value: string): value is CategoryIcon {
  return (categoryIconKeys as readonly string[]).includes(value);
}

export type Category = {
  slug: string;
  name: string;
  /** Tên hiển thị ngắn cho ô danh mục ở trang chủ. */
  shortName: string;
  icon: CategoryIcon;
  /** Mô tả ngắn ở đầu trang danh mục. */
  description: string;
  /** Thứ tự trong lưới 8 ô ở trang chủ; số nhỏ đứng trước. */
  sortOrder: number;
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
 * Trang chủ hiện 8 danh mục có `sortOrder` nhỏ nhất.
 */
export const categories: Category[] = [
  {
    slug: "cam-cum-ha-sot",
    name: "Thuốc cảm cúm, hạ sốt",
    shortName: "Thuốc cảm cúm",
    icon: "thermometer",
    description:
      "Thuốc hạ sốt, giảm đau, trị cảm cúm và nghẹt mũi cho người lớn và trẻ em.",
    sortOrder: 1,
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
    icon: "droplets",
    description:
      "Men vi sinh, bù nước điện giải, thuốc dạ dày và hỗ trợ tiêu hoá.",
    sortOrder: 2,
  },
  {
    slug: "vitamin-khoang-chat",
    name: "Vitamin và khoáng chất",
    shortName: "Vitamin & khoáng chất",
    icon: "pill",
    description:
      "Bổ sung vi chất, tăng đề kháng, hỗ trợ sức khoẻ tim mạch và thị lực.",
    sortOrder: 3,
  },
  {
    slug: "ho-hen-suyen",
    name: "Hô hấp, ho và hen suyễn",
    shortName: "Hô hấp",
    icon: "wind",
    description: "Siro ho, viên ngậm, xịt họng và thuốc hỗ trợ đường hô hấp.",
    sortOrder: 4,
  },
  {
    slug: "da-lieu",
    name: "Da liễu",
    shortName: "Da liễu",
    icon: "spray-can",
    description: "Thuốc bôi, kem dưỡng và sản phẩm chăm sóc các vấn đề về da.",
    sortOrder: 5,
  },
  {
    slug: "giam-dau-khang-viem",
    name: "Đau nhức xương khớp",
    shortName: "Đau nhức xương khớp",
    icon: "bone",
    description: "Thuốc giảm đau, kháng viêm và hỗ trợ xương khớp.",
    sortOrder: 6,
  },
  {
    slug: "me-va-be",
    name: "Mẹ và bé",
    shortName: "Mẹ và bé",
    icon: "baby",
    description: "Sản phẩm cho mẹ mang thai, cho con bú và trẻ nhỏ.",
    sortOrder: 7,
  },
  {
    slug: "thiet-bi-y-te",
    name: "Thiết bị y tế",
    shortName: "Thiết bị y tế",
    icon: "activity",
    description: "Máy đo huyết áp, máy đo đường huyết, nhiệt kế và vật tư y tế.",
    sortOrder: 8,
  },
  {
    slug: "tim-mach",
    name: "Tim mạch",
    shortName: "Tim mạch",
    icon: "heart-pulse",
    description: "Thuốc huyết áp, chống đông và hỗ trợ tim mạch.",
    sortOrder: 9,
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
    icon: "hand",
    description: "Nước muối sinh lý, sản phẩm vệ sinh và chăm sóc hằng ngày.",
    sortOrder: 10,
  },
  {
    slug: "khang-sinh",
    name: "Kháng sinh",
    shortName: "Kháng sinh",
    icon: "layers",
    description:
      "Thuốc kháng sinh kê đơn — cần đơn của bác sĩ và tư vấn dược sĩ trước khi bán.",
    sortOrder: 11,
    aiHint: {
      message:
        "Kháng sinh chỉ có tác dụng với nhiễm khuẩn, không dùng cho cảm lạnh do virus. Dùng đủ liều kể cả khi đã đỡ.",
    },
  },
  {
    slug: "mat",
    name: "Nhỏ mắt, nhỏ tai",
    shortName: "Mắt và tai",
    icon: "eye",
    description: "Thuốc nhỏ mắt, nhỏ tai và sản phẩm vệ sinh mắt.",
    sortOrder: 12,
  },
];

/**
 * Tám danh mục đầu theo thứ tự, hiện ở lưới trang chủ.
 *
 * Là HÀM chứ không phải hằng: quản trị thêm danh mục mới thì hằng giữ nguyên tám
 * danh mục cũ tới khi khởi động lại máy chủ — danh mục vừa tạo không bao giờ lên
 * trang chủ, và người thêm tưởng mình thao tác sai.
 */
export const getFeaturedCategories = () =>
  [...categories].sort((a, b) => a.sortOrder - b.sortOrder).slice(0, 8);

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
