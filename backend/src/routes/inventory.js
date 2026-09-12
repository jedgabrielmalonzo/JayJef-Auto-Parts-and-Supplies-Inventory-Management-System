import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController.js';

const router = Router();

router.get('/movements', inventoryController.listMovements);
router.post('/movements', inventoryController.createMovement);
router.post('/movements/batch', inventoryController.createBatchMovements);
router.get('/low-stock', inventoryController.lowStock);

export default router;

