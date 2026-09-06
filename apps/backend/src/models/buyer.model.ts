import { z } from 'zod';

export const BuyerStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);
export type BuyerStatus = z.infer<typeof BuyerStatusEnum>;

export const createBuyerSchema = z.object({
  name: z.string().trim().min(1, 'Buyer name is required'),
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  phone: z.string().trim(),
  address: z.string().trim(),
  category: z.object({ id: z.string(), name: z.string() }),
  status: BuyerStatusEnum.default('ACTIVE'),
});

export const updateBuyerSchema = z.object({
  name: z.string().trim().min(1, 'Buyer name cannot be empty').optional(),
  email: z.string().trim().email('A valid email address is required').toLowerCase().optional(),
  phone: z.string().trim().optional().nullable(),
  category: z.object({ id: z.string(), name: z.string().optional() }).optional(),
  address: z.string().trim().optional().nullable(),
  status: BuyerStatusEnum.optional(),
});

export const buyerQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: BuyerStatusEnum.optional(),
  category: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type CreateBuyerInput = z.infer<typeof createBuyerSchema>;
export type UpdateBuyerInput = z.infer<typeof updateBuyerSchema>;
export type BuyerQueryInput = z.infer<typeof buyerQuerySchema>;

export interface BuyerEntity {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  status: BuyerStatus;
  createdAt: Date;
  updatedAt: Date;
}
