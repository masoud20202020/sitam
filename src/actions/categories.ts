'use server';

import { prisma } from '@/lib/prisma';
import { Category } from '@/data/categories';
import { revalidatePath } from 'next/cache';

export async function getCategoriesAction(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || undefined,
      parentId: c.parentId || null,
      icon: c.icon || undefined,
      isActive: c.isActive,
      isPopular: c.isPopular,
    }));
  } catch (error) {
    console.error('Error fetching categories from DB:', error);
    return [];
  }
}

export async function createCategoryAction(data: {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | number | null;
  icon?: string;
  isActive: boolean;
  isPopular: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description,
        parentId: data.parentId ? String(data.parentId) : null, // Schema has parentId as String?
        icon: data.icon,
        isActive: data.isActive,
        isPopular: data.isPopular,
      },
    });

    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/admin/categories');
    return { success: true, id: category.id };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateCategoryAction(
  id: string | number,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    parentId?: string | number | null;
    icon?: string;
    isActive?: boolean;
    isPopular?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.category.update({
      where: { id: String(id) },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        parentId: data.parentId ? String(data.parentId) : (data.parentId === null ? null : undefined),
        icon: data.icon,
        isActive: data.isActive,
        isPopular: data.isPopular,
      },
    });

    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteCategoryAction(id: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    // Check for child categories or products before deleting?
    // Prisma might handle this if relations are set up, or throw error.
    await prisma.category.delete({
      where: { id: String(id) },
    });

    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: String(error) };
  }
}
