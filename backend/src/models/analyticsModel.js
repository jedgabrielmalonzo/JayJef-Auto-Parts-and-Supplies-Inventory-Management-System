import { pool } from '../db/pool.js';

// Backs the Dashboard and Reports pages. "Profit" throughout is a simple
// period P&L (fulfilled sale revenue minus fulfilled purchase cost), not
// full COGS accounting against each line item's cost_price — good enough
// for a shop-floor read, not a general ledger.

async function scalar(sql, params = []) {
  const result = await pool.query(sql, params);
  return Number(result.rows[0]?.total ?? 0);
}

function percentChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function overview() {
  const [salesRes, purchaseRes, cancelRes, inventoryRes, toBeReceivedRes, supplierRes, categoryRes] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(total),0)::numeric AS total FROM purchase_orders WHERE type = 'sale' AND status = 'fulfilled'`),
    pool.query(`SELECT COUNT(*)::int AS count, COALESCE(SUM(total),0)::numeric AS total FROM purchase_orders WHERE type = 'purchase' AND status = 'fulfilled'`),
    pool.query(`SELECT COUNT(*)::int AS count FROM purchase_orders WHERE type = 'purchase' AND status = 'cancelled'`),
    pool.query(`SELECT COALESCE(SUM(stock_quantity),0)::int AS total FROM products WHERE is_active = true`),
    pool.query(`SELECT COALESCE(SUM(poi.quantity),0)::int AS total FROM purchase_order_items poi JOIN purchase_orders po ON po.id = poi.purchase_order_id WHERE po.status = 'confirmed' AND po.type = 'purchase'`),
    pool.query(`SELECT COUNT(*)::int AS count FROM suppliers`),
    pool.query(`SELECT COUNT(DISTINCT category)::int AS count FROM products WHERE is_active = true`),
  ]);

  const revenue = Number(salesRes.rows[0].total);
  const cost = Number(purchaseRes.rows[0].total);

  return {
    sales: { count: salesRes.rows[0].count, revenue, profit: revenue - cost, cost },
    inventory: { quantityInHand: inventoryRes.rows[0].total, toBeReceived: toBeReceivedRes.rows[0].total },
    purchases: { count: purchaseRes.rows[0].count, cost, cancelled: cancelRes.rows[0].count },
    products: { supplierCount: supplierRes.rows[0].count, categoryCount: categoryRes.rows[0].count },
  };
}

export async function salesPurchaseChart({ period = 'week' } = {}) {
  const bucket = period === 'month' ? 'month' : 'week';
  const span = period === 'month' ? '6 months' : '8 weeks';
  const result = await pool.query(
    `SELECT date_trunc($1, order_date) AS bucket, type, COALESCE(SUM(total),0)::numeric AS total
     FROM purchase_orders
     WHERE status <> 'cancelled' AND order_date >= now() - $2::interval
     GROUP BY bucket, type
     ORDER BY bucket ASC`,
    [bucket, span]
  );

  const byBucket = new Map();
  for (const row of result.rows) {
    const key = row.bucket.toISOString();
    if (!byBucket.has(key)) byBucket.set(key, { label: row.bucket, purchase: 0, sales: 0 });
    byBucket.get(key)[row.type === 'sale' ? 'sales' : 'purchase'] = Number(row.total);
  }
  return Array.from(byBucket.values());
}

export async function orderSummaryChart() {
  const [orderedRes, deliveredRes] = await Promise.all([
    pool.query(`SELECT date_trunc('month', created_at) AS bucket, COUNT(*)::int AS count FROM purchase_orders WHERE created_at >= now() - interval '6 months' GROUP BY bucket`),
    pool.query(`SELECT date_trunc('month', updated_at) AS bucket, COUNT(*)::int AS count FROM purchase_orders WHERE status = 'fulfilled' AND updated_at >= now() - interval '6 months' GROUP BY bucket`),
  ]);

  const byBucket = new Map();
  for (const row of orderedRes.rows) byBucket.set(row.bucket.toISOString(), { label: row.bucket, ordered: row.count, delivered: 0 });
  for (const row of deliveredRes.rows) {
    const key = row.bucket.toISOString();
    if (!byBucket.has(key)) byBucket.set(key, { label: row.bucket, ordered: 0, delivered: 0 });
    byBucket.get(key).delivered = row.count;
  }
  return Array.from(byBucket.values()).sort((a, b) => a.label - b.label);
}

export async function topSellingProducts({ limit = 5 } = {}) {
  const result = await pool.query(
    `SELECT p.id, p.sku, p.name, p.stock_quantity, p.selling_price, COALESCE(SUM(poi.quantity),0)::int AS sold_quantity
     FROM products p
     JOIN purchase_order_items poi ON poi.product_id = p.id
     JOIN purchase_orders po ON po.id = poi.purchase_order_id AND po.type = 'sale' AND po.status = 'fulfilled'
     WHERE p.is_active = true
     GROUP BY p.id
     ORDER BY sold_quantity DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function revenueFor(whereExtra, params = []) {
  return scalar(
    `SELECT COALESCE(SUM(total),0) AS total FROM purchase_orders WHERE type = 'sale' AND status = 'fulfilled' AND ${whereExtra}`,
    params
  );
}

function costFor(whereExtra) {
  return scalar(`SELECT COALESCE(SUM(total),0) AS total FROM purchase_orders WHERE type = 'purchase' AND status = 'fulfilled' AND ${whereExtra}`);
}

export async function reportsOverview() {
  const [
    revenueThisMonth, revenueLastMonth, revenueLastYear,
    costThisMonth, costLastMonth, costLastYear,
    netPurchaseValue, netSalesValue, salesCount,
  ] = await Promise.all([
    revenueFor(`date_trunc('month', order_date) = date_trunc('month', now())`),
    revenueFor(`date_trunc('month', order_date) = date_trunc('month', now() - interval '1 month')`),
    revenueFor(`date_trunc('month', order_date) = date_trunc('month', now() - interval '1 year')`),
    costFor(`date_trunc('month', order_date) = date_trunc('month', now())`),
    costFor(`date_trunc('month', order_date) = date_trunc('month', now() - interval '1 month')`),
    costFor(`date_trunc('month', order_date) = date_trunc('month', now() - interval '1 year')`),
    scalar(`SELECT COALESCE(SUM(total),0) AS total FROM purchase_orders WHERE type = 'purchase' AND status = 'fulfilled'`),
    scalar(`SELECT COALESCE(SUM(total),0) AS total FROM purchase_orders WHERE type = 'sale' AND status = 'fulfilled'`),
    pool.query(`SELECT COUNT(*)::int AS count FROM purchase_orders WHERE type = 'sale' AND status = 'fulfilled'`).then((r) => r.rows[0].count),
  ]);

  const profitThisMonth = revenueThisMonth - costThisMonth;
  const profitLastMonth = revenueLastMonth - costLastMonth;
  const profitLastYear = revenueLastYear - costLastYear;

  return {
    totalProfit: netSalesValue - netPurchaseValue,
    revenue: revenueThisMonth,
    sales: salesCount,
    netPurchaseValue,
    netSalesValue,
    momProfitPct: percentChange(profitThisMonth, profitLastMonth),
    yoyProfitPct: percentChange(profitThisMonth, profitLastYear),
  };
}

export async function bestSellingCategories({ limit = 5 } = {}) {
  const [thisMonth, lastMonth] = await Promise.all([
    pool.query(
      `SELECT p.category, COALESCE(SUM(poi.line_total),0)::numeric AS total
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.purchase_order_id AND po.type = 'sale' AND po.status = 'fulfilled'
       JOIN products p ON p.id = poi.product_id
       WHERE date_trunc('month', po.order_date) = date_trunc('month', now())
       GROUP BY p.category`
    ),
    pool.query(
      `SELECT p.category, COALESCE(SUM(poi.line_total),0)::numeric AS total
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.purchase_order_id AND po.type = 'sale' AND po.status = 'fulfilled'
       JOIN products p ON p.id = poi.product_id
       WHERE date_trunc('month', po.order_date) = date_trunc('month', now() - interval '1 month')
       GROUP BY p.category`
    ),
  ]);

  const lastByCategory = new Map(lastMonth.rows.map((r) => [r.category, Number(r.total)]));
  return thisMonth.rows
    .map((r) => ({
      category: r.category,
      turnover: Number(r.total),
      increaseByPct: percentChange(Number(r.total), lastByCategory.get(r.category) ?? 0),
    }))
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, limit);
}

export async function bestSellingProducts({ limit = 5 } = {}) {
  const [thisMonth, lastMonth] = await Promise.all([
    pool.query(
      `SELECT p.id, p.sku, p.name, p.category, p.stock_quantity, COALESCE(SUM(poi.line_total),0)::numeric AS total
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.purchase_order_id AND po.type = 'sale' AND po.status = 'fulfilled'
       JOIN products p ON p.id = poi.product_id
       WHERE date_trunc('month', po.order_date) = date_trunc('month', now())
       GROUP BY p.id`
    ),
    pool.query(
      `SELECT poi.product_id, COALESCE(SUM(poi.line_total),0)::numeric AS total
       FROM purchase_order_items poi
       JOIN purchase_orders po ON po.id = poi.purchase_order_id AND po.type = 'sale' AND po.status = 'fulfilled'
       WHERE date_trunc('month', po.order_date) = date_trunc('month', now() - interval '1 month')
       GROUP BY poi.product_id`
    ),
  ]);

  const lastByProduct = new Map(lastMonth.rows.map((r) => [r.product_id, Number(r.total)]));
  return thisMonth.rows
    .map((r) => ({
      id: r.id,
      sku: r.sku,
      name: r.name,
      category: r.category,
      remainingQuantity: r.stock_quantity,
      turnover: Number(r.total),
      increaseByPct: percentChange(Number(r.total), lastByProduct.get(r.id) ?? 0),
    }))
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, limit);
}

function demo() {
  const assert = (cond, msg) => {
    if (!cond) throw new Error(`analyticsModel self-check failed: ${msg}`);
  };
  assert(percentChange(120, 100) === 20, 'percentChange should compute a plain percent increase');
  assert(percentChange(80, 100) === -20, 'percentChange should compute a plain percent decrease');
  assert(percentChange(0, 0) === 0, 'percentChange should treat 0-vs-0 as no change, not divide by zero');
  assert(percentChange(50, 0) === 100, 'percentChange should treat any-vs-0 as a full increase, not divide by zero');
  console.log('analyticsModel self-check passed');
}

if (process.argv[1] && process.argv[1].endsWith('analyticsModel.js')) {
  demo();
}
