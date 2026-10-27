import { FileCheck, Upload } from "@/lib/icons";
import type { CartItem } from "@/lib/data/cart";

/**
 * Tải đơn thuốc — chỉ hiện khi giỏ THỰC SỰ có thuốc kê đơn.
 *
 * Ô tệp phải có `name` thì `FormData` mới mang tệp lên server; thiếu nó thì cả
 * khối này là hình vẽ — khách chọn ảnh, bấm đặt hàng, và không có gì được gửi.
 * `required` để trình duyệt chặn ngay tại chỗ; `placeOrder` vẫn tự kiểm lại, vì
 * thuộc tính HTML không phải là kiểm tra phía server.
 *
 * Không cần `encType`: form là server action, React tự gửi multipart — cùng cách
 * `ReviewForm` đang gửi ảnh đánh giá.
 */
export function PrescriptionUpload({ items }: { items: CartItem[] }) {
  const needsPrescription = items.filter((item) => item.product.prescriptionRequired);
  if (needsPrescription.length === 0) return null;

  return (
    <section className="rounded-card border border-danger/30 bg-danger-wash p-4 md:p-5">
      <h2 className="text-label-md text-ink">Đơn thuốc kê đơn</h2>

      <p className="mt-1.5 text-body-sm text-ink">
        Đơn của bạn có {needsPrescription.length} thuốc kê đơn cần dược sĩ xác nhận:{" "}
        {needsPrescription.map((item) => item.product.name).join(", ")}.
      </p>

      <label
        htmlFor="anh-don-thuoc"
        className="focus-ring mt-3 flex cursor-pointer flex-col items-center gap-1.5 rounded-card border border-dashed border-danger/40 bg-card px-4 py-6 text-center"
      >
        <span className="text-danger">
          <Upload size={22} aria-hidden />
        </span>
        <span className="text-label-md text-ink">Tải ảnh đơn thuốc từ bác sĩ</span>
        <span className="text-body-sm text-ink-muted">
          Chấp nhận JPG, PNG, PDF dưới 10 MB
        </span>
      </label>
      <input
        id="anh-don-thuoc"
        name="donThuoc"
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        required
        className="sr-only"
      />

      <p className="mt-3 flex items-start gap-2 text-body-sm text-ink-muted">
        <FileCheck size={16} className="mt-0.5 shrink-0 text-trust-text" aria-hidden />
        Dược sĩ sẽ gọi xác nhận trong 15 phút trước khi soạn thuốc kê đơn. Thuốc kê
        đơn chỉ được giao khi đơn thuốc hợp lệ.
      </p>
    </section>
  );
}
