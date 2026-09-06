import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { createOrderSchema, updateOrderSchema, orderQuerySchema } from '../models/order.model';
import { AppError } from '../utils/app-error';
import { ZodError } from 'zod';

export const getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedQuery = orderQuerySchema.parse(req.query);
    const { orders, summary, pagination } = await orderService.getAllOrders(validatedQuery);

    res.status(200).json({
      status: 'success',
      results: orders.length,
      summary,
      pagination,
      data: orders,
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

export const getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: 'fail', message: 'Order ID is required' });
      return;
    }

    const order = await orderService.getOrderById(id);
    res.status(200).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    next(error);
  }
};

export const getBuyerOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { buyerId } = req.params;
    if (!buyerId) {
      res.status(400).json({ status: 'fail', message: 'Buyer ID is required' });
      return;
    }

    const validatedQuery = orderQuerySchema.parse(req.query);
    const result = await orderService.getOrdersByBuyerId(buyerId, validatedQuery);

    res.status(200).json({
      status: 'success',
      results: result.orders.length,
      summary: result.summary,
      pagination: result.pagination,
      data: result.orders,
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

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    const order = await orderService.createOrder(validatedData);

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: order,
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

export const editOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) {
      res.status(400).json({ status: 'fail', message: 'Order ID is required' });
      return;
    }

    const validatedData = updateOrderSchema.parse(req.body);
    const updatedOrder = await orderService.updateOrder(id, validatedData);

    res.status(200).json({
      status: 'success',
      message: 'Order updated successfully',
      data: updatedOrder,
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

export const deleteOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: 'fail', message: 'Order ID is required' });
      return;
    }

    await orderService.deleteOrder(id);

    res.status(200).json({
      status: 'success',
      message: 'Order deleted successfully',
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

export const getOrderStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await orderService.getOrderStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
