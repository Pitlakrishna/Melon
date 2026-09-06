import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  slug: z.string().trim().optional(),
 });

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name cannot be empty').optional(),
  slug: z.string().trim().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export interface CategoryEntity {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}
