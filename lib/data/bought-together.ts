import { products } from "@/lib/data/products";
import type { Product } from "@/lib/types";

/**
 * Gợi ý "Thường được mua cùng" — tính năng AI số 4.
 *
 * Mỗi gợi ý BẮT BUỘC có `reason`. Một danh sách sản phẩm không kèm lý do thì
 * chỉ là quảng cáo; câu "Bù nước khi sốt cao" mới là thứ giúp người mua tự
 * quyết định có cần hay không.
 *
 * Viết tay theo từng thuốc thay vì sinh tự động: gợi ý sai ngữ cảnh (bán dầu
 * cá cho người đang sốt) làm mất lòng tin nhanh hơn là không gợi ý gì.
 */
export type Suggestion = {
  productId: string;
  /** Lý do ngắn, hiện phía trên tên sản phẩm. */
  reason: string;
};

export type BoughtTogether = {
  productId: string;
  /** Câu giải thích căn cứ của cả khối, ví dụ "Dựa trên triệu chứng sốt...". */
  basis: string;
  suggestions: Suggestion[];
};

const boughtTogether: BoughtTogether[] = [
  {
    productId: "hapacol-650",
    basis: "Dựa trên triệu chứng sốt và cảm cúm thông thường",
    suggestions: [
      { productId: "oresol-hydrite", reason: "Bù nước khi sốt cao" },
      { productId: "natri-clorid-09", reason: "Vệ sinh mũi khi cảm" },
      { productId: "vitamin-c-1000", reason: "Tăng đề kháng trong đợt sốt" },
      { productId: "bao-thanh-vien-ngam", reason: "Dịu cổ khi kèm đau họng" },
    ],
  },
  {
    productId: "panadol-extra",
    basis: "Dựa trên nhóm giảm đau có chứa caffein",
    suggestions: [
      { productId: "oresol-hydrite", reason: "Bù nước khi mất nước nhẹ" },
      { productId: "vitamin-c-1000", reason: "Dùng cùng đợt cảm cúm" },
      { productId: "xit-hong-propolis", reason: "Khi đau đầu kèm viêm họng" },
    ],
  },
  {
    productId: "efferalgan-500",
    basis: "Dựa trên dạng viên sủi hạ sốt cho người lớn",
    suggestions: [
      { productId: "oresol-hydrite", reason: "Bù nước khi sốt cao" },
      { productId: "natri-clorid-09", reason: "Vệ sinh mũi khi cảm" },
      { productId: "berocca", reason: "Bù vitamin nhóm B khi mệt" },
    ],
  },
  {
    productId: "hapacol-150",
    basis: "Dựa trên nhóm hạ sốt dành cho trẻ em",
    suggestions: [
      { productId: "oresol-hydrite", reason: "Bù nước cho trẻ khi sốt" },
      { productId: "natri-clorid-09", reason: "Nhỏ mũi cho trẻ khi ngạt" },
      { productId: "prospan", reason: "Khi trẻ sốt kèm ho có đờm" },
    ],
  },
  {
    productId: "augmentin-625",
    basis: "Dựa trên nhóm kháng sinh đường uống",
    suggestions: [
      // Men vi sinh là gợi ý ĐÚNG chuyên môn khi dùng kháng sinh, nhưng phải
      // uống cách nhau — cảnh báo tương tác ở trang chi tiết nói rõ giờ uống.
      { productId: "enterogermina", reason: "Hạn chế rối loạn tiêu hoá do kháng sinh" },
      { productId: "oresol-hydrite", reason: "Bù nước nếu bị tiêu chảy" },
      { productId: "vitamin-c-1000", reason: "Hỗ trợ trong đợt nhiễm khuẩn" },
    ],
  },
  {
    productId: "tamiflu-75",
    basis: "Dựa trên nhóm thuốc kháng virus cúm",
    suggestions: [
      { productId: "oresol-hydrite", reason: "Bù nước khi sốt cao" },
      { productId: "hapacol-650", reason: "Hạ sốt khi cúm gây sốt trên 38,5°C" },
      { productId: "natri-clorid-09", reason: "Vệ sinh mũi họng hằng ngày" },
    ],
  },
];

export type SuggestedProduct = {
  product: Product;
  reason: string;
};

/**
 * Trả về gợi ý kèm sản phẩm thật. Bỏ qua:
 * - id không còn trong danh mục (dữ liệu cũ),
 * - sản phẩm hết hàng (gợi ý thứ không mua được thì vô nghĩa),
 * - thuốc kê đơn (không được bán thêm kèm, phải có đơn của bác sĩ).
 */
export function getBoughtTogether(
  productId: string,
): { basis: string; items: SuggestedProduct[] } | undefined {
  const entry = boughtTogether.find((item) => item.productId === productId);
  if (!entry) return undefined;

  const items = entry.suggestions.flatMap<SuggestedProduct>((suggestion) => {
    const product = products.find((item) => item.id === suggestion.productId);
    if (!product) return [];
    if (product.prescriptionRequired) return [];
    if (product.stock.total <= 0) return [];
    return [{ product, reason: suggestion.reason }];
  });

  if (items.length === 0) return undefined;
  return { basis: entry.basis, items };
}

/**
 * Gợi ý cho CẢ giỏ hàng: gộp gợi ý của mọi thuốc đang có trong giỏ.
 *
 * Bắt buộc loại thứ đã nằm trong giỏ. Giỏ mẫu đang có Oresol và Vitamin C —
 * đúng hai gợi ý đầu của Hapacol và Panadol — nên nếu không lọc thì trang sẽ
 * mời người dùng mua lại thứ họ vừa cho vào giỏ.
 *
 * Giữ `reason` của lần gặp đầu tiên và không cộng dồn lý do: một sản phẩm chỉ
 * cần một câu giải thích, hai câu ghép lại đọc như máy nói.
 */
export function getCartSuggestions(
  cartProductIds: string[],
  limit = 3,
): SuggestedProduct[] {
  const inCart = new Set(cartProductIds);
  const picked = new Map<string, SuggestedProduct>();

  for (const id of cartProductIds) {
    const entry = boughtTogether.find((item) => item.productId === id);
    if (!entry) continue;

    for (const suggestion of entry.suggestions) {
      if (inCart.has(suggestion.productId)) continue;
      if (picked.has(suggestion.productId)) continue;

      const product = products.find((item) => item.id === suggestion.productId);
      if (!product) continue;
      if (product.prescriptionRequired) continue;
      if (product.stock.total <= 0) continue;

      picked.set(suggestion.productId, { product, reason: suggestion.reason });
    }
  }

  return [...picked.values()].slice(0, limit);
}

/**
 * Gợi ý mua kèm cho CẢ MỘT DANH MỤC, dùng ở cuối trang danh mục.
 *
 * Vì sao phải có bảng riêng thay vì gộp gợi ý của các sản phẩm trong danh mục:
 * chỉ 6 trong 24 sản phẩm có entry `boughtTogether`, và 5 trong số đó nằm cùng ở
 * `cam-cum-ha-sot`. Suy ra từ sản phẩm thì khối này hiện ở 2 trên 12 trang danh
 * mục — một khối lúc có lúc không giữa các trang cùng loại là thứ phá vỡ tính
 * đồng bộ nhanh nhất, nên thà viết tay theo danh mục.
 *
 * Câu `basis` nói rõ căn cứ là "đơn hàng của khách mua nhóm này", KHÔNG phải
 * "khách xem sản phẩm này" như ở trang chi tiết. Hai trang có mức chính xác khác
 * nhau thật, nên câu giải thích cũng phải khác — nói quá lên là tự bịa dữ liệu.
 *
 * Mọi gợi ý ở đây đều CHÉO danh mục, và `getCategoryBoughtTogether` sẽ chặn lại
 * nếu tôi viết sai: "thường mua kèm" mà lại gợi ý đúng thứ người dùng đang xem
 * cả trang thì vô nghĩa — đó là danh sách sản phẩm, không phải gợi ý mua kèm.
 */
const categoryCombos: { categorySlug: string; basis: string; suggestions: Suggestion[] }[] = [
  {
    categorySlug: "cam-cum-ha-sot",
    basis: "Dựa trên đơn hàng của khách mua thuốc cảm cúm, hạ sốt",
    suggestions: [
      { productId: "oresol-hydrite", reason: "Bù nước và điện giải khi sốt cao" },
      { productId: "natri-clorid-09", reason: "Rửa mũi, làm sạch dịch khi ngạt" },
      { productId: "bao-thanh-vien-ngam", reason: "Dịu cổ khi cảm kèm đau họng" },
      { productId: "vitamin-c-1000", reason: "Tăng đề kháng trong đợt cảm" },
    ],
  },
  {
    categorySlug: "ho-hen-suyen",
    basis: "Dựa trên đơn hàng của khách mua thuốc ho và đường hô hấp",
    suggestions: [
      { productId: "natri-clorid-09", reason: "Rửa mũi để giảm ho do dịch mũi sau" },
      { productId: "hapacol-650", reason: "Hạ sốt nếu ho kèm sốt" },
      { productId: "vitamin-c-1000", reason: "Tăng đề kháng khi hô hấp yếu" },
      { productId: "berocca", reason: "Bù vitamin nhóm B khi mệt kéo dài" },
    ],
  },
  {
    /*
      Kháng sinh + men vi sinh là cặp mua kèm kinh điển và có lý do y khoa thật
      (kháng sinh diệt cả lợi khuẩn đường ruột), nên để Enterogermina đứng đầu.
    */
    categorySlug: "khang-sinh",
    basis: "Dựa trên đơn hàng của khách mua kháng sinh theo đơn",
    suggestions: [
      { productId: "enterogermina", reason: "Cân bằng lợi khuẩn khi dùng kháng sinh" },
      { productId: "oresol-hydrite", reason: "Bù nước nếu bị tiêu chảy do thuốc" },
      { productId: "hapacol-650", reason: "Hạ sốt trong đợt nhiễm khuẩn" },
      { productId: "vitamin-c-1000", reason: "Hỗ trợ đề kháng sau đợt điều trị" },
    ],
  },
  {
    categorySlug: "vitamin-khoang-chat",
    basis: "Dựa trên đơn hàng của khách mua vitamin và khoáng chất",
    suggestions: [
      { productId: "enterogermina", reason: "Hỗ trợ hấp thu khi đường ruột kém" },
      { productId: "xit-hong-propolis", reason: "Bảo vệ họng khi trở lạnh" },
      { productId: "natri-clorid-09", reason: "Vệ sinh mũi hằng ngày" },
      { productId: "oresol-hydrite", reason: "Bù điện giải sau khi vận động" },
    ],
  },
  {
    /*
      KHÔNG gợi ý Ibuprofen ở nhóm tim mạch, dù nó là thuốc phổ thông và còn hàng:
      NSAID dùng cùng Aspirin hoặc Warfarin làm tăng nguy cơ xuất huyết — đúng cảnh
      báo mà trang /ai/tuong-tac của chính MediVia đang hiện. Một khối gợi ý bán
      thêm thứ mà trang khác cảnh báo là mâu thuẫn nội bộ, không phải gợi ý.
    */
    categorySlug: "tim-mach",
    basis: "Dựa trên đơn hàng của khách mua thuốc tim mạch",
    suggestions: [
      { productId: "omega-3-fish-oil", reason: "Hỗ trợ mỡ máu, dùng dài ngày" },
      { productId: "berocca", reason: "Bù vitamin nhóm B cho người lớn tuổi" },
      { productId: "vitamin-c-1000", reason: "Hỗ trợ thành mạch" },
      { productId: "oresol-hydrite", reason: "Bù điện giải khi dùng thuốc lợi tiểu" },
    ],
  },
  {
    categorySlug: "giam-dau-khang-viem",
    basis: "Dựa trên đơn hàng của khách mua thuốc giảm đau, kháng viêm",
    suggestions: [
      { productId: "hapacol-650", reason: "Giảm đau, hạ sốt khi cần tránh kháng viêm" },
      { productId: "enterogermina", reason: "Bảo vệ đường ruột khi dùng kháng viêm" },
      { productId: "omega-3-fish-oil", reason: "Hỗ trợ khớp khi đau kéo dài" },
      { productId: "berocca", reason: "Bù vitamin khi đau mỏi dài ngày" },
    ],
  },
  {
    categorySlug: "tieu-hoa",
    basis: "Dựa trên đơn hàng của khách mua thuốc tiêu hóa",
    suggestions: [
      { productId: "hapacol-650", reason: "Hạ sốt khi tiêu chảy kèm sốt" },
      { productId: "berocca", reason: "Bù vitamin khi ăn uống kém" },
      { productId: "vitamin-c-1000", reason: "Tăng đề kháng khi đường ruột yếu" },
      { productId: "omega-3-fish-oil", reason: "Bổ sung khi hấp thu kém dài ngày" },
    ],
  },
  {
    categorySlug: "cham-soc-ca-nhan",
    basis: "Dựa trên đơn hàng của khách mua sản phẩm chăm sóc cá nhân",
    suggestions: [
      { productId: "xit-hong-propolis", reason: "Bảo vệ họng khi thời tiết đổi" },
      { productId: "vitamin-c-1000", reason: "Tăng đề kháng hằng ngày" },
      { productId: "berocca", reason: "Bù vitamin cho người hay mệt" },
      { productId: "enterogermina", reason: "Cân bằng lợi khuẩn đường ruột" },
    ],
  },
];

/**
 * Gợi ý mua kèm cho một danh mục. Lọc y hệt `getBoughtTogether` — thiếu id, hết
 * hàng, thuốc kê đơn — cộng thêm một chặn riêng: bỏ sản phẩm cùng danh mục đang
 * xem (xem docstring của `categoryCombos`).
 *
 * `limit` mặc định 4 vì lưới hiển thị là 4 cột ở màn rộng: gợi ý thứ 5 sẽ rơi
 * xuống hàng hai và để lại ba ô trống cạnh nó.
 */
export function getCategoryBoughtTogether(
  categorySlug: string,
  limit = 4,
): { basis: string; items: SuggestedProduct[] } | undefined {
  const entry = categoryCombos.find((item) => item.categorySlug === categorySlug);
  if (!entry) return undefined;

  const items = entry.suggestions.flatMap<SuggestedProduct>((suggestion) => {
    const product = products.find((item) => item.id === suggestion.productId);
    if (!product) return [];
    if (product.categorySlug === categorySlug) return [];
    if (product.prescriptionRequired) return [];
    if (product.stock.total <= 0) return [];
    return [{ product, reason: suggestion.reason }];
  });

  if (items.length === 0) return undefined;
  return { basis: entry.basis, items: items.slice(0, limit) };
}

