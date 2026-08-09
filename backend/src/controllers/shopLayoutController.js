import * as shopLayoutModel from '../models/shopLayoutModel.js';

function handleDbError(err, res) {
  if (err.code === '23505') {
    return res.status(409).json({ error: 'An aisle code already exists on the map' });
  }
  throw err;
}

export async function listCabinets(req, res, next) {
  try {
    res.json(await shopLayoutModel.list());
  } catch (err) {
    next(err);
  }
}

export async function createCabinet(req, res, next) {
  try {
    const missing = ['location_aisle', 'label', 'x', 'y'].filter((f) => req.body[f] === undefined || req.body[f] === '');
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        fields: Object.fromEntries(missing.map((f) => [f, 'required'])),
      });
    }
    const cabinet = await shopLayoutModel.create(req.body);
    res.status(201).json(cabinet);
  } catch (err) {
    try {
      handleDbError(err, res);
    } catch (e) {
      next(e);
    }
  }
}

export async function updateCabinet(req, res, next) {
  try {
    const existing = await shopLayoutModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Cabinet not found' });
    const cabinet = await shopLayoutModel.update(req.params.id, req.body);
    res.json(cabinet);
  } catch (err) {
    try {
      handleDbError(err, res);
    } catch (e) {
      next(e);
    }
  }
}

export async function deleteCabinet(req, res, next) {
  try {
    const existing = await shopLayoutModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Cabinet not found' });
    await shopLayoutModel.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
