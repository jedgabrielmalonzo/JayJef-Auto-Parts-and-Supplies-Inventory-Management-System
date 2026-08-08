import { pool } from '../db/pool.js';
import { createMovement } from '../services/stockMovements.js';

export class NoConfirmedItemsError extends Error {
  constructor() {
    super('Confirm at least one matched line item before committing this receipt (or reject it instead)');
  }
}

export async function create({ imagePath, rawOcrJson, supplierId, items }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const receiptResult = await client.query(
      `INSERT INTO ocr_receipts (image_path, raw_ocr_json, supplier_id) VALUES ($1, $2, $3) RETURNING *`,
      [imagePath, rawOcrJson ?? null, supplierId ?? null]
    );
    const receipt = receiptResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO ocr_receipt_items (ocr_receipt_id, raw_text, parsed_name, parsed_quantity, parsed_price, matched_product_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [receipt.id, item.raw_text ?? null, item.parsed_name ?? null, item.parsed_quantity ?? null, item.parsed_price ?? null, item.matched_product_id ?? null]
      );
    }

    await client.query('COMMIT');
    return findById(receipt.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function list({ status, page = 1, pageSize = 25 }) {
  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const [itemsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT r.*, s.name AS supplier_name,
         (SELECT COUNT(*)::int FROM ocr_receipt_items WHERE ocr_receipt_id = r.id) AS item_count
       FROM ocr_receipts r
       LEFT JOIN suppliers s ON s.id = r.supplier_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM ocr_receipts r ${where}`, params),
  ]);

  return { items: itemsResult.rows, total: countResult.rows[0].total, page, pageSize };
}

export async function findById(id) {
  const [receiptResult, itemsResult] = await Promise.all([
    pool.query(
      `SELECT r.*, s.name AS supplier_name FROM ocr_receipts r LEFT JOIN suppliers s ON s.id = r.supplier_id WHERE r.id = $1`,
      [id]
    ),
    pool.query(
      `SELECT i.*, p.sku AS matched_product_sku, p.name AS matched_product_name
       FROM ocr_receipt_items i
       LEFT JOIN products p ON p.id = i.matched_product_id
       WHERE i.ocr_receipt_id = $1
       ORDER BY i.id ASC`,
      [id]
    ),
  ]);

  if (receiptResult.rows.length === 0) return null;
  return { ...receiptResult.rows[0], items: itemsResult.rows };
}

const ITEM_WRITABLE_FIELDS = ['parsed_name', 'parsed_quantity', 'parsed_price', 'matched_product_id', 'is_confirmed'];

export async function upsertItems(receiptId, items) {
  for (const item of items) {
    if (item.id) {
      const fields = ITEM_WRITABLE_FIELDS.filter((f) => item[f] !== undefined);
      if (fields.length === 0) continue;
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = fields.map((f) => item[f]);
      await pool.query(
        `UPDATE ocr_receipt_items SET ${setClause} WHERE id = $${fields.length + 1} AND ocr_receipt_id = $${fields.length + 2}`,
        [...values, item.id, receiptId]
      );
    } else {
      // Staff adding a line OCR missed (docs/03 flow step 5).
      await pool.query(
        `INSERT INTO ocr_receipt_items (ocr_receipt_id, parsed_name, parsed_quantity, parsed_price, matched_product_id, is_confirmed)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [receiptId, item.parsed_name ?? null, item.parsed_quantity ?? null, item.parsed_price ?? null, item.matched_product_id ?? null, item.is_confirmed ?? false]
      );
    }
  }
  return findById(receiptId);
}

export async function setStatus(id, status, confirmedBy) {
  const result = await pool.query(
    `UPDATE ocr_receipts SET status = $1, confirmed_by = $2, confirmed_at = CASE WHEN $1 = 'confirmed' THEN now() ELSE confirmed_at END WHERE id = $3 RETURNING *`,
    [status, confirmedBy ?? null, id]
  );
  return result.rows[0] || null;
}

/**
 * The correctness boundary from docs/03: only lines a human explicitly
 * confirmed become stock movements, one ocr_restock movement per line, in
 * a single transaction with the receipt's status flip.
 */
export async function confirm(id, userId) {
  const receipt = await findById(id);
  if (!receipt) return null;
  if (receipt.status !== 'pending_review') {
    throw new Error(`Only a pending_review receipt can be confirmed (current status: ${receipt.status})`);
  }

  const toCommit = receipt.items.filter((i) => i.is_confirmed && i.matched_product_id && Number(i.parsed_quantity) > 0);
  if (toCommit.length === 0) throw new NoConfirmedItemsError();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of toCommit) {
      await createMovement(client, {
        productId: item.matched_product_id,
        userId,
        quantityChange: Number(item.parsed_quantity),
        reason: 'ocr_restock',
        referenceType: 'ocr_receipt',
        referenceId: receipt.id,
        note: item.parsed_name,
      });
    }
    await client.query(
      "UPDATE ocr_receipts SET status = 'confirmed', confirmed_by = $1, confirmed_at = now() WHERE id = $2",
      [userId ?? null, id]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return findById(id);
}
