import * as productModel from '../models/productModel.js';
import * as orderModel from '../models/orderModel.js';
import { createMovementStandalone } from '../services/stockMovements.js';

const REQUIRED_ON_CREATE = ['sku', 'name', 'category'];

function toBool(value) {
  if (value === undefined) return undefined;
  return value === 'true' || value === true;
}

function handleDbError(err, res) {
  if (err.code === '23505') {
    return res.status(409).json({ error: 'SKU already exists' });
  }
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Invalid field value', details: err.detail });
  }
  if (err.code === '23503') {
    return res.status(409).json({ error: 'Referenced record does not exist (e.g. supplier_id)' });
  }
  throw err;
}

export async function listProducts(req, res, next) {
  try {
    const { search, category, supplier_id, is_active, low_stock, page, page_size } = req.query;
    const result = await productModel.list({
      search,
      category,
      supplierId: supplier_id,
      isActive: toBool(is_active),
      lowStock: toBool(low_stock),
      page: page ? Number(page) : 1,
      pageSize: page_size ? Number(page_size) : 25,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProductLocations(req, res, next) {
  try {
    res.json(await productModel.locations({ search: req.query.search }));
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function getProductPurchases(req, res, next) {
  try {
    res.json(await orderModel.itemHistoryForProduct(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const missing = REQUIRED_ON_CREATE.filter((f) => !req.body[f]);
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        fields: Object.fromEntries(missing.map((f) => [f, 'required'])),
      });
    }
    if (req.file) req.body.image_path = `/uploads/products/${req.file.filename}`;
    let product = await productModel.create(req.body);

    const initialStock = Number(req.body.initial_stock);
    if (initialStock > 0) {
      await createMovementStandalone({
        productId: product.id,
        userId: req.body.user_id,
        quantityChange: initialStock,
        reason: 'initial_stock',
      });
      product = await productModel.findById(product.id);
    }

    res.status(201).json(product);
  } catch (err) {
    try {
      handleDbError(err, res);
    } catch (e) {
      next(e);
    }
  }
}

export async function updateProduct(req, res, next) {
  try {
    const existing = await productModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    if (req.file) req.body.image_path = `/uploads/products/${req.file.filename}`;
    const product = await productModel.update(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    try {
      handleDbError(err, res);
    } catch (e) {
      next(e);
    }
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const existing = await productModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const wantsHard = toBool(req.query.hard);
    if (wantsHard) {
      const hasHistory = await productModel.hasHistory(req.params.id);
      if (hasHistory) {
        return res.status(409).json({
          error: 'Product has movement or order history and cannot be hard-deleted; use soft delete instead',
        });
      }
      await productModel.hardDelete(req.params.id);
      return res.status(204).send();
    }

    await productModel.softDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function reactivateProduct(req, res, next) {
  try {
    const existing = await productModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    const product = await productModel.reactivate(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
}
