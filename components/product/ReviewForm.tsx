import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { Camera, Upload } from "@/lib/icons";
import { submitReview } from "@/lib/shop/review-actions";
import type { ResolvedOrder } from "@/lib/data/orders";
import { site } from "@/lib/data/site";

/**
 * Ô viết đánh giá.
 *
 * Chỉ hiện khi có đơn đã giao: đơn đặt trên máy này (cookie mã đơn) hoặc đơn của
 * tài khoản đang đăng nhập. Đó là bằng chứng duy nhất cho chữ "đã mua tại
 * MediVia" — hiện ô này cho mọi khách thì nhãn kia thành lời nói suông.
 *
 * Lỗi đọc từ `?danh-gia=` chứ không dùng `useActionState`: form gửi lên rồi
 * chuyển trang, vì trang sản phẩm là Server Component đọc dữ liệu mới — để form
 * tự cập nhật tại chỗ thì danh sách đánh giá phía trên không đổi.
 */
const messages: Record<string, { text: string; ok: boolean }> = {
  ok: { text: "Đã gửi đánh giá. Cảm ơn bạn đã chia sẻ.", ok: true },
  "da-danh-gia": { text: "Bạn đã đánh giá mặt hàng này trong đơn đó rồi.", ok: false },
  "loi-sao": { text: "Chọn số sao từ 1 đến 5.", ok: false },
  "loi-noi-dung": { text: "Nhận xét cần ít nhất 10 ký tự.", ok: false },
  "loi-don": { text: "Không tìm thấy đơn này trong tài khoản của bạn.", ok: false },
  "loi-chua-giao": { text: "Chỉ đánh giá được sau khi đơn đã giao.", ok: false },
  "loi-tep": {
    text: "Tệp đính kèm không hợp lệ. Chỉ nhận ảnh JPG/PNG/WEBP tối đa 2 MB và video MP4/WEBM tối đa 5 MB.",
    ok: false,
  },
};

/** Giới hạn bên dưới phải khớp `lib/shop/media.ts` — cùng một con số, hai nơi. */
const maxPhotos = 3;
const maxPhotoBytes = 2 * 1024 * 1024;
const maxVideoBytes = 5 * 1024 * 1024;

export function ReviewForm({
  productId,
  orders,
  messageCode,
}: {
  productId: string;
  orders: ResolvedOrder[];
  messageCode?: string;
}) {
  const message = messageCode ? messages[messageCode] : undefined;

  // Gửi xong thì đơn không còn trong danh sách đánh giá được — form biến mất, và
  // nếu ẩn luôn câu xác nhận thì người dùng chỉ thấy trang nhảy về đầu mà không
  // biết đã gửi được chưa.
  if (orders.length === 0) {
    return message ? (
      <p role="status" className={`mt-5 text-body-sm ${message.ok ? "text-trust-text" : "text-danger"}`}>
        {message.text}
      </p>
    ) : null;
  }

  return (
    <form
      action={submitReview}
      className="mt-5 flex flex-col gap-3 rounded-card border border-hairline bg-card p-4"
    >
      <input type="hidden" name="productId" value={productId} />

      <fieldset>
        <legend className="text-label-md text-ink">Đánh giá của bạn</legend>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {[5, 4, 3, 2, 1].map((value, index) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-1.5 rounded-chip border border-hairline px-2.5 py-1.5 text-body-sm text-ink has-checked:border-trust has-checked:bg-trust-wash has-checked:text-trust-text"
            >
              <input
                type="radio"
                name="score"
                value={value}
                defaultChecked={index === 0}
                className="focus-ring size-4 accent-[var(--color-trust)]"
              />
              {value} sao
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        label="Đơn đã giao"
        id="review-order"
        hint="Chỉ đơn đã giao của tài khoản này mới đánh giá được — đó là cách câu “đã mua tại MediVia” có cơ sở."
      >
        <select
          id="review-order"
          name="orderCode"
          className="focus-ring h-11 w-full rounded-card border border-hairline bg-card px-3 text-body-md text-ink"
        >
          {orders.map((order) => (
            <option key={order.code} value={order.code}>
              {order.code} · {order.items.length} sản phẩm
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Nhận xét"
        id="review-body"
        hint="Thuốc dùng có hiệu quả không, đóng gói và tư vấn thế nào. Tối thiểu 10 ký tự."
      >
        <Textarea
          id="review-body"
          name="body"
          rows={3}
          minLength={10}
          maxLength={1000}
          required
          placeholder="Ví dụ: uống sau ăn khoảng 20 phút là dễ chịu hơn, dược sĩ gọi hướng dẫn liều rõ ràng."
        />
      </Field>

      {/*
        `accept` chỉ là gợi ý của trình duyệt, không phải kiểm tra: người dùng
        đổi được phần mở rộng tệp. Máy chủ đọc byte đầu để quyết định loại thật.
      */}
      <Field
        label="Ảnh thực tế (không bắt buộc)"
        id="review-photos"
        hint="Tối đa 3 ảnh JPG, PNG hoặc WEBP, mỗi ảnh dưới 2 MB. Ảnh hộp thuốc và đơn thuốc giúp người mua sau dễ hình dung hơn."
      >
        <div className="flex items-center gap-2.5 rounded-card border border-dashed border-hairline bg-recessed/50 px-3 py-2.5">
          <Camera size={18} className="shrink-0 text-trust-text" aria-hidden />
          <input
            id="review-photos"
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp"
            multiple
            aria-describedby="review-photos-limit"
            className="w-full text-body-sm text-ink-muted file:mr-3 file:rounded-chip file:border-0 file:bg-card file:px-2.5 file:py-1.5 file:text-label-sm file:text-trust-text"
          />
        </div>
      </Field>

      <Field
        label="Video mở hộp (không bắt buộc)"
        id="review-video"
        hint="Một video MP4 hoặc WEBM dưới 5 MB."
      >
        <div className="flex items-center gap-2.5 rounded-card border border-dashed border-hairline bg-recessed/50 px-3 py-2.5">
          <Upload size={18} className="shrink-0 text-trust-text" aria-hidden />
          <input
            id="review-video"
            type="file"
            name="video"
            accept="video/mp4,video/webm"
            className="w-full text-body-sm text-ink-muted file:mr-3 file:rounded-chip file:border-0 file:bg-card file:px-2.5 file:py-1.5 file:text-label-sm file:text-trust-text"
          />
        </div>
      </Field>
      <p id="review-photos-limit" className="sr-only">
        Chọn tối đa {maxPhotos} ảnh, mỗi ảnh dưới {maxPhotoBytes / 1024 / 1024} MB, và một
        video dưới {maxVideoBytes / 1024 / 1024} MB.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline-trust" size="sm">
          Gửi đánh giá
        </Button>
        <span className="text-body-sm text-ink-subtle">
          Đánh giá hiện công khai sau khi gửi. Cần xoá thì gọi {site.hotline}.
        </span>
      </div>

      {message ? (
        <p
          role="status"
          className={`text-body-sm ${message.ok ? "text-trust-text" : "text-danger"}`}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
