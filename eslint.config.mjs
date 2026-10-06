import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Chặn màu viết thẳng bằng mã hex trong mã giao diện.
 *
 * Lý do cần luật này thay vì chỉ nhắc nhau: bảng màu MediVia mang NGHĨA, không chỉ
 * là thẩm mỹ. Tím là nội dung do AI tạo, đỏ là cảnh báo an toàn và thuốc kê đơn,
 * teal là hành động tin cậy, coral là khuyến mãi. Một dòng `bg-[#7c5cff]` viết tay
 * sẽ ra đúng màu tím nhưng nằm ngoài `@theme`, nên lần sau đổi token thì chỗ đó
 * không đổi theo — và một khối không phải AI sẽ mang màu AI. Đó là lỗi ngữ nghĩa,
 * mắt thường không phát hiện được khi review.
 *
 * Luật bắt hai đường lách phổ biến:
 *  1. Tailwind arbitrary value: `bg-[#fff]`, `text-[#0e9a8d]`, `border-[#ddd]`.
 *  2. Hex trong `style={{ color: "#fff" }}`.
 *
 * KHÔNG áp cho `app/globals.css` — đó là chỗ duy nhất được phép định nghĩa mã màu,
 * và ESLint không đọc CSS. Cũng không áp cho `lib/` vì ở đó không có className.
 *
 * Nếu thật sự cần một màu ngoài bảng: thêm token vào `@theme` trong globals.css
 * rồi dùng tên token. Đừng tắt luật bằng eslint-disable — token mới có tên gọi thì
 * lần sau người khác mới biết nó nghĩa là gì.
 */
const noHexColors = {
  files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        // Chuỗi thường: className="bg-[#fff]"
        selector: "Literal[value=/(bg|text|border|from|to|via|fill|stroke|ring|shadow|outline|decoration|divide|accent|caret|placeholder)-\\[#[0-9a-fA-F]{3,8}\\]/]",
        message:
          "Không viết mã hex trong className. Dùng token màu trong @theme (trust, promo, ai, danger, ink…) — bảng màu MediVia mang nghĩa, hex viết tay phá liên kết đó.",
      },
      {
        // Template literal: className={`bg-[${x}] text-[#fff]`}
        selector: "TemplateElement[value.raw=/(bg|text|border|from|to|via|fill|stroke|ring|shadow|outline|decoration|divide|accent|caret|placeholder)-\\[#[0-9a-fA-F]{3,8}\\]/]",
        message:
          "Không viết mã hex trong className. Dùng token màu trong @theme (trust, promo, ai, danger, ink…) — bảng màu MediVia mang nghĩa, hex viết tay phá liên kết đó.",
      },
      {
        // style={{ color: "#fff" }} — cùng vấn đề, khác cửa vào.
        selector:
          "JSXAttribute[name.name='style'] Property[key.name=/^(color|background|backgroundColor|borderColor|fill|stroke|outlineColor)$/] > Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
        message:
          "Không viết mã hex trong style. Dùng class có token màu; nếu cần màu mới thì thêm token vào @theme trong app/globals.css.",
      },
    ],
  },
};

/**
 * Chặn dùng `next/image` trực tiếp cho ảnh sản phẩm.
 *
 * Toàn bộ 24 sản phẩm hiện có `image: ""` (chưa có ảnh thật). `next/image` nhận
 * chuỗi rỗng thì văng lỗi runtime "Image is missing required src property" — và
 * TypeScript không bắt được, vì `""` vẫn là `string` hợp lệ.
 *
 * Lỗi này đã xảy ra thật ở ba file (dòng giỏ hàng, danh sách bước thanh toán, gợi ý
 * mua kèm): cả ba tự dựng `<Image src={product.image}>` thay vì đi qua `ProductImage`,
 * nên nhánh placeholder không bao giờ chạy. Sửa ba chỗ đó là xong hôm nay; luật này
 * để chỗ thứ tư không lặp lại y hệt vào tháng sau.
 *
 * Hai component được phép import `next/image` là `ProductImage` và `ProductThumb` —
 * cả hai đều kiểm tra `src` rỗng trước khi render.
 */
const noRawProductImage = {
  files: ["app/**/*.tsx", "components/**/*.tsx"],
  ignores: [
    "components/product/ProductImage.tsx",
    "components/product/ProductThumb.tsx",
  ],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "next/image",
            message:
              "Không dùng next/image trực tiếp cho ảnh sản phẩm. Dùng ProductImage (ô vuông theo cột) hoặc ProductThumb (48–64px, có link) — hai component đó xử lý trường hợp product.image rỗng, còn next/image sẽ văng lỗi runtime.",
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  noHexColors,
  noRawProductImage,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
