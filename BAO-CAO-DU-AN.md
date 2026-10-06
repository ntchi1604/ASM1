# MediVia — Báo cáo dự án

Website nhà thuốc trực tuyến, mô phỏng mô hình [nhathuoclongchau.com.vn](https://nhathuoclongchau.com.vn/), điểm khác biệt là **9 tính năng AI** trải khắp luồng mua thuốc.

---

## 1. Tóm tắt trong một phút

| Hạng mục      | Số liệu                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------- |
| Công nghệ     | Next.js 16.3.5 (App Router) · React 19.2.8 · TypeScript 5 · Tailwind CSS v4                     |
| Số trang       | **30 tệp page → 77 tuyến** (trang chủ + giỏ + thanh toán + xác nhận + 6 AI + 24 thuốc + 12 danh mục + 2 bộ sưu tập + 10 trang chữ + 6 trang tiện ích + 3 bài viết + 10 quản trị) |
| Sản phẩm mẫu | 24 sản phẩm · 12 danh mục · 3 thuốc kê đơn · 6 thực phẩm bổ sung                        |
| Tính năng AI  | **9** (6 trang riêng + 3 tính năng gắn trong trang bán hàng)                           |
| Component       | 67 file,**140 file TS/TSX**, ~17.900 dòng                                                   |
| Cơ sở dữ liệu  | **Thiết kế xong, chưa dựng** — 36 bảng + 2 view, xem mục 9. Quản trị ghi vào tệp delta `.data/medivia.json` |
| Thiết kế      | 12 màn hình phác thảo trước, rồi hiện thực lại bằng code                              |
| Trạng thái AI | **Mock** — dữ liệu mẫu viết tay, kiến trúc đã sẵn sàng thay bằng mô hình thật |

**Ý tưởng chủ đạo:** một nhà thuốc online không chỉ bán hàng, mà phải *tư vấn được*. Người mua thuốc thường không biết tên hoạt chất, không biết hai thuốc có dùng chung được không, không biết tờ hướng dẫn dày 4 trang nói gì. 9 tính năng AI giải đúng 9 chỗ đó.

**Báo cáo này gồm 11 mục.** Mục 1–8 là sản phẩm đã chạy: kiến trúc, 9 tính năng AI, ràng buộc pháp lý, kiểm soát chất lượng, giao diện, hạn chế. **Mục 9 là phần phân tích — thiết kế — cơ sở dữ liệu**, nằm gọn trong báo cáo này. Mục 10 là câu hỏi giảng viên có thể hỏi, mục 11 là cách chạy thử.

---

## 2. Vì sao chọn đề tài này

Nhà thuốc online là bài toán thương mại điện tử **có ràng buộc pháp lý thật**:

- Thuốc kê đơn **không được bán như hàng thường** — phải có đơn bác sĩ.
- Thực phẩm bảo vệ sức khoẻ **bắt buộc** in khuyến cáo "không phải là thuốc, không có tác dụng thay thế thuốc chữa bệnh".
- Nội dung tư vấn sai có thể **gây hại cho người dùng**, không chỉ gây khó chịu.

Vì vậy dự án này không chỉ là bài tập dựng giao diện. Mỗi ràng buộc trên được **cài thẳng vào kiểu dữ liệu và hệ thống kiểm tra tự động**, chứ không chỉ ghi chú trong tài liệu.

---

## 3. Kiến trúc

### 3.1 Cấu trúc thư mục

```
app/
  (shop)/          → trang bán hàng (dùng chung header + footer)
    page.tsx           Trang chủ
    danh-muc/[slug]/   Trang danh mục + bộ sưu tập (lọc, sắp xếp, phân trang)
    thuoc/[slug]/      Chi tiết thuốc
    [page]/            10 trang chữ: giới thiệu, 4 chính sách, FAQ…
    gio-hang/          Giỏ hàng
    goc-suc-khoe/      Góc sức khoẻ: danh sách bài + [slug] chi tiết bài
    he-thong-nha-thuoc/    Danh sách nhà thuốc
    tra-cuu-don-hang/  Tra cứu đơn theo mã đơn
    tai-don-thuoc/     Hướng dẫn gửi đơn thuốc kê đơn
    tai-khoan/         Tài khoản và đơn gần đây
    tai-ung-dung/      Tình trạng ứng dụng điện thoại
    ai/*               6 trang AI
  (checkout)/      → luồng thanh toán (layout riêng, không header quảng cáo)
    thanh-toan/        Thanh toán
    dat-hang-thanh-cong/  Xác nhận đơn
  admin/           → trang quản trị
    dang-nhap/         Đăng nhập (2 vai trò mẫu)
    page.tsx           Tổng quan: việc đang chờ + lối vào từng phần
    phan-tich/         Phân tích doanh số (chỉ đọc)
    don-hang/          Đơn hàng: xem + đổi trạng thái
    kho-thuoc/         Kho thuốc: sửa tồn, sửa giá, thêm/xoá mặt hàng
    duyet-don-thuoc/   Duyệt đơn thuốc kê đơn (chỉ dược sĩ)
    uu-dai/            Mã ưu đãi: thêm, sửa, xoá
    bai-viet/          Bài viết Góc sức khoẻ: thêm, sửa, xoá
    trang/             Trang chữ (chính sách, FAQ…): sửa, xoá
    nha-thuoc/         Nhà thuốc: thêm, sửa, xoá

proxy.ts           → chặn sớm đường vào /admin (Next 16 gọi middleware là proxy)

lib/
  data/            → 18 tệp dữ liệu: sản phẩm, danh mục, tương tác, khuyến mãi, giao hàng, đơn hàng…
  ai/              → 8 tệp, mỗi tệp là MỘT tính năng AI
  admin/           → 5 tệp: db (kho delta), auth (phiên), actions (18 action ghi), users, page-text
  types.ts         → kiểu dữ liệu dùng chung
  filters.ts       → bộ lọc, sắp xếp
  format.ts        → định dạng tiền, ngày, tồn kho theo chuẩn Việt Nam
  icons.ts         → toàn bộ icon đi qua đây (một nguồn duy nhất)

components/
  ui/              → 9 component nền: Button, Chip, Badge, Card, Field…
  product/         → thẻ sản phẩm, ảnh, đánh giá, chọn đơn vị…
  ai/              → khối AI dùng chung
  layout/          → header, footer, nav, tìm kiếm, ContentPage

design/            → thiết kế và kiểm tra: medivia-schema.sql, sweep.mjs, check-*.mjs
```

**Nguyên tắc:** `lib/` không import `components/`, và `components/` không tự bịa dữ liệu. Dữ liệu chảy một chiều, nên sửa giá một sản phẩm chỉ sửa một chỗ.

**Hai chỗ gộp để khỏi phải viết trùng** (cùng tinh thần với mục 6.2):

- `danh-muc/[slug]` phục vụ **cả danh mục lẫn bộ sưu tập**. "Tất cả sản phẩm" và "Thuốc không kê đơn" là đích đến có thật của các link "Xem tất cả", nhưng chúng lọc theo `Product.type`, không phải theo nhóm bệnh — nhét vào bảng danh mục thì lưới danh mục ở trang chủ sẽ có một ô gộp cả 12 nhóm và ô đó không lọc được gì. Nên chúng nằm riêng ở `lib/data/collections.ts` và dùng chung một route, thừa hưởng nguyên bộ lọc, sắp xếp, phân trang.
- **10 trang chữ dùng chung một route động** `[page]`, nội dung ở `lib/data/pages.ts`. Mười thư mục `page.tsx` gần giống nhau là mười chỗ để lệch nhau về sau. Route này bật `dynamicParams = false` — không có nó thì nó nhận **mọi** đường dẫn một cấp chưa định nghĩa ở chỗ khác và người dùng thấy trang trắng thay vì 404.

### 3.2 Vì sao Next.js App Router

- **Server Component mặc định** — toàn bộ 77 tuyến render trên server. Trong 140 file chỉ **5 file** là client component, và cả 5 đều có lý do bắt buộc:

  | File              | Vì sao phải là client                            |
  | ----------------- | --------------------------------------------------- |
  | `SaleCountdown` | cần`setInterval` đếm ngược                   |
  | `MainNav`       | cần`usePathname()` để tô đậm mục đang mở |
  | `SearchBar`     | cần`useRouter()` và ô nhập có trạng thái   |
  | `VoiceCapture`  | cần Web Speech API của trình duyệt              |
  | `AdminForm`     | cần`useActionState()` để hiện trạng thái đang lưu và câu báo lỗi |
- **Trạng thái nằm trong URL** — mọi thao tác lọc, sắp xếp, phân trang, chọn đơn vị, mã giảm giá, hình thức giao hàng đều là một `<Link>`, không phải `useState`. Nghĩa là: **copy link gửi cho người khác là mở ra đúng màn hình đó**, nút Back của trình duyệt hoạt động đúng, và không có state nào mất khi tải lại.

  Ngoại lệ duy nhất: **tải ảnh đơn thuốc ở trang thanh toán dùng POST**. Dữ liệu sức khoẻ không được phép nằm trong thanh địa chỉ.

### 3.3 Tailwind v4 — bảng màu mang nghĩa

Toàn bộ màu khai báo một lần trong `app/globals.css`. Điểm quan trọng: **màu ở đây không phải để cho đẹp, mà để nói nghĩa.**

| Token      | Màu           | Nghĩa — chỉ dùng cho                                  |
| ---------- | -------------- | --------------------------------------------------------- |
| `trust`  | teal           | hành động tin cậy: nút mua, dược sĩ, chính hãng |
| `promo`  | coral          | khuyến mãi, giảm giá                                  |
| `ai`     | **tím** | **chỉ** nội dung do AI tạo ra                    |
| `danger` | đỏ           | cảnh báo an toàn, thuốc kê đơn                     |
| `ink`    | xanh đen      | chữ                                                      |

**Có một luật ESLint riêng chặn viết màu hex trực tiếp trong code** (`noHexColors`). Lý do: một dòng `bg-[#7c5cff]` viết tay sẽ ra *đúng màu tím* nhưng nằm ngoài hệ token — lần sau đổi bảng màu thì chỗ đó không đổi theo, và tệ hơn: **một khối không phải AI sẽ mang màu tím của AI**. Lỗi này mắt thường không phát hiện được khi review.

Kết quả: người dùng nhìn thấy màu tím là biết ngay "chỗ này do máy tạo, cần kiểm chứng".

### 3.4 Lớp quản trị ghi được — và vì sao không dựng cơ sở dữ liệu

**Vấn đề.** Toàn bộ site đọc từ `lib/data/*.ts`, và **25 tệp import thẳng mảng `products`**. Dựng PostgreSQL bây giờ nghĩa là viết lại cả 25 tệp đó cùng lúc — một thay đổi không thể kiểm từng bước, và không có gì để chạy thử ở giữa.

**Cách làm.** Giữ nguyên các mảng, cho quản trị sửa **tại chỗ**. `lib/admin/db.ts` nạp một tệp delta rồi `Object.assign` thẳng vào chính mảng mà `lib/data/` xuất ra. Không tệp nào phải sửa, và trang bán hàng thấy thay đổi ngay vì nó đọc đúng mảng đó.

**Delta, không phải ảnh chụp.** Đây là quyết định quan trọng nhất của lớp này. Một ảnh chụp toàn bộ sẽ **chôn luôn** những mặt hàng thêm sau này trong `products.ts`: sửa mã xong khởi động lại thì bản ghi cũ đè lên và mặt hàng mới biến mất, không có gì báo. Delta chỉ ghi đúng trường đã sửa, nên phần còn lại vẫn là mã nguồn.

**Nơi áp delta là layout gốc.** `db()` được gọi ở `app/layout.tsx`, không phải ở trang quản trị. Không gọi ở đó thì nó chỉ chạy khi có ai mở `/admin` — nghĩa là sau khi khởi động lại máy chủ, khách xem trang sản phẩm vẫn thấy **giá cũ** cho tới khi một quản trị viên tình cờ mở trang quản trị. Lỗi đó đã xảy ra thật, và nó chỉ hiện sau khi restart — đúng lúc không ai đang nhìn.

**Ba giá trị dẫn xuất đã phải sửa cùng lúc.** Chúng được tính (`featuredCategories`, `pickupPharmacy`, `orderStatusCounts`) được tính **một lần lúc nạp module** rồi giữ nguyên. Quản trị sửa danh mục hay đổi nhà thuốc lấy hàng thì ba giá trị đó vẫn là bản cũ — trang không vỡ, chỉ hiện sai. Đổi cả ba thành hàm đọc tại chỗ gọi. Xoá một nhà thuốc khỏi danh sách thì địa chỉ ở trang thanh toán phải đổi theo, không được giữ địa chỉ đã bị xoá.

**Xác thực.** Cookie ký HMAC, một khoá, không có bảng phiên — vì bản mẫu chưa có cơ sở dữ liệu mà thư viện xác thực nào cũng cần một nơi lưu phiên. Cookie chứa tên đăng nhập, **không chứa vai trò**: vai trò tra lại từ `adminUsers` mỗi lần đọc, nên đổi vai trò trong mã là có hiệu lực ngay thay vì phải chờ cookie cũ hết hạn.

**Server Action là điểm vào công khai.** Mọi action đều gọi `requireRole()` ở dòng đầu, vì action gọi được bằng POST thẳng chứ không phải qua giao diện. Giao diện ẩn nút chỉ để người dùng khỏi bấm nhầm — nó không chặn được ai. Cụ thể: vai trò `ke-toan` mở `/admin/duyet-don-thuoc` thấy 0 nút duyệt và một dòng nói rõ lý do; `duoc-si` thấy 4 nút. Và `reviewedBy` ghi vào đơn thuốc lấy từ **phiên đăng nhập**, không lấy từ form — người duyệt không tự khai tên mình được.

**`proxy.ts` không phải lớp bảo vệ.** Next 16 đổi tên middleware thành proxy. Nó chỉ đọc cookie để biết *có* chữ ký hay không: không kiểm chữ ký, không tra tài khoản, và **không chạy cho Server Action**. Giữ nó chỉ để tránh chớp nội dung quản trị trước khi bị đá sang trang đăng nhập. Chỗ chặn thật là `requireSession()`.

**Một tệp văn bản, không phải JSON.** Trình soạn trang chữ dùng cú pháp `## Tiêu đề` + `- gạch đầu dòng`. Người dùng công cụ này là dược sĩ, không phải lập trình viên: một dấu phẩy sai trong JSON chỉ cho ra đúng một câu "không đọc được", còn lỗi cú pháp ở đây thì mất một mục chứ không mất cả trang.

---

## 4. Chín tính năng AI

| # | Tính năng                        | Đường dẫn                    | Độ khó | Cách hoạt động                                                                            |
| - | ---------------------------------- | -------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| 1 | Tư vấn thuốc theo triệu chứng | `/ai/tu-van`                   | ⭐⭐⭐    | Chọn nhiều triệu chứng → AI gom thành nhóm bệnh, gợi ý thuốc kèm lý do           |
| 2 | Tìm thuốc bằng AI               | `/ai/tim-kiem`                 | ⭐⭐      | Gõ câu tự nhiên ("thuốc ho cho trẻ không gây buồn ngủ") → AI tách thành bộ lọc |
| 3 | Chatbot dược sĩ                 | `/ai/chatbot`                  | ⭐⭐⭐    | Hỏi đáp nhiều lượt, có nút chuyển sang**dược sĩ người thật**             |
| 4 | Gợi ý sản phẩm                 | Trang chủ, chi tiết, danh mục | ⭐⭐⭐    | Mỗi gợi ý**bắt buộc kèm lý do**                                                  |
| 5 | Nhận diện thuốc bằng ảnh      | `/ai/nhan-dien`                | ⭐⭐⭐⭐  | Tải ảnh vỉ thuốc → AI trả về các ứng viên kèm**độ tin cậy**               |
| 6 | Tóm tắt thông tin thuốc        | Trang chi tiết thuốc           | ⭐⭐      | Rút gọn tờ hướng dẫn thành 3 nhóm,**luôn có link về nguồn gốc**            |
| 7 | Cảnh báo tương tác thuốc     | `/ai/tuong-tac` + giỏ hàng   | ⭐⭐⭐⭐  | Đối chiếu hoạt chất, phân 3 mức: nghiêm trọng / trung bình / nhẹ                   |
| 8 | Phân tích doanh số              | `/admin/phan-tich`             | ⭐⭐      | AI đọc số liệu bán hàng, viết nhận xét và phát hiện bất thường                 |
| 9 | Tìm thuốc bằng giọng nói      | `/ai/giong-noi`                | ⭐⭐⭐    | Web Speech API → chuyển thành truy vấn tìm kiếm                                         |

### 4.1 Ba quyết định quan trọng khi làm tính năng AI

**a) Mỗi gợi ý phải có lý do.**
Khối "AI gợi ý sản phẩm" không được phép chỉ liệt kê sản phẩm. Mỗi thẻ có một dòng lý do *nằm trên tên sản phẩm* — ví dụ "Cân bằng lợi khuẩn khi dùng kháng sinh". Không có lý do thì đây chỉ là **quảng cáo đội lốt AI**, và người dùng sẽ mất niềm tin vào cả 8 tính năng còn lại.

**b) Tương tác thuốc khoá theo HOẠT CHẤT, không theo tên thương mại.**
Đây là quyết định kỹ thuật quan trọng nhất của tính năng số 7. Người mua Hapacol rồi mua thêm Panadol **không biết** mình đang uống hai lần cùng một chất. Hai cái tên chẳng liên quan gì nhau. Nếu tra theo tên thương mại thì hệ thống báo "an toàn" — trong khi thực tế là quá liều Paracetamol, gây độc gan.

Hệ thống hiện có **8 luật tương tác** (3 nghiêm trọng, 4 trung bình, 1 nhẹ), khoá theo hoạt chất, kèm bảng đồng nghĩa 12 dòng để quy đổi tên thương mại về hoạt chất.

Bảng đồng nghĩa không phải chi tiết phụ — nó là thứ giữ cho tính năng chạy đúng. Nhãn thuốc Việt Nam ghi tên INN ("Acid acetylsalicylic", "Warfarin natri") còn người dùng và luật tương tác gọi tên thông dụng ("Aspirin", "Warfarin"). So chuỗi thẳng thì **Aspirin 81 không bao giờ khớp luật Warfarin × Aspirin** — cảnh báo xuất huyết im lặng biến mất, và không có thông báo lỗi nào để ai phát hiện.

**c) Phân tích doanh số không dùng màu đỏ cho doanh thu giảm.**
Đỏ trong MediVia nghĩa là *nguy hiểm cho sức khoẻ*. Doanh thu giảm là chuyện kinh doanh, không phải chuyện an toàn — nên dùng màu coral (khuyến mãi). Dùng đỏ ở đây sẽ **làm loãng nghĩa của màu đỏ** ở những chỗ thật sự quan trọng như cảnh báo tương tác thuốc.

### 4.2 Trạng thái AI: mock có chủ ý

**Cần nói thẳng: 9 tính năng AI hiện trả về dữ liệu mẫu viết tay, chưa gọi mô hình nào.**

Đây là lựa chọn, không phải thiếu sót. Lý do: giao diện phải chốt trước — AI trả lời thế nào thì người dùng đọc được? Câu trả lời dài bao nhiêu? Khi AI không chắc thì hiển thị ra sao? Những câu đó phải trả lời xong mới biết cần gọi mô hình với tham số gì.

Kiến trúc đã sẵn sàng thay: **mỗi tính năng là một hàm trong một tệp** (`lib/ai/consult.ts`, `lib/ai/identify.ts`…), trả về một kiểu dữ liệu đã khai báo rõ ràng. Thay ruột hàm bằng lệnh gọi API, **giữ nguyên kiểu trả về, thì không trang nào phải sửa một dòng**. Các trang không bao giờ tự dựng câu trả lời trong JSX — đó chính là lý do.

Một chi tiết nhỏ nhưng quan trọng: hàm mock có **độ trễ giả lập** (`thinkingDelay`). Nếu dữ liệu mẫu trả về tức thì, khối "AI đang đọc…" sẽ không bao giờ hiện, và tới lúc gắn mô hình thật mới phát hiện chưa ai thiết kế trạng thái chờ.

**Mọi trang AI đều hiện dòng chữ nói rõ đang là bản demo.** Trang demo mà để người dùng tưởng máy đang thật sự đọc ảnh vỉ thuốc của họ là chuyện khác hẳn một trang demo.

---

## 5. Ràng buộc pháp lý được cài vào code

Đây là phần tôi tâm đắc nhất, và cũng là phần dễ bị bỏ qua nhất khi làm bài tập.

### 5.1 Thuốc kê đơn

`Product.prescriptionRequired = true` → **mọi nơi** hiển thị sản phẩm này tự động:

- bỏ nút "Thêm vào giỏ hàng"
- thay bằng nút "Cần đơn bác sĩ" dẫn tới tư vấn
- hiện huy hiệu đỏ

Cài ở tầng kiểu dữ liệu và tầng component, **không phụ thuộc việc người viết trang có nhớ hay không**. 3 sản phẩm kê đơn trong dữ liệu mẫu: Augmentin 625mg, Warfarin 5mg, Tamiflu 75.

Đáng chú ý: khối "AI gợi ý sản phẩm" ở trang chủ **cố tình** gợi ý Augmentin (thuốc kê đơn) để chứng minh ràng buộc hoạt động — kể cả khi chính AI đề xuất, nút thêm giỏ hàng vẫn bị bỏ.

### 5.2 Thực phẩm bảo vệ sức khoẻ

Sản phẩm loại `supplement` làm trang hiện khuyến cáo bắt buộc theo luật. Câu này viết **một lần duy nhất** trong `lib/data/site.ts` — không thể lệch chữ giữa các trang.

### 5.3 Một mâu thuẫn nội bộ đã phát hiện và sửa

Khi viết dữ liệu gợi ý mua kèm cho danh mục **tim mạch**, tôi suýt thêm Ibuprofen — thuốc phổ thông, còn hàng, rất dễ bán. Nhưng Ibuprofen dùng cùng Aspirin hoặc Warfarin làm tăng nguy cơ xuất huyết, **đúng cảnh báo mà trang `/ai/tuong-tac` của chính MediVia đang hiện**.

Một khối gợi ý bán thêm thứ mà trang khác cảnh báo là **mâu thuẫn nội bộ**, không phải gợi ý. Đã loại bỏ và ghi lý do ngay trong code để người sau không thêm lại.

---

## 6. Kiểm soát chất lượng

### 6.1 Sáu cổng kiểm tra tự động

```bash
node ./node_modules/typescript/bin/tsc --noEmit    # kiểu dữ liệu
node ./node_modules/eslint/bin/eslint.js app components lib eslint.config.mjs
node design/sweep.mjs        # 41 tuyến đại diện + bò theo mọi liên kết nội bộ
node design/check-combos.mjs # kiểm tra 12 trang danh mục
node design/check-schema.mjs # lược đồ cơ sở dữ liệu (mục 9)
node design/check-ai.mjs     # 9 tính năng AI trả nội dung thật + nhánh cờ đỏ
```

Cả sáu hiện **đều sạch**. Mười hai lỗi thật đã lộ ra trong quá trình làm — một số do cổng bắt, phần lớn **không cổng nào bắt được** vì chúng không làm trang vỡ:

1. **Ảnh `src` rỗng** ở 3 chỗ (dòng giỏ hàng, các bước thanh toán, gợi ý mua kèm) — cả ba tự dựng `<Image>` thay vì đi qua component chung, nên nhánh xử lý ảnh trống không bao giờ chạy. Sửa 3 chỗ, rồi **thêm luật ESLint `noRawProductImage`** để chỗ thứ tư không lặp lại y hệt.
2. **Tràn ngang ở mobile** — hàng header rộng 533px trong khung 390px, làm *mọi trang* bị cuộn ngang. Nguyên nhân: ô tìm kiếm là flex item nhưng mặc định có `min-width: auto`, không co được xuống dưới bề rộng nội tại của nó.
3. **Ràng buộc pháp lý trung tâm của dự án đã không chạy, và giao diện vẫn hiện cảnh báo như đang chạy.** `setOrderStatus` đọc đơn bằng `getRow("orders")` — hàm này trả **dòng thô** trong `mockOrders`, mà `requiresPrescription` không nằm ở đó: nó do `resolveOrder()` tính ra từ danh mục sản phẩm lúc đọc. Nên `order.requiresPrescription` luôn là `undefined`, điều kiện chặn luôn sai, và **một đơn Augmentin chưa duyệt đơn thuốc chuyển thẳng sang "Đang giao" được**. Giao diện vẫn hiện đúng câu "Đơn thuốc chưa duyệt — chỉ huỷ được" vì trang đọc bằng `getOrders()` (đã resolve), nên nhìn vào chỉ thấy một hệ thống đang chặn đúng.

Đây là lỗi nặng nhất trong cả dự án, và nó **không phải lỗi giao diện**: bán thuốc kê đơn mà chưa có người có chứng chỉ hành nghề đối chiếu đơn là vi phạm, không phải chuyện quy trình nội bộ. Nó chỉ lộ ra vì tôi **gửi thử một ca phải bị chặn và kiểm tệp delta** — chứ đọc mã thì hai chỗ trông khớp nhau. Sửa: đọc bằng `getOrderByCode()` (đã resolve) để kiểm, ghi bằng `updateRow()` trên dòng thô. Cổng kiểm không bắt được vì đây là logic nghiệp vụ, không phải lỗi cú pháp hay liên kết.

4. **Tìm ra lỗ hổng:** trên mobile **không có đường nào vào giỏ hàng** — cả 3 nút ở header đều bị ẩn, và không có thanh điều hướng dưới. Một trang bán thuốc mà không vào được giỏ hàng trên điện thoại là lỗi nghiêm trọng. Đã sửa.
5. **Hai nguồn dữ liệu nói hai con số khác nhau.** Số trên header gõ cứng là 3, còn giỏ hàng thật có 4 dòng. Lỗi này không làm trang vỡ nên không cổng nào bắt được — chỉ lộ ra khi đối chiếu tay. Sửa bằng cách cho mọi nơi đọc chung một hàm, và đó cũng là lý do mục 6.2 tồn tại.
6. **Ba liên kết chết ở menu chính.** Ba mục nav trỏ vào `/danh-muc/thuoc`, `/danh-muc/thuc-pham-chuc-nang`, `/danh-muc/duoc-my-pham` — đó là các giá trị của `Product.type`, không phải slug danh mục, nên cả ba đều 404. Nav là chỗ người xem bấm vào đầu tiên; ba mục chết ở đó thì không còn gì để nói về phần còn lại. Đã thay bằng 6 danh mục có thật, và bổ sung bộ sưu tập cho các link "Xem tất cả".
7. **Một loại lỗi mà không cổng nào bắt được: sai đơn vị.** Trang kho thuốc và bảng bán chạy in giá **viên** cạnh số lượng **hộp** — hai đơn vị khác nhau đứng chung một dòng. Trang không vỡ, không có ngoại lệ nào ném ra, con số vẫn trông rất hợp lý; chỉ khi lấy máy tính nhân tay hai cách mới thấy doanh thu bị hụt **cả chục lần** (36,4 triệu so với 162,0 triệu trên cùng 10 mặt hàng). Lỗi này cũng là lý do mục 6.2 có luật "tồn kho và giá phải cùng đơn vị" — và nó chỉ lộ ra vì đã ngồi đối chiếu tay, không phải vì đọc mã.
8. **Hàm so khớp từ khoá khớp cả chuỗi con.** `matchesAny` dùng `includes`, nên từ khoá `"ho"` khớp bên trong **"không"** — câu *"tôi không muốn buồn ngủ"* và *"khó thở"* đều bị tính là có nhắc tới ho. Với danh sách triệu chứng thì đó là phân loại sai âm thầm: câu hỏi về đau ngực rơi vào nhánh cảm cúm. Đáng nói là `lib/ai/chat.ts` đã có sẵn ghi chú cảnh báo đúng cái lỗi này và tự viết regex vòng qua nó, nhưng **bản thân hàm thì chưa ai sửa** — chỗ phát hiện ra vấn đề lại là chỗ duy nhất né được nó. Sửa thành khớp theo biên từ, và cổng `check-ai.mjs` giữ 10 ca làm bằng chứng.
9. **Trang tư vấn không có nhánh cờ đỏ nào.** Mục 9.2 của báo cáo này vẽ nhánh đó từ đầu — "DỪNG gợi ý sản phẩm" — nhưng trong mã `consultSymptoms` chỉ trả ba dấu hiệu chung kèm **danh sách thuốc đầy đủ cho mọi câu trả lời**. Người gõ *"đau ngực dữ dội, khó thở, vã mồ hôi"* nhận được **11 sản phẩm mua được**. Khối đỏ nằm trên cùng nên nhìn qua thì có vẻ an toàn, nhưng người đang đau ngực vẫn thấy danh sách thuốc ngay bên dưới — đúng thứ trang này không được phép làm. Không cổng nào bắt được vì trang vẫn trả 200 và vẫn hiện đủ nội dung. Đã thêm nhánh chạy **trước** mọi nhánh gợi ý và trả về danh sách rỗng; cổng `check-ai.mjs` kiểm **cả hai chiều** (6 câu nguy hiểm phải chặn, 2 câu thường vẫn phải ra thuốc), vì cổng chỉ kiểm chiều chặn thì một hàm chặn tất cả cũng "đạt".
10. **Ba giá trị dẫn xuất giữ bản cũ sau khi quản trị sửa dữ liệu.** `featuredCategories`, `pickupPharmacy` và `orderStatusCounts` được tính **một lần lúc nạp module** rồi giữ nguyên. Quản trị đổi danh mục nổi bật, hay xoá một nhà thuốc thì cả ba vẫn là bản cũ — trang không vỡ, không ngoại lệ nào ném ra, con số chỉ đơn giản là sai. Xoá nhà thuốc lấy hàng khỏi danh sách mà trang thanh toán vẫn chỉ tới địa chỉ đã bị xoá. Sửa bằng cách đổi cả ba thành hàm đọc tại chỗ gọi. Đây là lỗi chỉ lộ ra khi **sửa dữ liệu rồi nhìn lại trang bán hàng**, một việc chỉ làm được sau khi lớp quản trị đã có quyền ghi.
11. **Cổng kiểm tra tự "đạt" mà chưa hề kiểm gì.** `design/sweep.mjs` gọi `/admin/*` không kèm phiên nên nhận 307 về trang đăng nhập — và nó tính đó là tuyến hợp lệ. Cổng báo xanh trong khi chưa dựng xong một trang quản trị nào. `design/check-ai.mjs` mắc đúng lỗi đó ở `/admin/phan-tich`. Sửa: cả hai cổng tự ký cookie phiên, và `sweep.mjs` **đếm chuyển hướng là lỗi** chứ không phải là trang hợp lệ.
12. **Phép kiểm quyền viết ra nhưng chưa bao giờ chạy.** Tôi dựng một script gọi thẳng Server Action bằng POST để thử phân quyền. Nó trả 500 cho **cả hai** vai trò — vì header `Next-Action` tôi tự ghép sai định dạng, không phải vì phân quyền chạy đúng. Một script lỗi ở mọi trường hợp thì không chứng minh được gì, kể cả khi kết quả trông có vẻ "chặt". Đã xoá nó thay vì giữ lại một cổng xanh giả, và kiểm phân quyền bằng cách dùng thật: `ke-toan` thấy 0 nút duyệt kèm dòng báo lý do, `duoc-si` duyệt được một đơn và tệp delta ghi đúng tên dược sĩ **lấy từ phiên đăng nhập**.

### 6.2 Kiểm tra đồng bộ giữa các trang

Yêu cầu đặt ra từ đầu là **các page phải đồng bộ với nhau**. Cách làm không phải là "cố gắng viết giống nhau", mà là **gộp về một chỗ để không thể viết lệch**:

| Thành phần dùng chung            | Số trang dùng | Nếu không gộp thì hỏng thế nào                                                |
| ----------------------------------- | --------------- | ------------------------------------------------------------------------------------ |
| `SuggestionGrid`                  | 2               | Sửa cỡ chữ giá ở một trang → hai khối trông như hai tính năng khác nhau |
| `ProductCard`                     | 4               | Một trang quên bỏ nút giỏ hàng của thuốc kê đơn                           |
| `ProductImage` / `ProductThumb` | 8+              | Ảnh lỗi ở một chỗ (đã xảy ra thật)                                          |
| `AiBlock`                         | 9               | Khối AI mất nhãn tím hoặc mất câu miễn trừ                                  |
| `lib/data/site.ts`                | Toàn site      | Hotline, địa chỉ, khuyến cáo TPBS lệch chữ giữa các trang                   |
| `lib/icons.ts`                    | Toàn site      | Cùng một ý nghĩa dùng hai icon khác nhau                                       |
| `getOrderSummary`                 | 3               | Giỏ hàng, thanh toán và trang đơn hàng tự cộng riêng → ba trang ra ba con số |
| `resolveCollection`               | 14              | 12 danh mục + 2 bộ sưu tập chạy hai nhánh xử lý khác nhau |
| `ContentPage`                     | 16              | Mười sáu trang chữ lệch nhau về cỡ chữ, lề, khoảng cách |
| `orderStatusHint`                 | 2               | Khách tra đơn đọc một câu, nhân viên quản trị đọc một câu khác về cùng trạng thái |
| `getPickupPharmacy`               | 2               | Địa chỉ nhà thuốc ở trang thanh toán và ở trang hệ thống nhà thuốc lệch nhau |
| `AdminShell`                      | 9               | Chín trang quản trị lệch nhau về thanh điều hướng và lề. Trang đăng nhập cố ý không dùng shell: chưa đăng nhập thì chưa có mục nào để điều hướng tới |
| `StatCard` / `Th`                 | 9               | Chín bảng quản trị lệch cỡ chữ ở ô tiêu đề và ô số |
| `resolveStockAlerts`              | 2               | Kho thuốc và phân tích doanh số nói hai con số tồn khác nhau |
| `AdminForm` / `AdminButtonForm`   | 9               | Mỗi trang tự viết `useActionState` → chín chỗ hiện lỗi và trạng thái đang lưu khác nhau, và chỗ hay quên nhất là **quên khoá nút lúc đang gửi**, nên bấm hai lần là ghi hai lần |
| `requireSession` / `requireRole`  | 18 action       | Một action quên gọi là một đường ghi dữ liệu không cần đăng nhập, và nó không làm trang vỡ |
| `parseSections` / `formatSections` | 2               | Trình soạn và trình đọc hiểu cú pháp khác nhau → sửa trang chữ xong là mất nội dung vừa gõ |

Ngoài việc dùng chung, hai chỗ còn **tự kiểm lúc nạp module** — sai thì vỡ ngay chứ không hiện ra một con số sai trông vẫn hợp lý:

- Năm trạng thái đơn ở `/admin/don-hang` cộng lại phải **đúng bằng** số đơn ở `/admin/phan-tich`. Hai trang đếm cùng một thứ bằng hai đường khác nhau, nên đây là chỗ duy nhất phép cộng có thể lệch mà không ai thấy.
- Tồn kho **chỉ nằm ở một tệp** (`lib/data/products.ts`); `resolveStockAlerts` đọc thẳng từ đó chứ không giữ bản sao. Bản sao thì có ngày sửa một chỗ mà quên chỗ kia.

Và một luật viết ra thành chữ vì máy không kiểm được: **tồn kho và giá phải cùng một đơn vị.** Tồn kho đếm bằng hộp, chai, lọ; giá thì mỗi sản phẩm có nhiều mức (giá viên, giá vỉ, giá hộp). `getDefaultUnit` là đơn vị tồn kho đang đếm, `getBaseUnit` là đơn vị **rẻ nhất** và chỉ đúng khi lọc theo trần ngân sách. Lấy nhầm là ra một con số nhỏ hơn thực tế cả chục lần mà trang vẫn hiện bình thường.

### 6.3 Một chi tiết về độ trung thực của dữ liệu

Khối gợi ý ở **trang chi tiết** và ở **trang danh mục** dùng chung một lưới, nhưng **cố tình khác tiêu đề**:

- Trang chi tiết: *"Thường được mua cùng"* — neo vào đúng một hộp thuốc người dùng đang xem.
- Trang danh mục: *"Khách mua nhóm này thường mua thêm"* + ghi chú *"dựa trên đơn hàng đã hoàn tất"* — neo vào cả nhóm.

Dùng chung một câu sẽ **hứa mức chính xác mà dữ liệu cấp danh mục không có**. Nói quá lên về độ chính xác của dữ liệu là tự bịa.

---

## 7. Giao diện

### 7.1 Quy trình

Dựng **12 màn hình phác thảo trước**, chốt bố cục và luồng, rồi mới hiện thực lại bằng code. Không vừa code vừa nghĩ bố cục.

12 màn hình: trang chủ · danh mục · chi tiết thuốc · giỏ hàng · thanh toán · 6 trang AI · admin phân tích.

Chín trang quản trị còn lại (**đăng nhập**, **tổng quan**, **đơn hàng**, **kho thuốc**, **duyệt đơn thuốc**, **mã ưu đãi**, **bài viết**, **trang chữ**, **nhà thuốc**) không phác thảo riêng — chúng dùng lại đúng khung của trang phân tích (`AdminShell` + `StatCard`), nên phác thảo thêm chín bản na ná nhau là chín chỗ để lệch cỡ chữ chứ không phải chín chỗ để nghĩ thêm.

Phần **quyền ghi** cũng không cần phác thảo: mỗi màn hình chỉ thêm một form, và mọi form đi qua cùng một `AdminForm`. Cái đáng nghĩ ở phần quản trị không phải bố cục mà là **cái gì được phép sửa** — nên ba quyết định dưới đây được chốt trước khi viết dòng nào:

- **Đường dẫn của bài viết và trang chữ không sửa được** sau khi tạo. Đổi đường dẫn là mọi liên kết đã trỏ tới nó thành liên kết chết, và không có gì báo. Form hiện ô đó ở dạng chỉ đọc.
- **Nút xoá sạch dữ liệu không nằm trong menu.** Nó nằm dưới cùng trang tổng quan, sau một dòng giải thích, và đòi gõ chữ `XOÁ`. Đây là thao tác duy nhất xoá dữ liệu người khác đã nhập — để cạnh các mục quản lý khác là để nó bị bấm nhầm.
- **Trường hợp trùng khoá bị từ chối, không ghi đè.** Thêm một mặt hàng có `id` đã tồn tại thì báo lỗi. Ghi đè âm thầm là cách một mặt hàng mới xoá mất một mặt hàng cũ mà không ai được báo.

Sáu trang tiện ích (**nhà thuốc**, **tra cứu đơn**, **tải đơn thuốc**, **tài khoản**, **ứng dụng**, **góc sức khoẻ**) cũng vậy: chúng dùng chung `ContentPage`, và phần khó của chúng không nằm ở bố cục mà ở chỗ **quyết định không đưa thứ gì vào trang** — bốn trong sáu trang cố ý thiếu một ô nhập hoặc một nút. Vẽ trước một ô tải tệp rồi sau đó bỏ đi thì dễ hơn là tự hỏi ngay từ đầu "ô này gửi tệp đi đâu".

### 7.2 Những chỗ phải sửa so với bản phác thảo

Bản phác thảo **không dùng được ngay** — có những lỗi chỉ lộ ra khi ghép vào dữ liệu thật:

- Bản phác thảo có **2 biến thể header khác nhau** → đã chốt dùng một bản duy nhất.
- Chữ tiếng Việt bị đặt **line-height quá chặt**, dấu bị cắt. Tiếng Việt có dấu chồng hai tầng (ế, ộ, ẫ) nên cần line-height ≥ 1.2 cho tiêu đề.
- Bản phác thảo dùng **chữ in hoa toàn bộ** ở vài nhãn — với tiếng Việt có dấu, in hoa toàn bộ vừa khó đọc vừa làm dấu mất cân đối. Đã bỏ.
- Các con số dùng dấu chấm thập phân kiểu Anh (`125,000`) trong khi tiền Việt phải là `125.000 ₫`.

### 7.3 Hai điểm về tiếng Việt trong code

**Định dạng tiền:** mọi nơi dùng `formatVnd()` cho ra `125.000 ₫` (dấu chấm ngăn nghìn, ký hiệu ₫ đứng sau). Riêng nhãn biểu đồ hẹp dùng dạng rút gọn `33,5 tr`.

**Không tự chế chữ:** hotline, địa chỉ, số nhà thuốc, câu khuyến cáo pháp lý — tất cả đọc từ một tệp hằng số. Chép tay ở 20 trang thì kiểu gì cũng lệch.

---

## 8. Hạn chế — nói thẳng

Phần này quan trọng khi bảo vệ: **biết rõ cái gì chưa làm** tốt hơn là để người khác phát hiện.

| Hạn chế                        | Chi tiết                                                                                                               | Nếu làm tiếp                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **AI là mock**            | 9 tính năng trả dữ liệu mẫu, chưa gọi mô hình                                                                 | Thay ruột 8 hàm trong`lib/ai/`, giữ nguyên kiểu trả về |
| **Ảnh sản phẩm trống** | Cả 24 sản phẩm có`image: ""`, hiện ô placeholder có tên + nhãn hiệu                                         | Có ảnh thật thì chỉ điền vào dữ liệu                  |
| **Chưa có cơ sở dữ liệu** | Dữ liệu nền nằm trong 18 tệp TypeScript; thay đổi của quản trị ghi vào tệp delta `.data/medivia.json` trên một máy. Giỏ hàng và đơn của khách vẫn không được lưu, tải lại là mất. Lược đồ đã thiết kế xong (mục 9) nhưng chưa dựng | Dựng cơ sở dữ liệu từ `design/medivia-schema.sql`, thay `save()` trong `lib/admin/db.ts` bằng `UPDATE` — tên hàm giữ nguyên nên trang không phải sửa |
| **Tệp delta chỉ đúng với một tiến trình** | Một máy chủ, một người sửa. Hai người sửa cùng lúc thì lần ghi sau đè lần ghi trước, và không có gì báo. Đã ghi rõ trong `lib/admin/db.ts` | Cùng cách xử lý như trên: chuyển sang cơ sở dữ liệu |
| **Mật khẩu so bằng chuỗi thẳng** | Hai tài khoản demo (`duocsi`/`duocsi123`, `ketoan`/`ketoan123`) nằm trong mã nguồn và in ngay trên trang đăng nhập — cố ý, vì đây là bản mẫu không có dữ liệu thật. Khoá ký phiên mặc định cũng là một chuỗi ai cũng đọc được | Đặt `ADMIN_SESSION_SECRET`, thay `verifyPassword` bằng `bcrypt.compare` — một dòng |
| **Bốn trang cố ý thiếu một ô nhập** | `/tai-don-thuoc` không có ô tải tệp, `/tai-khoan` không có biểu mẫu đăng nhập (chỉ hiện hồ sơ **một khách mẫu**), `/tai-ung-dung` không có nút App Store, `/tra-cuu-don-hang` tra bằng mã đơn chứ không bằng số điện thoại. Đều là quyết định, không phải bỏ sót — một ô nhập chạy được nhưng không gửi dữ liệu đi đâu cả thì dạy người dùng tin vào một thứ không tồn tại | Nối vào máy chủ thật rồi mới thêm |
| **4/12 danh mục trống**  | `da-lieu`, `me-va-be`, `thiet-bi-y-te`, `mat` chưa có sản phẩm, hiện màn hình gợi ý hỏi dược sĩ AI | Thêm dữ liệu                                                 |
| **Quản trị chưa ghi nhật ký** | Mọi thao tác ghi đều biết ai làm (phiên đăng nhập), nhưng **không lưu lại**: duyệt đơn thuốc có ghi `reviewedBy` kèm thời điểm, còn sửa giá hay xoá mặt hàng thì không để lại vết. Với dữ liệu y tế thì đây là thiếu sót thật, và lược đồ hiện **chưa có bảng nào** cho việc đó | Thêm bảng `audit_log` — việc đầu tiên nên làm khi dựng cơ sở dữ liệu |
| **Thanh toán mô phỏng** | Không nối cổng thanh toán thật                                                                                     | —                                                              |

**Điểm đáng nói về 4 danh mục trống:** đây không phải lỗi bỏ quên. Một danh mục trống vẫn phải có màn hình tử tế dẫn người dùng sang hỏi dược sĩ AI, chứ không được để trang trắng. Và khối "mua kèm" **cố tình không hiện** ở 4 trang này — mời mua thêm bên dưới một danh mục trống là mời mua thứ chẳng liên quan.

---

## 9. Phân tích — Thiết kế — Cơ sở dữ liệu

> Toàn bộ phần này nằm gọn trong báo cáo — không còn tệp thiết kế riêng. Lược đồ chạy được ở [`design/medivia-schema.sql`](design/medivia-schema.sql), cổng kiểm ở [`design/check-schema.mjs`](design/check-schema.mjs).

**Nói trước một câu cho rõ:** dự án **chưa dựng cơ sở dữ liệu**. Dữ liệu nền nằm trong 18 tệp TypeScript ở `lib/data/`; thay đổi của quản trị ghi vào tệp delta `.data/medivia.json` trên một máy (mục 3.4). Phần dưới đây không mô tả một cái đang tồn tại — nó mô tả **đích đến**, và mọi bảng đều suy ra từ một kiểu dữ liệu có thật trong `lib/types.ts` hoặc một hàm có thật trong `lib/data/`, không có bảng nào thêm vào cho oai.

### 9.1 Phân tích

**Bài toán.** Người mua thuốc không biết mô tả triệu chứng của mình thành tên thuốc. Các nhà thuốc trực tuyến hiện có giải quyết phần "mua" nhưng bỏ trống phần "biết mình cần mua gì" — người dùng phải tự tra, tự đoán liều, tự phát hiện hai thuốc mình đang uống có kỵ nhau không. 9 tính năng AI lấp đúng khoảng đó, giữ nguyên một nguyên tắc: **AI tra cứu, không chẩn đoán**.

**Tác nhân.** Khách vãng lai (tra cứu, đọc thông tin) · Khách mua hàng (đặt thuốc, tải đơn kê đơn) · Dược sĩ (xác nhận đơn kê đơn, nhận ca chatbot chuyển sang) · Kế toán (đọc doanh số, xử lý đơn hàng). Bản mẫu dựng đầy đủ luồng khách mua hàng; hai vai sau có **mười màn hình quản trị** — chín trang dùng chung `AdminShell` cộng trang đăng nhập.

**Phân quyền giữa hai vai.** `duoc-si` làm được mọi thứ, kể cả **duyệt đơn thuốc kê đơn**; `ke-toan` làm được mọi thứ **trừ** việc đó. Đây là ràng buộc pháp lý chứ không phải phân công nội bộ: duyệt đơn thuốc là việc của người có chứng chỉ hành nghề. Phép kiểm nằm ở tầng action (`requireRole`), không ở tầng giao diện — giao diện chỉ ẩn nút cho người dùng khỏi bấm nhầm.

**Ràng buộc pháp lý, dịch thành yêu cầu hệ thống.** Đây là phần quan trọng nhất của đề tài, vì nó biến một website thương mại điện tử thường thành một website bán dược phẩm hợp lệ:

| Quy định | Yêu cầu hệ thống | Cài ở đâu |
| --- | --- | --- |
| Thuốc kê đơn không bán không đơn | Sản phẩm kê đơn **không có** nút thêm giỏ; phải tải ảnh đơn; dược sĩ xác nhận trước khi soạn | `ProductCard`, `PrescriptionUpload` |
| Thuốc kê đơn không được gợi ý bán kèm | Mọi hàm gợi ý lọc bỏ sản phẩm kê đơn **trước khi** trả kết quả | `getBoughtTogether`, `getCategoryBoughtTogether` |
| TPBS không thay thế thuốc | Trang có sản phẩm `supplement` phải hiện khuyến cáo | `SupplementDisclaimer` |
| Không bán lại thuốc đã xuất kho | Chính sách đổi trả loại trừ thuốc kê đơn | `lib/data/pages.ts` |
| Dữ liệu sức khoẻ là dữ liệu nhạy cảm | Triệu chứng và ảnh đơn **không vào URL**, không hiện lại, không dùng quảng cáo | Server action POST |
| Cảnh báo tương tác phải đúng | Luật khoá theo **hoạt chất**, không theo tên thương mại | `lib/data/interactions.ts` |

**Yêu cầu phi chức năng.** An toàn (dữ liệu sức khoẻ không nằm trong URL) · Đồng bộ (không có hai màn hình nào nói hai con số khác nhau) · Trung thực (AI không nói quá khả năng của nó) · Hiệu năng (trang tĩnh không truy vấn lúc chạy) · Tiếp cận (nhãn thật, không dùng placeholder làm nhãn).

### 9.2 Thiết kế

Bốn lớp, dữ liệu chảy một chiều:

| Lớp | Vị trí | Được biết | Không được biết |
| --- | --- | --- | --- |
| Trình bày | `app/`, `components/` | Kiểu dữ liệu, token màu | Nguồn dữ liệu đến từ đâu |
| Nghiệp vụ | `lib/data/`, `lib/category-query.ts` | Toàn bộ quy tắc | JSX |
| AI | `lib/ai/` | `lib/data/` | JSX |
| Quản trị | `lib/admin/` | `lib/data/`, phiên đăng nhập | JSX |
| Hạ tầng | `lib/icons.ts` | `lucide-react` | — |

Lớp quản trị **ghi vào** `lib/data/` chứ không sở hữu dữ liệu riêng, nên nó không phá vỡ quy tắc "một nguồn duy nhất": sửa giá ở `/admin/kho-thuoc` là sửa đúng mảng mà trang chi tiết thuốc đang đọc.

**Luồng nghiệp vụ chính.** Mua thuốc thường: chọn → giỏ (đối soát tương tác) → thanh toán → đặt hàng (POST) → mã đơn. Mua thuốc kê đơn: thêm bước tải ảnh đơn và dược sĩ gọi xác nhận trong 15 phút.

**Luồng AI có cờ đỏ** — đây là yêu cầu an toàn, không phải tính năng:

```
Mô tả triệu chứng
   ├─ Bình thường → Nhóm thuốc không kê đơn + lý do
   └─ Cờ đỏ (sốt cao kéo dài, đau ngực, khó thở)
        → DỪNG gợi ý sản phẩm
        → Chuyển sang cơ sở y tế: đi khám ngay
```

Một hệ thống gợi ý thuốc cảm cho người đang đau ngực là hệ thống có hại.

### 9.3 Cơ sở dữ liệu

**36 bảng + 2 view**, PostgreSQL 16. Nhóm theo bốn khối: danh mục hàng hoá · bán hàng · AI · nội dung và tổng hợp. Sơ đồ quan hệ và từ điển dữ liệu đầy đủ nằm trong tệp lược đồ; ở đây nêu **năm quyết định lược đồ**, vì chúng là phần đáng bảo vệ:

**a) Giá thuộc về ĐƠN VỊ BÁN, không thuộc về sản phẩm.** Hapacol 650 bán theo Hộp 78.000 ₫, theo Vỉ 21.000 ₫, theo Viên 5.500 ₫. Nếu giá nằm ở bảng `products` thì lần đổi giá đầu tiên sẽ viết lại toàn bộ hoá đơn cũ. Và `order_items` chép lại `unit_price` tại thời điểm mua thay vì đọc từ `product_units`.

Không chỉ là chuyện lược đồ: **tồn kho phải đếm bằng đúng đơn vị mà giá đang niêm yết**, nếu không thì "còn 12 hộp" nhân với "5.500 ₫ một viên" ra một con số nhỏ hơn thực tế cả chục lần mà trang vẫn hiện bình thường. Xem lỗi số 6 ở mục 6.1.

**b) Hoạt chất là thực thể riêng, không phải cột chuỗi.** Bảng `active_ingredients` + `product_ingredients` + `ingredient_aliases`. Đây là điều kiện để tính năng số 7 chạy đúng — xem 4.1b.

**c) `interaction_rules` có ràng buộc `CHECK (a <= b)`.** Không có nó thì bảng sẽ có cả `(Warfarin, Aspirin)` lẫn `(Aspirin, Warfarin)` và **mỗi cặp bị cảnh báo hai lần**. Ràng buộc ở tầng cơ sở dữ liệu chặn được; một dòng `if` trong mã thì không, vì mã có nhiều đường vào. Bảng này còn có luật tự tham chiếu `Paracetamol × Paracetamol` — cảnh báo trùng hoạt chất giữa hai sản phẩm khác tên.

**d) `prescriptions.delete_after` là cột NOT NULL.** Ba lời hứa trong chính sách bảo mật (ảnh đơn không có URL công khai, chỉ dược sĩ kiểm duyệt xem được, xoá sau khi đơn hoàn tất) đều được cài ở tầng lược đồ. Một lời hứa không có cột nào giữ thì không phải lời hứa. Trang `/admin/duyet-don-thuoc` giữ đúng ba lời hứa đó ở tầng giao diện: nó **chỉ hiện tên tệp**, không có đường dẫn công khai tới ảnh — hiện ảnh ở đó là tự tay tạo đường dẫn công khai cho đơn thuốc.

**e) `combo_suggestions.reason` là cột NOT NULL.** Danh sách sản phẩm không kèm lý do chỉ là quảng cáo. Bắt buộc ở lược đồ thì không ai thêm được gợi ý trống lý do.

Ba bộ lọc gợi ý (bỏ hết hàng, bỏ thuốc kê đơn, bỏ sản phẩm cùng danh mục đang xem) cài thành **view** `combo_suggestions_sellable`, không chỉ trong mã — cùng lý do như ràng buộc `CHECK` ở (c).

**Tìm kiếm tiếng Việt:** PostgreSQL **không có** cấu hình `vietnamese`. Dùng `simple` kèm cột `search_text` đã bỏ dấu, sinh tự động khi ghi. Bản mẫu đã làm đúng cách này trong `lib/ai/engine.ts` (`normalize()` bỏ dấu trước khi so khớp), nên đây chỉ là làm lại điều tương tự ở tầng cơ sở dữ liệu.

**Đường di trú.** `lib/types.ts` đã là hợp đồng giữa giao diện và dữ liệu. Thay `lib/data/*.ts` bằng truy vấn cơ sở dữ liệu, tên hàm và kiểu trả về giữ nguyên — không trang nào phải sửa. Nếu một trang phải sửa, đó là dấu hiệu tầng dữ liệu đã rò ra ngoài.

### 9.4 Những gì cố ý KHÔNG có trong lược đồ

| Không có | Vì sao |
| --- | --- |
| Bảng `search_history` | Chưa có màn hình nào dùng. Thêm khi có gợi ý tìm kiếm cá nhân hoá |
| Bảng phân quyền đầy đủ (vai × quyền) | Chỉ có **hai vai** và chúng khác nhau đúng một quyền. Một bảng ba chiều cho hai dòng dữ liệu là bảng sẽ không ai cập nhật đúng. Vai để trong mã (`lib/admin/users.ts`), và `canApprovePrescriptions()` là chỗ duy nhất trả lời câu hỏi đó — cả trang lẫn action đều gọi nó |
| Bảng `audit_log` | **Thiếu sót thật**, đã ghi ở mục 8. Duyệt đơn thuốc có lưu người duyệt, nhưng sửa giá và xoá mặt hàng thì không để lại vết. Sẽ là bảng đầu tiên thêm vào khi dựng |
| Bảng `notifications` | Thông báo đang là giả định trong chính sách, chưa có kênh thật (SMS/email) |
| Lịch sử giá | `order_items.unit_price` đã đủ cho hoá đơn |
| Soft delete toàn cục | Chỉ `prescriptions` cần vòng đời riêng; bảng khác xoá cứng |

Cùng tinh thần với 4 danh mục trống ở mục 8: **thiếu mà biết mình thiếu** khác hẳn thiếu mà không biết.

---

## 10. Câu hỏi giảng viên có thể hỏi

**"AI ở đây thật hay giả?"**
Giả — dữ liệu mẫu viết tay, và mọi trang AI đều hiện dòng chữ nói rõ điều đó. Nhưng kiến trúc là thật: mỗi tính năng một hàm, một kiểu dữ liệu; thay ruột hàm là xong, không sửa giao diện. Làm vậy vì giao diện phải chốt trước mới biết cần gọi mô hình với tham số gì.

**"Vì sao không dùng thư viện quản lý state?"**
Vì trạng thái nằm trong URL. Lọc, sắp xếp, phân trang đều là `<Link>` — copy link gửi bạn bè mở ra đúng màn hình đó, Back hoạt động đúng. Không cần Redux hay Context cho việc này.

**"Sao biết 9 tính năng không phá vỡ ràng buộc pháp lý?"**
Vì ràng buộc nằm ở tầng kiểu dữ liệu và tầng component dùng chung, không nằm ở từng trang. `ProductCard` tự kiểm tra `prescriptionRequired` — người viết trang không thể quên. Và có luật ESLint chặn dùng `<Image>` trực tiếp, vì đã từng có 3 chỗ quên.

**"Sao màu tím lại quan trọng thế?"**
Tím là **quy ước**: chỉ nội dung do AI tạo. Người dùng nhìn màu là biết ngay chỗ đó cần kiểm chứng. Có luật ESLint chặn viết màu hex trực tiếp để không ai vô tình làm một khối không phải AI mang màu tím.

**"Khó nhất là gì?"**
Tính năng cảnh báo tương tác thuốc. Khó không phải vì code, mà vì phải khoá theo **hoạt chất** chứ không theo tên thương mại — người mua Hapacol rồi mua Panadol không biết mình đang uống hai lần cùng một chất. Tra theo tên thì hệ thống báo "an toàn" trong khi thực tế là quá liều gây độc gan. Tra theo tên là **sai nguy hiểm**, không phải sai bình thường.

**"Quản trị viên sửa dữ liệu thì lưu vào đâu, và ai được sửa?"**
Vào tệp delta `.data/medivia.json`, không phải vào mã nguồn — xem mục 3.4. Hai vai: `duoc-si` làm được mọi thứ, `ke-toan` làm được mọi thứ trừ duyệt đơn thuốc, vì đó là việc phải có chứng chỉ hành nghề. Phép kiểm quyền nằm ở tầng action (`requireRole`), không ở giao diện: Server Action gọi được bằng POST thẳng nên ẩn nút chỉ ngăn người dùng bấm nhầm, không ngăn được ai. Và tên dược sĩ ghi vào đơn thuốc lấy **từ phiên đăng nhập**, không lấy từ form — người duyệt không tự khai tên mình được.

**"Sao không dựng luôn cơ sở dữ liệu cho phần quản trị?"**
Vì 25 tệp import thẳng mảng `products`. Dựng Postgres nghĩa là viết lại cả 25 tệp cùng lúc — không kiểm được từng bước. Cách đang dùng giữ nguyên các mảng và cho quản trị sửa tại chỗ, nên **không tệp nào phải sửa** mà trang bán hàng vẫn thấy thay đổi ngay. Đường di trú đã vạch sẵn: thay `save()` trong `lib/admin/db.ts` bằng `UPDATE`, giữ nguyên tên hàm. Ghi rõ trong `ponytail:` ngay trong tệp đó.

**"Phát hiện được lỗi gì trong quá trình làm?"**
Mười hai lỗi thật, kể ở mục 6.1. **Nặng nhất là lỗi ở `setOrderStatus`**: nó đọc đơn bằng hàm trả dòng thô nên trường `requiresPrescription` luôn là `undefined`, và ràng buộc pháp lý trung tâm của cả dự án — đơn có thuốc kê đơn chưa được dược sĩ duyệt thì không được chuyển sang soạn hàng — **chưa bao giờ chạy**. Giao diện vẫn hiện đúng cảnh báo vì nó đọc bằng hàm khác (đã resolve), nên nhìn vào chỉ thấy một hệ thống đang chặn đúng. Lỗi chỉ lộ ra khi tôi **gửi thử một ca phải bị chặn rồi kiểm tệp dữ liệu** — đọc mã thì hai chỗ trông khớp nhau. Từ đó mới có nguyên tắc: kiểm một ràng buộc bằng cách **thử phá nó**, không bằng cách đọc chỗ cài nó.

Đáng chú ý thứ hai là lỗi mobile: hàng header rộng 533px trong khung 390px làm mọi trang bị cuộn ngang. Cách sửa đầu tiên tôi thử **đã không dùng được** — nó hết tràn nhưng bóp ô tìm kiếm còn 32px, không đọc được chữ đang gõ. Nên phải cho header xuống hai dòng ở mobile.

Phần còn lại **không làm trang vỡ**, nên không cổng kiểm tra tự động nào bắt được: số trên header gõ cứng là 3 trong khi giỏ hàng thật có 4 dòng; ba mục menu chính trỏ vào giá trị của `Product.type` thay vì slug danh mục nên 404; giá tính theo **viên** đứng cạnh tồn kho đếm theo **hộp**; trang tư vấn **không có nhánh cờ đỏ nào** nên câu mô tả cơn đau ngực vẫn ra danh sách thuốc mua được; hàm so khớp từ khoá khớp cả chuỗi con nên `"ho"` khớp bên trong `"không"`; ba giá trị dẫn xuất tính một lần lúc nạp module nên vẫn giữ bản cũ sau khi quản trị sửa dữ liệu; và **hai cổng kiểm tra tự "đạt" mà chưa hề kiểm gì** vì chúng nhận trang đăng nhập thay vì trang quản trị.

Hai lỗi AI là loại khó thấy nhất trong nhóm này: trang vẫn trả 200, vẫn hiện đủ nội dung, không ngoại lệ nào ném ra — chỉ có câu trả lời sai. Chúng chỉ lộ ra khi **đọc lại mã để đối chiếu với chính báo cáo này** (mục 9.2 vẽ nhánh cờ đỏ, mã không có) chứ không phải khi chạy thử. Từ đó mới thêm cổng `design/check-ai.mjs` kiểm hai chiều: câu nguy hiểm phải chặn, câu thường vẫn phải ra thuốc.

**"Cơ sở dữ liệu đâu?"**
Chưa dựng. Dữ liệu nền nằm trong 18 tệp TypeScript; quản trị ghi vào tệp delta `.data/medivia.json`. Nhưng lược đồ đã thiết kế xong: **36 bảng + 2 view**, và mọi bảng đều suy ra từ một kiểu dữ liệu có thật trong mã, không có bảng nào thêm vào cho oai. Tệp `design/medivia-schema.sql` chạy được, và `design/check-schema.mjs` tự kiểm nó (khoá ngoại trỏ bảng không có, ràng buộc trùng tên, số bảng khớp tài liệu).

Lý do thiết kế trước khi dựng: **kiểu dữ liệu đúng quan trọng hơn máy chủ chạy được.** Ba quyết định ở mục 9.3 — giá thuộc về đơn vị bán, tương tác khoá theo hoạt chất, ảnh đơn có hạn xoá — là những thứ nếu chọn sai từ đầu thì sửa lại phải đụng vào toàn bộ giao diện.

**"Sao biết lược đồ đúng?"**
Lược đồ không phải bản vẽ tay rời rạc — nó ánh xạ 1–1 với `lib/types.ts` hiện có. `Product` → `products` + `product_units`, `ProductDetail` → `product_details`, `Interaction` → `interaction_rules`, `Review` → `reviews`. Và có script kiểm: `node design/check-schema.mjs` xác nhận khoá ngoại, ràng buộc trùng tên, view đọc bảng có thật, cùng số bảng khớp tài liệu.

**"Nếu có thêm một tuần?"**
Dựng cơ sở dữ liệu từ lược đồ đã có — lớp quản trị đã ghi được nên đây là việc thay ruột chứ không phải làm mới, và chỗ đổi là một hàm (`save()` trong `lib/admin/db.ts`). Kèm theo đó là bảng `audit_log`, thiếu sót thật đã ghi ở mục 8. Sau đó thay mock AI bằng mô hình thật — kiến trúc cũng đã sẵn sàng, mỗi tính năng là một hàm.

---

## 11. Chạy thử

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

**Phần quản trị** ở `http://localhost:3000/admin`, hai tài khoản mẫu in ngay trên trang đăng nhập:

| Tài khoản | Mật khẩu | Vai trò |
| --- | --- | --- |
| `duocsi` | `duocsi123` | Dược sĩ — làm được mọi thứ, kể cả duyệt đơn thuốc |
| `ketoan` | `ketoan123` | Kế toán — mọi thứ trừ duyệt đơn thuốc |

Đăng nhập bằng `ketoan` rồi mở `/admin/duyet-don-thuoc`, sau đó đăng nhập lại bằng `duocsi` và mở đúng trang đó: **hai màn hình khác nhau**.


**Nên xem theo thứ tự này:**

1. **Trang chủ** — khối "AI gợi ý" có lý do cho từng sản phẩm, trong đó có Augmentin (thuốc kê đơn) **không có nút thêm giỏ hàng**.
2. **`/thuoc/augmentin-625mg`** — trang chi tiết thuốc kê đơn: huy hiệu đỏ "Thuốc kê đơn", **không có một nút "Thêm vào giỏ" nào** trong phần thân trang, thay bằng nút tư vấn dược sĩ.
3. **`/ai/tuong-tac?thuoc=Warfarin,Aspirin`** — cảnh báo mức **Nghiêm trọng**, mô tả nguy cơ xuất huyết.
4. **`/ai/tuong-tac?thuoc=Hapacol%20650,Panadol%20Extra`** — **cùng hoạt chất Paracetamol nhưng khác tên thương mại**, hệ thống vẫn bắt được và cảnh báo nguy cơ vượt liều gây độc gan. Đây là điểm mạnh nhất của tính năng, vì tra theo tên thương mại sẽ báo "an toàn".
5. **`/ai/nhan-dien?anh=anh-mo-thieu-sang.jpg`** — ảnh mờ cho ra 3 ứng viên với độ tin cậy thấp (44%), và câu **"Không dùng kết quả này để uống thuốc"** hiện ngay trên kết quả.
6. **`/ai/tim-kiem?q=thuốc ho cho trẻ em không gây buồn ngủ`** — gõ câu tự nhiên, AI tách thành bộ lọc.
7. **`/admin/phan-tich`** — AI đọc số liệu bán hàng và viết nhận xét. Chú ý thứ tự: **số thật đứng trước, nhận xét của AI đứng sau**, và mỗi nhận xét mang kèm đúng những con số nó đã dùng để viết ra câu đó.
8. **`/admin/don-hang`** — năm trạng thái đơn, cộng lại **đúng bằng** số đơn ở trang phân tích (đẳng thức này được kiểm lúc nạp module, lệch là vỡ ngay). Ô "Đã huỷ" **không tô đỏ**: đỏ trên site này là nguy hiểm cho sức khoẻ, không phải tin xấu về kinh doanh. Cuối mỗi dòng có ô đổi trạng thái. **Chỗ đáng thử nhất cả dự án:** chọn `MV15092814` (đơn Augmentin, đơn thuốc đang chờ duyệt) rồi đặt sang "Đang giao" — thao tác **bị từ chối**, trạng thái giữ nguyên, và tệp `.data/medivia.json` **không được ghi**. Ràng buộc nằm ở tầng action nên gửi thẳng POST cũng không qua được. Duyệt đơn thuốc đó ở mục 10 rồi thử lại thì mới chuyển được.
9. **`/admin/kho-thuoc`** — sắp theo **số ngày còn bán được**, không theo số lượng: còn 100 hộp mà bán 50 hộp/ngày thì gấp hơn còn 12 hộp bán 1 hộp/ngày. Mở một mặt hàng ra **sửa tồn và sửa giá**, rồi mở lại trang sản phẩm đó ở tab khác: giá đổi ngay, vì cả hai đọc cùng một mảng.
10. **`/admin/duyet-don-thuoc`** — hàng đợi đơn kê đơn. Trang **chỉ hiện tên tệp**, không có đường dẫn công khai tới ảnh đơn; đăng nhập bằng `ketoan` thì **không có nút duyệt nào** và có một dòng nói rõ vì sao, bằng `duocsi` thì có. Duyệt một đơn rồi mở `/admin` xem số "chưa duyệt" giảm.
11. **`/admin/uu-dai`, `/admin/bai-viet`, `/admin/trang`, `/admin/nha-thuoc`** — bốn màn hình thêm/sửa/xoá còn lại. Thử sửa một bài viết rồi mở `/goc-suc-khoe` xem bài đổi ngay.
12. **`/tra-cuu-don-hang?ma=MV15092814`** — tra đơn bằng **mã đơn**, không bằng số điện thoại. Số điện thoại thì đoán được, nên tra theo số là tra được đơn của người khác. Trang này đọc lại `order.summary` chứ không tự cộng lại tiền.
13. **`/tai-don-thuoc`** — hướng dẫn gửi đơn thuốc. Cố ý **không có ô tải tệp**: ô tải chạy được nhưng không gửi tệp đi đâu cả là ô tải nói dối khách.
14. **`/goc-suc-khoe`** rồi mở một bài — bài do **dược sĩ** viết nên cả trang dùng màu teal, không dùng tím. Tím trên site này nghĩa là "máy tạo, cần kiểm chứng".
15. **`/tai-ung-dung`** — nói thẳng chưa có ứng dụng, kèm cảnh báo có app mạo danh trên store.
16. **`/he-thong-nha-thuoc`** — sáu nhà thuốc có địa chỉ và giờ mở cửa kiểm chứng được, nói rõ sáu chứ không phải 1.247.
17. **`/faq`** hoặc `/quy-dinh-thuoc-ke-don` — 10 trang chữ dùng chung một route động, cùng một khung bố cục.
18. Thu nhỏ cửa sổ xuống 390px — kiểm tra bản mobile.

> Muốn xem phần phân tích — thiết kế — cơ sở dữ liệu: mục 9 bên trên, lược đồ chạy được ở [`design/medivia-schema.sql`](design/medivia-schema.sql).

> Ô nhập ở trang tương tác nhận **tên thuốc hoặc tên hoạt chất**, mỗi dòng một thuốc (hoặc ngăn cách bằng dấu phẩy). Không nhận id sản phẩm.

---

*MediVia — dự án học phần. Dữ liệu sản phẩm, giá, tồn kho và nội dung y tế trong dự án là **dữ liệu mẫu phục vụ minh hoạ**, không dùng để tra cứu hay tự điều trị.*
