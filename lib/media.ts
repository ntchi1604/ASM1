import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Tệp tải lên: ảnh khách đính kèm đánh giá (kèm video), và ảnh mặt hàng do quản
 * trị tải lên.
 *
 * Vì sao kiểm loại tệp bằng BYTE ĐẦU chứ không tin `file.type`: kiểu MIME do
 * trình duyệt gửi lên và sửa được bằng một request tự viết. Một tệp HTML gắn
 * nhãn `image/jpeg` mà được phục vụ lại với `Content-Type: image/jpeg` thì
 * trình duyệt không chạy mã trong đó — nhưng chỉ khi phần đuôi tệp do chính
 * máy chủ đặt, không phải do người gửi. Ở đây đuôi tệp suy ra từ byte đã kiểm.
 *
 * ponytail: ghi thẳng vào `.data/uploads` trên đĩa của tiến trình đang chạy.
 * Đủ cho một máy chủ và một người dùng. Khi có nhiều máy chủ hoặc cần CDN thì
 * thay `writeFile` bằng object storage và trả về khoá thay vì tên tệp; lược đồ
 * đã để cột dạng text nên chỉ đổi đúng module này.
 */

export const maxPhotos = 3;
export const maxPhotoBytes = 2 * 1024 * 1024;
export const maxVideoBytes = 5 * 1024 * 1024;

export const uploadsDir = join(process.cwd(), ".data", "uploads");

/** Đuôi tệp là nguồn duy nhất của `Content-Type` lúc phục vụ lại. */
const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
};

export function contentTypeOf(name: string): string | undefined {
  return contentTypes[name.split(".").pop()?.toLowerCase() ?? ""];
}

export type SavedMedia = { photos: string[]; video?: string };

export type SaveMediaResult =
  | { ok: true; media: SavedMedia }
  | { ok: false; files: string[] };

/**
 * Nhận diện ảnh/video bằng chữ ký nhị phân. Trả về đuôi tệp ứng với loại ĐÃ
 * XÁC NHẬN, `undefined` nếu không nhận ra — không có nhánh "đoán theo tên tệp".
 */
function sniffType(head: Uint8Array): string | undefined {
  const at = (offset: number, ...bytes: number[]) =>
    bytes.every((byte, index) => head[offset + index] === byte);

  if (at(0, 0xff, 0xd8, 0xff)) return "jpg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "webp";
  if (at(0, 0x25, 0x50, 0x44, 0x46, 0x2d)) return "pdf"; // "%PDF-"
  if (at(4, 0x66, 0x74, 0x79, 0x70)) return "mp4"; // hộp "ftyp" của MP4/MOV
  if (at(0, 0x1a, 0x45, 0xdf, 0xa3)) return "webm";
  return undefined;
}

/**
 * Ghi một tệp vào `dir` và trả tên đã sinh.
 *
 * `dir` là tham số chứ không phải hằng số trong module: ảnh đơn thuốc phải nằm ở
 * thư mục KHÔNG được `/api/media` phục vụ — cùng một hàm ghi, hai kho khác nhau.
 * `pdf` chỉ có mặt ở kho đơn thuốc; bộ đuôi của kho công khai không có nó.
 */
export async function saveOne(
  file: File,
  allowed: Set<string>,
  dir: string = uploadsDir,
): Promise<string | undefined> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ext = sniffType(head);
  if (!ext || !allowed.has(ext)) return undefined;

  // Tên ngẫu nhiên, không dùng tên người gửi: tên là thứ trình duyệt (và người
  // gửi) tự đặt, có thể chứa `..` hoặc tiếng Việt có dấu. Đổi tên cũng làm mỗi
  // lần thay ảnh sinh một URL mới, nên bộ nhớ đệm của `next/image` không trả
  // ảnh cũ cho ảnh vừa thay.
  const name = `${crypto.randomUUID()}.${ext}`;
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), new Uint8Array(await file.arrayBuffer()));
  return name;
}

/**
 * Lưu tệp đính kèm đánh giá. Tệp nào hỏng thì bỏ TOÀN BỘ và trả về những tệp đã
 * ghi để người gọi xoá — một đánh giá nửa có ảnh nửa mất ảnh trên trang sản
 * phẩm trông như ảnh bị lỗi, không ai đoán ra là do lúc gửi.
 */
export async function saveMedia(
  photos: File[],
  video: File | undefined,
): Promise<SaveMediaResult> {
  const photoFiles = photos.filter((file) => file.size > 0);
  if (photoFiles.length > maxPhotos) return { ok: false, files: [] };
  if (photoFiles.some((file) => file.size > maxPhotoBytes)) return { ok: false, files: [] };
  if (video && video.size > maxVideoBytes) return { ok: false, files: [] };

  const written: string[] = [];
  const photoNames: string[] = [];
  try {
    for (const file of photoFiles) {
      const name = await saveOne(file, new Set(["jpg", "png", "webp"]));
      if (!name) return { ok: false, files: written };
      written.push(name);
      photoNames.push(name);
    }

    let videoName: string | undefined;
    if (video && video.size > 0) {
      videoName = await saveOne(video, new Set(["mp4", "webm"]));
      if (!videoName) return { ok: false, files: written };
      written.push(videoName);
    }

    return { ok: true, media: { photos: photoNames, video: videoName } };
  } catch (err) {
    console.error("Không ghi được tệp đánh giá:", err);
    return { ok: false, files: written };
  }
}

/**
 * Lưu một ảnh mặt hàng. Chỉ nhận ảnh — không nhận video như tệp đính kèm đánh
 * giá, vì ảnh mặt hàng hiện ở mọi thẻ sản phẩm trên site.
 *
 * Trả `undefined` khi không có tệp (ô để trống) để người gọi phân biệt "không
 * đổi ảnh" với "ảnh sai định dạng".
 */
export async function saveProductImage(file: File | undefined): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;
  if (file.size > maxPhotoBytes) throw new Error("Ảnh vượt quá 2 MB.");
  const name = await saveOne(file, new Set(["jpg", "png", "webp"]));
  if (!name) throw new Error("Ảnh phải là JPG, PNG hoặc WebP.");
  return name;
}

export async function removeMedia(names: string[]) {
  await Promise.all(
    names
      .filter((name) => safeName(name) !== "")
      .map((name) => unlink(join(uploadsDir, name)).catch(() => {})),
  );
}

/**
 * Xoá tệp đang được một URL nội bộ trỏ tới.
 *
 * Chỉ đụng vào tệp do module này ghi. Ảnh đóng gói sẵn trong `public/products`
 * (`/products/…`) không nằm trên đĩa ghi được và cũng không được xoá — đường dẫn
 * đó không khớp `/api/media/`.
 */
export async function removeMediaFromUrl(url: string) {
  const match = url.match(/^\/api\/media\/([^/?#]+)$/);
  if (match) await removeMedia([match[1]]);
}

/**
 * Tên tệp đi qua URL, nên chỉ chấp nhận đúng dạng do `saveOne` sinh ra. Một
 * `..%2F` lọt vào đây là đọc được mọi tệp trên máy chủ.
 */
export function safeName(name: string): string {
  const match = name.match(/^[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm)$/i);
  return match ? name : "";
}

export function mediaUrl(name: string): string {
  return `/api/media/${name}`;
}
