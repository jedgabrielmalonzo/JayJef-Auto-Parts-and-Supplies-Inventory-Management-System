import { pool } from '../db/pool.js';

export async function overview() {
  const [inventoryRes, lowStockRes, outOfStockRes, productCountRes, movementRes] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(stock_quantity),0)::int AS total FROM products WHERE is_active = true`),
    pool.query(`SELECT COUNT(*)::int AS count FROM products WHERE is_active = true AND stock_quantity <= reorder_threshold AND stock_quantity > 0`),
    pool.query(`SELECT COUNT(*)::int AS count FROM products WHERE is_active = true AND stock_quantity = 0`),
    pool.query(`SELECT COUNT(*)::int AS count FROM products WHERE is_active = true`),
    pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END), 0)::int AS total_in,
        COALESCE(SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END), 0)::int AS total_out
      FROM stock_movements 
      WHERE created_at >= now() - interval '30 days'
    `),
  ]);

  return {
    inventory: {
      quantityInHand: inventoryRes.rows[0]?.total || 0,
      totalProducts: productCountRes.rows[0]?.count || 0,
      lowStockCount: lowStockRes.rows[0]?.count || 0,
      outOfStockCount: outOfStockRes.rows[0]?.count || 0,
      recentStockIn: movementRes.rows[0]?.total_in || 0,
      recentStockOut: movementRes.rows[0]?.total_out || 0,
    },
  };
}

export async function salesPurchaseChart({ period = 'week' } = {}) {
  const bucket = period === 'month' ? 'month' : 'week';
  const span = period === 'month' ? '6 months' : '8 weeks';

  const result = await pool.query(
    `SELECT 
       date_trunc($1, created_at) AS bucket,
       COALESCE(SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END), 0)::int AS restocked,
       COALESCE(SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END), 0)::int AS deducted
     FROM stock_movements
     WHERE created_at >= now() - $2::interval
     GROUP BY bucket
     ORDER BY bucket ASC`,
    [bucket, span]
  );

  return result.rows.map((row) => ({
    label: row.bucket,
    purchase: Number(row.restocked),
    sales: Number(row.deducted),
  }));
}

export async function orderSummaryChart() {
  const result = await pool.query(
    `SELECT 
       date_trunc('month', created_at) AS bucket,
       COUNT(*)::int AS count
     FROM stock_movements
     WHERE created_at >= now() - interval '6 months'
     GROUP BY bucket
     ORDER BY bucket ASC`
  );

  return result.rows.map((row) => ({
    label: row.bucket,
    ordered: Number(row.count),
    delivered: Number(row.count),
  }));
}

export async function topSellingProducts({ limit = 5 } = {}) {
  const result = await pool.query(
    `SELECT 
       p.id, 
       p.sku, 
       p.name, 
       p.stock_quantity, 
       p.selling_price, 
       COALESCE(SUM(ABS(sm.quantity_change)), 0)::int AS sold_quantity
     FROM products p
     JOIN stock_movements sm ON sm.product_id = p.id AND sm.quantity_change < 0
     WHERE p.is_active = true
     GROUP BY p.id
     ORDER BY sold_quantity DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}
