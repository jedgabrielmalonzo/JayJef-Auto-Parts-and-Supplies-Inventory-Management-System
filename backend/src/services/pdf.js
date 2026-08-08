import puppeteer from 'puppeteer';
import { fontFaceCss } from './pdfFonts.js';

// Static per docs/04-purchase-order-invoice.md — shop info isn't entered
// per-document.
const SHOP = {
  name: 'JAYJEF AUTO PARTS & SUPPLIES',
  address: 'Shop address on file',
  contact: 'Contact number on file',
};

const DOC_TITLE = { purchase: 'PURCHASE ORDER', sale: 'INVOICE' };

function peso(n) {
  return `₱${Number(n).toFixed(2)}`;
}

function counterparty(order) {
  if (order.type === 'purchase') {
    return {
      label: 'Supplier',
      name: order.supplier_name || order.party_name || '—',
      contact: order.supplier_address || order.supplier_phone || order.party_contact || '',
    };
  }
  return {
    label: 'Customer',
    name: order.party_name || '—',
    contact: order.party_contact || '',
  };
}

function renderOrderHtml(order) {
  const title = DOC_TITLE[order.type];
  const party = counterparty(order);
  const rows = order.items.map((item) => `
    <tr>
      <td class="mono">${item.product_sku}</td>
      <td>${item.product_name}</td>
      <td class="num">${item.quantity} ${item.product_unit}</td>
      <td class="num">${peso(item.unit_price)}</td>
      <td class="num">${peso(item.line_total)}</td>
    </tr>
  `).join('');

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      ${fontFaceCss()}
      * { box-sizing: border-box; }
      body { margin: 0; padding: 40px 48px; font-family: 'Inter', sans-serif; color: #111111; font-size: 13px; }
      .shop-name { font-family: 'Archivo Black', sans-serif; font-size: 22px; letter-spacing: 0.02em; }
      .rule { height: 4px; background: #111111; width: 64px; margin: 8px 0 4px; }
      .shop-meta { color: #3A3A3A; font-size: 11px; margin-top: 4px; }
      .doc-title { font-family: 'Archivo Black', sans-serif; font-size: 20px; text-align: right; }
      .order-number { font-family: 'JetBrains Mono', monospace; font-weight: 500; text-align: right; margin-top: 4px; }
      .letterhead { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
      .meta-row { display: flex; justify-content: space-between; margin-bottom: 24px; }
      .meta-block h3 { font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #6B6B6B; margin: 0 0 6px; }
      .meta-block p { margin: 0; line-height: 1.4; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      thead th { text-align: left; font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #6B6B6B; border-bottom: 1px solid #D1D1D1; padding: 8px 6px; }
      tbody td { padding: 8px 6px; border-bottom: 1px solid #E4E4E4; }
      td.mono { font-family: 'JetBrains Mono', monospace; font-weight: 500; }
      td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
      .totals { margin-top: 16px; margin-left: auto; width: 260px; }
      .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
      .totals-row.total { font-family: 'Archivo Black', sans-serif; font-size: 16px; border-top: 2px solid #111111; margin-top: 4px; padding-top: 10px; }
      .notes { margin-top: 28px; font-size: 12px; color: #3A3A3A; }
      .notes h3 { font-family: 'Archivo', sans-serif; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #6B6B6B; margin: 0 0 6px; }
      .status { display: inline-block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #6B6B6B; margin-top: 2px; }
    </style>
  </head>
  <body>
    <div class="letterhead">
      <div>
        <div class="shop-name">${SHOP.name}</div>
        <div class="rule"></div>
        <div class="shop-meta">${SHOP.address}<br/>${SHOP.contact}</div>
      </div>
      <div>
        <div class="doc-title">${title}</div>
        <div class="order-number">${order.order_number}</div>
        <div class="status" style="text-align:right">${order.status}</div>
      </div>
    </div>

    <div class="meta-row">
      <div class="meta-block">
        <h3>${party.label}</h3>
        <p>${party.name}</p>
        ${party.contact ? `<p>${party.contact}</p>` : ''}
      </div>
      <div class="meta-block" style="text-align:right">
        <h3>Date</h3>
        <p>${new Date(order.order_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>SKU</th>
          <th>Item</th>
          <th class="num">Qty</th>
          <th class="num">Unit Price</th>
          <th class="num">Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Subtotal</span><span>${peso(order.subtotal)}</span></div>
      <div class="totals-row total"><span>Total</span><span>${peso(order.total)}</span></div>
    </div>

    ${order.notes ? `<div class="notes"><h3>Notes</h3><p>${order.notes}</p></div>` : ''}
  </body>
  </html>`;
}

export async function renderOrderPdf(order) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(renderOrderHtml(order), { waitUntil: 'networkidle0' });
    return await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } });
  } finally {
    await browser.close();
  }
}
