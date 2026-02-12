import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getBlogPostBySlugAction, getBlogPostByIdAction } from '@/actions/blog';
import type { Metadata } from 'next';
import BlogPostContent from './BlogPostClient';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = params;
  const decodedId = decodeURIComponent(id);
  const bySlug = await getBlogPostBySlugAction(id);
  const bySlugDecoded = id !== decodedId ? await getBlogPostBySlugAction(decodedId) : { success: false, error: 'Not found' };
  const byId = await getBlogPostByIdAction(id);
  const post = bySlug.success
    ? bySlug.data
    : bySlugDecoded.success
    ? bySlugDecoded.data
    : byId.success
    ? byId.data
    : null;
  
  if (!post) return { title: 'خبر یافت نشد' };

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      type: 'article',
      images: post.image ? [{ url: post.image, alt: post.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: post.image ? [post.image] : [],
    },
    alternates: {
      canonical: `/blog/${post.slug || post.id}`,
    },
  };
}

export default async function BlogPostPage() {
  // We don't need to fetch post here for rendering, the client component handles it.
  // But we keep the page structure server-side.
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <BlogPostContent />
      </main>

      <Footer />
    </div>
  );
}
