import { pool } from '../db/pool.js';

/**
 * AI Assistant Service for JayJef Inventory Management System.
 * Answers natural language queries regarding product availability,
 * low stock alerts, pricing/costs, and product updates.
 */
export async function processChatQuery(userMessage) {
  if (!userMessage || typeof userMessage !== 'string') {
    return {
      reply: 'Hello! I am your JayJef Inventory Assistant. You can ask me about product availability, low stock items, prices, or specific SKUs.',
      products: [],
    };
  }

  const queryLower = userMessage.toLowerCase().trim();

  // 1. Low stock / reorder query
  if (
    queryLower.includes('low stock') ||
    queryLower.includes('reorder') ||
    queryLower.includes('running low') ||
    queryLower.includes('out of stock') ||
    queryLower.includes('need stock')
  ) {
    const { rows } = await pool.query(
      `SELECT p.*, s.name as supplier_name 
       FROM products p 
       LEFT JOIN suppliers s ON p.supplier_id = s.id 
       WHERE p.stock_quantity <= p.reorder_threshold 
       ORDER BY p.stock_quantity ASC 
       LIMIT 10`
    );

    if (rows.length === 0) {
      return {
        reply: 'Great news! All products are currently well-stocked above their reorder thresholds.',
        products: [],
      };
    }

    return {
      reply: `Found ${rows.length} item(s) running low on stock or below their reorder threshold:`,
      products: rows.map(formatProduct),
    };
  }

  // 2. Low cost / cheapest / budget parts query
  if (
    queryLower.includes('low cost') ||
    queryLower.includes('cheapest') ||
    queryLower.includes('affordable') ||
    queryLower.includes('under') ||
    queryLower.includes('cheap')
  ) {
    // Extract potential max price number (e.g. "under 1000")
    const matchPrice = queryLower.match(/(?:under|below|less than|max)\s*₱?\s*(\d+(?:\.\d+)?)/);
    let maxPrice = matchPrice ? parseFloat(matchPrice[1]) : null;

    let sql = `SELECT p.*, s.name as supplier_name FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id`;
    let params = [];

    if (maxPrice) {
      sql += ` WHERE p.selling_price <= $1 ORDER BY p.selling_price ASC LIMIT 10`;
      params.push(maxPrice);
    } else {
      sql += ` ORDER BY p.selling_price ASC LIMIT 8`;
    }

    const { rows } = await pool.query(sql, params);

    return {
      reply: maxPrice
        ? `Here are auto parts priced under ₱${maxPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}:`
        : `Here are our lowest cost products currently in stock:`,
      products: rows.map(formatProduct),
    };
  }

  // 3. Category search (e.g. "compressors", "refrigerant", "filter", "hoses", "o-rings")
  const categories = ['compressor', 'refrigerant', 'condenser', 'evaporator', 'filter', 'valve', 'oil', 'hose', 'fan'];
  const matchedCategory = categories.find((c) => queryLower.includes(c));

  // 4. Product Search by Name / SKU / Brand
  const searchTerms = queryLower
    .replace(/(?:is|are|the|in|stock|available|price|how|much|does|cost|what|show|me|find|any|for|with|of|a)/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (searchTerms.length > 0 || matchedCategory) {
    let sql = `
      SELECT p.*, s.name as supplier_name 
      FROM products p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id 
      WHERE 1=1
    `;
    let params = [];
    let paramIndex = 1;

    if (matchedCategory) {
      sql += ` AND (LOWER(p.category) LIKE $${paramIndex} OR LOWER(p.name) LIKE $${paramIndex})`;
      params.push(`%${matchedCategory}%`);
      paramIndex++;
    }

    for (const term of searchTerms) {
      if (term !== matchedCategory) {
        sql += ` AND (LOWER(p.name) LIKE $${paramIndex} OR LOWER(p.sku) LIKE $${paramIndex} OR LOWER(p.brand) LIKE $${paramIndex} OR LOWER(p.description) LIKE $${paramIndex})`;
        params.push(`%${term}%`);
        paramIndex++;
      }
    }

    sql += ` ORDER BY p.name ASC LIMIT 10`;

    const { rows } = await pool.query(sql, params);

    if (rows.length > 0) {
      return {
        reply: `Found ${rows.length} product(s) matching your inquiry:`,
        products: rows.map(formatProduct),
      };
    }
  }

  // Fallback: Return top active products & helpful suggestions
  const { rows } = await pool.query(
    `SELECT p.*, s.name as supplier_name FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id ORDER BY p.updated_at DESC LIMIT 5`
  );

  return {
    reply: `I searched for "${userMessage}", but couldn't find an exact match. Here are recently updated parts in inventory, or you can try asking:
• "Show low stock items"
• "Which products cost under ₱1000?"
• "Is Denso Compressor in stock?"`,
    products: rows.map(formatProduct),
  };
}

function formatProduct(p) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    brand: p.brand,
    category: p.category,
    cost_price: Number(p.cost_price || 0),
    selling_price: Number(p.selling_price || 0),
    stock_quantity: Number(p.stock_quantity || 0),
    reorder_threshold: Number(p.reorder_threshold || 0),
    unit: p.unit || 'pcs',
    location: p.cabinet_location || 'Unassigned',
    supplier_name: p.supplier_name || 'N/A',
    is_low_stock: p.stock_quantity <= p.reorder_threshold,
  };
}
