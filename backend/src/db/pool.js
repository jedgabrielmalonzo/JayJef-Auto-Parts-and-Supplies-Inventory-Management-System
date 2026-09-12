import pg from 'pg';
import 'dotenv/config';

// Ensure PostgreSQL DATE (OID 1082) columns are returned as 'YYYY-MM-DD' strings, not Date objects
pg.types.setTypeParser(1082, (val) => val);

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/jayjef_ims';
const isCloud = connectionString?.includes('supabase.com') || connectionString?.includes('pooler.supabase') || process.env.NODE_ENV === 'production';

const realPool = new pg.Pool({
  connectionString,
  ssl: isCloud ? { rejectUnauthorized: false } : false,
});

let isPostgresAvailable = true;

const memStore = {
  users: [
    { id: 1, name: 'JayJef Admin', role: 'admin', created_at: new Date().toISOString() }
  ],
  suppliers: [
    { id: 1, name: 'Denso Auto Parts Ph', contact_person: 'Carlos Mendoza', phone: '0917-555-0192', email: 'sales@denso.ph', address: 'Quezon City', notes: 'Primary OEM supplier', created_at: new Date().toISOString() },
    { id: 2, name: 'Sanden Philippines', contact_person: 'Elena Reyes', phone: '0918-444-8833', email: 'orders@sanden.ph', address: 'Valenzuela City', notes: 'Compressors & Condensers', created_at: new Date().toISOString() }
  ],
  products: [
    { id: 1, sku: 'CMP-10PA17C', name: 'AC Compressor Denso 10PA17C', brand: 'Denso', category: 'compressor', unit: 'pc', cost_price: 12500, selling_price: 16500, stock_quantity: 12, reorder_threshold: 3, supplier_id: 1, is_active: true, created_at: new Date().toISOString() },
    { id: 2, sku: 'RFG-R134A', name: 'Refrigerant Can R134a 13.6kg', brand: 'Generic', category: 'refrigerant', unit: 'can', cost_price: 2800, selling_price: 3600, stock_quantity: 45, reorder_threshold: 10, supplier_id: 2, is_active: true, created_at: new Date().toISOString() }
  ],
  stock_movements: [],
  purchase_orders: [],
  purchase_order_items: [],
  ocr_receipts: [],
  ocr_receipt_items: [],
  schema_migrations: [],
  shop_cabinets: [],
  shop_settings: []
};

let nextIds = {
  users: 2, suppliers: 3, products: 3, stock_movements: 1,
  purchase_orders: 1, purchase_order_items: 1, ocr_receipts: 1, ocr_receipt_items: 1
};

function executeMemQuery(text, params = []) {
  const sql = (text || '').trim();
  const lowerSql = sql.toLowerCase();

  const toCharDate = (d) => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d));
    } catch {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    }
  };

  // OCR Folders query
  if (lowerSql.includes('from ocr_receipts') && lowerSql.includes('group by')) {
    const groups = {};
    for (const r of memStore.ocr_receipts) {
      const dateStr = r.receipt_date || toCharDate(r.created_at);
      if (!groups[dateStr]) {
        groups[dateStr] = { folder_date: dateStr, total_receipts: 0, pending_count: 0, confirmed_count: 0, total_items: 0 };
      }
      groups[dateStr].total_receipts += 1;
      if (r.status === 'pending_review') groups[dateStr].pending_count += 1;
      if (r.status === 'confirmed') groups[dateStr].confirmed_count += 1;
      const itemsCount = memStore.ocr_receipt_items.filter(i => String(i.ocr_receipt_id) === String(r.id)).length;
      groups[dateStr].total_items += itemsCount;
    }
    const rows = Object.values(groups).sort((a, b) => b.folder_date.localeCompare(a.folder_date));
    return { rows, rowCount: rows.length };
  }

  // SELECT ocr_receipts
  if (lowerSql.startsWith('select') && lowerSql.includes('from ocr_receipts')) {
    if (lowerSql.includes('where r.id = $1') || lowerSql.includes('where id = $1')) {
      const receipt = memStore.ocr_receipts.find(r => String(r.id) === String(params[0]));
      if (!receipt) return { rows: [], rowCount: 0 };
      const supplier = memStore.suppliers.find(s => String(s.id) === String(receipt.supplier_id));
      return { rows: [{ ...receipt, supplier_name: supplier?.name || null }], rowCount: 1 };
    }
    if (lowerSql.includes('count(*)::int as total')) {
      return { rows: [{ total: memStore.ocr_receipts.length }], rowCount: 1 };
    }
    let list = [...memStore.ocr_receipts];
    if (params[0] && typeof params[0] === 'string' && ['pending_review', 'confirmed', 'rejected'].includes(params[0])) {
      list = list.filter(r => r.status === params[0]);
    }
    const rows = list.map(r => {
      const supplier = memStore.suppliers.find(s => String(s.id) === String(r.supplier_id));
      const itemCount = memStore.ocr_receipt_items.filter(i => String(i.ocr_receipt_id) === String(r.id)).length;
      return { ...r, supplier_name: supplier?.name || null, item_count: itemCount };
    });
    return { rows, rowCount: rows.length };
  }

  // SELECT ocr_receipt_items
  if (lowerSql.startsWith('select') && lowerSql.includes('from ocr_receipt_items')) {
    if (lowerSql.includes('where i.ocr_receipt_id = $1')) {
      const items = memStore.ocr_receipt_items.filter(i => String(i.ocr_receipt_id) === String(params[0]));
      const rows = items.map(i => {
        const product = memStore.products.find(p => String(p.id) === String(i.matched_product_id));
        return { ...i, matched_product_sku: product?.sku || null, matched_product_name: product?.name || null };
      });
      return { rows, rowCount: rows.length };
    }
  }

  // INSERT INTO ocr_receipts
  if (lowerSql.startsWith('insert into ocr_receipts')) {
    const id = nextIds.ocr_receipts++;
    const now = new Date().toISOString();
    const receiptDate = params[3] || toCharDate(now);
    const newReceipt = {
      id,
      image_path: params[0],
      raw_ocr_json: params[1] || null,
      supplier_id: params[2] || null,
      receipt_date: receiptDate,
      status: 'pending_review',
      confirmed_by: null,
      created_at: now,
      confirmed_at: null
    };
    memStore.ocr_receipts.push(newReceipt);
    return { rows: [newReceipt], rowCount: 1 };
  }

  // INSERT INTO ocr_receipt_items
  if (lowerSql.startsWith('insert into ocr_receipt_items')) {
    const id = nextIds.ocr_receipt_items++;
    const newItem = {
      id,
      ocr_receipt_id: params[0],
      raw_text: params[1] || null,
      parsed_name: params[2] || null,
      parsed_quantity: params[3] || null,
      parsed_price: params[4] || null,
      matched_product_id: params[5] || null,
      is_confirmed: params[6] ?? false
    };
    memStore.ocr_receipt_items.push(newItem);
    return { rows: [newItem], rowCount: 1 };
  }

  // UPDATE ocr_receipts
  if (lowerSql.startsWith('update ocr_receipts')) {
    const receiptId = params[params.length - 1];
    const receipt = memStore.ocr_receipts.find(r => String(r.id) === String(receiptId));
    if (receipt) {
      if (params[0]) receipt.status = params[0];
      if (params[1]) receipt.confirmed_by = params[1];
      if (receipt.status === 'confirmed') receipt.confirmed_at = new Date().toISOString();
      return { rows: [receipt], rowCount: 1 };
    }
  }

  // DELETE ocr_receipt_items / ocr_receipts
  if (lowerSql.startsWith('delete from ocr_receipt_items')) {
    memStore.ocr_receipt_items = memStore.ocr_receipt_items.filter(i => String(i.ocr_receipt_id) !== String(params[0]));
    return { rows: [], rowCount: 1 };
  }
  if (lowerSql.startsWith('delete from ocr_receipts')) {
    const deleted = memStore.ocr_receipts.find(r => String(r.id) === String(params[0]));
    memStore.ocr_receipts = memStore.ocr_receipts.filter(r => String(r.id) !== String(params[0]));
    return { rows: deleted ? [deleted] : [], rowCount: deleted ? 1 : 0 };
  }

  // SELECT suppliers
  if (lowerSql.startsWith('select') && lowerSql.includes('from suppliers')) {
    if (lowerSql.includes('count(*)::int as total')) {
      return { rows: [{ total: memStore.suppliers.length }], rowCount: 1 };
    }
    const rows = memStore.suppliers.map(s => {
      const pCount = memStore.products.filter(p => String(p.supplier_id) === String(s.id)).length;
      return { ...s, product_count: pCount };
    });
    return { rows, rowCount: rows.length };
  }

  // SELECT products
  if (lowerSql.startsWith('select') && lowerSql.includes('from products')) {
    if (lowerSql.includes('count(*)::int as total')) {
      return { rows: [{ total: memStore.products.length }], rowCount: 1 };
    }
    return { rows: [...memStore.products], rowCount: memStore.products.length };
  }

  return { rows: [], rowCount: 0 };
}

class MemClient {
  async query(text, params) {
    return executeMemQuery(text, params);
  }
  release() {}
}

export const pool = {
  async query(text, params) {
    if (!isPostgresAvailable) {
      return executeMemQuery(text, params);
    }
    try {
      return await realPool.query(text, params);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        console.warn('⚡ Local PostgreSQL unavailable. Switching seamlessly to In-Memory DB Store.');
        isPostgresAvailable = false;
        return executeMemQuery(text, params);
      }
      throw err;
    }
  },
  async connect() {
    if (!isPostgresAvailable) {
      return new MemClient();
    }
    try {
      return await realPool.connect();
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        console.warn('⚡ Local PostgreSQL unavailable. Switching seamlessly to In-Memory DB Client.');
        isPostgresAvailable = false;
        return new MemClient();
      }
      throw err;
    }
  },
  end() {
    return realPool.end();
  }
};
