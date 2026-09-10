import { pool } from '../db/pool.js';

/**
 * AI Assistant Service for JayJef Inventory Management System.
 * Strictly grounded in real-time Supabase PostgreSQL database data to prevent hallucinations.
 * Provides accurate stock status, availability, prices, and low stock alerts.
 */

// Stopwords used to clean conversational filler words from user search queries
const STOP_WORDS = new Set([
  'status', 'details', 'detail', 'info', 'information', 'check', 'count', 'inventory',
  'quantity', 'qty', 'where', 'is', 'are', 'the', 'in', 'stock', 'available', 'availability',
  'price', 'prices', 'cost', 'costs', 'how', 'much', 'does', 'what', 'show', 'me', 'find',
  'any', 'for', 'with', 'of', 'a', 'an', 'tell', 'about', 'item', 'items', 'product',
  'products', 'parts', 'part', 'give', 'can', 'you', 'search', 'lookup', 'please', 'current',
  'state', 'get', 'list', 'all', 'do', 'we', 'have', 'there'
]);

export async function processChatQuery(userMessage) {
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    return {
      reply: 'Hello! I am your JayJef Inventory Assistant. You can ask me about stock availability, product status, prices, or specific SKUs.',
      products: [],
    };
  }

  const queryRaw = userMessage.trim();
  const queryLower = queryRaw.toLowerCase();

  // Guard Rail 1: Out-of-Domain / Non-Inventory Query Filter
  if (
    queryLower.includes('recipe') ||
    queryLower.includes('weather') ||
    queryLower.includes('movie') ||
    queryLower.includes('song') ||
    queryLower.includes('who is') ||
    queryLower.includes('capital of')
  ) {
    return {
      reply: 'I am the JayJef Inventory Assistant. I am specialized only in auto parts inventory, stock levels, pricing, SKUs, and suppliers.',
      products: [],
    };
  }

  // 1. Low Stock / Reorder Query Handler
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
       WHERE p.stock_quantity <= p.reorder_threshold AND p.is_active = true
       ORDER BY p.stock_quantity ASC 
       LIMIT 10`
    );

    if (rows.length === 0) {
      return {
        reply: '✅ Great news! All auto parts are currently well-stocked above their reorder thresholds.',
        products: [],
      };
    }

    return {
      reply: `⚠️ Found ${rows.length} product(s) running low on stock or requiring reorder:`,
      products: rows.map(formatProduct),
    };
  }

  // 2. Budget / Price Threshold Handler (e.g. "under 1000", "cheapest")
  if (
    queryLower.includes('low cost') ||
    queryLower.includes('cheapest') ||
    queryLower.includes('affordable') ||
    queryLower.includes('under') ||
    queryLower.includes('below') ||
    queryLower.includes('cheap')
  ) {
    const matchPrice = queryLower.match(/(?:under|below|less than|max)\s*₱?\s*(\d+(?:\.\d+)?)/);
    let maxPrice = matchPrice ? parseFloat(matchPrice[1]) : null;

    let sql = `SELECT p.*, s.name as supplier_name FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id WHERE p.is_active = true`;
    let params = [];

    if (maxPrice) {
      sql += ` AND p.selling_price <= $1 ORDER BY p.selling_price ASC LIMIT 10`;
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

  // 3. Extract Core Search Keywords by Removing Stopwords
  const rawWords = queryLower
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const searchTerms = rawWords.filter((w) => !STOP_WORDS.has(w) && w.length >= 2);

  if (searchTerms.length > 0) {
    // Attempt 1: Strict AND search across all search terms
    let rows = await executeProductSearch(searchTerms, 'AND');

    // Attempt 2: Fallback to OR search if strict AND returns 0 rows
    if (rows.length === 0 && searchTerms.length > 1) {
      rows = await executeProductSearch(searchTerms, 'OR');
    }

    if (rows.length > 0) {
      const formattedProducts = rows.map(formatProduct);

      // If single specific product matched, generate detailed natural language status summary
      if (rows.length === 1) {
        const p = rows[0];
        const stockStatus = p.stock_quantity <= p.reorder_threshold ? '⚠️ LOW STOCK' : '✅ IN STOCK';
        const formattedPrice = `₱${Number(p.selling_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        const supplierText = p.supplier_name ? ` (Supplier: ${p.supplier_name})` : '';

        return {
          reply: `Here is the current database status for **${p.name}** (SKU: **${p.sku}**):\n\n• **Stock Level**: ${stockStatus} — **${p.stock_quantity} ${p.unit || 'pc'}** available\n• **Selling Price**: ${formattedPrice}\n• **Reorder Threshold**: ${p.reorder_threshold} ${p.unit || 'pc'}\n• **Category / Brand**: ${p.category} • ${p.brand || 'N/A'}${supplierText}`,
          products: formattedProducts,
        };
      }

      return {
        reply: `Found ${rows.length} product(s) matching your query in the inventory database:`,
        products: formattedProducts,
      };
    } else {
      // Guard Rail 2: Strict No-Hallucination Fallback
      return {
        reply: `I searched the live database for "${searchTerms.join(' ')}", but no matching product was found in your catalog.\n\nPlease check the SKU or product name.`,
        products: [],
      };
    }
  }

  // Fallback: Default Helpful Response
  const { rows } = await pool.query(
    `SELECT p.*, s.name as supplier_name FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id WHERE p.is_active = true ORDER BY p.updated_at DESC LIMIT 5`
  );

  return {
    reply: `I couldn't identify specific auto part keywords in your message. Here are recently updated items in inventory, or ask me:\n\n• "Status of Denso Compressor"\n• "Show low stock items"\n• "Parts under ₱1000"`,
    products: rows.map(formatProduct),
  };
}

async function executeProductSearch(searchTerms, operator = 'AND') {
  let sql = `
    SELECT p.*, s.name as supplier_name 
    FROM products p 
    LEFT JOIN suppliers s ON p.supplier_id = s.id 
    WHERE p.is_active = true AND (
  `;

  let conditions = [];
  let params = [];

  searchTerms.forEach((term, i) => {
    params.push(`%${term}%`);
    const idx = `$${i + 1}`;
    conditions.push(`(
      LOWER(p.name) LIKE ${idx} OR 
      LOWER(p.sku) LIKE ${idx} OR 
      LOWER(p.brand) LIKE ${idx} OR 
      LOWER(p.category) LIKE ${idx} OR
      LOWER(COALESCE(p.notes, '')) LIKE ${idx}
    )`);
  });

  sql += conditions.join(` ${operator} `) + `) ORDER BY p.stock_quantity DESC LIMIT 10`;

  const { rows } = await pool.query(sql, params);
  return rows;
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
