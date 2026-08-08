import { pool } from '../db/pool.js';

const REASONS = [
  'initial_stock', 'manual_adjustment', 'ocr_restock',
  'purchase_order_received', 'order_fulfillment', 'correction',
];

export class InsufficientStockError extends Error {
  constructor(productId, available, requested) {
    super(`Insufficient stock for product ${productId}: have ${available}, need ${requested}`);
    this.productId = productId;
    this.available = available;
    this.requested = requested;
  }
}

/**
 * The one shared code path allowed to change products.stock_quantity (docs/02).
 * Must run inside a transaction the caller owns — locks the product row so
 * concurrent movements against the same product serialize instead of racing.
 */
export async function createMovement(client, { productId, userId, quantityChange, reason, referenceType, referenceId, note }) {
  if (!REASONS.includes(reason)) throw new Error(`Invalid movement reason: ${reason}`);

  const productResult = await client.query('SELECT stock_quantity FROM products WHERE id = $1 FOR UPDATE', [productId]);
  if (productResult.rows.length === 0) throw new Error(`Product ${productId} not found`);

  const before = productResult.rows[0].stock_quantity;
  const after = before + quantityChange;
  if (after < 0) throw new InsufficientStockError(productId, before, -quantityChange);

  await client.query('UPDATE products SET stock_quantity = $1, updated_at = now() WHERE id = $2', [after, productId]);

  const movementResult = await client.query(
    `INSERT INTO stock_movements
       (product_id, user_id, quantity_change, reason, reference_type, reference_id, quantity_before, quantity_after, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [productId, userId ?? null, quantityChange, reason, referenceType ?? null, referenceId ?? null, before, after, note ?? null]
  );

  return movementResult.rows[0];
}

/** Convenience wrapper for callers that only need to record a single movement. */
export async function createMovementStandalone(data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const movement = await createMovement(client, data);
    await client.query('COMMIT');
    return movement;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
