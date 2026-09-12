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

export function extractReceiptDate(rawText) {
  if (!rawText) return null;
  const lines = rawText.split('\n');

  const months = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12'
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Pattern 1: ISO YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (also YY-MM-DD)
    const isoMatch = trimmed.match(/\b(20\d{2}|\d{2})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/);
    if (isoMatch) {
      const y = isoMatch[1].length === 2 ? `20${isoMatch[1]}` : isoMatch[1];
      return `${y}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // Pattern 2: Sep 12 2026 or Sep 12, 26
    const monthWordMatch = trimmed.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+([0-3]?\d)[,.\s]+(20\d{2}|\d{2})\b/i);
    if (monthWordMatch) {
      const m = months[monthWordMatch[1].toLowerCase()];
      const d = monthWordMatch[2].padStart(2, '0');
      const y = monthWordMatch[3].length === 2 ? `20${monthWordMatch[3]}` : monthWordMatch[3];
      return `${y}-${m}-${d}`;
    }

    // Pattern 3: 12 Sep 2026 or 12 Sep 26
    const dayMonthWordMatch = trimmed.match(/\b([0-3]?\d)\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[,.\s]+(20\d{2}|\d{2})\b/i);
    if (dayMonthWordMatch) {
      const d = dayMonthWordMatch[1].padStart(2, '0');
      const m = months[dayMonthWordMatch[2].toLowerCase()];
      const y = dayMonthWordMatch[3].length === 2 ? `20${dayMonthWordMatch[3]}` : dayMonthWordMatch[3];
      return `${y}-${m}-${d}`;
    }

    // Pattern 4: MM/DD/YYYY, MM/DD/YY, DD/MM/YYYY, DD/MM/YY
    const slashMatch = trimmed.match(/\b(0[1-9]|1[0-2]|[1-9])[-/.](0[1-9]|[12]\d|3[01]|[1-9])[-/.](20\d{2}|\d{2})\b/);
    if (slashMatch) {
      const p1 = slashMatch[1].padStart(2, '0');
      const p2 = slashMatch[2].padStart(2, '0');
      const y = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
      if (Number(p1) > 12) {
        return `${y}-${p2}-${p1}`;
      }
      return `${y}-${p1}-${p2}`;
    }
  }

  return null;
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
