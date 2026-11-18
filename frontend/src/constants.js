export const CATEGORIES = [
  'compressor',
  'condenser',
  'evaporator',
  'cabin_filter',
  'expansion_valve',
  'hose',
  'seal_kit',
  'refrigerant',
  'dryer_accumulator',
  'blower_motor',
  'other',
];

export function formatCategory(category) {
  if (!category) return '';
  if (category === 'cabin_filter' || category === 'filter') return 'Cabin Filter';
  if (category === 'dryer_accumulator' || category === 'dryer' || category === 'drier') return 'Drier';
  return category
    .split('_')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ');
}

export const MOVEMENT_REASON_LABELS = {
  initial_stock: 'Initial Stock',
  manual_adjustment: 'Manual Adjustment',
  ocr_restock: 'OCR Restock',
  purchase_order_received: 'Purchase Order Received',
  order_fulfillment: 'Order Fulfillment',
  correction: 'Correction',
};

export function availability(p) {
  if (p.stock_quantity <= 0) return { label: 'Out of stock', variant: 'destructive' };
  if (p.stock_quantity <= p.reorder_threshold) return { label: 'Low stock', variant: 'warning' };
  return { label: 'In stock', variant: 'success' };
}
