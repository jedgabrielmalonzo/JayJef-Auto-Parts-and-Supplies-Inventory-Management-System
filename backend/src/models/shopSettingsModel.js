import { pool } from '../db/pool.js';

const WRITABLE_FIELDS = ['name', 'address', 'phone'];

export async function get() {
  const result = await pool.query('SELECT * FROM shop_settings WHERE id = 1');
  return result.rows[0];
}

export async function update(data) {
  const fields = WRITABLE_FIELDS.filter((f) => data[f] !== undefined);
  if (fields.length === 0) return get();

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map((f) => data[f]);

  const result = await pool.query(
    `UPDATE shop_settings SET ${setClause}, updated_at = now() WHERE id = 1 RETURNING *`,
    values
  );
  return result.rows[0];
}
