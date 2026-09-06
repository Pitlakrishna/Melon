import { z } from 'zod';

/**
 * Category Form Validation Schema (Frontend)
 */
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .min(2, 'Min 2 characters')
    .max(50, 'Max 50 characters')
    .refine((val) => !/^\d+$/.test(val), {
      message: 'Cannot be numbers only',
    }),
});

/**
 * Buyer Form Validation Schema (Frontend)
 */
export const buyerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .min(2, 'Min 2 characters')
    .max(70, 'Max 70 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone is required.')
    .max(10 , "Enter valid number.")
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      const validChars = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
      return digits.length >= 7 && validChars.test(val);
    }, {
      message: 'Enter valid number',
    }),
  address: z
    .string()
    .trim()
    .min(1, 'Address is required')
    .min(5, 'Min 5 characters'),
  categoryId: z
    .string()
    .trim()
    .min(1, 'Category is required'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

/**
 * Buyer Order Validation Schema (Frontend)
 */
export const orderFormSchema = z.object({
  buyerId: z.string().trim().optional(),
  buyerName: z
    .string()
    .trim()
    .min(1, 'Buyer name is required')
    .max(100, 'Buyer name is too long'),
  quantity: z
    .union([z.string(), z.number()])
    .refine((val) => {
      const n = Number(val);
      return !isNaN(n) && Number.isInteger(n) && n >= 1;
    }, { message: 'Quantity must be a positive integer (at least 1)' }),
  amount: z
    .union([z.string(), z.number()])
    .refine((val) => {
      const n = Number(val);
      return !isNaN(n) && n >= 0;
    }, { message: 'Amount must be a valid non-negative number' }),
  description: z
    .string()
    .trim()
    .min(2, 'Description must be at least 2 characters')
    .max(500, 'Description cannot exceed 500 characters'),
  orderDate: z
    .string()
    .trim()
    .min(1, 'Order date is required'),
  status: z.enum(['COMPLETED', 'PENDING', 'CANCELLED']),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;
export type BuyerFormData = z.infer<typeof buyerFormSchema>;
export type OrderFormData = z.infer<typeof orderFormSchema>;

/**
 * Task Validation Schema (Frontend)
 */
export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']),
  dueDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
});

export type TaskFormData = z.infer<typeof taskFormSchema>;

