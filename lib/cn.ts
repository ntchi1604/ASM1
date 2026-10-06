/** Nối class, bỏ giá trị rỗng. Đủ dùng vì mọi class đều do component kiểm soát. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
