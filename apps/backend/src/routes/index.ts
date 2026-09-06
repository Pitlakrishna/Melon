import { Router } from 'express';
import categoryRoutes from './category.routes';
import buyerRoutes from './buyer.routes';
import orderRoutes from './order.routes';
import taskRoutes from './task.routes';

const router = Router();

router.use('/categories', categoryRoutes);
router.use('/buyer', buyerRoutes);
router.use('/buyers', buyerRoutes); // Optional plural alias for standard REST conventions
router.use('/orders', orderRoutes);
router.use('/history', orderRoutes); // Alias to support /history endpoint
router.use('/tasks', taskRoutes);

export default router;
