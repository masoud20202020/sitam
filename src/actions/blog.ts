'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  seoTitle?: string;
  seoDescription?: string;
  published: boolean;
  relatedProductIds: number[]; // Keeping number[] for compatibility if possible, but IDs are usually strings now. Let's assume we might need to migrate to string[] eventually, but for now the client might expect numbers if it was using number IDs. However, product IDs in Prisma are Strings (CUID). So I should probably change this to string[].
};

// Helper to format date
const formatDate = (date: Date) => date.toLocaleDateString('fa-IR');

export async function getBlogPostBySlugAction(slug: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
    });
    if (!post) return { success: false, error: 'Not found' };
    return {
      success: true,
      data: {
        ...post,
        excerpt: post.excerpt || '',
        content: post.content || '',
        image: post.image || '',
        author: post.author || 'Admin',
        category: post.category || 'عمومی',
        date: formatDate(post.createdAt),
        seoTitle: post.seoTitle || undefined,
        seoDescription: post.seoDescription || undefined,
        relatedProductIds: post.relatedProductIds ? JSON.parse(post.relatedProductIds) : [],
      }
    };
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return { success: false, error: String(error) };
  }
}

export async function getBlogPostByIdAction(id: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });
    if (!post) return { success: false, error: 'Not found' };
    return {
      success: true,
      data: {
        ...post,
        excerpt: post.excerpt || '',
        content: post.content || '',
        image: post.image || '',
        author: post.author || 'Admin',
        category: post.category || 'عمومی',
        date: formatDate(post.createdAt),
        seoTitle: post.seoTitle || undefined,
        seoDescription: post.seoDescription || undefined,
        relatedProductIds: post.relatedProductIds ? JSON.parse(post.relatedProductIds) : [],
      }
    };
  } catch (error) {
    console.error('Error fetching blog post by id:', error);
    return { success: false, error: String(error) };
  }
}

export async function getBlogPostsAction() {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: posts.map(p => ({
        ...p,
        excerpt: p.excerpt || '',
        content: p.content || '',
        image: p.image || '',
        author: p.author || 'Admin',
        category: p.category || 'عمومی',
        date: formatDate(p.createdAt),
        seoTitle: p.seoTitle || undefined,
        seoDescription: p.seoDescription || undefined,
        relatedProductIds: p.relatedProductIds ? JSON.parse(p.relatedProductIds) : [],
      }))
    };
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return { success: false, error: String(error) };
  }
}

export async function getLatestBlogPostsAction(limit: number = 4) {
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        published: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return posts.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt || '',
      content: p.content || '',
      image: p.image || '',
      date: formatDate(p.createdAt),
      author: p.author || 'Admin',
      category: p.category || 'عمومی',
      tags: [],
      relatedProductIds: p.relatedProductIds ? JSON.parse(p.relatedProductIds) : [],
    }));
  } catch (error) {
    console.error('Error fetching latest blog posts:', error);
    return [];
  }
}

type BlogPostInput = {
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  author?: string;
  category?: string;
  image?: string;
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
  relatedProductIds?: (string | number)[];
};

export async function createBlogPostAction(data: BlogPostInput) {
  try {
    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        author: data.author,
        category: data.category,
        image: data.image,
        published: data.published,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        relatedProductIds: JSON.stringify(data.relatedProductIds || []),
      },
    });
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    return { success: true, data: post };
  } catch (error) {
    console.error('Error creating blog post:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateBlogPostAction(id: string, data: Partial<BlogPostInput>) {
  try {
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        author: data.author,
        category: data.category,
        image: data.image,
        published: data.published,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        relatedProductIds: JSON.stringify(data.relatedProductIds || []),
      },
    });
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    return { success: true, data: post };
  } catch (error) {
    console.error('Error updating blog post:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteBlogPostAction(id: string) {
  try {
    await prisma.blogPost.delete({
      where: { id },
    });
    revalidatePath('/admin/blog');
    revalidatePath('/blog');
    return { success: true };
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return { success: false, error: String(error) };
  }
}
