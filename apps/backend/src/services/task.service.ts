import { prisma } from './db.service';
import { CreateTaskInput, UpdateTaskInput, TaskQueryInput } from '../models/task.model';
import { AppError } from '../utils/app-error';

export class TaskService {
  /**
   * Retrieve all tasks with search, status/priority filtering, and pagination
   */
  async getAllTasks(query?: Partial<TaskQueryInput>) {
    const page = query?.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query?.limit && query.limit > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query?.status && query.status !== 'ALL') {
      whereClause.status = query.status;
    }

    if (query?.priority && query.priority !== 'ALL') {
      whereClause.priority = query.priority;
    }

    if (query?.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [tasks, total, statusCounts, priorityCounts] = await Promise.all([
      (prisma as any).task.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [
          { status: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      (prisma as any).task.count({
        where: whereClause,
      }),
      (prisma as any).task.groupBy({
        where: whereClause,
        by: ['status'],
        _count: { id: true },
      }),
      (prisma as any).task.groupBy({
        where: whereClause,
        by: ['priority'],
        _count: { id: true },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const summary = {
      totalTasks: total,
      completedTasks: statusCounts.find((s: any) => s.status === 'COMPLETED')?._count.id || 0,
      inProgressTasks: statusCounts.find((s: any) => s.status === 'IN_PROGRESS')?._count.id || 0,
      todoTasks: statusCounts.find((s: any) => s.status === 'TODO')?._count.id || 0,
      urgentTasks: priorityCounts.find((p: any) => p.priority === 'URGENT')?._count.id || 0,
    };

    return {
      tasks,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Find a single task by ID
   */
  async getTaskById(id: string) {
    const task = await (prisma as any).task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    return task;
  }

  /**
   * Create a new task
   */
  async createTask(data: CreateTaskInput) {
    return (prisma as any).task.create({
      data: {
        title: data.title.trim(),
        description: data.description ? data.description.trim() : null,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
    });
  }

  /**
   * Update an existing task
   */
  async updateTask(id: string, data: UpdateTaskInput) {
    await this.getTaskById(id);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

    return (prisma as any).task.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Toggle task completion status
   */
  async toggleTaskStatus(id: string) {
    const task = await this.getTaskById(id);
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';

    return (prisma as any).task.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string) {
    await this.getTaskById(id);

    return (prisma as any).task.delete({
      where: { id },
    });
  }

  /**
   * Get overall task statistics
   */
  async getTaskStats() {
    const [totalTasks, statusCounts, priorityCounts] = await Promise.all([
      (prisma as any).task.count(),
      (prisma as any).task.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      (prisma as any).task.groupBy({
        by: ['priority'],
        _count: { id: true },
      }),
    ]);

    return {
      totalTasks,
      statusBreakdown: statusCounts.reduce((acc: any, curr: any) => {
        acc[curr.status] = curr._count.id;
        return acc;
      }, {}),
      priorityBreakdown: priorityCounts.reduce((acc: any, curr: any) => {
        acc[curr.priority] = curr._count.id;
        return acc;
      }, {}),
    };
  }
}

export const taskService = new TaskService();
