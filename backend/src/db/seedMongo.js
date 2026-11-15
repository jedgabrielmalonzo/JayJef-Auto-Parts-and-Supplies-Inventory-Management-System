import { connectMongo, mongoose } from './mongo.js';
import { Product, StockMovement, Supplier, User, ShopSettings } from './schemas.js';

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await connectMongo();

    console.log('Clearing existing collections...');
    await Promise.all([
      Product.deleteMany({}),
      StockMovement.deleteMany({}),
      Supplier.deleteMany({}),
      User.deleteMany({}),
      ShopSettings.deleteMany({}),
    ]);

    console.log('Seeding Shop Settings...');
    await ShopSettings.create({
      name: 'JayJef Auto Parts & Supplies',
      address: '123 Industrial Ave, Quezon City, Philippines',
      phone: '0917 123 4567',
    });

    console.log('Seeding Admin User...');
    const adminUser = await User.create({
      name: 'JayJef System Admin',
      role: 'admin',
    });

    console.log('Seeding Suppliers...');
    const suppliers = await Supplier.create([
      {
        name: 'Denso Auto Parts Ph',
        contact_person: 'Carlos Mendoza',
        phone: '0917-555-0192',
        email: 'sales@denso.ph',
        address: 'Quezon City',
        notes: 'Primary OEM supplier',
      },
      {
        name: 'Sanden Philippines',
        contact_person: 'Elena Reyes',
        phone: '0918-444-8833',
        email: 'orders@sanden.ph',
        address: 'Valenzuela City',
        notes: 'Compressors & Condensers',
      },
    ]);

    console.log('Seeding Products...');
    const productsData = [
      {
        sku: 'CMP-10PA17C',
        name: 'AC Compressor Denso 10PA17C',
        brand: 'Denso',
        category: 'compressor',
        compatible_vehicles: 'Toyota Vios 2013-2018, Innova 2.5 D4D',
        unit: 'pc',
        cost_price: 12500,
        selling_price: 16500,
        stock_quantity: 20,
        reorder_threshold: 3,
        supplier_id: suppliers[0]._id.toString(),
        notes: 'Top seller for commercial fleet aircon servicing.',
        is_active: true,
      },
      {
        sku: 'RFG-R134A',
        name: 'Refrigerant Can R134a 13.6kg',
        brand: 'Generic',
        category: 'refrigerant',
        compatible_vehicles: 'Universal R134a AC Systems',
        unit: 'can',
        cost_price: 2800,
        selling_price: 3600,
        stock_quantity: 19,
        reorder_threshold: 10,
        supplier_id: suppliers[1]._id.toString(),
        notes: 'High-purity refrigerant cylinder.',
        is_active: true,
      },
      {
        sku: 'CND-COR-001',
        name: 'Aluminum AC Condenser Corolla Altis',
        brand: 'Denso',
        category: 'condenser',
        compatible_vehicles: 'Toyota Corolla Altis 2008-2019',
        unit: 'pc',
        cost_price: 4200,
        selling_price: 5800,
        stock_quantity: 8,
        reorder_threshold: 2,
        supplier_id: suppliers[0]._id.toString(),
        notes: 'Parallel flow high efficiency condenser core.',
        is_active: true,
      },
      {
        sku: 'EVP-INNOVA',
        name: 'Evaporator Core Innova/Fortuner Front',
        brand: 'CoolGear',
        category: 'evaporator',
        compatible_vehicles: 'Toyota Innova, Fortuner, Hilux 2005-2015',
        unit: 'pc',
        cost_price: 3400,
        selling_price: 4700,
        stock_quantity: 12,
        reorder_threshold: 3,
        supplier_id: suppliers[0]._id.toString(),
        notes: 'Multi-tank micro-channel cooling core.',
        is_active: true,
      },
      {
        sku: 'EXV-BLK-01',
        name: 'Block Type Expansion Valve Fujikoki',
        brand: 'Fujikoki',
        category: 'expansion_valve',
        compatible_vehicles: 'Toyota, Honda, Nissan common models',
        unit: 'pc',
        cost_price: 850,
        selling_price: 1250,
        stock_quantity: 25,
        reorder_threshold: 5,
        supplier_id: suppliers[1]._id.toString(),
        notes: 'Precision thermal expansion valve.',
        is_active: true,
      },
      {
        sku: 'FLT-CAB-002',
        name: 'Activated Carbon Cabin Filter',
        brand: 'Bosch',
        category: 'other',
        compatible_vehicles: 'Mitsubishi Mirage G4, Xpander',
        unit: 'pc',
        cost_price: 380,
        selling_price: 650,
        stock_quantity: 30,
        reorder_threshold: 8,
        supplier_id: suppliers[0]._id.toString(),
        notes: 'Odor and particulate anti-allergen filter.',
        is_active: true,
      },
    ];

    const createdProducts = await Product.create(productsData);

    console.log('Seeding Stock Movements...');
    for (const prod of createdProducts) {
      await StockMovement.create({
        product_id: prod._id,
        user_id: adminUser._id,
        quantity_change: prod.stock_quantity,
        reason: 'initial_stock',
        quantity_before: 0,
        quantity_after: prod.stock_quantity,
        note: 'Opening stock balance initialized on migration to MongoDB',
      });
    }

    console.log('MongoDB Atlas Database successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();

