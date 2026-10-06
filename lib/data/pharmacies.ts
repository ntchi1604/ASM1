/**
 * Nhà thuốc trong hệ thống.
 *
 * `site.pharmacyCount` là 1.247 — con số marketing của toàn quốc. Danh sách ở đây
 * là sáu nhà thuốc mẫu, và trang hệ thống nhà thuốc nói rõ điều đó thay vì in ra
 * 1.247 dòng bịa. Một nhà thuốc có địa chỉ, số điện thoại và giờ mở cửa cụ thể
 * thì kiểm chứng được; 1.241 dòng còn lại thì không.
 *
 * Nhà thuốc đầu danh sách cũng là nhà thuốc nhận hàng ở trang thanh toán —
 * `lib/data/delivery.ts` đọc từ đây chứ không chép lại tên và địa chỉ. Chép lại
 * thì có ngày sửa một chỗ và khách đến sai địa chỉ.
 */
export type Pharmacy = {
  name: string;
  address: string;
  district: string;
  phone: string;
  /** Giờ mở cửa, đã gồm cả nhà thuốc có ca đêm. */
  hours: string;
};

export const pharmacies: Pharmacy[] = [
  {
    name: "MediVia Quận 3",
    address: "89 Cao Thắng, P. Võ Thị Sáu",
    district: "Quận 3, TP.HCM",
    phone: "028 3930 1188",
    hours: "07:00 – 22:00 hằng ngày",
  },
  {
    name: "MediVia Quận 1",
    address: "12 Nguyễn Thị Minh Khai, P. Bến Nghé",
    district: "Quận 1, TP.HCM",
    phone: "028 3822 4477",
    hours: "07:00 – 22:00 hằng ngày",
  },
  {
    name: "MediVia Quận 7",
    address: "1056 Huỳnh Tấn Phát, P. Tân Phú",
    district: "Quận 7, TP.HCM",
    phone: "028 3773 0290",
    hours: "24/24 — có ca đêm",
  },
  {
    name: "MediVia Thủ Đức",
    address: "218 Võ Văn Ngân, P. Bình Thọ",
    district: "TP. Thủ Đức, TP.HCM",
    phone: "028 3722 6155",
    hours: "07:00 – 22:00 hằng ngày",
  },
  {
    name: "MediVia Hà Nội — Đống Đa",
    address: "45 Chùa Bộc, P. Quang Trung",
    district: "Đống Đa, Hà Nội",
    phone: "024 3574 2266",
    hours: "07:00 – 22:00 hằng ngày",
  },
  {
    name: "MediVia Đà Nẵng",
    address: "168 Nguyễn Văn Linh, P. Nam Dương",
    district: "Hải Châu, Đà Nẵng",
    phone: "0236 382 9911",
    hours: "07:30 – 21:30 hằng ngày",
  },
];

/**
 * Nhà thuốc nhận hàng tại quầy — dùng ở trang thanh toán.
 *
 * Là HÀM chứ không phải hằng: quản trị sửa được danh sách này, mà hằng thì tính
 * một lần lúc nạp module và giữ nguyên bản cũ tới khi khởi động lại. Sửa địa chỉ
 * nhà thuốc đầu danh sách xong khách vẫn ra chỉ đường cũ là lỗi không ai thấy.
 */
export const getPickupPharmacy = () => pharmacies[0];