import { pool } from '../db/pool.js';

const WRITABLE_FIELDS = ['location_aisle', 'label', 'x', 'y', 'width', 'height', 'color'];

export async function list() {
  const result = await pool.query('SELECT * FROM shop_layout_cabinets ORDER BY location_aisle ASC');
  return result.rows;
}

export async function findById(id) {
  const result = await pool.query('SELECT * FROM shop_layout_cabinets WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function create(data) {
  const fields = WRITABLE_FIELDS.filter((f) => data[f] !== undefined);
  const columns = fields.join(', ');
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const values = fields.map((f) => data[f]);

  const result = await pool.query(
    `INSERT INTO shop_layout_cabinets (${columns}) VALUES (${placeholders}) RETURNING *`,
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
    `UPDATE shop_layout_cabinets SET ${setClause}, updated_at = now() WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0] || null;
}

export async function remove(id) {
  const result = await pool.query('DELETE FROM shop_layout_cabinets WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}
