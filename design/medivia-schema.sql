-- MediVia — lược đồ cơ sở dữ liệu
-- PostgreSQL 16
--
-- Sinh từ PHAN-TICH-THIET-KE-DATABASE.md, Phần 3. Mọi bảng ở đây ánh xạ một
-- kiểu dữ liệu có thật trong lib/types.ts hoặc một hàm có thật trong lib/data/;
-- không có bảng nào thêm vào cho đủ.
--
-- Bản mẫu CHƯA dùng tệp này. Đây là đích đến khi thay lib/data/*.ts bằng truy
-- vấn thật: tên hàm và kiểu trả về giữ nguyên, nên không trang nào phải sửa.
--
-- Chạy: psql -d medivia -f design/medivia-schema.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- NHÓM A — DANH MỤC HÀNG HOÁ
-- ============================================================

CREATE TYPE product_type   AS ENUM ('drug', 'supplement', 'cosmetic', 'device');
CREATE TYPE dosage_form    AS ENUM ('vien-nen', 'vien-sui', 'siro', 'goi-bot',
                                    'xit-nho', 'vien-ngam', 'ong-uong', 'dung-dich');
CREATE TYPE audience       AS ENUM ('nguoi-lon', 'tre-em', 'nguoi-cao-tuoi');
CREATE TYPE unit_label     AS ENUM ('Hộp', 'Vỉ', 'Viên', 'Tuýp', 'Lọ', 'Chai', 'Gói');
CREATE TYPE severity       AS ENUM ('nghiem-trong', 'trung-binh', 'nhe');

-- Hai vai trò, không phải ba: chỉ có hai loại việc khác nhau về trách nhiệm pháp
-- lý. `duoc-si` là người DUY NHẤT được duyệt đơn thuốc, vì đơn thuốc kê đơn phải
-- có người có chứng chỉ hành nghề đứng tên.
CREATE TYPE admin_role     AS ENUM ('duoc-si', 'ke-toan');

CREATE TABLE categories (
  slug                  varchar(64)  PRIMARY KEY,
  name                  varchar(128) NOT NULL,
  short_name            varchar(64)  NOT NULL,
  -- Khoá icon, không phải tên tệp: giao diện tra khoá trong `lib/data/categories.ts`.
  icon                  varchar(32)  NOT NULL,
  description           text         NOT NULL,
  -- Gợi ý AI ở dải tím trang danh mục. Để trống thì khối tự ẩn.
  ai_hint_message       text,
  ai_hint_action_label  varchar(64),
  ai_hint_action_href   varchar(128),
  sort_order            smallint     NOT NULL DEFAULT 0,
  -- Hint chỉ có nghĩa khi đủ cả câu chữ; href phải trỏ tới một đường dẫn có thật.
  CONSTRAINT hint_action_complete CHECK (
    (ai_hint_action_label IS NULL) = (ai_hint_action_href IS NULL)
  ),
  -- Đích của nút có thể là một danh mục khác ("xem thuốc long đờm") hoặc một
  -- công cụ AI ("kiểm tra tương tác"). Cả hai đều là đích thật trong ứng dụng;
  -- chỉ chặn đường dẫn ra ngoài hai nhánh đó.
  CONSTRAINT hint_href_is_known CHECK (
    ai_hint_action_href IS NULL
    OR ai_hint_action_href LIKE '/danh-muc/%'
    OR ai_hint_action_href LIKE '/ai/%'
  )
);

CREATE TABLE products (
  id                     varchar(64)  PRIMARY KEY,
  -- slug KHÁC id: `augmentin-625` (id) so với `augmentin-625mg` (slug).
  -- Mọi bảng khác tham chiếu product_id; mọi đường dẫn công khai dùng slug.
  slug                   varchar(128) NOT NULL UNIQUE,
  name                   varchar(255) NOT NULL,
  brand                  varchar(128) NOT NULL,
  origin                 varchar(64)  NOT NULL,
  category_slug          varchar(64)  NOT NULL REFERENCES categories(slug),
  type                   product_type NOT NULL,
  dosage_form            dosage_form  NOT NULL,
  audiences              audience[]   NOT NULL DEFAULT '{}',
  -- Cột quan trọng nhất bảng này: true ⇒ mọi nơi hiển thị phải bỏ nút thêm giỏ.
  prescription_required  boolean      NOT NULL DEFAULT false,
  strength               varchar(64),
  image_url              varchar(255),
  short_uses             text         NOT NULL,
  -- rating_score và rating_count đi thành cặp hoặc cùng NULL: hai con số này
  -- phải nói cùng một chuyện, có điểm mà không có lượt đánh giá là vô nghĩa.
  rating_score           numeric(2,1) CHECK (rating_score BETWEEN 0 AND 5),
  rating_count           integer      CHECK (rating_count >= 0),
  -- Ngày dự kiến có hàng lại. Chỉ có nghĩa khi tổng tồn bằng 0: trang chi tiết
  -- hiện "có hàng lại từ …", form kho thuốc nhập được, và thông báo cho khách
  -- chờ hàng đọc đúng cột này.
  restock_date           date,
  CONSTRAINT rating_is_a_pair CHECK (
    (rating_score IS NULL) = (rating_count IS NULL)
  ),
  -- Thiết bị y tế và dược mỹ phẩm không kê đơn.
  CONSTRAINT only_drug_needs_prescription CHECK (
    NOT prescription_required OR type = 'drug'
  )
);

CREATE INDEX products_category_idx ON products (category_slug);
CREATE INDEX products_rx_idx ON products (prescription_required) WHERE prescription_required;

-- Giá thuộc về ĐƠN VỊ BÁN, không thuộc về sản phẩm.
CREATE TABLE product_units (
  id              bigserial   PRIMARY KEY,
  product_id      varchar(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_label      unit_label  NOT NULL,
  price           integer     NOT NULL CHECK (price >= 0),
  original_price  integer     CHECK (original_price >= price),
  packaging       varchar(64),
  UNIQUE (product_id, unit_label)
);

-- 1–1 TUỲ CHỌN với products. Bảng cố ý thiếu 18/24 sản phẩm: trang chi tiết vẫn
-- chạy, chỉ bỏ khối tóm tắt AI. Khối tóm tắt sai liều tệ hơn khối vắng mặt.
CREATE TABLE product_details (
  product_id               varchar(64) PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  registration_number      varchar(32)  NOT NULL,
  manufacturer             varchar(255) NOT NULL,
  shelf_life               varchar(128) NOT NULL,
  therapeutic_group        varchar(128) NOT NULL,
  uses                     text[]       NOT NULL DEFAULT '{}',
  dosage                   text[]       NOT NULL DEFAULT '{}',
  cautions                 text[]       NOT NULL DEFAULT '{}',
  side_effects             text         NOT NULL,
  storage                  text         NOT NULL,
  manufacturer_source_label varchar(255) NOT NULL,
  quick_questions          text[]       NOT NULL DEFAULT '{}'
);

-- Hoạt chất là THỰC THỂ RIÊNG, không phải cột chuỗi. Đây là điều kiện để cảnh
-- báo tương tác chạy đúng: người mua Hapacol rồi mua Panadol không nghĩ mình
-- đang uống hai lần cùng một thuốc vì hai cái tên chẳng liên quan gì nhau.
CREATE TABLE active_ingredients (
  id    serial       PRIMARY KEY,
  name  varchar(128) NOT NULL UNIQUE
);

CREATE TABLE product_ingredients (
  product_id     varchar(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id  integer     NOT NULL REFERENCES active_ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, ingredient_id)
);

CREATE INDEX product_ingredients_ingredient_idx ON product_ingredients (ingredient_id);

-- Nhãn thuốc Việt Nam ghi tên INN ("Acid acetylsalicylic") còn luật tương tác và
-- người dùng gọi tên thông dụng ("Aspirin"). Không có bảng này thì Aspirin 81
-- không bao giờ khớp luật Warfarin × Aspirin — cảnh báo xuất huyết im lặng mất.
CREATE TABLE ingredient_aliases (
  alias          varchar(128) PRIMARY KEY,  -- viết thường, không dấu
  ingredient_id  integer      NOT NULL REFERENCES active_ingredients(id) ON DELETE CASCADE
);

CREATE TABLE interaction_rules (
  id                serial  PRIMARY KEY,
  severity          severity NOT NULL,
  ingredient_a_id   integer  NOT NULL REFERENCES active_ingredients(id) ON DELETE CASCADE,
  ingredient_b_id   integer  NOT NULL REFERENCES active_ingredients(id) ON DELETE CASCADE,
  mechanism         text     NOT NULL,
  advice            text     NOT NULL,
  -- Bắt buộc ở tầng cơ sở dữ liệu, không phải cho đẹp: thiếu nó thì bảng có cả
  -- (Warfarin, Aspirin) lẫn (Aspirin, Warfarin) và mỗi cặp bị cảnh báo hai lần.
  -- Ràng buộc ở đây chặn được; một dòng `if` trong mã thì không, vì mã có nhiều
  -- đường vào.
  CONSTRAINT pair_ordered UNIQUE (ingredient_a_id, ingredient_b_id),
  CONSTRAINT pair_sorted  CHECK (ingredient_a_id <= ingredient_b_id)
);

CREATE TABLE reviews (
  id                 varchar(64) PRIMARY KEY,
  product_id         varchar(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author             varchar(128) NOT NULL,
  initials           varchar(4)   NOT NULL,
  score              smallint     NOT NULL CHECK (score BETWEEN 1 AND 5),
  body               text         NOT NULL,
  created_at         date         NOT NULL,
  verified_purchase  boolean      NOT NULL DEFAULT false,
  -- Đuôi tệp nằm ngay trong tên: máy chủ suy `Content-Type` từ đó lúc phục vụ,
  -- không tin kiểu MIME trình duyệt khai lúc tải lên.
  photos             text[]       NOT NULL DEFAULT '{}',
  video              text,
  -- Đơn đã giao dùng để xác thực câu "đã mua tại MediVia". NULL với đánh giá
  -- mẫu: chúng có trước khi có đường viết đánh giá. Khoá ngoại gắn sau, ở cuối
  -- tệp — `orders` được tạo sau bảng này, và PostgreSQL không cho tham chiếu tới
  -- bảng chưa tồn tại.
  order_code         varchar(16),
  -- Quản trị ẩn khỏi trang sản phẩm. Ẩn chứ KHÔNG xoá: nội dung khách viết là
  -- bằng chứng khi có khiếu nại.
  hidden             boolean      NOT NULL DEFAULT false,
  CONSTRAINT photos_within_limit CHECK (cardinality(photos) <= 3)
);

CREATE INDEX reviews_product_idx ON reviews (product_id, created_at DESC);

CREATE TABLE pharmacies (
  id              serial       PRIMARY KEY,
  name            varchar(128) NOT NULL,
  address         varchar(255) NOT NULL,
  province        varchar(128) NOT NULL,
  district        varchar(128) NOT NULL,
  latitude        numeric(9,6) NOT NULL,
  longitude       numeric(9,6) NOT NULL,
  opening_hours   varchar(128) NOT NULL,
  -- In ở danh sách nhà thuốc để khách gọi trước khi tới.
  phone           varchar(32)  NOT NULL,
  is_pickup_point boolean      NOT NULL DEFAULT false
);

-- Tồn kho tách theo từng nhà thuốc: "còn 3 nhà thuốc gần đây có hàng" là câu hỏi
-- không trả lời được bằng một con số tổng.
CREATE TABLE stock_levels (
  product_id   varchar(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  pharmacy_id  integer     NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  quantity     integer     NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (product_id, pharmacy_id)
);

CREATE INDEX stock_levels_pharmacy_idx ON stock_levels (pharmacy_id) WHERE quantity > 0;

-- Hạn dùng thuộc về LÔ, không thuộc về sản phẩm. Một sản phẩm nhập ba đợt có ba
-- hạn khác nhau; hỏi "hạn dùng của Hapacol là bao nhiêu" là câu hỏi không có câu
-- trả lời đúng nếu chỉ có một cột `expiry_date` trên bảng `products`.
--
-- `quantity` ở đây là tồn của lô trên TOÀN HỆ THỐNG, còn `stock_levels` chia theo
-- nhà thuốc. Hai bảng đếm hai thứ khác nhau và phải cộng khớp: hệ thật nên gộp
-- thành `stock_levels(product_id, pharmacy_id, lot)` để mỗi nhà thuốc biết mình
-- còn lô nào. ponytail: để rời vì bản mẫu chưa có luồng chuyển kho giữa nhà thuốc.
CREATE TABLE product_batches (
  product_id   varchar(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  -- Mã lô in trên vỏ hộp. Khoá cùng sản phẩm: hai sản phẩm khác nhau nhà sản
  -- xuất có thể trùng mã lô, gộp thành một khoá toàn cục là xoá mất một lô thật.
  lot          varchar(64) NOT NULL,
  quantity     integer     NOT NULL CHECK (quantity >= 0),
  expiry_date  date        NOT NULL,
  PRIMARY KEY (product_id, lot)
);

-- Truy vấn thường gặp là "lô nào hết hạn trước" — đúng thứ tự xuất kho FEFO.
CREATE INDEX product_batches_fefo_idx ON product_batches (product_id, expiry_date)
  WHERE quantity > 0;
-- Cảnh báo "lô cận hạn" quét toàn kho theo hạn, không theo sản phẩm.
CREATE INDEX product_batches_expiry_idx ON product_batches (expiry_date)
  WHERE quantity > 0;

-- Gợi ý "Thường được mua cùng" — tính năng AI #4.
CREATE TYPE combo_scope AS ENUM ('product', 'category');

CREATE TABLE combo_suggestions (
  id                    bigserial   PRIMARY KEY,
  scope                 combo_scope NOT NULL,
  -- product_id hoặc category_slug, tuỳ theo `scope`. Không đặt khoá ngoại được
  -- vì trỏ tới hai bảng khác nhau; ràng buộc nằm ở mã nạp dữ liệu.
  scope_id              varchar(64) NOT NULL,
  -- Câu giải thích căn cứ của CẢ khối, ví dụ "Dựa trên triệu chứng sốt...".
  basis                 text        NOT NULL,
  suggested_product_id  varchar(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  -- NOT NULL có chủ ý: danh sách sản phẩm không kèm lý do chỉ là quảng cáo, câu
  -- "Bù nước khi sốt cao" mới giúp người mua tự quyết định. Bắt buộc ở lược đồ
  -- thì không ai thêm được gợi ý trống lý do.
  reason                varchar(255) NOT NULL,
  sort_order            smallint     NOT NULL DEFAULT 0,
  UNIQUE (scope, scope_id, suggested_product_id)
);

CREATE INDEX combo_suggestions_scope_idx ON combo_suggestions (scope, scope_id, sort_order);

-- Gợi ý phải lọc TRƯỚC KHI trả kết quả: bỏ hết hàng, bỏ thuốc kê đơn (không được
-- bán thêm kèm), bỏ sản phẩm cùng danh mục đang xem. Ba bộ lọc đó nằm ở view này
-- chứ không chỉ trong mã, vì mã có nhiều đường vào còn view thì chỉ một.
CREATE VIEW combo_suggestions_sellable AS
SELECT cs.*
FROM combo_suggestions cs
JOIN products p ON p.id = cs.suggested_product_id
WHERE NOT p.prescription_required
  AND COALESCE((SELECT sum(sl.quantity) FROM stock_levels sl
                WHERE sl.product_id = p.id), 0) > 0
  AND NOT (cs.scope = 'category' AND p.category_slug = cs.scope_id);

-- ============================================================
-- NHÓM B — BÁN HÀNG
-- ============================================================

CREATE TABLE customers (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Số điện thoại là khoá nhận diện chính, không phải email: người mua thuốc
  -- thường không có email, và tra cứu đơn hàng tra bằng số điện thoại.
  phone       varchar(16)  NOT NULL UNIQUE,
  full_name   varchar(128) NOT NULL,
  email       varchar(255),
  -- `scrypt$<salt>$<hash>`, KHÔNG lưu chữ thô. Xem `lib/shop/customer-auth.ts`.
  -- Cột này là lý do khách đăng nhập được; thiếu nó thì `customers` chỉ còn là
  -- danh bạ, và mọi mật khẩu phải nằm đâu đó ngoài lược đồ.
  password_hash text       NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE customer_addresses (
  id           bigserial    PRIMARY KEY,
  customer_id  uuid         NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  province     varchar(128) NOT NULL,
  district     varchar(128) NOT NULL,
  ward         varchar(128) NOT NULL,
  street       varchar(255) NOT NULL,
  is_default   boolean      NOT NULL DEFAULT false
);

CREATE INDEX customer_addresses_customer_idx ON customer_addresses (customer_id);

-- Tài khoản quản trị.
--
-- Password nằm thẳng trong mã ở bản mẫu (`lib/admin/users.ts`) vì không có cơ sở
-- dữ liệu và cả ba tài khoản đều là trình diễn. Khi có bảng này thì không còn lý
-- do đó: một dòng trong bảng còn xoá được, một chuỗi trong mã thì phải deploy lại.
-- Vẫn là `password_hash` chứ không phải mật khẩu thô — thói quen viết sai một lần
-- là sai luôn ở chỗ thật.
CREATE TABLE admin_users (
  username      varchar(64)  PRIMARY KEY,
  -- Cùng định dạng `scrypt$<salt>$<hash>` với `customers.password_hash`.
  password_hash text         NOT NULL,
  full_name     varchar(128) NOT NULL,
  role          admin_role   NOT NULL,
  title         varchar(128) NOT NULL,
  active        boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now()
);

-- Vai trò quyết định ai được duyệt đơn thuốc. Tra thẳng bằng SQL khi cần kiểm
-- toán: "đơn này ai duyệt" phải trả lời được mà không mở mã nguồn.
CREATE INDEX admin_users_role_idx ON admin_users (role) WHERE active;

CREATE TABLE carts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid        REFERENCES customers(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Dòng giỏ trỏ tới ĐƠN VỊ BÁN, không trỏ tới sản phẩm: khách chọn "2 hộp" chứ
-- không chọn "2 Hapacol 650", và giá của hai thứ đó khác nhau.
CREATE TABLE cart_items (
  cart_id         uuid    NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_unit_id bigint  NOT NULL REFERENCES product_units(id) ON DELETE CASCADE,
  quantity        integer NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (cart_id, product_unit_id)
);

CREATE TYPE coupon_kind AS ENUM ('amount', 'freeship');

CREATE TABLE coupons (
  code          varchar(32) PRIMARY KEY,
  kind          coupon_kind NOT NULL,
  amount        integer     CHECK (amount > 0),
  -- Điều kiện áp dụng là MỘT CON SỐ, không phải câu chữ. Nếu chỉ nằm trong câu
  -- mô tả thì mã vẫn áp được cho đơn chưa đủ điều kiện, và người dùng chỉ phát
  -- hiện ở bước thanh toán.
  min_subtotal  integer     NOT NULL CHECK (min_subtotal >= 0),
  description   varchar(255) NOT NULL,
  active        boolean     NOT NULL DEFAULT true,
  -- Cửa sổ hiệu lực. Bỏ trống = không giới hạn. Dùng `date` chứ không phải
  -- timestamptz: mã mở lúc 0h giờ Việt Nam, không phải 0h UTC (sớm hơn 7 tiếng).
  -- Ngày kết thúc tính CẢ ngày đó.
  start_at      date,
  end_at        date,
  CONSTRAINT window_ordered CHECK (start_at IS NULL OR end_at IS NULL OR start_at <= end_at),
  CONSTRAINT amount_matches_kind CHECK (
    (kind = 'amount' AND amount IS NOT NULL) OR
    (kind = 'freeship' AND amount IS NULL)
  )
);

CREATE TABLE delivery_methods (
  id     varchar(32) PRIMARY KEY,   -- nhanh | tieu-chuan | nhan-tai-nha-thuoc
  name   varchar(128) NOT NULL,
  fee    integer      NOT NULL CHECK (fee >= 0),
  active boolean      NOT NULL DEFAULT true
);

CREATE TABLE payment_methods (
  id     varchar(32) PRIMARY KEY,   -- cod | momo | zalopay | vnpay | the
  name   varchar(128) NOT NULL,
  note   varchar(255),
  active boolean      NOT NULL DEFAULT true
);

CREATE TYPE order_status AS ENUM (
  'cho-xac-nhan', 'da-xac-nhan', 'dang-giao', 'da-giao',
  -- Giao quá 3 ngày mà khách không phản hồi thì đơn tự đóng; 'da-giao' là trạng
  -- thái duy nhất còn mở cửa sổ đổi trả.
  'hoan-thanh', 'hoan-tra', 'da-huy'
);

-- Kết quả xử lý một yêu cầu hoàn trả. NULL = khách đã báo, quản trị chưa xem.
CREATE TYPE return_decision AS ENUM ('da-chap-nhan', 'tu-choi');

CREATE TABLE orders (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  -- MV + DDMM + 4 số.
  code                  varchar(16)   NOT NULL UNIQUE,
  customer_id           uuid          REFERENCES customers(id) ON DELETE SET NULL,
  status                order_status  NOT NULL DEFAULT 'cho-xac-nhan',
  original_subtotal     integer       NOT NULL CHECK (original_subtotal >= 0),
  subtotal              integer       NOT NULL CHECK (subtotal >= 0),
  product_discount      integer       NOT NULL DEFAULT 0 CHECK (product_discount >= 0),
  coupon_code           varchar(32)   REFERENCES coupons(code) ON DELETE SET NULL,
  coupon_discount       integer       NOT NULL DEFAULT 0 CHECK (coupon_discount >= 0),
  shipping_fee          integer       NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total                 integer       NOT NULL CHECK (total >= 0),
  delivery_method_id    varchar(32)   NOT NULL REFERENCES delivery_methods(id),
  payment_method_id     varchar(32)   NOT NULL REFERENCES payment_methods(id),
  -- Suy ra từ các dòng hàng, nhưng chốt lại ở đây để tra nhanh hàng đợi duyệt.
  requires_prescription boolean       NOT NULL DEFAULT false,
  note                  text,
  -- Đơn khách tự đặt có cả hai: email để gửi xác nhận, và địa chỉ giao dạng
  -- một chuỗi đã ghép. Địa chỉ ở đây là BẢN CHỤP lúc đặt hàng, không phải khoá
  -- tới `customer_addresses`: sửa sổ địa chỉ về sau không được viết lại đơn cũ.
  email                 varchar(255),
  address               text,
  company_name          varchar(255),
  tax_code              varchar(32),
  created_at            timestamptz   NOT NULL DEFAULT now(),
  -- Mốc giao thành công. Cửa sổ 3 ngày tự hoàn thành tính từ đây, không từ
  -- created_at: đơn giao chậm không được tự đóng trước khi khách cầm hàng.
  delivered_at          timestamptz,
  return_reason         text,
  return_note           text,
  return_requested_at   timestamptz,
  return_decision       return_decision,
  return_decided_at     timestamptz,
  -- Hoàn trả luôn có lý do. Chuyển sang 'hoan-tra' mà không ghi vì sao là đơn
  -- mất tiền không ai giải thích được.
  CONSTRAINT return_needs_reason CHECK (
    status <> 'hoan-tra' OR return_reason IS NOT NULL
  )
);

CREATE INDEX orders_code_idx ON orders (code);
CREATE INDEX orders_customer_idx ON orders (customer_id, created_at DESC);

-- Khoá ngoại của `reviews.order_code` gắn ở đây: bảng `reviews` tạo trước
-- `orders`, và PostgreSQL từ chối tham chiếu tới bảng chưa tồn tại. ON DELETE SET
-- NULL chứ không CASCADE: xoá một đơn không được làm biến mất đánh giá của khách.
ALTER TABLE reviews
  ADD CONSTRAINT reviews_order_fk
  FOREIGN KEY (order_code) REFERENCES orders(code) ON DELETE SET NULL;
CREATE INDEX orders_rx_queue_idx ON orders (status) WHERE requires_prescription;

CREATE TABLE order_items (
  id                    bigserial   PRIMARY KEY,
  order_id              uuid        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id            varchar(64) NOT NULL REFERENCES products(id),
  unit_label            unit_label  NOT NULL,
  quantity              integer     NOT NULL CHECK (quantity > 0),
  -- Ảnh chụp giá tại thời điểm mua. Đọc lại từ product_units thì lần đổi giá sau
  -- sẽ viết lại toàn bộ hoá đơn cũ.
  unit_price            integer     NOT NULL CHECK (unit_price >= 0),
  original_unit_price   integer     CHECK (original_unit_price >= unit_price),
  line_total            integer     NOT NULL CHECK (line_total >= 0),
  CONSTRAINT line_total_matches CHECK (line_total = unit_price * quantity)
);

CREATE INDEX order_items_order_idx ON order_items (order_id);

CREATE TABLE shipments (
  order_id            uuid        PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  delivery_method_id  varchar(32) NOT NULL REFERENCES delivery_methods(id),
  -- Chỉ có khi nhận tại nhà thuốc.
  pharmacy_id         integer     REFERENCES pharmacies(id),
  pickup_code         varchar(16),
  pickup_expires_at   timestamptz,
  -- Ba cột này đi cùng nhau: có nhà thuốc nhận hàng thì phải có mã nhận và hạn
  -- giữ hàng, và ngược lại. Ràng buộc gộp một dòng để không phải nhớ ba tên.
  CONSTRAINT pickup_fields_together CHECK (
    (pharmacy_id IS NULL) = (pickup_code IS NULL)
    AND (pharmacy_id IS NULL) = (pickup_expires_at IS NULL)
  ),
  CONSTRAINT pickup_needs_pickup_method CHECK (
    pharmacy_id IS NULL OR delivery_method_id = 'nhan-tai-nha-thuoc'
  )
);

CREATE TYPE prescription_status AS ENUM ('cho-duyet', 'da-duyet', 'tu-choi');

-- Bảng NHẠY CẢM, vòng đời riêng. Ba ràng buộc dưới đây là ba lời hứa trong
-- chính sách bảo mật, nên phải cài ở tầng lược đồ, không chỉ ở tầng giao diện.
CREATE TABLE prescriptions (
  id             uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       uuid                NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  -- (1) Khoá tới kho lưu trữ, KHÔNG phải URL công khai ai cũng đoán được.
  storage_key    varchar(255)        NOT NULL,
  mime_type      varchar(64)         NOT NULL
    CHECK (mime_type IN ('image/jpeg', 'image/png', 'application/pdf')),
  size_bytes     integer             NOT NULL CHECK (size_bytes <= 10485760),  -- 10 MB
  status         prescription_status NOT NULL DEFAULT 'cho-duyet',
  reject_reason  varchar(255),
  reviewed_by    varchar(128),
  reviewed_at    timestamptz,
  -- (3) Xoá sau khi đơn hoàn tất — một tác vụ định kỳ đọc cột này. Một lời hứa
  -- không có cột nào giữ thì không phải lời hứa.
  delete_after   timestamptz         NOT NULL,
  CONSTRAINT reject_needs_reason CHECK (
    status <> 'tu-choi' OR reject_reason IS NOT NULL
  ),
  CONSTRAINT review_is_stamped CHECK (
    (reviewed_by IS NULL) = (reviewed_at IS NULL)
  )
);

CREATE INDEX prescriptions_pending_idx ON prescriptions (status) WHERE status = 'cho-duyet';
CREATE INDEX prescriptions_delete_idx ON prescriptions (delete_after);

-- ============================================================
-- NHÓM C — AI
-- ============================================================

CREATE TYPE ai_tool AS ENUM (
  'tu-van', 'tim-kiem', 'chatbot', 'nhan-dien', 'tuong-tac', 'giong-noi'
);

CREATE TABLE ai_sessions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  uuid        REFERENCES customers(id) ON DELETE SET NULL,
  tool         ai_tool     NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Nguồn của bảng "mức sử dụng công cụ AI" ở /admin/phan-tich.
CREATE TABLE ai_tool_events (
  id            bigserial   PRIMARY KEY,
  session_id    uuid        REFERENCES ai_sessions(id) ON DELETE SET NULL,
  tool          ai_tool     NOT NULL,
  added_to_cart boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_tool_events_tool_idx ON ai_tool_events (tool, created_at);

-- Bốn bảng kết quả, cùng một khuôn. Chúng lưu KẾT QUẢ ĐÃ CHUẨN HOÁ, không lưu
-- prompt và không lưu văn xuôi tự do. Khi lắp mô hình thật, dữ liệu mẫu viết tay
-- và kết quả mô hình phải nằm cùng một bảng cùng một khuôn — nếu không thì giao
-- diện phải có hai nhánh, và bản mẫu không còn dự báo đúng hình dạng bản thật.
CREATE TABLE ai_consult_results (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid        NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  query         text        NOT NULL,
  reading       text        NOT NULL,
  groups        jsonb       NOT NULL,  -- [{ title, reason, product_ids[] }]
  red_flags     jsonb       NOT NULL DEFAULT '[]',
  self_care     text[]      NOT NULL DEFAULT '{}',
  confidence    smallint    NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_search_results (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid        NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  query         text        NOT NULL,
  understood    text        NOT NULL,
  filters       jsonb       NOT NULL DEFAULT '[]',
  hits          jsonb       NOT NULL,  -- [{ product_id, reason }]
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_identify_results (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid        NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  read_text     text[]      NOT NULL DEFAULT '{}',
  candidates    jsonb       NOT NULL,  -- [{ product_id, percent, evidence[] }]
  confidence    smallint    NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  must_verify   text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_messages (
  id                bigserial   PRIMARY KEY,
  session_id        uuid        NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  question          text        NOT NULL,
  paragraphs        text[]      NOT NULL DEFAULT '{}',
  follow_ups        text[]      NOT NULL DEFAULT '{}',
  needs_pharmacist  boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_messages_session_idx ON ai_messages (session_id, created_at);

-- Thư viện cờ đỏ triệu chứng. Ở cơ sở dữ liệu chứ không viết trong mã: danh sách
-- này do dược sĩ cập nhật, không do lập trình viên. Đây là dữ liệu y khoa.
CREATE TABLE red_flags (
  id        serial       PRIMARY KEY,
  label     varchar(128) NOT NULL,
  action    text         NOT NULL,
  keywords  text[]       NOT NULL DEFAULT '{}'
);

CREATE TYPE handoff_reason AS ENUM (
  'lieu-tre-em', 'thai-cho-con-bu', 'thuoc-ke-don', 'dau-hieu-nghi-nang'
);
CREATE TYPE handoff_status AS ENUM ('cho-tiep-nhan', 'dang-xu-ly', 'xong');

-- Chỉ số AN TOÀN, không phải chỉ số thất bại: một chatbot dược sĩ chuyển 0% ca
-- sang người thật là chatbot đang trả lời những câu nó không đủ thẩm quyền.
CREATE TABLE pharmacist_handoffs (
  id            bigserial      PRIMARY KEY,
  session_id    uuid           NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  reason        handoff_reason NOT NULL,
  status        handoff_status NOT NULL DEFAULT 'cho-tiep-nhan',
  pharmacist_id varchar(128),
  created_at    timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX pharmacist_handoffs_queue_idx ON pharmacist_handoffs (status, created_at);

-- ============================================================
-- NHÓM D — NỘI DUNG VÀ TỔNG HỢP
-- ============================================================

CREATE TABLE static_pages (
  slug        varchar(64)  PRIMARY KEY,  -- gioi-thieu, faq, ...
  title       varchar(255) NOT NULL,
  lead        text         NOT NULL,
  sort_order  smallint     NOT NULL DEFAULT 0
);

CREATE TABLE page_sections (
  id          bigserial    PRIMARY KEY,
  page_slug   varchar(64)  NOT NULL REFERENCES static_pages(slug) ON DELETE CASCADE,
  title       varchar(255) NOT NULL,
  body        text[]       NOT NULL DEFAULT '{}',
  list_items  text[]       NOT NULL DEFAULT '{}',
  sort_order  smallint     NOT NULL DEFAULT 0
);

CREATE INDEX page_sections_page_idx ON page_sections (page_slug, sort_order);

-- Bài viết Góc sức khoẻ.
--
-- Thân bài là MẢNG KHỐI JSONB chứ không phải `page_sections` dùng lại: bài viết
-- có ba loại khối (đoạn, danh sách, khung cảnh báo) và thứ tự trộn lẫn giữa
-- chúng là nội dung, không phải trình bày. Tách thành bảng khối thì mỗi khối
-- thành một dòng, và sửa một câu văn là một thao tác ghi chứ không phải một
-- phép sửa chuỗi.
CREATE TABLE articles (
  slug            varchar(128) PRIMARY KEY,
  tag             varchar(64)  NOT NULL,
  title           varchar(255) NOT NULL,
  excerpt         text         NOT NULL,
  author          varchar(128) NOT NULL,
  published_at    date         NOT NULL,
  reading_minutes smallint     NOT NULL CHECK (reading_minutes > 0),
  image_url       varchar(255) NOT NULL,
  -- [{kind: 'para'|'list'|'warning', text?, items?}] — đúng kiểu `ArticleBlock`.
  body            jsonb        NOT NULL DEFAULT '[]'
);

CREATE INDEX articles_published_idx ON articles (published_at DESC);

-- Bình luận dưới bài viết. Khác đánh giá sản phẩm ở ba điểm: gắn với BÀI chứ
-- không với sản phẩm, có GIỜ chứ không chỉ ngày (một câu hỏi về liều thuốc lúc
-- 22h khác hẳn lúc 9h sáng), và có thể được dược sĩ trả lời ngay dưới.
CREATE TABLE comments (
  id           varchar(64)  PRIMARY KEY,
  article_slug varchar(128) NOT NULL REFERENCES articles(slug) ON DELETE CASCADE,
  author       varchar(128) NOT NULL,
  initials     varchar(4)   NOT NULL,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  body         text         NOT NULL,
  -- Ẩn chứ KHÔNG xoá — cùng lý do với `reviews.hidden`.
  hidden       boolean      NOT NULL DEFAULT false,
  -- Một câu trả lời cho mỗi bình luận. Ba cột đi cùng nhau hoặc cùng NULL; câu
  -- trả lời không có người ký thì người đọc không biết ai chịu trách nhiệm.
  reply_body   text,
  reply_author varchar(128),
  reply_at     timestamptz,
  CONSTRAINT reply_complete CHECK (
    (reply_body IS NULL) = (reply_author IS NULL)
    AND (reply_body IS NULL) = (reply_at IS NULL)
  )
);

CREATE INDEX comments_article_idx ON comments (article_slug, created_at DESC);
-- Hàng đợi "bình luận chờ trả lời" ở /admin/binh-luan.
CREATE INDEX comments_unanswered_idx ON comments (created_at DESC)
  WHERE NOT hidden AND reply_body IS NULL;

-- Bảng TÍNH SẴN theo đêm, không phải bảng giao dịch. Trang phân tích và câu nhận
-- xét do AI viết PHẢI đọc cùng một nguồn: nếu trang tự tính một phần và AI tính
-- phần khác thì sẽ có ngày biểu đồ nói doanh thu tăng còn câu nhận xét nói giảm,
-- và người đọc không có cách nào biết bên nào đúng.
CREATE TABLE daily_sales (
  date      date    PRIMARY KEY,
  revenue   bigint  NOT NULL CHECK (revenue >= 0),
  orders    integer NOT NULL CHECK (orders >= 0)
);

CREATE TABLE category_sales (
  period_from     date         NOT NULL,
  period_to       date         NOT NULL,
  category_slug   varchar(64)  NOT NULL REFERENCES categories(slug),
  revenue         bigint       NOT NULL CHECK (revenue >= 0),
  orders          integer      NOT NULL CHECK (orders >= 0),
  change_percent  numeric(5,1) NOT NULL,
  PRIMARY KEY (period_from, period_to, category_slug),
  CONSTRAINT period_ordered CHECK (period_from <= period_to)
);

CREATE TABLE product_sales (
  period_from  date        NOT NULL,
  period_to    date        NOT NULL,
  product_id   varchar(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  units_sold   integer     NOT NULL CHECK (units_sold >= 0),
  views        integer     NOT NULL CHECK (views >= 0),
  PRIMARY KEY (period_from, period_to, product_id),
  CONSTRAINT sales_period_ordered CHECK (period_from <= period_to)
);

-- Trung bình bán mỗi ngày trong kỳ báo cáo, dùng để tính số ngày còn hàng.
CREATE VIEW stock_forecast AS
SELECT p.id                                          AS product_id,
       p.slug,
       p.name,
       COALESCE((SELECT sum(sl.quantity) FROM stock_levels sl
                 WHERE sl.product_id = p.id), 0)::integer AS remaining,
       COALESCE((SELECT ps.units_sold::numeric /
                        NULLIF((ps.period_to - ps.period_from), 0)
                 FROM product_sales ps
                 WHERE ps.product_id = p.id
                 ORDER BY ps.period_to DESC LIMIT 1), 0)   AS daily_rate
FROM products p;

-- ============================================================
-- TÌM KIẾM TIẾNG VIỆT
-- ============================================================
--
-- PostgreSQL KHÔNG có cấu hình `vietnamese`. Dùng `simple` kèm cột đã bỏ dấu,
-- sinh tự động khi ghi. Bản mẫu đã làm đúng cách này trong lib/ai/engine.ts
-- (normalize() bỏ dấu trước khi so khớp), nên đây chỉ là làm lại điều tương tự
-- ở tầng cơ sở dữ liệu.
--
-- unaccent cần thiết vì 'đ' không phải nguyên âm có dấu thanh — NFD không tách
-- được nó, phải thay tay.

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION medivia_unaccent(txt text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT lower(replace(unaccent('unaccent', txt), 'đ', 'd'))
$$;

ALTER TABLE products
  ADD COLUMN search_text text
  GENERATED ALWAYS AS (
    medivia_unaccent(name || ' ' || brand || ' ' || short_uses)
  ) STORED;

CREATE INDEX products_search_idx ON products
  USING gin (to_tsvector('simple', search_text));

COMMIT;

-- ============================================================
-- KIỂM TRA — chạy sau khi nạp dữ liệu mẫu
-- ============================================================
--
-- SELECT count(*) FROM products;                    -- 24
-- SELECT count(*) FROM products WHERE prescription_required;  -- 3
-- SELECT count(*) FROM products WHERE type = 'supplement';    -- 6
-- SELECT count(*) FROM product_units;               -- 40
-- SELECT count(*) FROM categories;                  -- 12
-- SELECT count(*) FROM reviews;                     -- 8
-- SELECT count(*) FROM interaction_rules;           -- 8
-- SELECT count(*) FROM ingredient_aliases;          -- 12
--
-- Không có thuốc kê đơn nào lọt vào gợi ý bán kèm — phải trả 0 dòng:
-- SELECT * FROM combo_suggestions_sellable cs
--   JOIN products p ON p.id = cs.suggested_product_id
--   WHERE p.prescription_required;
--
-- Mọi cặp tương tác chỉ có một chiều (ràng buộc pair_sorted giữ, kiểm tra lại):
-- SELECT count(*) FROM interaction_rules a JOIN interaction_rules b
--   ON a.ingredient_a_id = b.ingredient_b_id
--  AND a.ingredient_b_id = b.ingredient_a_id;   -- 0