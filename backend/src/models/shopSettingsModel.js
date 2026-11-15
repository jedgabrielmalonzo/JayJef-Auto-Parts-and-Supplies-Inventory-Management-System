import { ShopSettings } from '../db/schemas.js';

export async function get() {
  let settings = await ShopSettings.findOne().lean({ virtuals: true });
  if (!settings) {
    const created = await ShopSettings.create({
      name: 'JayJef Auto Parts & Supplies',
      address: '123 Industrial Ave, Quezon City, Philippines',
      phone: '0917 123 4567',
    });
    return { ...created.toObject(), id: created._id.toString() };
  }
  return { ...settings, id: settings._id.toString() };
}

export async function update(data) {
  const updated = await ShopSettings.findOneAndUpdate(
    {},
    { $set: data },
    { new: true, upsert: true }
  ).lean({ virtuals: true });
  return { ...updated, id: updated._id.toString() };
}
