import { pool } from '../db/pool.js';
import { createMovement } from '../services/stockMovements.js';

const ORDER_NUMBER_PREFIX = { purchase: 'PO', sale: 'INV' };

export class FulfillmentStockError extends Error {
  constructor(items) {
    super('Insufficient stock to fulfill this order');
    this.items = items;
  }
}

// ponytail: sequence-by-scan, not a DB sequence — fine at shop-floor order
// volume; move to a real per-type sequence if concurrent order creation
// ever becomes frequent enough to race.
async function nextOrderNumber(client, type) {
  const prefix = ORDER_NUMBER_PREFIX[type];
  const result = await client.query(
    `SELECT order_number FROM purchase_orders WHERE type = $1 ORDER BY id DESC LIMIT 1`,
    [type]
  );
  const last = result.rows[0]?.order_number;
  const lastNum = last ? Number(last.slice(prefix.length + 1)) : 0;
  return `${prefix}-${String(lastNum + 1).padStart(4, '0')}`;
}

function computeTotals(items) {
  const lineItems = items.map((it) => ({
    product_id: it.product_id,
    quantity: Number(it.quantity),
    unit_price: Number(it.unit_price),
    line_total: Number((Number(it.quantity) * Number(it.unit_price)).toFixed(2)),
  }));
  const subtotal = Number(lineItems.reduce((sum, it) => sum + it.line_total, 0).toFixed(2));
  return { lineItems, subtotal, total: subtotal };
}

export async function list({ type, status, page = 1, pageSize = 25 }) {
  const conditions = [];
  const params = [];

  if (type) {
    params.push(type);
    conditions.push(`o.type = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const [itemsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT o.*, s.name AS supplier_name
       FROM purchase_orders o
       LEFT JOIN suppliers s ON s.id = o.supplier_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM purchase_orders o ${where}`, params),
  ]);

  return { items: itemsResult.rows, total: countResult.rows[0].total, page, pageSize };
}

export async function findById(id) {
  const [orderResult, itemsResult] = await Promise.all([
    pool.query(
      `SELECT o.*, s.name AS supplier_name, s.address AS supplier_address,
              s.phone AS supplier_phone, s.email AS supplier_email
       FROM purchase_orders o
       LEFT JOIN suppliers s ON s.id = o.supplier_id
       WHERE o.id = $1`,
      [id]
    ),
    pool.query(
      `SELECT i.*, p.sku AS product_sku, p.name AS product_name, p.unit AS product_unit
       FROM purchase_order_items i
       JOIN products p ON p.id = i.product_id
       WHERE i.purchase_order_id = $1
       ORDER BY i.id ASC`,
      [id]
    ),
  ]);

  if (orderResult.rows.length === 0) return null;
  return { ...orderResult.rows[0], items: itemsResult.rows };
}

/** A product's own purchase/sale history, for its detail page's Purchases tab. */
export async function itemHistoryForProduct(productId) {
  const result = await pool.query(
    `SELECT i.quantity, i.unit_price, i.line_total,
            o.id AS order_id, o.order_number, o.type, o.status, o.order_date,
            s.name AS supplier_name, o.party_name
     FROM purchase_order_items i
     JOIN purchase_orders o ON o.id = i.purchase_order_id
     LEFT JOIN suppliers s ON s.id = o.supplier_id
     WHERE i.product_id = $1
     ORDER BY o.order_date DESC, o.id DESC`,
    [productId]
  );
  return result.rows;
}

async function replaceItems(client, orderId, items) {
  const { lineItems, subtotal, total } = computeTotals(items);

  await client.query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [orderId]);
  for (const item of lineItems) {
    await client.query(
      `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, line_total)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, item.product_id, item.quantity, item.unit_price, item.line_total]
    );
  }
  await client.query(
    'UPDATE purchase_orders SET subtotal = $1, total = $2, updated_at = now() WHERE id = $3',
    [subtotal, total, orderId]
  );
}

export async function create({ type, supplier_id, party_name, party_contact, order_date, notes, items, userId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderNumber = await nextOrderNumber(client, type);
    const { subtotal, total } = computeTotals(items);

    const orderResult = await client.query(
      `INSERT INTO purchase_orders
         (order_number, type, supplier_id, party_name, party_contact, order_date, notes, subtotal, total, created_by)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), $7, $8, $9, $10)
       RETURNING id`,
      [orderNumber, type, supplier_id ?? null, party_name ?? null, party_contact ?? null, order_date ?? null, notes ?? null, subtotal, total, userId ?? null]
    );
    const orderId = orderResult.rows[0].id;
    await replaceItems(client, orderId, items);

    await client.query('COMMIT');
    return findById(orderId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function update(id, { supplier_id, party_name, party_contact, order_date, notes, items }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const fields = [];
    const values = [];
    for (const [col, val] of Object.entries({ supplier_id, party_name, party_contact, order_date, notes })) {
      if (val === undefined) continue;
      values.push(val);
      fields.push(`${col} = $${values.length}`);
    }
    if (fields.length > 0) {
      values.push(id);
      await client.query(`UPDATE purchase_orders SET ${fields.join(', ')}, updated_at = now() WHERE id = $${values.length}`, values);
    }
    if (items) {
      await replaceItems(client, id, items);
    }

    await client.query('COMMIT');
    return findById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function setStatus(id, status) {
  const result = await pool.query(
    'UPDATE purchase_orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0] || null;
}

/**
 * Confirmed -> fulfilled: creates one stock movement per line item (docs/04).
 * For sales, every item is checked against current stock *before* any
 * movement is applied, so a short order reports every shortfall at once
 * instead of failing partway through.
 */
export async function fulfill(id, userId) {
  const order = await findById(id);
  if (!order) return null;
  if (order.status !== 'confirmed') {
    throw new Error(`Order must be confirmed before it can be fulfilled (current status: ${order.status})`);
  }

  if (order.type === 'sale') {
    const shortfalls = [];
    for (const item of order.items) {
      const stockResult = await pool.query('SELECT stock_quantity FROM products WHERE id = $1', [item.product_id]);
      const available = stockResult.rows[0]?.stock_quantity ?? 0;
      if (available < item.quantity) {
        shortfalls.push({ product_id: item.product_id, sku: item.product_sku, name: item.product_name, available, requested: item.quantity });
      }
    }
    if (shortfalls.length > 0) throw new FulfillmentStockError(shortfalls);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reason = order.type === 'purchase' ? 'purchase_order_received' : 'order_fulfillment';
    for (const item of order.items) {
      const quantityChange = order.type === 'purchase' ? item.quantity : -item.quantity;
      await createMovement(client, {
        productId: item.product_id,
        userId,
        quantityChange,
        reason,
        referenceType: 'purchase_order',
        referenceId: order.id,
      });
    }
    await client.query(
      "UPDATE purchase_orders SET status = 'fulfilled', updated_at = now() WHERE id = $1",
      [id]
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
