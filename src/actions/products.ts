'use server';

import { prisma } from '@/lib/prisma';
import { mapPrismaProductToItem } from '@/lib/product-mapper';
import { ProductItem } from '@/data/products';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getProductsAction(): Promise<ProductItem[]> {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        variants: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products.map(mapPrismaProductToItem);
  } catch (error) {
    console.error('Error fetching products from DB:', error);
    return [];
  }
}

export async function getProductByIdAction(id: string): Promise<ProductItem | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        variants: true,
      },
    });

    if (!product) return null;

    return mapPrismaProductToItem(product);
  } catch (error) {
    console.error('Error fetching product from DB:', error);
    return null;
  }
}

export async function createProductAction(data: Omit<ProductItem, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Resolve Category ID
    let categoryId: string | undefined;
    if (data.category) {
      const category = await prisma.category.findFirst({ where: { name: data.category } });
      categoryId = category?.id;
    }

    // Resolve Brand ID
    let brandId: string | undefined;
    if (data.brand) {
      const brand = await prisma.brand.findFirst({ where: { name: data.brand } });
      brandId = brand?.id;
    }

    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: slug,
        basePrice: data.basePrice,
        description: data.description,
        shortDescription: data.shortDescription,
        discountPrice: data.discountPrice,
        image: data.image,
        images: data.images ? JSON.stringify(data.images) : undefined,
        options: data.options ? JSON.stringify(data.options) : undefined,
        stock: data.stock || 0,
        published: data.published ?? true,
        isTrending: data.isTrending ?? false,
        sku: data.sku,
        weight: data.weight,
        length: data.dimensions?.length,
        width: data.dimensions?.width,
        height: data.dimensions?.height,
        volume: data.volume,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords ? JSON.stringify(data.seoKeywords) : undefined,
        imageAlt: data.imageAlt,
        specialSaleEndTime: data.specialSaleEndTime ? new Date(data.specialSaleEndTime) : undefined,
        categoryId: categoryId,
        brandId: brandId,
        variants: {
          create: data.variants?.map(v => ({
            price: v.price,
            stock: v.stock,
            selection: JSON.stringify(v.selection),
            image: v.image
          })) || []
        }
      }
    });

    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/admin/products');
    
    return { success: true, id: product.id };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateProductAction(id: string, data: Partial<ProductItem>): Promise<{ success: boolean; error?: string }> {
  try {
    // Resolve Category ID if changed
    let categoryId: string | undefined;
    if (data.category) {
      const category = await prisma.category.findFirst({ where: { name: data.category } });
      categoryId = category?.id;
    }

    // Resolve Brand ID if changed
    let brandId: string | undefined;
    if (data.brand) {
      const brand = await prisma.brand.findFirst({ where: { name: data.brand } });
      brandId = brand?.id;
    }

    // Prepare update data
    const updateData: Prisma.ProductUpdateInput = {
      updatedAt: new Date(),
    };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.discountPrice !== undefined) updateData.discountPrice = data.discountPrice;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.options !== undefined) updateData.options = JSON.stringify(data.options);
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.published !== undefined) updateData.published = data.published;
    if (data.isTrending !== undefined) updateData.isTrending = data.isTrending;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.dimensions) {
        updateData.length = data.dimensions.length;
        updateData.width = data.dimensions.width;
        updateData.height = data.dimensions.height;
    }
    if (data.volume !== undefined) updateData.volume = data.volume;
    if (data.seoTitle !== undefined) updateData.seoTitle = data.seoTitle;
    if (data.seoDescription !== undefined) updateData.seoDescription = data.seoDescription;
    if (data.seoKeywords !== undefined) updateData.seoKeywords = JSON.stringify(data.seoKeywords);
    if (data.imageAlt !== undefined) updateData.imageAlt = data.imageAlt;
    if (data.specialSaleEndTime !== undefined) updateData.specialSaleEndTime = data.specialSaleEndTime ? new Date(data.specialSaleEndTime) : null;
    
    if (categoryId !== undefined) {
      updateData.category = { connect: { id: categoryId } };
    }
    if (brandId !== undefined) {
      updateData.brand = { connect: { id: brandId } };
    }

    // Handle variants if provided: delete all and recreate
    // Note: This loses variant IDs but keeps data consistent
    if (data.variants) {
      // We need to use a transaction or just accept that we replace variants
      // Prisma update with deleteMany/create works
      updateData.variants = {
        deleteMany: {},
        create: data.variants.map(v => ({
          price: v.price,
          stock: v.stock,
          selection: JSON.stringify(v.selection),
          image: v.image
        }))
      };
    }

    await prisma.product.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/admin/products');

    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteProductAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.product.delete({
      where: { id }
    });

    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/admin/products');

    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: String(error) };
  }
}
