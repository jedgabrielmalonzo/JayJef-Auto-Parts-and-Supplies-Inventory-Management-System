import * as orderModel from '../models/orderModel.js';
import { FulfillmentStockError } from '../models/orderModel.js';
import { renderOrderPdf } from '../services/pdf.js';

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) return 'At least one line item is required';
  for (const item of items) {
    if (!item.product_id || !(Number(item.quantity) > 0) || Number(item.unit_price) < 0) {
      return 'Each item needs product_id, quantity > 0, and unit_price >= 0';
    }
  }
  return null;
}

export async function listOrders(req, res, next) {
  try {
    const { type, status, page, page_size } = req.query;
    const result = await orderModel.list({
      type,
      status,
      page: page ? Number(page) : 1,
      pageSize: page_size ? Number(page_size) : 25,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req, res, next) {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function createOrder(req, res, next) {
  try {
    const { type, supplier_id, party_name, party_contact, order_date, notes, items, user_id } = req.body;

    if (!['purchase', 'sale'].includes(type)) {
      return res.status(400).json({ error: 'Invalid request', fields: { type: "must be 'purchase' or 'sale'" } });
    }
    const itemsError = validateItems(items);
    if (itemsError) {
      return res.status(400).json({ error: 'Invalid request', fields: { items: itemsError } });
    }

    const order = await orderModel.create({ type, supplier_id, party_name, party_contact, order_date, notes, items, userId: user_id });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

export async function updateOrder(req, res, next) {
  try {
    const existing = await orderModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.status !== 'draft') {
      return res.status(409).json({ error: 'Only draft orders can be edited' });
    }
    if (req.body.items) {
      const itemsError = validateItems(req.body.items);
      if (itemsError) return res.status(400).json({ error: 'Invalid request', fields: { items: itemsError } });
    }

    const order = await orderModel.update(req.params.id, req.body);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function confirmOrder(req, res, next) {
  try {
    const existing = await orderModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (existing.status !== 'draft') {
      return res.status(409).json({ error: `Only draft orders can be confirmed (current status: ${existing.status})` });
    }
    res.json(await orderModel.setStatus(req.params.id, 'confirmed'));
  } catch (err) {
    next(err);
  }
}

export async function fulfillOrder(req, res, next) {
  try {
    const order = await orderModel.fulfill(req.params.id, req.body.user_id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    if (err instanceof FulfillmentStockError) {
      return res.status(409).json({ error: err.message, details: err.items });
    }
    if (err.message?.startsWith('Order must be confirmed')) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const existing = await orderModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (!['draft', 'confirmed'].includes(existing.status)) {
      return res.status(409).json({ error: `Only draft or confirmed orders can be cancelled (current status: ${existing.status})` });
    }
    res.json(await orderModel.setStatus(req.params.id, 'cancelled'));
  } catch (err) {
    next(err);
  }
}

export async function getOrderPdf(req, res, next) {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const pdf = await renderOrderPdf(order);
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `inline; filename="${order.order_number}.pdf"`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
}
