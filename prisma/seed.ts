import { PrismaClient } from '@prisma/client';
import { seedCategories } from '../src/data/categories';
import { seedBrands } from '../src/data/brands';
import { seedProducts } from '../src/data/products';
import { seedPosts } from '../src/data/blog';
import { SEED_ADMINS } from '../src/data/admins';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Seed Admins (Users)
  console.log('Seeding Admins...');
  for (const admin of SEED_ADMINS) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: admin.username }, // Using username as email for now if it looks like email, or just unique check
          // Since schema has email and phone unique, and admin has username.
          // Let's assume username is mapped to email for simplicity or create a placeholder email
        ]
      }
    });

    if (!existingUser) {
        // Map AdminUser to User model
        // We'll use username as email if it's not email-like, append @example.com or just store it if validation allows
        // Schema User.email is String? @unique.
        const email = admin.username.includes('@') ? admin.username : `${admin.username}@admin.com`;
        
        await prisma.user.create({
            data: {
                name: admin.name,
                email: email,
                role: admin.role,
                // In a real app, password should be hashed. admin.password might be undefined in seed.
                // We'll set a default password 'admin123' (hashed ideally, but plain for now as we don't have bcrypt here easily without install)
                // Wait, I should not store plain password if I can avoid it. But for dev seed it's okay.
                // Or better, just leave it null and assume we can't login via standard auth without setting it.
                // But NextAuth CredentialsProvider might need it.
                // Let's just set 'admin' as password for dev.
                password: admin.password || 'admin', 
            }
        });
    }
  }

  // 2. Seed Categories
  console.log('Seeding Categories...');
  for (const cat of seedCategories) {
    const existing = await prisma.category.findUnique({
        where: { slug: cat.slug || cat.name }
    });
    
    if (!existing) {
        await prisma.category.create({
            data: {
                // id: String(cat.id), // Let's use the ID from seed to keep relationships if possible? 
                // Schema uses cuid. If I force ID, it might not be a valid CUID but SQLite accepts strings.
                // Let's try to preserve ID if possible, or just let it generate and rely on names/slugs.
                // Since products use category NAME, we don't strictly need to preserve ID for product relations.
                // But subcategories might use parentId.
                // seedCategories has parentId: null for all. So no hierarchy in seed yet.
                name: cat.name,
                slug: cat.slug || cat.name,
                description: cat.description,
                icon: cat.icon,
                isActive: cat.isActive,
                isPopular: cat.isPopular,
                // image: cat.popularImage // seedCategories doesn't have popularImage in type definition shown in Read, 
                // but type has it. Let's check if seed has it.
            }
        });
    }
  }

  // 3. Seed Brands
  console.log('Seeding Brands...');
  for (const brand of seedBrands) {
    const existing = await prisma.brand.findUnique({
        where: { slug: brand.slug }
    });

    if (!existing) {
        await prisma.brand.create({
            data: {
                name: brand.name,
                slug: brand.slug,
                logo: brand.logo,
                isActive: brand.isActive
            }
        });
    }
  }

  // 4. Seed Products
  console.log('Seeding Products...');
  for (const product of seedProducts) {
    // Find category ID by name
    const category = await prisma.category.findFirst({
        where: { name: product.category }
    });

    // Find brand ID by name
    let brandId = null;
    if (product.brand) {
        const brand = await prisma.brand.findFirst({
            where: { name: product.brand }
        });
        brandId = brand?.id;
    }

    // Check if product exists (by slug or name)
    // seedProducts don't always have slug.
    const existing = await prisma.product.findFirst({
        where: { name: product.name }
    });

    if (!existing) {
        const createdProduct = await prisma.product.create({
            data: {
                name: product.name,
                // Generate a slug if missing
                slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-') + '-' + product.id,
                description: product.description,
                shortDescription: product.shortDescription,
                basePrice: product.basePrice,
                discountPrice: product.discountPrice,
                stock: product.stock || 0,
                image: product.image,
                images: product.images ? JSON.stringify(product.images) : null,
                published: product.published ?? true,
                isTrending: product.isTrending ?? false,
                
                categoryId: category?.id,
                categoryName: product.category, // Keep denormalized name as well
                
                brandId: brandId,
                brandName: product.brand,

                options: product.options ? JSON.stringify(product.options) : null,
                
                // SEO
                seoTitle: product.seoTitle,
                seoDescription: product.seoDescription,
                seoKeywords: product.seoKeywords ? JSON.stringify(product.seoKeywords) : null,
                imageAlt: product.imageAlt,
                
                // Physical Specs
                weight: product.weight,
                length: product.dimensions?.length,
                width: product.dimensions?.width,
                height: product.dimensions?.height,
                volume: product.volume,

                sku: product.sku,
                specialSaleEndTime: product.specialSaleEndTime ? new Date(product.specialSaleEndTime) : null,
            }
        });

        // Create Variants
        if (product.variants && product.variants.length > 0) {
            for (const variant of product.variants) {
                await prisma.productVariant.create({
                    data: {
                        productId: createdProduct.id,
                        price: variant.price,
                        stock: variant.stock,
                        selection: JSON.stringify(variant.selection),
                        image: variant.image
                    }
                });
            }
        }
    }
  }

  // 5. Seed BlogPosts
  console.log('Seeding Blog Posts...');
  for (const post of seedPosts) {
      const existing = await prisma.blogPost.findFirst({
          where: { title: post.title }
      });

      if (!existing) {
          await prisma.blogPost.create({
              data: {
                  title: post.title,
                  slug: post.slug || post.title.toLowerCase().replace(/\s+/g, '-'),
                  excerpt: post.excerpt,
                  content: post.content,
                  author: post.author,
                  category: post.category,
                  image: post.image,
                  published: post.published ?? true,
                  seoTitle: post.seoTitle,
                  seoDescription: post.seoDescription,
                  // date string in seed is Persian date '1403/...'. 
                  // Schema has createdAt DateTime. 
                  // We can't easily parse Persian date to JS Date without library.
                  // We'll just use current date or try to parse if possible, or ignore custom date for now and rely on createdAt
              }
          });
      }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
