import * as shopSettingsModel from '../models/shopSettingsModel.js';

export async function getSettings(req, res, next) {
  try {
    res.json(await shopSettingsModel.get());
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    if (req.body.name !== undefined && !req.body.name) {
      return res.status(400).json({ error: 'Missing required fields', fields: { name: 'required' } });
    }
    res.json(await shopSettingsModel.update(req.body));
  } catch (err) {
    next(err);
  }
}
