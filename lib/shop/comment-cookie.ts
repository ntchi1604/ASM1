import { cookies } from "next/headers";

/**
 * Mã những bình luận đã viết trên máy này.
 *
 * Không có đăng nhập, nên "bình luận của tôi" chỉ có thể chứng minh bằng thứ
 * trình duyệt này giữ: danh sách mã trong cookie HttpOnly. Cùng cách với mã đơn
 * đã đặt — cookie không tiết lộ nội dung gì, và người khác mở cùng máy thì cũng
 * chỉ sửa được những gì máy đó đã viết.
 *
 * ponytail: 30 mã gần nhất. Có `users` thì chuyển sang `comments.user_id`;
 * lược đồ đã có, chỗ đổi là đúng ba hàm dưới đây.
 */
export const ownCommentsCookieName = "medivia_comments";
const MAX_IDS = 30;

// Mã bình luận mẫu cũng khớp mẫu này, nhưng chúng không bao giờ nằm trong cookie
// của ai — nên chỉ bình luận do chính máy này viết mới sửa/xoá được.
const ID_PATTERN = /^cm-[a-z0-9-]+$/;

function parse(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => ID_PATTERN.test(id))
    .slice(0, MAX_IDS);
}

function write(store: Awaited<ReturnType<typeof cookies>>, ids: string[]) {
  store.set(ownCommentsCookieName, ids.slice(0, MAX_IDS).join(","), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function readOwnCommentIds(): Promise<string[]> {
  return parse((await cookies()).get(ownCommentsCookieName)?.value);
}

/** Gọi trong server action, ngay sau khi đã ghi bình luận mới. */
export async function rememberOwnComment(id: string) {
  const store = await cookies();
  const current = parse(store.get(ownCommentsCookieName)?.value);
  write(store, [id, ...current.filter((item) => item !== id)]);
}

/** Gọi sau khi chính tác giả xoá bình luận — không để lại mã mồ côi. */
export async function forgetOwnComment(id: string) {
  const store = await cookies();
  write(
    store,
    parse(store.get(ownCommentsCookieName)?.value).filter((item) => item !== id),
  );
}
