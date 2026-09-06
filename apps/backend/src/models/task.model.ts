import { z } from 'zod';

export const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().optional().nullable(),
  status: TaskStatusEnum.default('TODO'),
  priority: TaskPriorityEnum.default('MEDIUM'),
  dueDate: z.coerce.date().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title cannot be empty').max(200).optional(),
  description: z.string().trim().optional().nullable(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  dueDate: z.coerce.date().optional().nullable(),
});

export const taskQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  priority: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;

export interface TaskEntity {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
