import { Prisma } from '@prisma/client';
import { ProductItem, ProductVariant, ProductOption } from '@/data/products';

type PrismaProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    brand: true;
    variants: true;
  };
}>;

export function mapPrismaProductToItem(product: PrismaProductWithRelations): ProductItem {
  let parsedOptions: ProductOption[] = [];
  try {
    if (product.options) {
      parsedOptions = JSON.parse(product.options as string);
    }
  } catch (e) {
    console.error('Failed to parse options for product', product.id, e);
  }

  let parsedImages: string[] = [];
  try {
    if (product.images) {
      parsedImages = JSON.parse(product.images as string);
    }
  } catch (e) {
    console.error('Failed to parse images for product', product.id, e);
  }

  let parsedSeoKeywords: string[] = [];
  try {
    if (product.seoKeywords) {
      parsedSeoKeywords = JSON.parse(product.seoKeywords as string);
    }
  } catch (e) {
    console.error('Failed to parse seoKeywords for product', product.id, e);
  }

  const mappedVariants: ProductVariant[] = product.variants.map(v => {
    let selection = {};
    try {
      if (v.selection) {
        selection = JSON.parse(v.selection as string);
      }
    } catch (e) {
      console.error('Failed to parse variant selection', v.id, e);
    }

    return {
      variantId: v.id,
      selection: selection,
      price: v.price,
      stock: v.stock,
      image: v.image || undefined,
    };
  });

  return {
    id: product.id,
    name: product.name,
    basePrice: product.basePrice,
    category: product.category?.name || '',
    image: product.image || undefined,
    description: product.description || undefined,
    shortDescription: product.shortDescription || undefined,
    discountPrice: product.discountPrice || undefined,
    // rating and reviews are not in Prisma Product model directly yet (relations exist but not mapped here for simplicity/list view)
    images: parsedImages,
    options: parsedOptions,
    variants: mappedVariants,
    stock: product.stock,
    published: product.published,
    brand: product.brand?.name || undefined,
    isTrending: product.isTrending,
    slug: product.slug || undefined,
    seoTitle: product.seoTitle || undefined,
    seoDescription: product.seoDescription || undefined,
    seoKeywords: parsedSeoKeywords,
    imageAlt: product.imageAlt || undefined,
    specialSaleEndTime: product.specialSaleEndTime ? new Date(product.specialSaleEndTime).getTime() : undefined,
    sku: product.sku || undefined,
    weight: product.weight || undefined,
    dimensions: (product.length && product.width && product.height) ? {
      length: product.length,
      width: product.width,
      height: product.height
    } : undefined,
    volume: product.volume || undefined,
  };
}
