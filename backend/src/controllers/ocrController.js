import * as ocrReceiptModel from '../models/ocrReceiptModel.js';
import { NoConfirmedItemsError } from '../models/ocrReceiptModel.js';
import * as productModel from '../models/productModel.js';
import { requestOcrParse, OcrServiceUnavailableError } from '../services/ocrClient.js';
import { parseReceiptText, matchProduct } from '../services/ocrParser.js';

export async function uploadReceipt(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing required file', fields: { image: 'required' } });
    }
    const imagePath = `/uploads/receipts/${req.file.filename}`;
    const supplierId = req.body.supplier_id || null;

    let ocrResult;
    try {
      ocrResult = await requestOcrParse(req.file.path);
    } catch (err) {
      if (err instanceof OcrServiceUnavailableError) {
        // docs/03 error handling: image stays saved, receipt opens with zero
        // items and a prominent "add item manually" path — never a dead end.
        const receipt = await ocrReceiptModel.create({ imagePath, rawOcrJson: null, supplierId, items: [] });
        return res.status(201).json({ ...receipt, ocr_warning: err.message });
      }
      throw err;
    }

    const candidateLines = parseReceiptText(ocrResult.raw_text);
    const { items: catalog } = await productModel.list({ isActive: true, pageSize: 10000 });
    const items = candidateLines.map((line) => ({
      ...line,
      matched_product_id: matchProduct(line.parsed_name, catalog)?.id ?? null,
    }));

    const receipt = await ocrReceiptModel.create({ imagePath, rawOcrJson: ocrResult, supplierId, items });
    res.status(201).json(receipt);
  } catch (err) {
    next(err);
  }
}

export async function listReceipts(req, res, next) {
  try {
    const { status, page, page_size } = req.query;
    res.json(await ocrReceiptModel.list({
      status,
      page: page ? Number(page) : 1,
      pageSize: page_size ? Number(page_size) : 25,
    }));
  } catch (err) {
    next(err);
  }
}

export async function getReceipt(req, res, next) {
  try {
    const receipt = await ocrReceiptModel.findById(req.params.id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    res.json(receipt);
  } catch (err) {
    next(err);
  }
}

export async function updateItems(req, res, next) {
  try {
    const existing = await ocrReceiptModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Receipt not found' });
    if (existing.status !== 'pending_review') {
      return res.status(409).json({ error: `Only a pending_review receipt's items can be edited (current status: ${existing.status})` });
    }
    if (!Array.isArray(req.body.items)) {
      return res.status(400).json({ error: 'Invalid request', fields: { items: 'required array' } });
    }
    const receipt = await ocrReceiptModel.upsertItems(req.params.id, req.body.items);
    res.json(receipt.items);
  } catch (err) {
    next(err);
  }
}

export async function confirmReceipt(req, res, next) {
  try {
    const receipt = await ocrReceiptModel.confirm(req.params.id, req.body.user_id);
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    res.json(receipt);
  } catch (err) {
    if (err instanceof NoConfirmedItemsError) return res.status(400).json({ error: err.message });
    if (err.message?.startsWith('Only a pending_review')) return res.status(409).json({ error: err.message });
    next(err);
  }
}

export async function rejectReceipt(req, res, next) {
  try {
    const existing = await ocrReceiptModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Receipt not found' });
    if (existing.status !== 'pending_review') {
      return res.status(409).json({ error: `Only a pending_review receipt can be rejected (current status: ${existing.status})` });
    }
    res.json(await ocrReceiptModel.setStatus(req.params.id, 'rejected'));
  } catch (err) {
    next(err);
  }
}
