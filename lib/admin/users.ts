/**
 * Tài khoản quản trị của bản mẫu.
 *
 * Vai trò quyết định được làm gì, và chỉ có hai vai trò vì chỉ có hai loại việc
 * khác nhau về trách nhiệm pháp lý:
 *
 *  - `duoc-si`: người có chứng chỉ hành nghề. Là người DUY NHẤT được duyệt đơn
 *    thuốc, vì đơn thuốc kê đơn phải có người chịu trách nhiệm chuyên môn đứng
 *    tên. Vai trò này sửa được mọi thứ.
 *  - `ke-toan`: quản lý đơn hàng, kho, giá, mã ưu đãi, bài viết. KHÔNG được duyệt
 *    đơn thuốc — không phải vì kỹ thuật, mà vì chứng chỉ hành nghề.
 *
 * Mật khẩu nằm thẳng trong mã vì đây là bản mẫu không có cơ sở dữ liệu, và cả ba
 * tài khoản đều là tài khoản trình diễn. Chúng hiện công khai trên trang đăng nhập
 * — che đi thì không ai vào được, mà giấu cũng không có gì để bảo vệ.
 */
export type AdminRole = "duoc-si" | "ke-toan";

export const adminUsers = [
  {
    username: "duocsi",
    password: "duocsi123",
    name: "DS. Trần Thu Hà",
    role: "duoc-si",
    title: "Người phụ trách chuyên môn",
  },
  {
    username: "ketoan",
    password: "ketoan123",
    name: "Nguyễn Văn Bình",
    role: "ke-toan",
    title: "Kế toán kho",
  },
] as const satisfies readonly {
  username: string;
  password: string;
  name: string;
  role: AdminRole;
  title: string;
}[];

export const roleLabel: Record<AdminRole, string> = {
  "duoc-si": "Dược sĩ",
  "ke-toan": "Kế toán",
};

/**
 * Một chỗ duy nhất trả lời "vai trò này có được duyệt đơn thuốc không", để giao
 * diện và Server Action không bao giờ trả lời khác nhau.
 */
export function canApprovePrescriptions(role: AdminRole) {
  return role === "duoc-si";
}
