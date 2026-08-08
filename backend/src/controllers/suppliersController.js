import * as supplierModel from '../models/supplierModel.js';

export async function listSuppliers(req, res, next) {
  try {
    const { search, page, page_size } = req.query;
    const result = await supplierModel.list({
      search,
      page: page ? Number(page) : 1,
      pageSize: page_size ? Number(page_size) : 25,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSupplier(req, res, next) {
  try {
    const supplier = await supplierModel.findById(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (err) {
    next(err);
  }
}

export async function createSupplier(req, res, next) {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: 'Missing required fields', fields: { name: 'required' } });
    }
    const supplier = await supplierModel.create(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
}

export async function updateSupplier(req, res, next) {
  try {
    const existing = await supplierModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Supplier not found' });
    const supplier = await supplierModel.update(req.params.id, req.body);
    res.json(supplier);
  } catch (err) {
    next(err);
  }
}

export async function deleteSupplier(req, res, next) {
  try {
    const existing = await supplierModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Supplier not found' });

    const referenced = await supplierModel.isReferenced(req.params.id);
    if (referenced) {
      return res.status(409).json({ error: 'Supplier is referenced by products or orders and cannot be deleted' });
    }

    await supplierModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
