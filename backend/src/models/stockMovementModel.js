import { StockMovement, Product } from '../db/schemas.js';

export async function list({ productId, reason, dateFrom, dateTo, page = 1, pageSize = 25 }) {
  const query = {};

  if (productId) {
    query.product_id = productId;
  }
  if (reason) {
    query.reason = reason;
  }
  if (dateFrom || dateTo) {
    query.created_at = {};
    if (dateFrom) query.created_at.$gte = new Date(dateFrom);
    if (dateTo) query.created_at.$lte = new Date(dateTo);
  }

  const offset = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    StockMovement.find(query)
      .populate('product_id', 'sku name category brand')
      .populate('user_id', 'name')
      .sort({ created_at: -1, _id: -1 })
      .skip(offset)
      .limit(pageSize)
      .lean({ virtuals: true }),
    StockMovement.countDocuments(query),
  ]);

  const formattedItems = items.map((doc) => ({
    ...doc,
    id: doc._id.toString(),
    product_id: doc.product_id?._id ? doc.product_id._id.toString() : doc.product_id,
    product_sku: doc.product_id?.sku || '',
    product_name: doc.product_id?.name || '',
    user_name: doc.user_id?.name || 'System Manager',
  }));

  return { items: formattedItems, total, page, pageSize };
}

export async function lowStock({ category }) {
  const query = {
    is_active: true,
    $expr: { $lte: ['$stock_quantity', '$reorder_threshold'] },
  };
  if (category) {
    query.category = category;
  }
  const products = await Product.find(query).lean({ virtuals: true });
  products.sort((a, b) => (a.stock_quantity - a.reorder_threshold) - (b.stock_quantity - b.reorder_threshold));
  return products.map((p) => ({ ...p, id: p._id.toString() }));
}
