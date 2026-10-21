"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addRow } from "@/lib/admin/db";
import { getOrderByCode } from "@/lib/data/orders";
import { getProductById } from "@/lib/data/products";
import { reviews } from "@/lib/data/reviews";
import { ownsOrder } from "@/lib/shop/reviewable-orders";
import { removeMedia, saveMedia } from "@/lib/media";
import type { Review } from "@/lib/types";

/**
 * Viết đánh giá sau khi đơn đã giao.
 *
 * "Đã mua tại MediVia" chứng minh bằng một trong hai thứ, giống hệt
 * `getReviewableOrders`: mã đơn trong cookie HttpOnly của máy này, hoặc số điện
 * thoại của tài khoản đang đăng nhập khớp số ghi trên đơn. Đơn đã giao, và đơn
 * có đúng mặt hàng đang xem. Thiếu một cái là một câu "đã mua" không có cơ sở.
 *
 * ponytail: ai biết mã đơn, hoặc ai đăng nhập được vào số đó, thì đánh giá được.
 * Muốn chắc hơn thì cần `users` + `orders.user_id`; lược đồ đã có, chỗ đổi là
 * đúng hàm này.
 */
export async function submitReview(data: FormData) {
  const text = (key: string, max = 200) => {
    const raw = data.get(key);
    return typeof raw === "string" ? raw.trim().slice(0, max) : "";
  };

  const productId = text("productId", 80);
  const orderCode = text("orderCode", 20);
  const body = text("body", 1000);
  const score = Number(text("score", 1));

  const product = getProductById(productId);
  if (!product) redirect("/");

  /** Quay lại đúng trang sản phẩm, kèm mã lỗi để hiện đúng một câu. */
  const back = (code: string) => `/thuoc/${product.slug}?danh-gia=${code}`;

  if (!Number.isInteger(score) || score < 1 || score > 5) redirect(back("loi-sao"));
  if (body.length < 10) redirect(back("loi-noi-dung"));

  const order = getOrderByCode(orderCode);
  if (!order || !(await ownsOrder(order))) redirect(back("loi-don"));
  if (order.status !== "da-giao" && order.status !== "hoan-thanh") {
    redirect(back("loi-chua-giao"));
  }
  if (!order.lines.some((line) => line.productId === productId)) redirect(back("loi-don"));

  // Một đơn chỉ đánh giá một mặt hàng một lần — nếu không thì một người bấm
  // gửi ba lần là ba "khách" cùng khen.
  if (reviews.some((review) => review.orderCode === order.code && review.productId === productId)) {
    redirect(back("da-danh-gia"));
  }

  // Ảnh/video lưu trước dòng đánh giá: ghi dòng trước rồi mới lưu tệp thì một
  // tệp hỏng để lại đánh giá trỏ vào ảnh không tồn tại, và không có gì dọn chúng.
  const photos = data.getAll("photos").filter((entry): entry is File => entry instanceof File);
  const video = data.get("video");
  const saved = await saveMedia(
    photos,
    video instanceof File ? video : undefined,
  );
  if (!saved.ok) {
    await removeMedia(saved.files);
    redirect(back("loi-tep"));
  }

  const review: Review = {
    id: `rv-${order.code}-${productId}`,
    productId,
    author: order.customer,
    initials: initialsOf(order.customer),
    score,
    date: new Date().toISOString().slice(0, 10),
    body,
    photos: saved.media.photos.length > 0 ? saved.media.photos : undefined,
    video: saved.media.video,
    orderCode: order.code,
  };

  if (!addRow("reviews", review as unknown as Record<string, unknown>)) {
    await removeMedia(saved.media.video ? [...saved.media.photos, saved.media.video] : saved.media.photos);
    redirect(back("da-danh-gia"));
  }

  revalidatePath(`/thuoc/${product.slug}`);
  revalidatePath("/admin/danh-gia");
  redirect(back("ok"));
}

/** "Nguyễn Thị Lan" → "NL". Cùng quy tắc với chữ viết tắt của đánh giá mẫu. */
function initialsOf(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  const last = words.at(-1) ?? "";
  return ((words[0]?.[0] ?? "") + (last[0] ?? "")).toUpperCase();
}
