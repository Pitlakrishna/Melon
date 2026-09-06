import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', categoryController.createCategories);
router.patch('/:id', categoryController.editCategories);
router.delete('/:id', categoryController.deleteCategory);

export default router;
