import { cn } from "@/lib/cn";

/**
 * Câu giải thích vì sao thuốc kê đơn không thêm được vào giỏ hàng.
 *
 * Tách khỏi trang chi tiết để câu chữ chỉ có một bản. Cùng ràng buộc pháp lý này
 * xuất hiện ở nhiều nơi hiện thuốc kê đơn, và viết tay ở mỗi chỗ thì sớm muộn sẽ có
 * chỗ nói nhẹ hơn chỗ khác — với thuốc kê đơn, "nói nhẹ hơn" nghĩa là gợi ý người ta
 * có cách mua mà không cần đơn.
 *
 * CỐ Ý không có nút bấm và không có khung màu: component này đứng ngay dưới nút
 * "Tư vấn dược sĩ" trong hộp giá, nên thêm nút nữa là hai nút cạnh nhau cùng một
 * việc, còn thêm khung đỏ là hộp đỏ lồng trong hộp giá. Nơi nào cần khối cảnh báo
 * đứng riêng thì đã có `PrescriptionUpload` ở trang thanh toán.
 */
export function PrescriptionNotice({
  productName,
  className,
}: {
  /** Tên thuốc, nếu có thì câu chữ nêu đúng tên thay vì nói chung. */
  productName?: string;
  className?: string;
}) {
  const subject = productName ? `“${productName}”` : "Thuốc này";

  return (
    <p className={cn("text-body-sm text-ink-muted", className)}>
      {subject} là thuốc kê đơn, chỉ được bán khi có đơn của bác sĩ. Dược sĩ MediVia sẽ
      xem đơn, xác nhận đúng hoạt chất và liều rồi mới soạn thuốc.
    </p>
  );
}
