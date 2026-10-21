import { listRows } from "@/lib/admin/db";
import { getDefaultUnit } from "@/lib/data/products";
import { couponState } from "@/lib/data/coupons";
import { getOrders, getPrescriptionRows } from "@/lib/data/orders";
import { normalize } from "@/lib/ai/engine";
import { formatVnd } from "@/lib/format";
import type { Category } from "@/lib/data/categories";
import type { Article } from "@/lib/data/home";
import type { Pharmacy } from "@/lib/data/pharmacies";
import type { Customer } from "@/lib/data/customers";
import type { Coupon } from "@/lib/data/coupons";
import type { Comment, Product, Review } from "@/lib/types";

/** Một dòng kết quả. `href` nhảy thẳng tới dòng đó trên trang quản trị tương ứng. */
export type SearchHit = { title: string; meta: string; href: string };

export type SearchGroup = {
  key: string;
  label: string;
  /** Trang quản trị của nhóm — dùng khi kết quả bị cắt bớt. */
  href: string;
  /** Tổng số khớp, kể cả phần không hiện ra. */
  total: number;
  items: SearchHit[];
};

export type SearchResults = { query: string; groups: SearchGroup[]; total: number };

/** Mỗi nhóm hiện tối đa chừng này dòng; phần còn lại chỉ đếm. */
const perGroup = 6;

const couponStateLabel = {
  "dang-chay": "Đang chạy",
  "chua-bat-dau": "Chưa bắt đầu",
  "het-han": "Hết hạn",
} as const;

const prescriptionStateLabel = {
  "cho-duyet": "Chờ duyệt",
  "da-duyet": "Đã duyệt",
  "tu-choi": "Từ chối",
} as const;

/** "MediVia Quận 3" → "medivia-quan-3", cùng quy tắc id của trang nhà thuốc. */
const slugify = (value: string) => value.replace(/\s+/g, "-").toLowerCase();

/**
 * Tìm kiếm toàn bộ dữ liệu quản trị.
 *
 * Một hàm, một trang, không thêm ô tìm riêng cho từng bảng: mười bảng nhân mười
 * ô tìm là mười chỗ để lệch cách so khớp, và người dùng vẫn phải nhớ dữ liệu
 * nằm ở màn nào. Ở đây gõ một lần, kết quả chia nhóm, mỗi dòng bấm được.
 *
 * So khớp bằng `normalize` của `lib/ai/engine` — bỏ dấu tiếng Việt, nên gõ
 * "hapacol" hay "nguyen thi lan" vẫn ra. Nhiều từ thì phải khớp TẤT CẢ chứ
 * không phải một từ: khớp-một-từ biến "lan 0912" thành mọi thứ có chữ "lan".
 *
 * Đọc qua `listRows` chứ không import mảng gốc: khách đăng ký, đánh giá, bình
 * luận khách gửi lên chỉ nằm trong kho delta, mảng trong `lib/data` không có.
 */
export function adminSearch(rawQuery: string): SearchResults {
  const query = rawQuery.trim();
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { query, groups: [], total: 0 };

  /** Khớp khi MỌI từ đều xuất hiện trong chuỗi ghép của các trường. */
  const hit = (...fields: (string | number | undefined)[]) => {
    const hay = normalize(fields.filter((value) => value !== undefined).join(" "));
    return tokens.every((token) => hay.includes(token));
  };

  const group = (
    key: string,
    label: string,
    href: string,
    hits: SearchHit[],
  ): SearchGroup => ({
    key,
    label,
    href,
    total: hits.length,
    items: hits.slice(0, perGroup),
  });

  const productsHit: SearchHit[] = [];
  for (const product of listRows("products") as unknown as Product[]) {
    if (!hit(product.name, product.activeIngredient, product.brand, product.id, product.slug)) continue;
    const unit = getDefaultUnit(product);
    productsHit.push({
      title: product.name,
      meta: `${product.activeIngredient} · ${formatVnd(unit.price)}/${unit.label} · tồn ${product.stock.total}`,
      href: `/admin/kho-thuoc#sp-${product.id}`,
    });
  }

  const ordersHit: SearchHit[] = [];
  for (const order of getOrders()) {
    if (!hit(order.code, order.customer, order.phone)) continue;
    ordersHit.push({
      title: order.code,
      meta: `${order.customer} · ${order.phone} · ${formatVnd(order.summary.total)}`,
      href: `/admin/don-hang#don-${order.code}`,
    });
  }

  const customersHit: SearchHit[] = [];
  for (const row of listRows("customers") as unknown as Customer[]) {
    if (!hit(row.name, row.phone)) continue;
    customersHit.push({
      title: row.name,
      meta: row.phone,
      href: `/admin/nguoi-dung#kh-${row.phone}`,
    });
  }

  const reviewsHit: SearchHit[] = [];
  const productNames = new Map(
    (listRows("products") as unknown as Product[]).map((item) => [item.id, item.name]),
  );
  for (const review of listRows("reviews") as unknown as Review[]) {
    const productName = productNames.get(review.productId);
    if (!hit(review.author, review.body, productName)) continue;
    reviewsHit.push({
      title: `${review.author} · ${review.score} sao`,
      meta: productName ?? review.productId,
      href: `/admin/danh-gia#dg-${review.id}`,
    });
  }

  const commentsHit: SearchHit[] = [];
  const articleTitles = new Map(
    (listRows("articles") as unknown as Article[]).map((item) => [item.slug, item.title]),
  );
  for (const comment of listRows("comments") as unknown as Comment[]) {
    const articleTitle = articleTitles.get(comment.articleSlug);
    if (!hit(comment.author, comment.body, articleTitle)) continue;
    commentsHit.push({
      title: comment.author,
      meta: articleTitle ?? comment.articleSlug,
      href: `/admin/binh-luan#bl-${comment.id}`,
    });
  }

  const couponsHit: SearchHit[] = [];
  for (const coupon of listRows("coupons") as unknown as Coupon[]) {
    if (!hit(coupon.code, coupon.description)) continue;
    couponsHit.push({
      title: coupon.code,
      meta: `${coupon.description} · ${couponStateLabel[couponState(coupon)]}`,
      href: `/admin/uu-dai#ma-${coupon.code}`,
    });
  }

  const categoriesHit: SearchHit[] = [];
  for (const category of listRows("categories") as unknown as Category[]) {
    if (!hit(category.name, category.shortName, category.slug, category.description)) continue;
    categoriesHit.push({
      title: category.name,
      meta: `${category.shortName} · ${category.slug}`,
      href: `/admin/danh-muc#dm-${category.slug}`,
    });
  }

  const articlesHit: SearchHit[] = [];
  for (const article of listRows("articles") as unknown as Article[]) {
    if (!hit(article.title, article.excerpt, article.tag, article.author)) continue;
    articlesHit.push({
      title: article.title,
      meta: `${article.tag} · ${article.author}`,
      href: `/admin/bai-viet#bv-${article.slug}`,
    });
  }

  const pagesHit: SearchHit[] = [];
  for (const page of listRows("pages") as unknown as {
    slug: string;
    title: string;
    lead: string;
  }[]) {
    if (!hit(page.title, page.lead, page.slug)) continue;
    pagesHit.push({
      title: page.title,
      meta: `/trang/${page.slug}`,
      href: `/admin/trang#tr-${page.slug}`,
    });
  }

  const pharmaciesHit: SearchHit[] = [];
  for (const pharmacy of listRows("pharmacies") as unknown as Pharmacy[]) {
    if (!hit(pharmacy.name, pharmacy.address, pharmacy.district, pharmacy.phone)) continue;
    pharmaciesHit.push({
      title: pharmacy.name,
      meta: `${pharmacy.address}, ${pharmacy.district}`,
      href: `/admin/nha-thuoc#nt-${slugify(pharmacy.name)}`,
    });
  }

  const prescriptionsHit: SearchHit[] = [];
  for (const row of getPrescriptionRows()) {
    if (!hit(row.orderCode, row.fileName, row.order.customer, row.order.phone)) continue;
    prescriptionsHit.push({
      title: row.orderCode,
      meta: `${row.order.customer} · ${prescriptionStateLabel[row.status]} · ${row.fileName}`,
      href: `/admin/duyet-don-thuoc#dt-${row.orderCode}`,
    });
  }

  const groups = [
    group("products", "Hàng hoá", "/admin/kho-thuoc", productsHit),
    group("orders", "Đơn hàng", "/admin/don-hang", ordersHit),
    group("customers", "Khách hàng", "/admin/nguoi-dung", customersHit),
    group("reviews", "Đánh giá", "/admin/danh-gia", reviewsHit),
    group("comments", "Bình luận", "/admin/binh-luan", commentsHit),
    group("coupons", "Mã ưu đãi", "/admin/uu-dai", couponsHit),
    group("categories", "Danh mục", "/admin/danh-muc", categoriesHit),
    group("articles", "Bài viết", "/admin/bai-viet", articlesHit),
    group("pages", "Trang chữ", "/admin/trang", pagesHit),
    group("pharmacies", "Nhà thuốc", "/admin/nha-thuoc", pharmaciesHit),
    group("prescriptions", "Đơn thuốc", "/admin/duyet-don-thuoc", prescriptionsHit),
  ].filter((entry) => entry.total > 0);

  return { query, groups, total: groups.reduce((sum, entry) => sum + entry.total, 0) };
}
