import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { createCategorySchema, updateCategorySchema } from '../models/category.model';
import { AppError } from '../utils/app-error';
import { ZodError } from 'zod';

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json({
      status: 'success',
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    res.status(200).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    next(error);
  }
};

export const createCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = createCategorySchema.parse(req.body);
    const category = await categoryService.createCategory(validatedData);

    res.status(201).json({
      status: 'success',
      data: category,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: 'fail',
        message: error.errors[0]?.message || 'Category name is required',
        errors: error.errors,
      });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    if (error.code === 'P2002') {
      res.status(409).json({
        status: 'fail',
        message: 'A category with this name or slug already exists',
      });
      return;
    }
    next(error);
  }
};

export const editCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = (req.params.id || req.body.id) as string;
    if (!id) {
      res.status(400).json({
        status: 'fail',
        message: 'Category ID is required',
      });
      return;
    }

    const validatedData = updateCategorySchema.parse(req.body);
    const category = await categoryService.updateCategory(id, validatedData);

    res.status(200).json({
      status: 'success',
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: 'fail',
        message: error.errors[0]?.message || 'Invalid input data',
        errors: error.errors,
      });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    if (error.code === 'P2002') {
      res.status(409).json({
        status: 'fail',
        message: 'A category with this name or slug already exists',
      });
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({
        status: 'fail',
        message: 'Category not found',
      });
      return;
    }
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        status: 'fail',
        message: 'Category ID is required',
      });
      return;
    }

    await categoryService.deleteCategory(id);

    res.status(200).json({
      status: 'success',
      message: 'Category has been deleted successfully',
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    if (error.code === 'P2025') {
      res.status(404).json({
        status: 'fail',
        message: 'Category not found',
      });
      return;
    }
    next(error);
  }
};
