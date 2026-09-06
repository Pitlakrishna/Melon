import { prisma } from './db.service';
import { CreateCategoryInput, UpdateCategoryInput } from '../models/category.model';
import { AppError } from '../utils/app-error';

export class CategoryService {
  /**
   * Helper to format slug from category name
   */
  generateSlug(name: string, customSlug?: string): string {
    const raw = customSlug && customSlug.trim() ? customSlug : name;
    return raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Fetch all categories
   */
  async getAllCategories() {
    return prisma.category.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Fetch category by ID
   */
  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category;
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryInput) {
    const cleanName = data.name.trim();
    const cleanSlug = this.generateSlug(cleanName, data.slug);

    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name: cleanName }, { slug: cleanSlug }],
      },
    });

    if (existingCategory) {
      throw new AppError('A category with this name or slug already exists', 409);
    }

    return prisma.category.create({
      data: {
        name: cleanName,
        slug: cleanSlug,
      },
    });
  }

  /**
   * Update existing category
   */
  async updateCategory(id: string, data: UpdateCategoryInput) {
    await this.getCategoryById(id);

    const updateData: any = {};

    if (data.name) {
      const cleanName = data.name.trim();
      updateData.name = cleanName;
      updateData.slug = this.generateSlug(cleanName, data.slug);

      // Check conflict
      const conflict = await prisma.category.findFirst({
        where: {
          OR: [{ name: updateData.name }, { slug: updateData.slug }],
          NOT: { id },
        },
      });

      if (conflict) {
        throw new AppError('A category with this name or slug already exists', 409);
      }
    } else if (data.slug) {
      updateData.slug = this.generateSlug(data.slug);
    }

    return prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete category by ID
   */
  async deleteCategory(id: string) {
    await this.getCategoryById(id);

    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoryService = new CategoryService();
