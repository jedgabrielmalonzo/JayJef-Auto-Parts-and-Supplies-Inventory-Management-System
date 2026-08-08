import { Router } from 'express';
import * as ordersController from '../controllers/ordersController.js';

const router = Router();

router.get('/', ordersController.listOrders);
router.get('/:id', ordersController.getOrder);
router.get('/:id/pdf', ordersController.getOrderPdf);
router.post('/', ordersController.createOrder);
router.put('/:id', ordersController.updateOrder);
router.post('/:id/confirm', ordersController.confirmOrder);
router.post('/:id/fulfill', ordersController.fulfillOrder);
router.post('/:id/cancel', ordersController.cancelOrder);

export default router;
