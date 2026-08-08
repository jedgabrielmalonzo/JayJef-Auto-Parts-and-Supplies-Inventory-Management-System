import { pool } from '../db/pool.js';

const WRITABLE_FIELDS = [
  'sku', 'name', 'brand', 'category', 'compatible_vehicles', 'unit',
  'cost_price', 'selling_price', 'reorder_threshold', 'supplier_id',
  'location_aisle', 'location_shelf', 'location_bin',
  'location_x', 'location_y', 'location_z', 'notes',
];

export async function list({ search, category, supplierId, isActive, lowStock, page = 1, pageSize = 25 }) {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(sku ILIKE $${params.length} OR name ILIKE $${params.length} OR brand ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  if (supplierId) {
    params.push(supplierId);
    conditions.push(`supplier_id = $${params.length}`);
  }
  if (isActive !== undefined) {
    params.push(isActive);
    conditions.push(`is_active = $${params.length}`);
  }
  if (lowStock) {
    conditions.push('stock_quantity <= reorder_threshold');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const [itemsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT * FROM products ${where} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM products ${where}`, params),
  ]);

  return { items: itemsResult.rows, total: countResult.rows[0].total, page, pageSize };
}

export async function findById(id) {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/** Lightweight bulk list for the 3D map's product picker (docs/06#products). */
export async function locations({ search }) {
  const conditions = ['is_active = true', 'location_x IS NOT NULL', 'location_y IS NOT NULL', 'location_z IS NOT NULL'];
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(sku ILIKE $${params.length} OR name ILIKE $${params.length})`);
  }
  const result = await pool.query(
    `SELECT id, sku, name, location_aisle, location_shelf, location_bin, location_x, location_y, location_z
     FROM products WHERE ${conditions.join(' AND ')} ORDER BY name ASC`,
    params
  );
  return result.rows;
}

export async function create(data) {
  const fields = WRITABLE_FIELDS.filter((f) => data[f] !== undefined);
  const columns = fields.join(', ');
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const values = fields.map((f) => data[f]);

  const result = await pool.query(
    `INSERT INTO products (${columns}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function update(id, data) {
  const fields = WRITABLE_FIELDS.filter((f) => data[f] !== undefined);
  if (fields.length === 0) return findById(id);

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map((f) => data[f]);

  const result = await pool.query(
    `UPDATE products SET ${setClause}, updated_at = now() WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0] || null;
}

export async function softDelete(id) {
  const result = await pool.query(
    'UPDATE products SET is_active = false, updated_at = now() WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] || null;
}

export async function reactivate(id) {
  const result = await pool.query(
    'UPDATE products SET is_active = true, updated_at = now() WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] || null;
}

export async function hasHistory(id) {
  const result = await pool.query(
    `SELECT
       EXISTS(SELECT 1 FROM stock_movements WHERE product_id = $1) OR
       EXISTS(SELECT 1 FROM purchase_order_items WHERE product_id = $1)
       AS has_history`,
    [id]
  );
  return result.rows[0].has_history;
}

export async function hardDelete(id) {
  const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}
