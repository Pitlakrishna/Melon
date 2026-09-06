import { z } from 'zod';

export const OrderStatusEnum = z.enum(['COMPLETED', 'PENDING', 'CANCELLED']);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const createOrderSchema = z.object({
  buyerId: z.string().trim().optional().nullable(),
  buyerName: z.string().trim().min(1, 'Buyer name is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  amount: z.coerce.number().min(0, 'Amount must be a non-negative value'),
  description: z.string().trim().min(1, 'Description is required'),
  orderDate: z.coerce.date().optional().default(() => new Date()),
  status: OrderStatusEnum.default('COMPLETED'),
});

export const updateOrderSchema = z.object({
  buyerId: z.string().trim().optional().nullable(),
  buyerName: z.string().trim().min(1, 'Buyer name cannot be empty').optional(),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').optional(),
  amount: z.coerce.number().min(0, 'Amount must be non-negative').optional(),
  description: z.string().trim().min(1, 'Description cannot be empty').optional(),
  orderDate: z.coerce.date().optional(),
  status: OrderStatusEnum.optional(),
});

export const orderQuerySchema = z.object({
  search: z.string().trim().optional(),
  buyerId: z.string().trim().optional(),
  status: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;

export interface OrderEntity {
  id: string;
  buyerId?: string | null;
  buyerName: string;
  quantity: number;
  amount: number;
  description: string;
  orderDate: Date;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  buyer?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  } | null;
}
