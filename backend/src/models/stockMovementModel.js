import { pool } from '../db/pool.js';

export async function list({ productId, reason, dateFrom, dateTo, page = 1, pageSize = 25 }) {
  const conditions = [];
  const params = [];

  if (productId) {
    params.push(productId);
    conditions.push(`m.product_id = $${params.length}`);
  }
  if (reason) {
    params.push(reason);
    conditions.push(`m.reason = $${params.length}`);
  }
  if (dateFrom) {
    params.push(dateFrom);
    conditions.push(`m.created_at >= $${params.length}`);
  }
  if (dateTo) {
    params.push(dateTo);
    conditions.push(`m.created_at <= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const [itemsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT m.*, p.sku AS product_sku, p.name AS product_name, u.name AS user_name
       FROM stock_movements m
       JOIN products p ON p.id = m.product_id
       LEFT JOIN users u ON u.id = m.user_id
       ${where}
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM stock_movements m ${where}`, params),
  ]);

  return { items: itemsResult.rows, total: countResult.rows[0].total, page, pageSize };
}

export async function lowStock({ category }) {
  const conditions = ['stock_quantity <= reorder_threshold', 'is_active = true'];
  const params = [];
  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  const result = await pool.query(
    `SELECT * FROM products WHERE ${conditions.join(' AND ')} ORDER BY (stock_quantity - reorder_threshold) ASC`,
    params
  );
  return result.rows;
}
