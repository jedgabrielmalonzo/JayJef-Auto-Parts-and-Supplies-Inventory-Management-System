import { Router } from 'express';
import * as productsController from '../controllers/productsController.js';
import { uploadProductImage } from '../services/productUploads.js';

const router = Router();

router.get('/', productsController.listProducts);
router.get('/locations', productsController.getProductLocations);
router.get('/:id', productsController.getProduct);
router.get('/:id/purchases', productsController.getProductPurchases);
router.post('/', uploadProductImage.single('image'), productsController.createProduct);
router.put('/:id', uploadProductImage.single('image'), productsController.updateProduct);
router.delete('/:id', productsController.deleteProduct);
router.post('/:id/reactivate', productsController.reactivateProduct);

export default router;
