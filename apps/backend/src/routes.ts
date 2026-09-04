import { Router } from 'express';
import * as categoryController from './controllers/category.controller';

const router = Router();

router.get('/categories', categoryController.getCategories);
router.post('/categories', categoryController.createCategories);
router.patch('/categories/:id', categoryController.editCategories);
router.delete('/categories/:id', categoryController.deleteCategory);

export default router;
