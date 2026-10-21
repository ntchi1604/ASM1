// Nạp toàn bộ dữ liệu mẫu trong `lib/data/*` vào PostgreSQL.
//
//   node --import ./design/ts-alias-register.mjs design/seed-postgres.mjs
//
// Vì sao đọc thẳng từ `lib/data` thay vì chép dữ liệu sang đây: hai bản sao thì
// có ngày sửa giá trong `products.ts` mà quên sửa bản sao, và cơ sở dữ liệu nói
// một đằng còn trang bán hàng nói một nẻo.
//
// Chạy lại được nhiều lần: TRUNCATE trước, nạp sau, trong một transaction. Hỏng
// giữa chừng thì không bảng nào đổi.

import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { Client } from "pg";

const { products } = await import("../lib/data/products.ts");
const { categories } = await import("../lib/data/categories.ts");
const { coupons } = await import("../lib/data/coupons.ts");
const { staticPages } = await import("../lib/data/pages.ts");
const { articles } = await import("../lib/data/home.ts");
const { getArticleBySlug } = await import("../lib/data/articles.ts");
const { mockOrders, prescriptionRows, resolveOrder } = await import("../lib/data/orders.ts");
const { pharmacies } = await import("../lib/data/pharmacies.ts");
const { reviews } = await import("../lib/data/reviews.ts");
const { comments } = await import("../lib/data/comments.ts");
const { customers } = await import("../lib/data/customers.ts");
const { productDetails } = await import("../lib/data/product-details.ts");
const { interactionRules, ingredientAliases } = await import("../lib/data/interactions.ts");
const { boughtTogether, categoryCombos } = await import("../lib/data/bought-together.ts");
const { deliveryMethods } = await import("../lib/data/delivery.ts");
const { paymentMethods } = await import("../lib/data/payment.ts");
const { adminUsers } = await import("../lib/admin/users.ts");
const { commonFlags } = await import("../lib/ai/consult.ts");
const sales = await import("../lib/data/sales.ts");

const URL_ = process.env.DATABASE_URL ?? "postgresql://postgres:medivia@127.0.0.1:5433/medivia";

/**
 * Múi giờ Việt Nam, không phải UTC.
 *
 * `placedAt` trong `lib/data/orders.ts` là giờ địa phương cố ý (xem chú thích ở
 * đó). Gửi thẳng chuỗi ấy vào cột `timestamptz` thì PostgreSQL hiểu là UTC và
 * mọi đơn lệch 7 tiếng — đơn đặt 22:07 thành 05:07 hôm sau.
 */
const vn = (stamp) => `${stamp}${stamp.length === 10 ? "T00:00:00" : ""}+07:00`;
const plusHours = (stamp, hours) => new Date(new Date(vn(stamp)).getTime() + hours * 3_600_000);

/** `scrypt$<salt>$<hash>` — đúng định dạng `lib/shop/customer-auth.ts` đang đọc. */
const hashPassword = (password) => {
  const salt = randomBytes(16).toString("base64url");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("base64url")}`;
};

// Số điện thoại trong `mockOrders` có dấu cách ("0912 345 678"), trong `customers`
// thì không — không chuẩn hoá thì đơn của khách mẫu không gắn được vào tài khoản.
const normalizePhone = (phone) => phone.replace(/\s+/g, "");

// ------------------------------------------------------------------ hoạt chất

/**
 * Tên hoạt chất chuẩn hoá của một sản phẩm.
 *
 * Cùng phép tách và cùng bảng đồng nghĩa với `lib/data/interactions.ts`: dữ liệu
 * ghi "Paracetamol, Caffeine" còn luật tương tác ghi "Caffein", và nhãn thuốc ghi
 * "Acid acetylsalicylic" còn luật ghi "Aspirin". Chuẩn hoá ở đây một lần thì
 * `product_ingredients` khớp được với `interaction_rules`.
 */
const canonicalIngredients = (activeIngredient) =>
  activeIngredient
    .split(/[,+]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => ingredientAliases[part.toLowerCase()] ?? part);

/**
 * `Natrib` viết hai kiểu trong danh mục: "Natri clorid" và "natri clorid".
 *
 * `active_ingredients.name` là UNIQUE nhưng phân biệt hoa thường, nên ghi thẳng
 * thì cùng một chất thành hai dòng, và mọi truy vấn đối chiếu tương tác theo
 * `ingredient_id` sẽ bỏ sót một nửa. Giữ cách viết gặp trước.
 */
const byLowerName = new Map();
const addIngredient = (name) => {
  const key = name.toLowerCase();
  const seen = byLowerName.get(key);
  // Giữ cách viết có chữ hoa đầu: "Natri clorid" đẹp hơn "natri clorid" trong
  // một cột tên chất, và nó cũng là cách luật tương tác viết.
  if (!seen || (name[0] === name[0].toUpperCase() && seen.value[0] !== seen.value[0].toUpperCase())) {
    byLowerName.set(key, { value: name });
  }
};

for (const product of products) canonicalIngredients(product.activeIngredient).forEach(addIngredient);
for (const rule of interactionRules) {
  addIngredient(rule.drugA);
  addIngredient(rule.drugB);
}
for (const target of Object.values(ingredientAliases)) addIngredient(target);

const ingredientList = [...byLowerName.values()].map((entry) => entry.value).sort();
const ingredientId = new Map(
  ingredientList.map((name, index) => [name.toLowerCase(), index + 1]),
);

// --------------------------------------------------------------------- cửa hàng

/**
 * `Pharmacy` trong mã chỉ có `district` dạng "Quận 3, TP.HCM" — lược đồ tách
 * tỉnh và quận thành hai cột, và bắt buộc có toạ độ để tính khoảng cách.
 *
 * Sáu địa chỉ này là cửa hàng mẫu, toạ độ là trung tâm quận tương ứng. Chép tay
 * ở đây chứ không bịa từ tên đường: một toạ độ sai 500 m vẫn hiện ra như thật, và
 * không ai phát hiện được sau đó.
 */
const PHARMACY_GEO = {
  "MediVia Quận 3": { province: "TP. Hồ Chí Minh", lat: 10.7756, lng: 106.6811 },
  "MediVia Quận 1": { province: "TP. Hồ Chí Minh", lat: 10.779, lng: 106.6983 },
  "MediVia Quận 7": { province: "TP. Hồ Chí Minh", lat: 10.7295, lng: 106.7215 },
  "MediVia Thủ Đức": { province: "TP. Hồ Chí Minh", lat: 10.8506, lng: 106.7583 },
  "MediVia Hà Nội — Đống Đa": { province: "Hà Nội", lat: 21.0128, lng: 105.8267 },
  "MediVia Đà Nẵng": { province: "Đà Nẵng", lat: 16.06, lng: 108.22 },
};

const pharmacyRows = pharmacies.map((pharmacy, index) => {
  const geo = PHARMACY_GEO[pharmacy.name];
  if (!geo) throw new Error(`seed: chưa có toạ độ cho nhà thuốc "${pharmacy.name}"`);
  return {
    id: index + 1,
    name: pharmacy.name,
    address: pharmacy.address,
    province: geo.province,
    // "Quận 3, TP.HCM" → quận nằm trước dấu phẩy cuối.
    district: pharmacy.district.split(",")[0].trim(),
    latitude: geo.lat,
    longitude: geo.lng,
    opening_hours: pharmacy.hours,
    phone: pharmacy.phone,
    is_pickup_point: index === 0,
  };
});

/**
 * Tồn kho theo từng nhà thuốc.
 *
 * `stock.nearbyPharmacies` trong mã là con số tiếp thị (có sản phẩm ghi 15 trong
 * khi hệ thống chỉ có 6 nhà thuốc), nên chỉ dùng nó để quyết định BAO NHIÊU nhà
 * thuốc có hàng, tối đa bằng số nhà thuốc thật. Tổng thì lấy đúng `stock.total`:
 * `stock_forecast` và `combo_suggestions_sellable` đều cộng cột này, lệch một
 * đơn vị là hai trang nói hai con số khác nhau.
 */
const stockRows = [];
products.forEach((product, index) => {
  if (product.stock.total <= 0) return;
  const count = Math.min(product.stock.nearbyPharmacies, pharmacyRows.length);
  if (count <= 0) return;
  const base = Math.floor(product.stock.total / count);
  const remainder = product.stock.total % count;
  const start = index % pharmacyRows.length;
  for (let k = 0; k < count; k++) {
    const quantity = base + (k < remainder ? 1 : 0);
    if (quantity <= 0) continue;
    stockRows.push({
      product_id: product.id,
      pharmacy_id: pharmacyRows[(start + k) % pharmacyRows.length].id,
      quantity,
    });
  }
});

// ------------------------------------------------------------------ đơn hàng

const customerIdByPhone = new Map(customers.map((customer) => [normalizePhone(customer.phone), randomUUID()]));
const orderIdByCode = new Map(mockOrders.map((order) => [order.code, randomUUID()]));
const pickupPharmacyId = pharmacyRows[0].id;

const orderRows = [];
const orderItemRows = [];
const shipmentRows = [];

for (const order of mockOrders) {
  const resolved = resolveOrder(order);
  const summary = resolved.summary;
  const id = orderIdByCode.get(order.code);
  const ret = order.returnRequest;

  orderRows.push({
    id,
    code: order.code,
    // Cùng số điện thoại nhưng khác người đặt thì để NULL: gắn đơn của người
    // khác vào tài khoản mẫu là gán sai lịch sử mua thuốc.
    customer_id: customerIdByPhone.get(normalizePhone(order.phone)) ?? null,
    // Trạng thái thô, không phải trạng thái đã tính: "đã giao quá 3 ngày tự
    // hoàn thành" là quy tắc của tầng ứng dụng, cơ sở dữ liệu giữ sự thật.
    status: order.status,
    original_subtotal: summary.originalSubtotal,
    subtotal: summary.subtotal,
    product_discount: summary.productDiscount,
    // Chỉ ghi mã đã thực sự áp được: mã nhập nhưng chưa đủ điều kiện mà vẫn lưu
    // thì đọc lại sẽ tưởng đơn đã được giảm.
    coupon_code: summary.coupon?.code ?? null,
    coupon_discount: summary.couponDiscount,
    shipping_fee: summary.shipping,
    total: summary.total,
    delivery_method_id: order.deliveryMethodId,
    payment_method_id: order.paymentMethodId,
    requires_prescription: resolved.requiresPrescription,
    note: order.note ?? null,
    email: order.email ?? null,
    address: order.address ?? null,
    company_name: null,
    tax_code: null,
    created_at: vn(order.placedAt),
    delivered_at: order.deliveredAt ? vn(order.deliveredAt) : null,
    return_reason: ret?.reason ?? null,
    return_note: ret?.note ?? null,
    return_requested_at: ret ? vn(ret.requestedAt) : null,
    return_decision: ret?.decision ?? null,
    return_decided_at: ret?.decidedAt ? vn(ret.decidedAt) : null,
  });

  for (const line of order.lines) {
    const product = products.find((item) => item.id === line.productId);
    const unit = product?.units.find((item) => item.label === line.unitLabel);
    if (!product || !unit) throw new Error(`seed: dòng hàng không tra được — ${order.code} / ${line.productId}`);
    orderItemRows.push({
      order_id: id,
      product_id: product.id,
      unit_label: unit.label,
      quantity: line.quantity,
      // Giá chốt tại lúc đặt, không phải giá hiện tại của danh mục.
      unit_price: unit.price,
      original_unit_price: unit.originalPrice ?? null,
      line_total: unit.price * line.quantity,
    });
  }

  const pickup = order.deliveryMethodId === "nhan-tai-nha-thuoc";
  shipmentRows.push({
    order_id: id,
    delivery_method_id: order.deliveryMethodId,
    pharmacy_id: pickup ? pickupPharmacyId : null,
    pickup_code: pickup ? `PK${order.code.slice(2)}` : null,
    pickup_expires_at: pickup ? plusHours(order.placedAt, 24).toISOString() : null,
  });
}

// ------------------------------------------------------------------ nội dung

const articleRows = articles.map((meta) => {
  const content = getArticleBySlug(meta.slug);
  if (!content) throw new Error(`seed: bài "${meta.slug}" không có thân bài`);
  return {
    slug: meta.slug,
    tag: meta.tag,
    title: meta.title,
    excerpt: meta.excerpt,
    author: meta.author,
    published_at: meta.date,
    reading_minutes: meta.readingMinutes,
    image_url: meta.image,
    body: JSON.stringify(content.blocks),
  };
});

const pageRows = staticPages.map((page, index) => ({
  slug: page.slug,
  title: page.title,
  lead: page.lead,
  sort_order: index,
}));

const sectionRows = staticPages.flatMap((page) =>
  page.sections.map((section, index) => ({
    page_slug: page.slug,
    title: section.title,
    body: section.body ?? [],
    list_items: section.list ?? [],
    sort_order: index,
  })),
);

const comboRows = [];
const pushCombos = (scope, scopeId, entry) => {
  entry.suggestions.forEach((suggestion, index) => {
    comboRows.push({
      scope,
      scope_id: scopeId,
      basis: entry.basis,
      suggested_product_id: suggestion.productId,
      reason: suggestion.reason,
      sort_order: index,
    });
  });
};
for (const entry of boughtTogether) pushCombos("product", entry.productId, entry);
for (const entry of categoryCombos) pushCombos("category", entry.categorySlug, entry);

// ---------------------------------------------------------------------- nạp

const TABLES = [
  "order_items", "shipments", "prescriptions", "orders", "cart_items", "carts",
  "combo_suggestions", "stock_levels", "pharmacies", "categories",
  "product_ingredients", "ingredient_aliases", "interaction_rules", "active_ingredients",
  "reviews", "product_details", "product_units", "products",
  "customer_addresses", "customers", "admin_users",
  "coupons", "delivery_methods", "payment_methods",
  "ai_consult_results", "ai_search_results", "ai_identify_results", "ai_messages",
  "pharmacist_handoffs", "ai_tool_events", "ai_sessions", "red_flags",
  "comments", "articles", "page_sections", "static_pages",
  "daily_sales", "category_sales", "product_sales",
];

const client = new Client({ connectionString: URL_ });
await client.connect();

/** `INSERT` nhiều dòng một lượt — mỗi bảng một chuyến khứ hồi, không phải mỗi dòng. */
async function insert(table, rows) {
  if (rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  const params = [];
  const tuples = rows.map((row) => {
    const placeholders = columns.map((column) => {
      params.push(row[column]);
      return `$${params.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  await client.query(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${tuples.join(", ")}`,
    params,
  );
}

try {
  await client.query("BEGIN");
  await client.query(`TRUNCATE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);

  await insert("categories", categories.map((category, index) => ({
    slug: category.slug,
    name: category.name,
    short_name: category.shortName,
    icon: category.icon,
    description: category.description,
    // `aiHint` lồng trong mã, ba cột phẳng trong lược đồ. Danh mục chỉ có câu
    // gợi ý mà không có nút (khang-sinh) vẫn hợp lệ: label và href cùng NULL.
    ai_hint_message: category.aiHint?.message ?? null,
    ai_hint_action_label: category.aiHint?.action?.label ?? null,
    ai_hint_action_href: category.aiHint?.action?.href ?? null,
    sort_order: category.sortOrder ?? index,
  })));

  await insert("active_ingredients", ingredientList.map((name) => ({
    id: ingredientId.get(name.toLowerCase()),
    name,
  })));

  await insert("products", products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    origin: product.origin,
    category_slug: product.categorySlug,
    type: product.type,
    dosage_form: product.dosageForm,
    audiences: product.audiences,
    prescription_required: product.prescriptionRequired,
    strength: product.strength ?? null,
    image_url: product.image ?? null,
    short_uses: product.shortUses,
    rating_score: product.rating?.score ?? null,
    rating_count: product.rating?.count ?? null,
    restock_date: product.stock.restockDate ?? null,
  })));

  await insert("product_units", products.flatMap((product) =>
    product.units.map((unit) => ({
      product_id: product.id,
      unit_label: unit.label,
      price: unit.price,
      original_price: unit.originalPrice ?? null,
      packaging: unit.packaging ?? null,
    }))));

  await insert("product_details", productDetails.map((detail) => ({
    product_id: detail.productId,
    registration_number: detail.registrationNumber,
    manufacturer: detail.manufacturer,
    shelf_life: detail.shelfLife,
    therapeutic_group: detail.therapeuticGroup,
    uses: detail.uses,
    dosage: detail.dosage,
    cautions: detail.cautions,
    side_effects: detail.sideEffects,
    storage: detail.storage,
    manufacturer_source_label: detail.manufacturerSourceLabel,
    quick_questions: detail.quickQuestions,
  })));

  await insert("product_ingredients", products.flatMap((product) =>
    [...new Set(canonicalIngredients(product.activeIngredient))].map((name) => ({
      product_id: product.id,
      ingredient_id: ingredientId.get(name.toLowerCase()),
    }))));

  await insert("ingredient_aliases", Object.entries(ingredientAliases).map(([alias, name]) => ({
    alias,
    ingredient_id: ingredientId.get(name.toLowerCase()),
  })));

  // `pair_sorted` bắt a <= b; dữ liệu viết tên thông dụng trước tên INN nên thứ
  // tự có thể ngược. Sắp theo id chứ không sửa tay từng luật.
  await insert("interaction_rules", interactionRules.map((rule) => {
    const a = ingredientId.get(rule.drugA.toLowerCase());
    const b = ingredientId.get(rule.drugB.toLowerCase());
    if (a === undefined || b === undefined) {
      throw new Error(`seed: luật tương tác dùng hoạt chất lạ — ${rule.drugA} × ${rule.drugB}`);
    }
    return {
      severity: rule.severity,
      ingredient_a_id: Math.min(a, b),
      ingredient_b_id: Math.max(a, b),
      mechanism: rule.mechanism,
      advice: rule.advice,
    };
  }));

  await insert("reviews", reviews.map((review) => ({
    id: review.id,
    product_id: review.productId,
    author: review.author,
    initials: review.initials,
    score: review.score,
    body: review.body,
    created_at: review.date,
    verified_purchase: Boolean(review.orderCode),
    photos: review.photos ?? [],
    video: review.video ?? null,
    order_code: review.orderCode ?? null,
    hidden: review.hidden ?? false,
  })));

  await insert("pharmacies", pharmacyRows);
  await insert("stock_levels", stockRows);
  await insert("combo_suggestions", comboRows);

  await insert("customers", customers.map((customer) => ({
    id: customerIdByPhone.get(normalizePhone(customer.phone)),
    phone: normalizePhone(customer.phone),
    full_name: customer.name,
    email: null,
    password_hash: customer.passwordHash,
    created_at: vn(customer.createdAt),
  })));

  await insert("admin_users", adminUsers.map((user) => ({
    username: user.username,
    password_hash: hashPassword(user.password),
    full_name: user.name,
    role: user.role,
    title: user.title,
    active: true,
  })));

  await insert("coupons", coupons.map((coupon) => ({
    code: coupon.code,
    kind: coupon.kind,
    amount: coupon.kind === "amount" ? coupon.amount : null,
    min_subtotal: coupon.minSubtotal,
    description: coupon.description,
    active: true,
    start_at: coupon.startAt ?? null,
    end_at: coupon.endAt ?? null,
  })));

  await insert("delivery_methods", deliveryMethods.map((method) => ({
    id: method.id,
    name: method.name,
    fee: method.fee,
    active: true,
  })));

  await insert("payment_methods", paymentMethods.map((method) => ({
    id: method.id,
    name: method.name,
    note: method.note ?? null,
    active: true,
  })));

  await insert("orders", orderRows);
  await insert("order_items", orderItemRows);
  await insert("shipments", shipmentRows);

  await insert("prescriptions", prescriptionRows.map((row) => ({
    order_id: orderIdByCode.get(row.orderCode),
    // Khoá tới kho lưu trữ, không phải URL công khai — lược đồ ghi rõ điều này.
    storage_key: `prescriptions/${row.orderCode}/${row.fileName}`,
    mime_type: row.mimeType,
    size_bytes: row.sizeBytes,
    status: row.status,
    reject_reason: row.rejectReason ?? null,
    reviewed_by: row.reviewedBy ?? null,
    reviewed_at: row.reviewedAt ? vn(row.reviewedAt) : null,
    delete_after: vn(row.deleteAfter),
  })));

  await insert("red_flags", commonFlags.map((flag) => ({
    label: flag.label,
    action: flag.action,
    keywords: [],
  })));

  await insert("static_pages", pageRows);
  await insert("page_sections", sectionRows);
  await insert("articles", articleRows);

  await insert("comments", comments.map((comment) => ({
    id: comment.id,
    article_slug: comment.articleSlug,
    author: comment.author,
    initials: comment.initials,
    // Giờ địa phương, không giây (dữ liệu mẫu ghi "2026-09-30T09:12").
    created_at: vn(comment.date.length === 16 ? `${comment.date}:00` : comment.date),
    body: comment.body,
    hidden: comment.hidden ?? false,
    reply_body: comment.reply?.body ?? null,
    reply_author: comment.reply?.author ?? null,
    reply_at: comment.reply
      ? vn(comment.reply.date.length === 16 ? `${comment.reply.date}:00` : comment.reply.date)
      : null,
  })));

  await insert("daily_sales", sales.dailySales.map((day) => ({
    date: day.date,
    revenue: day.revenue,
    orders: day.orders,
  })));

  await insert("category_sales", sales.categorySales.map((row) => ({
    period_from: sales.reportPeriod.from,
    period_to: sales.reportPeriod.to,
    category_slug: row.slug,
    revenue: row.revenue,
    orders: row.orders,
    change_percent: row.changePercent,
  })));

  await insert("product_sales", sales.productSales.map((row) => ({
    period_from: sales.reportPeriod.from,
    period_to: sales.reportPeriod.to,
    product_id: row.productId,
    units_sold: row.unitsSold,
    views: row.views,
  })));

  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Nạp hỏng, đã rollback:", error.message);
  await client.end();
  process.exit(1);
}

// ---------------------------------------------------------------- kiểm lại

const expected = {
  categories: categories.length,
  products: products.length,
  product_units: products.reduce((sum, product) => sum + product.units.length, 0),
  product_details: productDetails.length,
  active_ingredients: ingredientList.length,
  product_ingredients: products.reduce(
    (sum, product) => sum + new Set(canonicalIngredients(product.activeIngredient)).size,
    0,
  ),
  ingredient_aliases: Object.keys(ingredientAliases).length,
  interaction_rules: interactionRules.length,
  reviews: reviews.length,
  pharmacies: pharmacyRows.length,
  stock_levels: stockRows.length,
  combo_suggestions: comboRows.length,
  customers: customers.length,
  admin_users: adminUsers.length,
  coupons: coupons.length,
  delivery_methods: deliveryMethods.length,
  payment_methods: paymentMethods.length,
  orders: mockOrders.length,
  order_items: orderItemRows.length,
  shipments: shipmentRows.length,
  prescriptions: prescriptionRows.length,
  red_flags: commonFlags.length,
  static_pages: staticPages.length,
  page_sections: sectionRows.length,
  articles: articles.length,
  comments: comments.length,
  daily_sales: sales.dailySales.length,
  category_sales: sales.categorySales.length,
  product_sales: sales.productSales.length,
};

const problems = [];

for (const [table, want] of Object.entries(expected)) {
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${table}`);
  if (rows[0].n !== want) problems.push(`${table}: ${rows[0].n} dòng, mong đợi ${want}`);
}

// Tồn kho phải cộng đúng `stock.total` — hai view đều cộng cột này.
const { rows: stockRowsDb } = await client.query(`
  SELECT p.id, COALESCE(sum(s.quantity), 0)::int AS total
  FROM products p LEFT JOIN stock_levels s ON s.product_id = p.id
  GROUP BY p.id`);
for (const row of stockRowsDb) {
  const source = products.find((product) => product.id === row.id).stock.total;
  if (row.total !== source) problems.push(`tồn kho ${row.id}: ${row.total}, mong đợi ${source}`);
}

// View lọc thuốc kê đơn — nếu nó trả về dòng nào thì bộ lọc trong SQL đã hỏng.
const { rows: sellable } = await client.query(`
  SELECT count(*)::int AS total,
         count(*) FILTER (WHERE p.prescription_required)::int AS rx
  FROM combo_suggestions_sellable cs JOIN products p ON p.id = cs.suggested_product_id`);
if (sellable[0].rx !== 0) problems.push(`combo_suggestions_sellable trả về ${sellable[0].rx} thuốc kê đơn`);

// Tổng đơn 14 ngày phải khớp trang phân tích.
const { rows: orderTotals } = await client.query("SELECT COALESCE(sum(orders), 0)::int AS n FROM daily_sales");
if (orderTotals[0].n !== sales.getTotals().orders) {
  problems.push(`daily_sales cộng ${orderTotals[0].n} đơn, trang phân tích ghi ${sales.getTotals().orders}`);
}

await client.end();

if (problems.length > 0) {
  console.error("Dữ liệu nạp xong nhưng không khớp:\n  " + problems.join("\n  "));
  process.exit(1);
}

console.log(`Đã nạp ${Object.keys(expected).length} bảng, ${Object.values(expected).reduce((a, b) => a + b, 0)} dòng.`);
console.log(`combo_suggestions_sellable: ${sellable[0].total} dòng, 0 thuốc kê đơn.`);
