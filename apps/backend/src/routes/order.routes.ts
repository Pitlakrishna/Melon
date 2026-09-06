import { Router } from 'express';
import * as orderController from '../controllers/order.controller';

const router = Router();

router.get('/stats', orderController.getOrderStats);
router.get('/buyer/:buyerId', orderController.getBuyerOrders);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.patch('/:id', orderController.editOrder);
router.delete('/:id', orderController.deleteOrder);

export default router;
