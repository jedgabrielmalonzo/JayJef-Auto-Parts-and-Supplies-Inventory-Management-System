import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const consoleErrors = [];
page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', (err) => consoleErrors.push(`PAGE ERROR: ${err.message}`));

const routes = [
  ['products', 'http://localhost:5173/products'],
  ['inventory', 'http://localhost:5173/inventory'],
  ['orders', 'http://localhost:5173/orders'],
  ['orders-new', 'http://localhost:5173/orders/new'],
  ['suppliers', 'http://localhost:5173/suppliers'],
  ['suppliers-new', 'http://localhost:5173/suppliers/new'],
  ['ocr', 'http://localhost:5173/ocr'],
  ['ocr-upload', 'http://localhost:5173/ocr/upload'],
  ['map', 'http://localhost:5173/map'],
];

for (const [name, url] of routes) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(name === 'map' ? 1200 : 500);
  await page.screenshot({ path: `C:\\Users\\USER\\.claude\\jobs\\9f989e00\\tmp\\${name}.png` });
}

console.log('--- console errors ---');
console.log(consoleErrors.length ? consoleErrors.join('\n') : '(none)');

await browser.close();
