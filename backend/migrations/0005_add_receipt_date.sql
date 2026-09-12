ALTER TABLE ocr_receipts ADD COLUMN IF NOT EXISTS receipt_date date NOT NULL DEFAULT CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_ocr_receipts_receipt_date ON ocr_receipts(receipt_date);
