import { prisma } from './db.service';
import { CreateOrderInput, UpdateOrderInput, OrderQueryInput } from '../models/order.model';
import { AppError } from '../utils/app-error';

export class OrderService {
  /**
   * Retrieve all orders with search, filtering by buyer/status/date, and pagination
   */
  async getAllOrders(query?: Partial<OrderQueryInput>) {
    const page = query?.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query?.limit && query.limit > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query?.buyerId && query.buyerId !== 'ALL') {
      whereClause.buyerId = query.buyerId;
    }

    if (query?.status && query.status !== 'ALL') {
      whereClause.status = query.status;
    }

    if (query?.startDate || query?.endDate) {
      whereClause.orderDate = {};
      if (query.startDate) {
        whereClause.orderDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        whereClause.orderDate.lte = new Date(query.endDate);
      }
    }

    if (query?.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      whereClause.OR = [
        { buyerName: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const completedWhereClause: any = {
      ...whereClause,
      status: 'COMPLETED',
    };

    const [orders, total, completedAggregates, completedCount] = await Promise.all([
      (prisma as any).order.findMany({
        where: whereClause,
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          orderDate: 'desc',
        },
      }),
      (prisma as any).order.count({
        where: whereClause,
      }),
      (prisma as any).order.aggregate({
        where: completedWhereClause,
        _sum: {
          amount: true,
          quantity: true,
        },
      }),
      (prisma as any).order.count({
        where: completedWhereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const totalAmount = completedAggregates?._sum?.amount || 0;
    const totalQuantity = completedAggregates?._sum?.quantity || 0;
    const averageOrderValue = completedCount > 0 ? totalAmount / completedCount : 0;

    return {
      orders,
      summary: {
        totalOrders: total,
        completedOrders: completedCount,
        totalAmount,
        totalQuantity,
        averageOrderValue,
      },
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
   * Find a single order by ID
   */
  async getOrderById(id: string) {
    const order = await (prisma as any).order.findUnique({
      where: { id },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  /**
   * Get orders placed by a specific buyer
   */
  async getOrdersByBuyerId(buyerId: string, query?: Partial<OrderQueryInput>) {
    return this.getAllOrders({
      ...query,
      buyerId,
    });
  }

  /**
   * Create a new buyer order
   */
  async createOrder(data: CreateOrderInput) {
    let buyerName = data.buyerName.trim();
    let buyerId = data.buyerId ? data.buyerId.trim() : null;

    if (buyerId) {
      const buyer = await (prisma as any).buyer.findUnique({
        where: { id: buyerId },
      });
      if (!buyer) {
        throw new AppError('Specified buyer does not exist', 404);
      }
      if (!buyerName) {
        buyerName = buyer.name;
      }
    }

    return (prisma as any).order.create({
      data: {
        buyerId: buyerId || null,
        buyerName,
        quantity: Number(data.quantity),
        amount: Number(data.amount),
        description: data.description.trim(),
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        status: data.status || 'COMPLETED',
      },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });
  }

  /**
   * Update an existing order by ID
   */
  async updateOrder(id: string, data: UpdateOrderInput) {
    await this.getOrderById(id);

    const updateData: any = {};
    if (data.buyerName !== undefined) updateData.buyerName = data.buyerName.trim();
    if (data.quantity !== undefined) updateData.quantity = Number(data.quantity);
    if (data.amount !== undefined) updateData.amount = Number(data.amount);
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.orderDate !== undefined) updateData.orderDate = new Date(data.orderDate);
    if (data.status !== undefined) updateData.status = data.status;

    if (data.buyerId !== undefined) {
      if (data.buyerId) {
        const buyer = await (prisma as any).buyer.findUnique({
          where: { id: data.buyerId.trim() },
        });
        if (!buyer) {
          throw new AppError('Specified buyer does not exist', 404);
        }
        updateData.buyerId = buyer.id;
        if (!data.buyerName) {
          updateData.buyerName = buyer.name;
        }
      } else {
        updateData.buyerId = null;
      }
    }

    return (prisma as any).order.update({
      where: { id },
      data: updateData,
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
    });
  }

  /**
   * Delete an order by ID
   */
  async deleteOrder(id: string) {
    await this.getOrderById(id);

    return (prisma as any).order.delete({
      where: { id },
    });
  }

  /**
   * Get aggregate statistics across all orders
   */
  async getOrderStats() {
    const [totalOrders, completedCount, completedAggregates, statusCounts] = await Promise.all([
      (prisma as any).order.count(),
      (prisma as any).order.count({
        where: { status: 'COMPLETED' },
      }),
      (prisma as any).order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: {
          amount: true,
          quantity: true,
        },
        _avg: {
          amount: true,
        },
      }),
      (prisma as any).order.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      }),
    ]);

    const totalRevenue = completedAggregates?._sum?.amount || 0;
    const totalQuantity = completedAggregates?._sum?.quantity || 0;
    const averageOrderValue = completedCount > 0 ? totalRevenue / completedCount : 0;

    return {
      totalOrders,
      completedOrders: completedCount,
      totalRevenue,
      totalQuantity,
      averageOrderValue,
      statusBreakdown: statusCounts.reduce((acc: any, curr: any) => {
        acc[curr.status] = curr._count.id;
        return acc;
      }, {}),
    };
  }
}

export const orderService = new OrderService();
