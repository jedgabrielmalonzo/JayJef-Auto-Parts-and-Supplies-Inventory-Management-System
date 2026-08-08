export const CATEGORIES = [
  'compressor',
  'condenser',
  'evaporator',
  'expansion_valve',
  'hose',
  'seal_kit',
  'refrigerant',
  'dryer_accumulator',
  'blower_motor',
  'other',
];

export function formatCategory(category) {
  return category
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
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

export const ORDER_STATUS_BADGE = {
  draft: 'neutral',
  confirmed: 'neutral',
  fulfilled: 'success',
  cancelled: 'destructive',
};

export const OCR_STATUS_BADGE = {
  pending_review: 'warning',
  confirmed: 'success',
  rejected: 'destructive',
};
