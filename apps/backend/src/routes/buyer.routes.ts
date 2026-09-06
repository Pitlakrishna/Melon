import { Router } from 'express';
import * as buyerController from '../controllers/buyer.Controller';
import * as orderController from '../controllers/order.controller';

const router = Router();

router.get('/', buyerController.getBuyers);
router.get('/:id', buyerController.getBuyerById);
router.get('/:buyerId/orders', orderController.getBuyerOrders);
router.post('/', buyerController.createBuyer);
router.patch('/:id', buyerController.editBuyer);
router.delete('/:id', buyerController.deleteBuyer);

export default router;
