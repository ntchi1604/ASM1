/**
 * Tỉnh / quận / phường cho biểu mẫu địa chỉ.
 *
 * Một nguồn cho cả trang thanh toán và sổ địa chỉ ở trang tài khoản: chép thành
 * hai danh sách thì có ngày khách lưu được một phường ở trang này mà trang kia
 * không có để chọn, và địa chỉ đã lưu không điền lại được.
 *
 * Bản mẫu giữ đúng ba tỉnh như trang thanh toán vốn có. Danh sách đầy đủ 63 tỉnh
 * và phường theo đơn vị hành chính mới là dữ liệu tra cứu, không phải hằng số
 * trong mã nguồn.
 */
export const provinces = ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"];

export const districts = ["Quận 3", "Quận 1", "Quận 10"];

export const wards = ["Phường Võ Thị Sáu", "Phường Đa Kao", "Phường 5"];

export function isKnownProvince(value: string): boolean {
  return provinces.includes(value);
}
