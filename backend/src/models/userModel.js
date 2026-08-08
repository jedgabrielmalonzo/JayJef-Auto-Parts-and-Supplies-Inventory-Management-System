import { pool } from '../db/pool.js';

export async function list() {
  const result = await pool.query('SELECT * FROM users ORDER BY name ASC');
  return result.rows;
}

export async function findById(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function create({ name, role }) {
  const result = await pool.query(
    'INSERT INTO users (name, role) VALUES ($1, $2) RETURNING *',
    [name, role]
  );
  return result.rows[0];
}

export async function update(id, data) {
  const fields = ['name', 'role'].filter((f) => data[f] !== undefined);
  if (fields.length === 0) return findById(id);

  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map((f) => data[f]);

  const result = await pool.query(
    `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0] || null;
}
