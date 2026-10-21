import {
  Bot,
  Camera,
  GitCompareArrows,
  Headset,
  Mic,
  RotateCcw,
  ScanSearch,
  ShieldCheck,
  Stethoscope,
  Truck,
  type LucideIcon,
} from "@/lib/icons";

/** 4 lời hứa dịch vụ, dải ngay dưới hero. */
export const trustPoints: {
  icon: LucideIcon;
  title: string;
  note: string;
}[] = [
  {
    icon: ShieldCheck,
    title: "Thuốc chính hãng, có hoá đơn",
    note: "Nguồn gốc minh bạch 100%",
  },
  {
    icon: Headset,
    title: "Dược sĩ tư vấn miễn phí",
    note: "Đội ngũ chuyên môn trực 24/7",
  },
  {
    icon: Truck,
    title: "Giao 2 giờ nội thành",
    note: "Nhanh chóng khi cần gấp",
  },
  {
    icon: RotateCcw,
    title: "Đổi trả trong 30 ngày",
    note: "Thủ tục đơn giản, an tâm",
  },
];

/**
 * 6 công cụ AI. Thứ tự này cố định: dùng ở dải công cụ trang chủ và
 * menu AI, nên người dùng thấy cùng một danh sách ở mọi nơi.
 */
export const aiTools: {
  icon: LucideIcon;
  label: string;
  href: string;
  description: string;
}[] = [
  {
    icon: Stethoscope,
    label: "Tư vấn triệu chứng",
    href: "/ai/tu-van",
    description: "Mô tả triệu chứng, AI gợi ý nhóm thuốc phù hợp",
  },
  {
    icon: ScanSearch,
    label: "Tìm thuốc bằng câu tự nhiên",
    href: "/ai/tim-kiem",
    description: "Hỏi như nói với dược sĩ, không cần nhớ tên thuốc",
  },
  {
    icon: Bot,
    label: "Chatbot dược sĩ",
    href: "/ai/chatbot",
    description: "Hỏi đáp nhanh, chuyển dược sĩ thật khi cần",
  },
  {
    icon: Camera,
    label: "Nhận diện thuốc bằng ảnh",
    href: "/ai/nhan-dien",
    description: "Chụp vỉ thuốc để biết đó là thuốc gì",
  },
  {
    icon: GitCompareArrows,
    label: "Kiểm tra tương tác thuốc",
    href: "/ai/tuong-tac",
    description: "Đối soát các thuốc đang dùng cùng lúc",
  },
  {
    icon: Mic,
    label: "Tìm bằng giọng nói",
    href: "/ai/giong-noi",
    description: "Nói tên thuốc hoặc triệu chứng",
  },
];

export type Article = {
  slug: string;
  tag: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readingMinutes: number;
  image: string;
};

export const articles: Article[] = [
  {
    slug: "phan-biet-sot-xuat-huyet-va-cam-cum",
    tag: "Dược lý ứng dụng",
    title: "Phân biệt sốt xuất huyết và cảm cúm mùa: khi nào cần nhập viện ngay?",
    excerpt:
      "Những dấu hiệu cảnh báo nguy hiểm trong 3 ngày đầu và nguyên tắc bù điện giải an toàn tại nhà.",
    author: "Dược sĩ Nguyễn Minh",
    date: "2026-09-12",
    readingMinutes: 4,
    image: "/articles/bai-sot-xuat-huyet.webp",
  },
  {
    slug: "uong-khang-sinh-bao-nhieu-ngay",
    tag: "Cảnh báo dùng thuốc",
    title: "Uống kháng sinh bao nhiêu ngày thì ngưng? Hiểm hoạ kháng kháng sinh",
    excerpt:
      "Tuyệt đối không tự ý ngưng thuốc khi vừa hết triệu chứng sốt hoặc đau rát họng.",
    author: "Dược sĩ Trần Thu Hà",
    date: "2026-09-10",
    readingMinutes: 5,
    image: "/articles/bai-khang-sinh.webp",
  },
  {
    slug: "tuong-tac-thuoc-huyet-ap-va-nsaids",
    tag: "Cơ sở dữ liệu AI",
    title: "Tương tác nguy hiểm giữa thuốc huyết áp và thuốc giảm đau NSAIDs",
    excerpt:
      "Cách nhận biết sớm nguy cơ tăng huyết áp đột ngột và suy giảm chức năng thận khi phối hợp thuốc.",
    author: "Dược sĩ Lê Hoàng",
    date: "2026-09-08",
    readingMinutes: 3,
    image: "/articles/bai-tuong-tac-nsaids.webp",
  },
];

/** Chứng nhận ở footer trang chủ. */
export const certifications = [
  { label: "Chuẩn GPP Bộ Y Tế", icon: "verified" },
  { label: "Bộ Công Thương", icon: "shield" },
  { label: "Tem chống giả", icon: "qr" },
] as const;
