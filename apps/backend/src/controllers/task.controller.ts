import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from '../models/task.model';
import { AppError } from '../utils/app-error';
import { ZodError } from 'zod';

export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedQuery = taskQuerySchema.parse(req.query);
    const { tasks, summary, pagination } = await taskService.getAllTasks(validatedQuery);

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      summary,
      pagination,
      data: tasks,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: 'fail',
        message: error.errors[0]?.message || 'Invalid query parameters',
        errors: error.errors,
      });
      return;
    }
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: 'fail', message: 'Task ID is required' });
      return;
    }

    const task = await taskService.getTaskById(id);
    res.status(200).json({
      status: 'success',
      data: task,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = createTaskSchema.parse(req.body);
    const task = await taskService.createTask(validatedData);

    res.status(201).json({
      status: 'success',
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: 'fail',
        message: error.errors[0]?.message || 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    next(error);
  }
};

export const editTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      res.status(400).json({ status: 'fail', message: 'Task ID is required' });
      return;
    }

    const validatedData = updateTaskSchema.parse(req.body);
    const updatedTask = await taskService.updateTask(id, validatedData);

    res.status(200).json({
      status: 'success',
      message: 'Task updated successfully',
      data: updatedTask,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: 'fail',
        message: error.errors[0]?.message || 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    next(error);
  }
};

export const toggleTaskStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: 'fail', message: 'Task ID is required' });
      return;
    }

    const updatedTask = await taskService.toggleTaskStatus(id);

    res.status(200).json({
      status: 'success',
      message: 'Task status updated',
      data: updatedTask,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: 'fail', message: 'Task ID is required' });
      return;
    }

    await taskService.deleteTask(id);

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
      data: null,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    next(error);
  }
};

export const getTaskStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await taskService.getTaskStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
