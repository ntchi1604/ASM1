import Image from "next/image";
import Link from "next/link";
import { productInitials } from "@/components/product/ProductImage";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

/**
 * Ảnh sản phẩm cỡ nhỏ, có link về trang chi tiết.
 *
 * Vì sao cần component này thay vì dùng `ProductImage`: `ProductImage` là ô vuông
 * co giãn theo cột (`aspect-square w-full`) với placeholder có cả tên hãng — đúng
 * cho thẻ sản phẩm rộng 132–220px. Trong giỏ hàng và bước thanh toán, ảnh chỉ rộng
 * 48–64px: nhồi placeholder đó vào thì tên hãng tràn ra ngoài khung.
 *
 * Vì sao KHÔNG để mỗi trang tự viết `<Link><Image/></Link>`: trước đây ba chỗ
 * (dòng giỏ hàng, danh sách ở bước thanh toán, gợi ý mua kèm) tự dựng markup ảnh
 * riêng, và cả ba đều truyền thẳng `product.image` vào `next/image`. Sản phẩm thêm
 * mới có thể chưa có ảnh (`image: ""`), và khi đó `next/image` nhận chuỗi rỗng, văng
 * lỗi "Image is missing required src property" ở mọi trang có sản phẩm. `ProductImage`
 * đã chặn đúng trường hợp này bằng nhánh placeholder từ đầu — ba chỗ kia không chạy
 * qua nó nên không được bảo vệ.
 *
 * Bài học đã gói vào component: chỗ nào hiện ảnh sản phẩm cũng phải đi qua một trong
 * hai component này, không dùng `next/image` trực tiếp với `product.image`.
 *
 * Link nằm luôn trong component vì cả ba chỗ đều cần nó, và vì địa chỉ phải dựng từ
 * `product.slug` chứ không phải `product.id` — hai trường này KHÁC nhau trong dữ liệu
 * MediVia (`prospan` vs `prospan-siro-ho`), và dùng lẫn thì ra trang 404.
 */
const sizeClass = {
  sm: { box: "size-12", px: "48px", text: "text-label-sm" },
  md: { box: "size-14", px: "56px", text: "text-label-md" },
  lg: { box: "size-16", px: "64px", text: "text-label-md" },
} as const;

export function ProductThumb({
  product,
  size = "lg",
  className,
}: {
  product: Product;
  size?: keyof typeof sizeClass;
  className?: string;
}) {
  const spec = sizeClass[size];

  return (
    <Link
      href={`/thuoc/${product.slug}`}
      className={cn(
        "focus-ring relative shrink-0 overflow-hidden rounded-card border border-hairline bg-card",
        spec.box,
        className,
      )}
    >
      {product.image ? (
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={spec.px}
          className="object-contain p-1"
        />
      ) : (
        /*
          Placeholder rút gọn: chỉ chữ cái đầu, không tên hãng, không dải màu trên.
          Ở 48px thì dải màu chiếm gần hết chiều cao còn tên hãng không đọc được —
          giữ lại chúng chỉ làm ô ảnh trông như bị lỗi hiển thị.

          `aria-hidden` vì tên sản phẩm đã nằm ngay cạnh trong mọi chỗ dùng: đọc
          thêm "PA" ở đây chỉ làm trình đọc màn hình lặp vô nghĩa.
        */
        <span
          aria-hidden
          className={cn(
            "flex h-full w-full items-center justify-center bg-recessed/60 font-headline text-trust-text",
            spec.text,
          )}
        >
          {productInitials(product.name)}
        </span>
      )}
    </Link>
  );
}
