import mongoose from 'mongoose';

const schemaOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
};

export const ProductSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: '' },
    category: { type: String, default: '' },
    compatible_vehicles: { type: String, default: '' },
    unit: { type: String, default: 'pc' },
    cost_price: { type: Number, default: 0 },
    selling_price: { type: Number, default: 0 },
    stock_quantity: { type: Number, default: 0 },
    reorder_threshold: { type: Number, default: 0 },
    supplier_id: { type: String, default: null },
    location_aisle: { type: String, default: null },
    location_shelf: { type: String, default: null },
    location_bin: { type: String, default: null },
    notes: { type: String, default: '' },
    image_path: { type: String, default: null },
    is_active: { type: Boolean, default: true },
  },
  schemaOptions
);

export const StockMovementSchema = new mongoose.Schema(
  {
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    quantity_change: { type: Number, required: true },
    reason: { type: String, required: true },
    reference_type: { type: String, default: null },
    reference_id: { type: String, default: null },
    quantity_before: { type: Number, default: 0 },
    quantity_after: { type: Number, default: 0 },
    note: { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: schemaOptions.toJSON,
    toObject: schemaOptions.toObject,
  }
);

export const SupplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact_person: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  schemaOptions
);

export const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: 'admin' },
  },
  schemaOptions
);

export const ShopSettingsSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'JayJef Auto Parts & Supplies' },
    address: { type: String, default: '123 Industrial Ave, Quezon City, Philippines' },
    phone: { type: String, default: '0917 123 4567' },
  },
  schemaOptions
);

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const StockMovement = mongoose.models.StockMovement || mongoose.model('StockMovement', StockMovementSchema);
export const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const ShopSettings = mongoose.models.ShopSettings || mongoose.model('ShopSettings', ShopSettingsSchema);

