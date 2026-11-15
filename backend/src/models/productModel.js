import mongoose from 'mongoose';
import { Product, StockMovement } from '../db/schemas.js';

export async function list({ search, category, supplierId, isActive, lowStock, page = 1, pageSize = 25 }) {
  const query = {};

  if (isActive !== undefined) {
    query.is_active = isActive;
  }
  if (category) {
    query.category = category;
  }
  if (supplierId) {
    query.supplier_id = supplierId;
  }
  if (lowStock) {
    query.$expr = { $lte: ['$stock_quantity', '$reorder_threshold'] };
  }
  if (search && search.trim()) {
    const q = search.trim();
    const regex = new RegExp(q, 'i');
    query.$or = [
      { sku: regex },
      { name: regex },
      { brand: regex },
      { compatible_vehicles: regex },
    ];
  }

  const offset = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    Product.find(query)
      .sort({ name: 1 })
      .skip(offset)
      .limit(pageSize)
      .lean({ virtuals: true }),
    Product.countDocuments(query),
  ]);

  const formattedItems = items.map((doc) => ({
    ...doc,
    id: doc._id.toString(),
  }));

  return { items: formattedItems, total, page, pageSize };
}

export async function findById(id) {
  let doc = null;
  if (mongoose.isValidObjectId(id)) {
    doc = await Product.findById(id).lean({ virtuals: true });
  } else {
    doc = await Product.findOne({ sku: id }).lean({ virtuals: true });
  }
  if (!doc) return null;
  return { ...doc, id: doc._id.toString() };
}

export async function locations({ search }) {
  const query = { is_active: true, location_aisle: { $ne: null } };
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ sku: regex }, { name: regex }];
  }
  const docs = await Product.find(query)
    .select('sku name location_aisle location_shelf location_bin')
    .sort({ name: 1 })
    .lean();
  return docs.map((d) => ({ ...d, id: d._id.toString() }));
}

export async function create(data) {
  const product = new Product(data);
  await product.save();
  const obj = product.toObject();
  return { ...obj, id: product._id.toString() };
}

export async function update(id, data) {
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { sku: id };
  const updated = await Product.findOneAndUpdate(query, { $set: data }, { new: true }).lean({ virtuals: true });
  if (!updated) return null;
  return { ...updated, id: updated._id.toString() };
}

export async function softDelete(id) {
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { sku: id };
  const updated = await Product.findOneAndUpdate(query, { $set: { is_active: false } }, { new: true }).lean({ virtuals: true });
  if (!updated) return null;
  return { ...updated, id: updated._id.toString() };
}

export async function reactivate(id) {
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { sku: id };
  const updated = await Product.findOneAndUpdate(query, { $set: { is_active: true } }, { new: true }).lean({ virtuals: true });
  if (!updated) return null;
  return { ...updated, id: updated._id.toString() };
}

export async function hasHistory(id) {
  const count = await StockMovement.countDocuments({ product_id: id });
  return count > 0;
}

export async function hardDelete(id) {
  const query = mongoose.isValidObjectId(id) ? { _id: id } : { sku: id };
  const res = await Product.deleteOne(query);
  return res.deletedCount > 0;
}

export async function bulkSoftDelete(ids = []) {
  if (!ids.length) return 0;
  const validIds = ids.filter(mongoose.isValidObjectId);
  const res = await Product.updateMany({ _id: { $in: validIds } }, { $set: { is_active: false } });
  return res.modifiedCount || 0;
}
