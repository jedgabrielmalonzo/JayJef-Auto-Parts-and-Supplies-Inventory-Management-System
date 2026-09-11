import { Router } from 'express';
import * as suppliersController from '../controllers/suppliersController.js';

const router = Router();

router.get('/', suppliersController.listSuppliers);
router.get('/:id', suppliersController.getSupplier);
router.get('/:id/products', suppliersController.getSupplierProducts);
router.post('/:id/products', suppliersController.updateSupplierProducts);
router.post('/', suppliersController.createSupplier);
router.put('/:id', suppliersController.updateSupplier);
router.delete('/:id', suppliersController.deleteSupplier);

export default router;

