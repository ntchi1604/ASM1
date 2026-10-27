import type { Product, StockBatch } from "@/lib/types";

/**
 * Hạn dùng thuộc về LÔ, không thuộc về mặt hàng: cùng một hộp thuốc nhập hai đợt
 * có hai hạn khác nhau, và hộp khách cầm phải là hộp của lô nhập trước. Mọi chỗ
 * cần "hạn dùng" đều đi qua tệp này để không nơi nào tự lấy `batches[0]` — thứ
 * tự trong mảng là thứ tự nhập, không phải thứ tự bán.
 */

/** Còn ≤ 90 ngày thì cảnh báo; ≤ 30 ngày thì coi như gấp. */
export const expiryWarnDays = 90;
export const expiryCriticalDays = 30;

/** Số ngày còn lại, làm tròn. Âm là đã quá hạn. */
export function daysUntil(expiryDate: string, now: Date = new Date()): number {
  // Cắt chuỗi thay vì `new Date("2026-08-12")`: chuỗi trần được hiểu là nửa đêm
  // UTC, và máy ở múi giờ âm sẽ lùi mất một ngày.
  const [year, month, day] = expiryDate.slice(0, 10).split("-").map(Number);
  const target = new Date(year, month - 1, day).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

export const isExpired = (batch: StockBatch, now: Date = new Date()) =>
  daysUntil(batch.expiryDate, now) < 0;

/** Lô còn hàng, hạn gần nhất trước. Thứ tự xuất kho: hạn trước xuất trước. */
export function sellableBatches(product: Product): StockBatch[] {
  return (product.stock.batches ?? [])
    .filter((batch) => batch.quantity > 0)
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
}

/** Lô khách sẽ nhận: lô còn hàng có hạn gần nhất. */
export function nextBatch(product: Product, now: Date = new Date()): StockBatch | undefined {
  return sellableBatches(product).find((batch) => !isExpired(batch, now));
}

export const batchTotal = (batches: StockBatch[]) =>
  batches.reduce((sum, batch) => sum + batch.quantity, 0);

/**
 * Tồn kho thật sự bán được. Lô quá hạn vẫn nằm trong sổ để đối chiếu giấy tờ
 * nhập, nhưng không được cộng vào số khách nhìn thấy.
 *
 * ponytail: hạn dùng chỉ được kiểm lúc đọc, chưa chặn được việc bán lô đã hết
 * hạn nếu `total` còn số của lô đó. Hệ thật phải trừ lô theo FEFO lúc đặt hàng.
 */
export function unexpiredStock(product: Product, now: Date = new Date()): number {
  if (!product.stock.batches?.length) return product.stock.total;
  return product.stock.batches
    .filter((batch) => !isExpired(batch, now))
    .reduce((sum, batch) => sum + batch.quantity, 0);
}

/** Lô sắp hết hạn hoặc đã quá hạn — việc cần xử lý ở màn kho. */
export function expiringBatches(product: Product, now: Date = new Date()) {
  return (product.stock.batches ?? [])
    .filter((batch) => batch.quantity > 0 && daysUntil(batch.expiryDate, now) <= expiryWarnDays)
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
}
