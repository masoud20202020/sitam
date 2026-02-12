'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getBrandsAction() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return { success: true, data: brands };
  } catch (error) {
    console.error('Error fetching brands:', error);
    return { success: false, error: String(error) };
  }
}

export async function createBrandAction(data: {
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
}) {
  try {
    const brand = await prisma.brand.create({
      data,
    });
    revalidatePath('/admin/brands');
    revalidatePath('/admin/products');
    return { success: true, data: brand };
  } catch (error) {
    console.error('Error creating brand:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateBrandAction(id: string, data: {
  name?: string;
  slug?: string;
  logo?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  isActive?: boolean;
}) {
  try {
    const brand = await prisma.brand.update({
      where: { id },
      data,
    });
    revalidatePath('/admin/brands');
    revalidatePath('/admin/products');
    return { success: true, data: brand };
  } catch (error) {
    console.error('Error updating brand:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteBrandAction(id: string) {
  try {
    // Check if brand has products
    const productCount = await prisma.product.count({
      where: { brandId: id },
    });

    if (productCount > 0) {
      return { success: false, error: 'Cannot delete brand with associated products.' };
    }

    await prisma.brand.delete({
      where: { id },
    });
    revalidatePath('/admin/brands');
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) {
    console.error('Error deleting brand:', error);
    return { success: false, error: String(error) };
  }
}
