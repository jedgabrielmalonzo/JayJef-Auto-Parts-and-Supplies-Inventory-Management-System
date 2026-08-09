import { Router } from 'express';
import * as shopLayoutController from '../controllers/shopLayoutController.js';

const router = Router();

router.get('/', shopLayoutController.listCabinets);
router.post('/', shopLayoutController.createCabinet);
router.put('/:id', shopLayoutController.updateCabinet);
router.delete('/:id', shopLayoutController.deleteCabinet);

export default router;
