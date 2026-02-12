import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  // Static routes
  const routes = [
    '',
    '/about',
    '/contact',
    '/shop',
    '/blog',
    '/privacy',
    '/tracking',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }))

  // Dynamic Products
  const productsData = await prisma.product.findMany({
    where: { published: true },
    select: { slug: true, id: true, updatedAt: true }
  });
  const products = productsData.map((product) => ({
    url: `${baseUrl}/product/${product.slug || product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dynamic Categories
  const categoriesData = await prisma.category.findMany({
    select: { slug: true }
  });
  const categories = categoriesData.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dynamic Blog Posts
  const postsData = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true, id: true, updatedAt: true }
  });
  const posts = postsData.map((post) => ({
    url: `${baseUrl}/blog/${post.slug || post.id}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...routes, ...products, ...categories, ...posts]
}
