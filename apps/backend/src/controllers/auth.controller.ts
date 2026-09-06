import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../models/auth.model';
import { AppError } from '../utils/app-error';
import { ZodError } from 'zod';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register(validatedData);

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      token: result.token,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: 'fail',
        message: error.errors[0]?.message || 'Validation error',
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

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData);

    res.status(200).json({
      status: 'success',
      message: 'Signed in successfully',
      token: result.token,
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: 'fail',
        message: error.errors[0]?.message || 'Validation error',
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

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Not authenticated' });
      return;
    }

    const user = await authService.getCurrentUser(userId);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ status: error.status, message: error.message });
      return;
    }
    next(error);
  }
};
