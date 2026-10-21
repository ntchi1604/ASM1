// Hook nạp cho `node --import ./design/ts-alias-register.mjs`.
// Node 24 bóc kiểu TypeScript sẵn, nhưng không biết alias `@/` của tsconfig và
// không tự thêm đuôi `.ts` cho import tương đối viết kiểu bundler.
//   `@/x` → `<repo>/x.ts` · `./x` (không đuôi) → `./x.ts`
const root = new URL("../", import.meta.url);

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    return next(new URL(`${specifier.slice(2)}.ts`, root).href, context);
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    try {
      return await next(specifier, context);
    } catch (err) {
      if (err?.code !== "ERR_MODULE_NOT_FOUND") throw err;
      return next(`${specifier}.ts`, context);
    }
  }
  return next(specifier, context);
}
