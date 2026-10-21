"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addRow, getRow, removeRow, updateRow } from "@/lib/admin/db";
import { getArticleBySlug } from "@/lib/data/articles";
import { forgetOwnComment, readOwnCommentIds, rememberOwnComment } from "@/lib/shop/comment-cookie";
import type { Comment } from "@/lib/types";

/**
 * Thêm, sửa, xoá bình luận dưới bài viết.
 *
 * Quyền sửa/xoá đến từ cookie của máy đã viết bình luận — không phải từ tên
 * người gửi, vì ai cũng gõ được tên người khác. Cùng mức tin cậy với đánh giá
 * "đã mua tại MediVia": đủ cho bản mẫu không có tài khoản, và ghi rõ giới hạn
 * này ngay dưới ô bình luận để người đọc không hiểu nhầm.
 *
 * Mọi trường đến từ FormData đều là dữ liệu của người lạ: cắt độ dài trước, kiểm
 * bài viết có thật sau, rồi mới ghi.
 */
const MIN_BODY = 10;
const MAX_BODY = 600;
const MAX_NAME = 40;

const read = (data: FormData, key: string, max: number) => {
  const raw = data.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
};

/** Quay lại đúng bài, kèm mã thông báo, neo xuống mục bình luận. */
function back(slug: string, code: string) {
  return `/goc-suc-khoe/${slug}?binh-luan=${code}#binh-luan`;
}

/** Giờ địa phương dạng `YYYY-MM-DDTHH:mm`, cùng định dạng với bình luận mẫu. */
function nowLocal() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** "Nguyễn Thị Lan" → "NL". Cùng quy tắc với đánh giá. */
function initialsOf(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  const last = words.at(-1) ?? "";
  return ((words[0]?.[0] ?? "") + (last[0] ?? "")).toUpperCase();
}

export async function submitComment(data: FormData) {
  const slug = read(data, "articleSlug", 80);
  const article = getArticleBySlug(slug);
  if (!article) redirect("/goc-suc-khoe");

  const author = read(data, "author", MAX_NAME);
  const body = read(data, "body", MAX_BODY);
  if (author.length < 2) redirect(back(slug, "loi-ten"));
  if (body.length < MIN_BODY) redirect(back(slug, "loi-noi-dung"));

  const comment: Comment = {
    id: `cm-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    articleSlug: slug,
    author,
    initials: initialsOf(author),
    date: nowLocal(),
    body,
  };

  if (!addRow("comments", comment as unknown as Record<string, unknown>)) {
    redirect(back(slug, "loi-luu"));
  }

  await rememberOwnComment(comment.id);
  revalidatePath(`/goc-suc-khoe/${slug}`);
  revalidatePath("/admin/binh-luan");
  redirect(back(slug, "ok"));
}

export async function editComment(data: FormData) {
  const slug = read(data, "articleSlug", 80);
  if (!getArticleBySlug(slug)) redirect("/goc-suc-khoe");

  const id = read(data, "id", 80);
  const body = read(data, "body", MAX_BODY);
  if (body.length < MIN_BODY) redirect(back(slug, "loi-noi-dung"));

  // Ba điều kiện: máy này đã viết bình luận đó, bình luận còn tồn tại, và nó
  // thuộc đúng bài đang mở. Thiếu một cái là sửa được bài của người khác bằng
  // cách đoán mã.
  const own = await readOwnCommentIds();
  const row = getRow("comments", id);
  if (!own.includes(id) || !row || row.articleSlug !== slug) {
    redirect(back(slug, "loi-quyen"));
  }

  updateRow("comments", id, { body });
  revalidatePath(`/goc-suc-khoe/${slug}`);
  revalidatePath("/admin/binh-luan");
  redirect(back(slug, "da-sua"));
}

export async function deleteComment(data: FormData) {
  const slug = read(data, "articleSlug", 80);
  if (!getArticleBySlug(slug)) redirect("/goc-suc-khoe");

  const id = read(data, "id", 80);
  const own = await readOwnCommentIds();
  const row = getRow("comments", id);
  if (!own.includes(id) || !row || row.articleSlug !== slug) {
    redirect(back(slug, "loi-quyen"));
  }

  removeRow("comments", id);
  await forgetOwnComment(id);
  revalidatePath(`/goc-suc-khoe/${slug}`);
  revalidatePath("/admin/binh-luan");
  redirect(back(slug, "da-xoa"));
}
