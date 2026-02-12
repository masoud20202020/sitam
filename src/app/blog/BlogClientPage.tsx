'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/actions/blog';
import Image from 'next/image';

export default function BlogClientPage({ initialPosts = [] }: { initialPosts?: BlogPost[] }) {
  const posts = useMemo(() => initialPosts, [initialPosts]);

  const visiblePosts = posts.filter(p => p.published !== false);

  if (visiblePosts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-600 text-lg">هنوز خبری منتشر نشده است.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">خبرنامه ما</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          آخرین اخبار، مقالات و دانستنی‌های دنیای مد، تکنولوژی و سبک زندگی را در اینجا بخوانید.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visiblePosts.map((post) => (
          <article key={post.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border">
            <Link href={`/blog/${post.slug || post.id}`} className="block h-48 bg-gray-200 relative">
              <Image
                src={post.image || '/placeholder.svg'}
                alt={post.title}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </Link>
            
            <div className="p-6">
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span className="bg-gray-100 px-2 py-1 rounded-md text-[#db2777] font-medium">{post.category}</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {post.date}
                </div>
              </div>

              <Link href={`/blog/${post.slug || post.id}`}>
                <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-[#db2777] transition-colors">
                  {post.title}
                </h2>
              </Link>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                  {post.author}
                </div>
                
                <Link href={`/blog/${post.slug || post.id}`} className="text-[#db2777] text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                  ادامه مطلب
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
