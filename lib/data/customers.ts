/**
 * Tài khoản khách hàng.
 *
 * Mật khẩu lưu dạng `scrypt$<salt>$<hash>`, không lưu chữ thô. Mảng này là NGUỒN
 * của kho delta: khách đăng ký thì dòng mới chỉ nằm trong `.data/medivia.json`,
 * mảng trong mã không đổi — đúng cơ chế của `lib/admin/db.ts`.
 *
 * Tài khoản mẫu in trên trang đăng nhập, cùng lý do với tài khoản quản trị: bản
 * mẫu không có gì để bảo vệ, và giấu nó thì người chấm không vào được.
 */
export type Customer = {
  phone: string;
  name: string;
  /** `scrypt$salt$hash` — xem `lib/shop/customer-auth.ts`. */
  passwordHash: string;
  createdAt: string;
};

export const customers: Customer[] = [
  {
    phone: "0912345678",
    name: "Nguyễn Thị Lan",
    passwordHash:
      "scrypt$TyMbMHxoqeTPWU-48wxTsg$KbFipMvbjjZFVtSnx0qIdlayGWEuFVMXY7aopsCxFPGh0_lNxCQNkEQ5ptd7TiFP2cD6ownZ5TahDejCSPk4-Q",
    createdAt: "2026-01-12T09:20:00",
  },
];
