import { pool } from './pool.js';

async function seed() {
  console.log('Seeding initial data into Supabase...');

  // 1. Seed Suppliers
  const supplier1 = await pool.query(`
    INSERT INTO suppliers (name, contact_person, email, phone)
    VALUES ('Denso Auto Parts Phils', 'Juan Dela Cruz', 'sales@denso.ph', '09171234567')
    RETURNING id;
  `);

  const supplier2 = await pool.query(`
    INSERT INTO suppliers (name, contact_person, email, phone)
    VALUES ('Sanden Climate Systems', 'Maria Santos', 'contact@sanden.ph', '09189876543')
    RETURNING id;
  `);

  const s1Id = supplier1.rows[0]?.id || 1;
  const s2Id = supplier2.rows[0]?.id || 2;

  // 2. Seed Products
  const products = [
    {
      sku: 'CMP-1023',
      name: 'Denso AC Compressor 10PA17C',
      brand: 'Denso',
      category: 'compressor',
      cost_price: 6200.00,
      selling_price: 7800.00,
      stock_quantity: 14,
      reorder_threshold: 4,
      unit: 'pc',
      supplier_id: s1Id,
    },
    {
      sku: 'RFG-5001',
      name: 'R134a Refrigerant Canister 13.6kg',
      brand: 'Generic',
      category: 'refrigerant',
      cost_price: 2400.00,
      selling_price: 3200.00,
      stock_quantity: 28,
      reorder_threshold: 8,
      unit: 'pc',
      supplier_id: s2Id,
    },
    {
      sku: 'EVP-2040',
      name: 'Sanden Laminated Evaporator Core',
      brand: 'Sanden',
      category: 'evaporator',
      cost_price: 1850.00,
      selling_price: 2450.00,
      stock_quantity: 3, // Low stock!
      reorder_threshold: 5,
      unit: 'pc',
      supplier_id: s2Id,
    },
    {
      sku: 'CND-3010',
      name: 'Parallel Flow AC Condenser Assembly',
      brand: 'Denso',
      category: 'condenser',
      cost_price: 2900.00,
      selling_price: 3850.00,
      stock_quantity: 9,
      reorder_threshold: 3,
      unit: 'pc',
      supplier_id: s1Id,
    },
    {
      sku: 'VAL-8820',
      name: 'Block Type Expansion Valve',
      brand: 'Denso',
      category: 'expansion_valve',
      cost_price: 450.00,
      selling_price: 680.00,
      stock_quantity: 2, // Low stock!
      reorder_threshold: 6,
      unit: 'pc',
      supplier_id: s1Id,
    },
  ];

  for (const p of products) {
    await pool.query(
      `INSERT INTO products 
       (sku, name, brand, category, unit, cost_price, selling_price, stock_quantity, reorder_threshold, supplier_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
       ON CONFLICT (sku) DO UPDATE SET
         stock_quantity = EXCLUDED.stock_quantity,
         selling_price = EXCLUDED.selling_price;`,
      [p.sku, p.name, p.brand, p.category, p.unit, p.cost_price, p.selling_price, p.stock_quantity, p.reorder_threshold, p.supplier_id]
    );
  }

  console.log('Seed completed successfully!');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
