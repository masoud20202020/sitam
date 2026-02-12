import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import BlogClientPage from './BlogClientPage';
import type { Metadata } from 'next';
import { getBlogPostsAction } from '@/actions/blog';

export const metadata: Metadata = {
  title: 'خبرنامه',
  description: 'آخرین مطالب و مقالات درباره مد، تکنولوژی و سبک زندگی',
};

export default async function BlogPage() {
  const res = await getBlogPostsAction();
  const posts = res.success && res.data ? res.data : [];
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      <main className="flex-grow">
        <BlogClientPage initialPosts={posts} />
      </main>
      <Footer />
    </div>
  );
}
