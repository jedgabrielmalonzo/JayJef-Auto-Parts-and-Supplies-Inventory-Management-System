import { Router } from 'express';
import * as ocrController from '../controllers/ocrController.js';
import { uploadReceiptImage } from '../services/uploads.js';

const router = Router();

router.post('/receipts', uploadReceiptImage.single('image'), ocrController.uploadReceipt);
router.get('/receipts', ocrController.listReceipts);
router.get('/receipts/:id', ocrController.getReceipt);
router.put('/receipts/:id/items', ocrController.updateItems);
router.post('/receipts/:id/confirm', ocrController.confirmReceipt);
router.post('/receipts/:id/reject', ocrController.rejectReceipt);
router.delete('/receipts/:id', ocrController.deleteReceipt);

router.get('/scanner/status', ocrController.getScannerStatus);
router.get('/scanner/events', ocrController.getScannerEvents);
router.post('/scanner/ingest', uploadReceiptImage.single('image'), ocrController.triggerScanSimulation);

export default router;

