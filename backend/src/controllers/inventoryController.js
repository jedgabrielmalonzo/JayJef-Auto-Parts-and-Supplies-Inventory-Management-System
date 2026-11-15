import * as stockMovementModel from '../models/stockMovementModel.js';
import { createMovementStandalone, createBatchMovementsStandalone, InsufficientStockError } from '../services/stockMovements.js';

const MANUAL_REASONS = ['manual_adjustment', 'correction', 'purchase_order_received', 'order_fulfillment'];

export async function listMovements(req, res, next) {
  try {
    const { product_id, reason, date_from, date_to, page, page_size } = req.query;
    const result = await stockMovementModel.list({
      productId: product_id,
      reason,
      dateFrom: date_from,
      dateTo: date_to,
      page: page ? Number(page) : 1,
      pageSize: page_size ? Number(page_size) : 25,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createMovement(req, res, next) {
  try {
    const { product_id, quantity_change, reason, note, user_id } = req.body;

    if (!product_id || !quantity_change || !MANUAL_REASONS.includes(reason)) {
      return res.status(400).json({
        error: 'Invalid request',
        fields: {
          ...(product_id ? {} : { product_id: 'required' }),
          ...(quantity_change ? {} : { quantity_change: 'required, non-zero integer' }),
          ...(MANUAL_REASONS.includes(reason) ? {} : { reason: `must be one of ${MANUAL_REASONS.join(', ')}` }),
        },
      });
    }

    const movement = await createMovementStandalone({
      productId: product_id,
      userId: user_id,
      quantityChange: Number(quantity_change),
      reason,
      note,
    });
    res.status(201).json(movement);
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

export async function createBatchMovements(req, res, next) {
  try {
    let rawMovements = req.body.movements;
    const batchReason = req.body.reason || 'manual_adjustment';
    const batchNote = req.body.note || null;

    if (!rawMovements && Array.isArray(req.body.adjustments)) {
      rawMovements = req.body.adjustments.map((a) => ({
        product_id: a.product_id || a.productId,
        quantity_change: a.quantity_change ?? a.quantityChange,
        reason: a.reason || batchReason,
        note: a.note || batchNote,
      }));
    }

    if (!Array.isArray(rawMovements) || rawMovements.length === 0) {
      return res.status(400).json({ error: 'Missing or empty movements array' });
    }

    const itemsToProcess = rawMovements.map((m) => ({
      productId: m.product_id || m.productId,
      userId: m.user_id || req.body.user_id,
      quantityChange: Number(m.quantity_change ?? m.quantityChange),
      reason: m.reason || batchReason,
      referenceType: m.reference_type || m.referenceType || null,
      referenceId: m.reference_id || m.referenceId || null,
      note: m.note ?? batchNote,
    }));

    const results = await createBatchMovementsStandalone(itemsToProcess);
    res.status(201).json({ movements: results, count: results.length });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

export async function lowStock(req, res, next) {
  try {
    res.json(await stockMovementModel.lowStock({ category: req.query.category }));
  } catch (err) {
    next(err);
  }
}

