import { Request, Response, NextFunction } from 'express';
import { buyerService } from '../services/buyer.service';
import { createBuyerSchema, updateBuyerSchema, buyerQuerySchema } from '../models/buyer.model';
import { AppError } from '../utils/app-error';
import { ZodError } from 'zod';

export const getBuyers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedQuery = buyerQuerySchema.parse(req.query);
    const { buyers, pagination } = await buyerService.getAllBuyers(validatedQuery);

    res.status(200).json({
      status: 'success',
      results: buyers.length,
      pagination,
      data: buyers,
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

// Support singular alias 'getBuyer' for routes mapping
export const getBuyer = getBuyers;

export const getBuyerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: 'fail', message: 'Buyer ID is required' });
      return;
    }

    const buyer = await buyerService.getBuyerById(id);
    res.status(200).json({
      status: 'success',
      data: buyer,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    next(error);
  }
};

export const createBuyer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = createBuyerSchema.parse(req.body);
    const buyer = await buyerService.createBuyer(validatedData);

    res.status(201).json({
      status: 'success',
      message: 'Buyer created successfully',
      data: buyer,
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

export const editBuyer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      res.status(400).json({ status: 'fail', message: 'Buyer ID is required' });
      return;
    }

    const validatedData = updateBuyerSchema.parse(req.body);
    const updatedBuyer = await buyerService.updateBuyer(id, validatedData);

    res.status(200).json({
      status: 'success',
      message: 'Buyer updated successfully',
      data: updatedBuyer,
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

export const deleteBuyer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: 'fail', message: 'Buyer ID is required' });
      return;
    }

    await buyerService.deleteBuyer(id);

    res.status(200).json({
      status: 'success',
      message: 'Buyer has been deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    next(error);
  }
};
