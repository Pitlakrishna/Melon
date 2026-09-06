import { prisma } from './db.service';
import { CreateBuyerInput, UpdateBuyerInput, BuyerQueryInput } from '../models/buyer.model';
import { AppError } from '../utils/app-error';

export class BuyerService {
  /**
   * Retrieve all buyers with optional search, status filtering, category filtering, and pagination
   */
  async getAllBuyers(query?: BuyerQueryInput) {
    const page = query?.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query?.limit && query.limit > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query?.status) {
      whereClause.status = query.status;
    }

    const categoryFilter = query?.category || query?.categoryId;
    if (categoryFilter && categoryFilter !== 'ALL') {
      whereClause.categoryId = categoryFilter;
    }

    if (query?.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [buyers, total] = await Promise.all([
      (prisma.buyer as any).findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      (prisma.buyer as any).count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      buyers,
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
   * Find a single buyer by ID
   */
  async getBuyerById(id: string) {
    const buyer = await (prisma.buyer as any).findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!buyer) {
      throw new AppError('Buyer not found', 404);
    }

    return buyer;
  }

  /**
   * Create a new buyer
   */
  async createBuyer(data: CreateBuyerInput) {
    const existingBuyer = await prisma.buyer.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingBuyer) {
      throw new AppError('A buyer with this email already exists', 409);
    }

    const categoryId = data.category?.id ? data.category.id.trim() : null;

    return (prisma.buyer as any).create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
        status: data.status || 'ACTIVE',
        categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Update an existing buyer by ID
   */
  async updateBuyer(id: string, data: UpdateBuyerInput) {
    // Check if buyer exists
    await this.getBuyerById(id);

    // If updating email, ensure it's not taken by another buyer
    if (data.email) {
      const existingBuyerWithEmail = await prisma.buyer.findFirst({
        where: {
          email: data.email.toLowerCase().trim(),
          NOT: { id },
        },
      });

      if (existingBuyerWithEmail) {
        throw new AppError('Another buyer with this email already exists', 409);
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.email !== undefined) updateData.email = data.email.toLowerCase().trim();
    if (data.phone !== undefined) updateData.phone = data.phone ? data.phone.trim() : null;
    if (data.address !== undefined) updateData.address = data.address ? data.address.trim() : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.category && data.category.id) {
      updateData.categoryId = data.category.id.trim();
    }

    return (prisma.buyer as any).update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Delete a buyer by ID
   */
  async deleteBuyer(id: string) {
    // Verify existence
    await this.getBuyerById(id);

    return prisma.buyer.delete({
      where: { id },
    });
  }
}

export const buyerService = new BuyerService();
