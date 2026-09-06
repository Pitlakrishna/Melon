import { Router } from 'express';
import * as taskController from '../controllers/task.controller';

const router = Router();

router.get('/stats', taskController.getTaskStats);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.patch('/:id/toggle', taskController.toggleTaskStatus);
router.patch('/:id', taskController.editTask);
router.delete('/:id', taskController.deleteTask);

export default router;
