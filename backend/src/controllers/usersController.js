import * as userModel from '../models/userModel.js';

export async function listUsers(req, res, next) {
  try {
    res.json(await userModel.list());
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const { name, role } = req.body;
    if (!name || !role) {
      return res.status(400).json({
        error: 'Missing required fields',
        fields: { ...(name ? {} : { name: 'required' }), ...(role ? {} : { role: 'required' }) },
      });
    }
    const user = await userModel.create({ name, role });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const existing = await userModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });
    const user = await userModel.update(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
}
