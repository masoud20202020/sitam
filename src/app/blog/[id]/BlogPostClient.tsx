'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, User, Share2 } from 'lucide-react';
import Link from 'next/link';
import { getBlogPostById, getBlogPostBySlug, BlogPost } from '@/data/blog';
import { getProducts } from '@/data/products';
import { autoLinkContent } from '@/lib/autoLinker';
import { BlogRelatedProducts } from '@/components/blog/BlogRelatedProducts';
import Image from 'next/image';
import { useParams } from 'next/navigation';

export default function BlogPostContent() {
  const params = useParams();
  const id = params?.id as string;
  const [post, setPost] = useState<BlogPost | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [contentWithLinks, setContentWithLinks] = useState('');

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (id) {
      const decodedId = decodeURIComponent(id);
      const foundPost = getBlogPostBySlug(id) || getBlogPostBySlug(decodedId) || getBlogPostById(id);
      const products = foundPost ? getProducts() : [];
      const linked =
        foundPost && foundPost.content
          ? autoLinkContent(foundPost.content, products)
          : foundPost && foundPost.excerpt
          ? autoLinkContent(`<p>${foundPost.excerpt}</p>`, products)
          : '';
      timer = setTimeout(() => {
        setPost(foundPost);
        if (foundPost) {
          setContentWithLinks(linked);
        }
        setLoading(false);
      }, 0);
    } else {
      timer = setTimeout(() => setLoading(false), 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center py-20">
        <div className="text-gray-500">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border overflow-hidden">
        
        <div className="relative h-64 md:h-96 bg-gray-200 w-full">
          {post?.image && (
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
          )}
        </div>

        <div className="p-6 md:p-10">
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 border-b pb-6">
            {post && (
              <>
                <span className="bg-[#db2777]/10 text-[#db2777] px-3 py-1 rounded-full font-medium">
                  {post.category}
                </span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {post.author}
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <article className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-a:text-[#db2777] prose-img:rounded-xl">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight">
              {post ? post.title : 'خبر یافت نشد'}
            </h1>
            {post ? (
              <div 
                className="space-y-4 break-words w-full text-justify"
                dir="rtl"
                dangerouslySetInnerHTML={{ __html: contentWithLinks }}
              />
            ) : (
              <div className="text-gray-600">
                خبر مورد نظر یافت نشد. لطفاً به لیست اخبار بازگردید.
              </div>
            )}
          </article>

          {/* Related Products */}
          {post?.relatedProductIds && post.relatedProductIds.length > 0 && (
            <BlogRelatedProducts productIds={post.relatedProductIds} />
          )}

          {/* Tags & Share */}
          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6">
            <div />

            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm">اشتراک‌گذاری:</span>
              <button className="p-2 rounded-full bg-gray-50 hover:bg-[#db2777] hover:text-white transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Back Link */}
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <Link href="/blog" className="text-gray-500 hover:text-[#db2777] font-medium inline-flex items-center gap-2">
          بازگشت به خبرنامه
        </Link>
      </div>
    </>
  );
}
