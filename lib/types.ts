/**
 * Kiểu dữ liệu dùng chung. Ràng buộc pháp lý được cài ở đây để component
 * tự áp dụng, không phụ thuộc việc người viết page có nhớ hay không.
 */

/** Đơn vị bán. Giá đổi theo đơn vị, luôn hiển thị kèm giá. */
export type UnitLabel = "Hộp" | "Vỉ" | "Viên" | "Tuýp" | "Lọ" | "Chai" | "Gói";

export type ProductUnit = {
  label: UnitLabel;
  price: number;
  /** Giá gốc trước giảm; bỏ trống nếu không giảm giá. */
  originalPrice?: number;
  /** Ví dụ: "10 vỉ x 10 viên" */
  packaging?: string;
};

/**
 * 'drug'      — thuốc, chịu quy định dược
 * 'supplement'— thực phẩm bảo vệ sức khoẻ, bắt buộc có khuyến cáo TPBS
 * 'cosmetic'  — dược mỹ phẩm
 * 'device'    — thiết bị y tế
 */
export type ProductType = "drug" | "supplement" | "cosmetic" | "device";

/** Dạng bào chế — một trong các bộ lọc ở trang danh mục. */
export type DosageForm =
  | "vien-nen"
  | "vien-sui"
  | "siro"
  | "goi-bot"
  | "xit-nho"
  | "vien-ngam"
  | "ong-uong"
  | "dung-dich";

/**
 * Đối tượng dùng được. Chỉ ghi khi có căn cứ trên nhãn thuốc — không suy
 * diễn. Phụ nữ có thai và cho con bú không đưa vào bộ lọc: phải hỏi dược sĩ
 * từng ca, không thể lọc bằng checkbox.
 */
export type Audience = "nguoi-lon" | "tre-em" | "nguoi-cao-tuoi";

/**
 * Một lô hàng đã nhập. Một mặt hàng nhập nhiều đợt thì mỗi đợt một lô, mỗi lô
 * một hạn dùng riêng — hạn dùng không phải thuộc tính của mặt hàng mà của lô.
 *
 * `quantity` tính theo ĐƠN VỊ MẶC ĐỊNH của mặt hàng (hộp, chai), cùng đơn vị
 * với `Product.stock.total`; trộn hai đơn vị thì tổng cộng ra số vô nghĩa.
 */
export type StockBatch = {
  /** Mã lô in trên vỏ hộp. Không đổi được vì nó là thứ đối chiếu với giấy tờ nhập. */
  lot: string;
  quantity: number;
  /** `yyyy-mm-dd`. */
  expiryDate: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** Hoạt chất, hiển thị chữ nhỏ xám dưới tên thuốc. */
  activeIngredient: string;
  /** Hàm lượng, ví dụ "650mg". */
  strength: string;
  brand: string;
  origin: string;
  categorySlug: string;
  type: ProductType;
  dosageForm: DosageForm;
  audiences: Audience[];
  /**
   * true ⇒ thuốc kê đơn. Mọi nơi hiển thị sản phẩm này PHẢI bỏ nút thêm
   * giỏ hàng và thay bằng "Tư vấn dược sĩ". ProductCard tự xử lý.
   */
  prescriptionRequired: boolean;
  units: ProductUnit[];
  stock: {
    /** Tổng số còn lại; 0 ⇒ hết hàng. Có lô thì đây là tổng số lượng của các lô. */
    total: number;
    nearbyPharmacies: number;
    /** Chỉ khi total = 0: ngày dự kiến có hàng lại, dạng ISO. */
    restockDate?: string;
    /**
     * Các lô đang có. Bỏ trống với mặt hàng chưa khai lô — khi đó `total` là con
     * số nhập tay. Có lô thì `total` phải bằng tổng `quantity`, xem `saveBatches`.
     */
    batches?: StockBatch[];
  };
  image: string;
  /** Dùng cho khối tóm tắt AI ở trang chi tiết. */
  shortUses: string;
  rating?: { score: number; count: number };
};

/**
 * Nội dung chi tiết thuốc, nguồn cho khối tóm tắt AI.
 *
 * uses/dosage/cautions đều là danh sách vì khối tóm tắt hiện dạng gạch đầu
 * dòng: người đang sốt không đọc một đoạn văn dài để tìm liều.
 */
export type ProductDetail = {
  productId: string;
  /** Số đăng ký lưu hành do Cục Quản lý Dược cấp, ví dụ "VD-24567-16". */
  registrationNumber: string;
  /** Tên đầy đủ nhà sản xuất; `Product.brand` chỉ là tên gọi ngắn. */
  manufacturer: string;
  /** Ví dụ: "36 tháng kể từ ngày sản xuất". */
  shelfLife: string;
  /** Tên danh mục dược lý in ở bảng thông tin, ví dụ "Thuốc hạ sốt, giảm đau". */
  therapeuticGroup: string;
  uses: string[];
  dosage: string[];
  cautions: string[];
  sideEffects: string;
  storage: string;
  /** Link "Xem thông tin gốc từ nhà sản xuất" trong khối AI. */
  manufacturerSourceLabel: string;
  /**
   * Câu hỏi gợi ý ở khối "Hỏi nhanh về thuốc". Viết riêng cho từng thuốc —
   * câu hỏi chung chung thì không ai bấm.
   */
  quickQuestions: string[];
};

/** Một đánh giá đã xác thực mua hàng. */
export type Review = {
  id: string;
  productId: string;
  author: string;
  /** Chữ viết tắt hiện trong vòng tròn avatar. */
  initials: string;
  score: number;
  /** ISO date. */
  date: string;
  body: string;
  /**
   * Tên tệp trong `.data/uploads`, không phải URL. URL dựng lại bằng
   * `mediaUrl()` — lưu URL vào dữ liệu thì đổi đường dẫn phục vụ là mọi
   * đánh giá cũ trỏ vào chỗ không còn gì.
   */
  photos?: string[];
  video?: string;
  /**
   * Đơn đã giao dùng để xác thực câu "đã mua tại MediVia". Đánh giá mẫu không
   * có trường này — chúng có trước khi có đường viết đánh giá.
   */
  orderCode?: string;
  /**
   * Quản trị ẩn khỏi trang sản phẩm. Ẩn chứ không xoá: nội dung khách viết vẫn
   * còn để đối chiếu khi có khiếu nại.
   */
  hidden?: boolean;
};

/**
 * Bình luận dưới bài viết Góc sức khoẻ.
 *
 * Khác đánh giá ở chỗ: đánh giá gắn với một đơn đã giao, bình luận chỉ gắn với
 * bài viết — người đọc hỏi thêm, không cần mua. Vì không có đăng nhập, quyền
 * sửa/xoá của chính mình chứng minh bằng mã bình luận trong cookie máy này.
 */
export type Comment = {
  id: string;
  articleSlug: string;
  author: string;
  /** Chữ viết tắt hiện trong vòng tròn avatar. */
  initials: string;
  /** ISO datetime — bình luận cần giờ, không chỉ ngày. */
  date: string;
  body: string;
  /** Quản trị ẩn khỏi bài viết. Ẩn chứ không xoá, cùng lý do với đánh giá. */
  hidden?: boolean;
  /** Trả lời của dược sĩ. Mỗi bình luận một câu trả lời, hiện ngay dưới nó. */
  reply?: {
    body: string;
    author: string;
    date: string;
  };
};

/**
 * Tổng hợp đánh giá. Phân bố sao lấy trực tiếp từ dữ liệu chứ không tự bịa
 * để tổng phần trăm luôn bằng 100.
 */
export type ReviewSummary = {
  productId: string;
  score: number;
  count: number;
  satisfactionPercent: number;
  /** Phần trăm theo từng mức sao, chỉ số 0 = 5 sao. */
  distribution: [number, number, number, number, number];
};

/** Ba mức cảnh báo tương tác thuốc. */
export type InteractionSeverity = "nghiem-trong" | "trung-binh" | "nhe";

export type Interaction = {
  severity: InteractionSeverity;
  drugA: string;
  drugB: string;
  /** Cơ chế, viết cho người không học dược. */
  mechanism: string;
  advice: string;
};

export type CartLine = {
  productId: string;
  unitLabel: UnitLabel;
  quantity: number;
};

/** Triệu chứng nguy hiểm — chặn gợi ý sản phẩm, đẩy sang cơ sở y tế. */
export type RedFlag = {
  label: string;
  action: string;
};

export type AiConfidence = {
  /** 0–100. Dưới 70 phải hiện nhiều ứng viên thay vì một kết quả. */
  percent: number;
};

export type CategoryNode = {
  slug: string;
  name: string;
};
