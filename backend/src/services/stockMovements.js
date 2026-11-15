import { Product, StockMovement } from '../db/schemas.js';

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

export async function createMovement(client, { productId, userId, quantityChange, reason, referenceType, referenceId, note }) {
  if (!REASONS.includes(reason)) {
    throw new Error(`Invalid movement reason: ${reason}`);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  const before = Number(product.stock_quantity || 0);
  const change = Number(quantityChange || 0);
  const after = before + change;

  if (after < 0) {
    throw new InsufficientStockError(productId, before, -change);
  }

  product.stock_quantity = after;
  await product.save();

  const movement = new StockMovement({
    product_id: product._id,
    user_id: userId || null,
    quantity_change: change,
    reason,
    reference_type: referenceType || null,
    reference_id: referenceId || null,
    quantity_before: before,
    quantity_after: after,
    note: note || null,
  });

  await movement.save();
  const obj = movement.toObject();
  return { ...obj, id: movement._id.toString() };
}

export async function createMovementStandalone(data) {
  return createMovement(null, data);
}

export async function createBatchMovementsStandalone(items) {
  const movements = [];
  for (const item of items) {
    const movement = await createMovement(null, item);
    movements.push(movement);
  }
  return movements;
}
