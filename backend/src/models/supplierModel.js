import { pool } from '../db/pool.js';

const WRITABLE_FIELDS = ['name', 'contact_person', 'phone', 'email', 'address', 'notes'];

export async function list({ search, page = 1, pageSize = 25 }) {
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR contact_person ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const [itemsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT * FROM suppliers ${where} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM suppliers ${where}`, params),
  ]);

  return { items: itemsResult.rows, total: countResult.rows[0].total, page, pageSize };
}

export async function findById(id) {
  const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data) {
  const fields = WRITABLE_FIELDS.filter((f) => data[f] !== undefined);
  const columns = fields.join(', ');
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const values = fields.map((f) => data[f]);

  const result = await pool.query(
    `INSERT INTO suppliers (${columns}) VALUES (${placeholders}) RETURNING *`,
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
    `UPDATE suppliers SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0] || null;
}

export async function isReferenced(id) {
  const result = await pool.query(
    `SELECT
       EXISTS(SELECT 1 FROM products WHERE supplier_id = $1) OR
       EXISTS(SELECT 1 FROM purchase_orders WHERE supplier_id = $1) OR
       EXISTS(SELECT 1 FROM ocr_receipts WHERE supplier_id = $1)
       AS referenced`,
    [id]
  );
  return result.rows[0].referenced;
}

export async function remove(id) {
  const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}
