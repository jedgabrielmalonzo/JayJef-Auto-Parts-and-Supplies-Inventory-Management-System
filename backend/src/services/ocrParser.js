import { fileURLToPath } from 'url';

// Turns raw OCR text into candidate line items (docs/03#4-parse-into-structured-line-items).
//
// ponytail: regex-based line parsing, not a real receipt-layout model —
// good enough while the OCR microservice itself is a stub (see
// ocr-service/app.py); revisit once PaddleOCR is actually wired in and
// real receipt text/positions are available to parse against.

const TRAILING_NUMBERS = /^(.*\S)\s+(\d+(?:\.\d+)?)\s+[₱$]?(\d+(?:\.\d{1,2})?)\s*$/;
const SINGLE_TRAILING_NUMBER = /^(.*\S)\s+(\d+(?:\.\d{1,2})?)\s*$/;

/**
 * One raw receipt line -> a candidate item. Never throws — an unparseable
 * line just comes back with blank fields rather than a wrong guess
 * (docs/03 error handling: "better to make the staff type a value than to
 * silently commit a wrong one").
 */
export function parseLine(rawText) {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const both = trimmed.match(TRAILING_NUMBERS);
  if (both) {
    return { raw_text: rawText, parsed_name: both[1].trim(), parsed_quantity: Number(both[2]), parsed_price: Number(both[3]) };
  }

  const one = trimmed.match(SINGLE_TRAILING_NUMBER);
  if (one) {
    return { raw_text: rawText, parsed_name: one[1].trim(), parsed_quantity: null, parsed_price: Number(one[2]) };
  }

  return { raw_text: rawText, parsed_name: trimmed, parsed_quantity: null, parsed_price: null };
}

export function parseReceiptText(rawText) {
  if (!rawText) return [];
  return rawText
    .split('\n')
    .map(parseLine)
    .filter(Boolean);
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Best-effort catalog match for a parsed line — word-overlap scoring
 * against product name/sku/brand, no external fuzzy-match dependency.
 * Returns null (not a wrong guess) when nothing scores meaningfully.
 */
export function matchProduct(parsedName, products) {
  if (!parsedName || products.length === 0) return null;

  const needleWords = new Set(normalize(parsedName).split(' ').filter(Boolean));
  if (needleWords.size === 0) return null;

  let best = null;
  let bestScore = 0;

  for (const product of products) {
    const haystack = normalize([product.sku, product.name, product.brand].filter(Boolean).join(' '));
    const haystackWords = new Set(haystack.split(' ').filter(Boolean));
    let overlap = 0;
    for (const word of needleWords) if (haystackWords.has(word)) overlap += 1;
    const score = overlap / needleWords.size;
    if (score > bestScore) {
      bestScore = score;
      best = product;
    }
  }

  return bestScore >= 0.5 ? best : null;
}

function demo() {
  const assert = (cond, msg) => {
    if (!cond) throw new Error(`ocrParser self-check failed: ${msg}`);
  };

  const lines = parseReceiptText('AC Compressor Denso 10PA17C   2   1250.00\nMystery smudge\nRefrigerant R134a 5\n');
  assert(lines.length === 3, `expected 3 lines, got ${lines.length}`);
  assert(lines[0].parsed_name === 'AC Compressor Denso 10PA17C', 'name should exclude trailing qty/price');
  assert(lines[0].parsed_quantity === 2 && lines[0].parsed_price === 1250, 'qty/price should parse from trailing numbers');
  assert(lines[1].parsed_quantity === null && lines[1].parsed_price === null, 'unparseable line should stay blank, not guessed');
  assert(lines[2].parsed_price === 5, 'single trailing number should be treated as price');

  const products = [
    { id: 1, sku: 'CMP-1023', name: 'AC Compressor', brand: 'Denso' },
    { id: 2, sku: 'RFG-500', name: 'Refrigerant R134a', brand: 'Generic' },
  ];
  assert(matchProduct('AC Compressor Denso 10PA17C', products)?.id === 1, 'should match compressor by name+brand overlap');
  assert(matchProduct('Refrigerant R134a', products)?.id === 2, 'should match refrigerant');
  assert(matchProduct('totally unrelated widget', products) === null, 'should not force a match with no overlap');

  console.log('ocrParser self-check passed');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  demo();
}
