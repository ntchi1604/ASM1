import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminButtonForm } from "@/components/admin/AdminForm";
import { StatCard, Th } from "@/components/admin/StatCard";
import { Card, SectionHeading } from "@/components/ui/Card";
import { formatDate, formatVnd } from "@/lib/format";
import { listRows } from "@/lib/admin/db";
import { getOrders } from "@/lib/data/orders";
import { requireSession } from "@/lib/admin/auth";
import { deleteCustomer } from "@/lib/admin/actions";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { matchesQuery, readFilter } from "@/lib/admin/filter";
import type { Customer } from "@/lib/data/customers";

export const metadata: Metadata = {
  title: "Khách hàng",
  description: "Tài khoản khách mua hàng, số đơn và tổng chi của từng người.",
};

/**
 * Quản lý tài khoản khách.
 *
 * Đọc bằng `listRows("customers")` chứ không import mảng mẫu: khách đăng ký trên
 * `/dang-ky` được ghi vào kho delta, mảng trong `lib/data/customers.ts` không đổi.
 *
 * Số đơn và tổng chi tính bằng cách so SỐ ĐIỆN THOẠI, không bằng khoá ngoại:
 * bảng `orders` trong bản mẫu giữ `phone` chứ không giữ `customerId`. Đó cũng là
 * lý do xoá tài khoản không làm mất đơn cũ — xem `deleteCustomer`.
 *
 * Cột `passwordHash` không bao giờ được đọc ra đây. Nó nằm trong dòng trả về,
 * nhưng một màn hình không hiển thị thì không ai vô tình chụp ảnh màn hình rồi
 * dán hash lên chỗ công khai.
 */
const normalizePhone = (value: string) => value.replace(/[\s.-]/g, "");

export default async function AdminCustomersPage({
  searchParams,
}: PageProps<"/admin/nguoi-dung">) {
  const session = await requireSession();
  const canDelete = session.role === "duoc-si";
  const filter = readFilter(await searchParams, ["q", "don"]);

  const rows = (listRows("customers") as unknown as Customer[])
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Gộp một lượt thay vì lọc lại danh sách đơn cho từng dòng — cùng kết quả, và
  // số đơn mẫu còn tăng thì vẫn chỉ một lượt.
  const activity = new Map<string, { count: number; spent: number }>();
  for (const order of getOrders()) {
    const phone = normalizePhone(order.phone);
    const entry = activity.get(phone) ?? { count: 0, spent: 0 };
    entry.count += 1;
    entry.spent += order.summary.total;
    activity.set(phone, entry);
  }

  // Chỉ cộng đơn của số có tài khoản: `activity` còn giữ đơn của người chưa
  // đăng ký, và cộng cả số đó thì "tổng chi" lớn hơn tổng của danh sách dưới.
  const revenue = rows.reduce(
    (sum, row) => sum + (activity.get(normalizePhone(row.phone))?.spent ?? 0),
    0,
  );
  const withOrders = rows.filter((row) => activity.has(normalizePhone(row.phone)));

  // Lọc trên toàn bộ danh sách, không trên phần đã cắt: bộ lọc phải tìm được cả
  // những dòng mà chỉ số phía trên không đếm.
  const visible = rows.filter((row) => {
    if (!matchesQuery(filter.q, row.name, row.phone)) return false;
    if (filter.don === "co" && !activity.has(normalizePhone(row.phone))) return false;
    if (filter.don === "khong" && activity.has(normalizePhone(row.phone))) return false;
    return true;
  });

  return (
    <AdminShell activeHref="/admin/nguoi-dung">
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-headline-xl text-ink">Khách hàng</h1>
          <p className="mt-2 max-w-2xl text-body-md text-ink-muted">
            Tài khoản khách tự đăng ký bằng số điện thoại. Số đơn và tổng chi tính từ lịch sử
            đơn, nên khách đổi số điện thoại thì đơn cũ không còn gắn vào tài khoản mới.
          </p>
        </header>

        <section aria-label="Chỉ số khách hàng" className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Tài khoản" value={`${rows.length} tài khoản`} />
          <StatCard
            label="Đã có đơn"
            value={`${withOrders.length} tài khoản`}
            hint="Khớp được số điện thoại với đơn"
          />
          <StatCard
            label="Tổng chi"
            value={formatVnd(revenue)}
            hint="Cộng cả phí giao của các đơn đó"
          />
        </section>

        <AdminFilterBar
          action="/admin/nguoi-dung"
          query={filter.q}
          placeholder="Tên khách hoặc số điện thoại"
          selects={[
            {
              name: "don",
              label: "Đơn hàng",
              value: filter.don,
              options: [
                { value: "co", label: "Đã có đơn" },
                { value: "khong", label: "Chưa có đơn" },
              ],
            },
          ]}
        />

        <Card className="overflow-hidden">
          <div className="p-4 md:p-5">
            <SectionHeading
              title={
                visible.length === rows.length
                  ? "Danh sách"
                  : `${visible.length} / ${rows.length} tài khoản khớp bộ lọc`
              }
            />
          </div>
          {rows.length === 0 ? (
            <p className="border-t border-hairline px-4 py-4 text-body-md text-ink-muted md:px-5">
              Chưa có tài khoản khách nào.
            </p>
          ) : visible.length === 0 ? (
            <p className="border-t border-hairline px-4 py-4 text-body-md text-ink-muted md:px-5">
              Không có tài khoản nào khớp bộ lọc đang chọn.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-t border-hairline text-left">
                <thead className="bg-recessed">
                  <tr>
                    <Th>Khách</Th>
                    <Th>Tham gia</Th>
                    <Th>Đơn</Th>
                    <Th>Tổng chi</Th>
                    <Th>Xử lý</Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => {
                    const stat = activity.get(normalizePhone(row.phone));
                    return (
                      <tr
                        key={row.phone}
                        id={`kh-${row.phone}`}
                        className="scroll-mt-24 border-t border-divider align-top"
                      >
                        <td className="px-4 py-3">
                          <span className="block text-body-md text-ink">{row.name}</span>
                          <span className="mt-0.5 block tabular-nums text-body-sm text-ink-subtle">
                            {row.phone}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-body-sm text-ink-muted">
                          {formatDate(row.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums text-body-sm text-ink-muted">
                          {stat ? `${stat.count} đơn` : "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums text-body-sm text-ink-muted">
                          {stat ? formatVnd(stat.spent) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {canDelete ? (
                            <AdminButtonForm
                              action={deleteCustomer}
                              hidden={{ phone: row.phone }}
                              submit="Xoá"
                              confirm={`Xoá tài khoản ${row.phone}? Đơn hàng cũ vẫn được giữ.`}
                            />
                          ) : (
                            <span className="text-body-sm text-ink-subtle">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="border-t border-hairline px-4 py-3 text-body-sm text-ink-subtle">
            Xoá tài khoản không xoá đơn hàng: đơn giữ bản sao số điện thoại chứ không giữ khoá
            tới tài khoản. Người vừa bị xoá bị đăng xuất ngay ở yêu cầu kế tiếp và có thể đăng ký
            lại bằng chính số đó.
          </p>
        </Card>
      </div>
    </AdminShell>
  );
}
