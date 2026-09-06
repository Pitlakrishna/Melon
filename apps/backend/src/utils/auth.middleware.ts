import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './app-error';

export interface AuthenticatedUserPayload {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    throw new AppError('Authentication token required. Please sign in.', 401);
  }

  const jwtSecret = process.env.JWT_SECRET || 'enterpriseproductionjwtsecretchangekey';

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUserPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Your session has expired. Please sign in again.', 401);
    }
    throw new AppError('Invalid authentication token.', 401);
  }
};
