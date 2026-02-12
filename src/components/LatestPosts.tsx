'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight, ChevronLeft } from 'lucide-react';
import { BlogPost } from '@/data/blog';
import Image from 'next/image';

export const LatestPosts = ({ initialPosts }: { initialPosts?: BlogPost[] }) => {
  const posts: BlogPost[] = initialPosts || [];

  if (posts.length === 0) return null;

  const featuredPost = posts[0];
  const sidePosts = posts.slice(1);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 bg-[#db2777] rounded-full"></div>
             <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">مجله خبری</h2>
          </div>
          <Link href="/blog" className="group flex items-center gap-2 text-gray-500 hover:text-[#db2777] transition-colors bg-white border border-gray-200 px-4 py-2 rounded-full font-medium text-sm hover:shadow-sm">
            <span>مشاهده همه</span>
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Featured Post */}
          <div className="w-full lg:w-5/12">
            <article className="bg-white rounded-[32px] border-2 border-dashed border-[#db2777]/30 hover:border-[#db2777] p-6 h-full transition-all duration-300 relative group flex flex-col">
              
              {/* Badge */}
              <div className="absolute top-8 right-8 z-10">
                <span className="bg-white/90 backdrop-blur-sm text-[#db2777] px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border border-gray-100 flex items-center gap-1">
                   خواندنی
                </span>
              </div>

              <Link href={`/blog/${featuredPost.slug || featuredPost.id}`} className="block relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-100">
                 <Image
                    src={featuredPost.image || '/placeholder.svg'}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                 />
              </Link>
              
              <div className="flex flex-col flex-grow">
                 <Link href={`/blog/${featuredPost.slug || featuredPost.id}`}>
                   <h3 className="text-2xl font-bold text-gray-800 mb-3 leading-tight hover:text-[#db2777] transition-colors line-clamp-2">
                     {featuredPost.title}
                   </h3>
                 </Link>
                 
                 <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed flex-grow">
                   {featuredPost.excerpt}
                 </p>

                 <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                       <Calendar className="w-3.5 h-3.5" />
                       {featuredPost.date}
                    </div>

                    <Link href={`/blog/${featuredPost.slug || featuredPost.id}`} className="flex items-center gap-2 text-[#db2777] font-bold text-sm hover:gap-3 transition-all">
                       بیشتر بخوانید
                       <ArrowRight className="w-4 h-4" />
                    </Link>
                 </div>
              </div>
            </article>
          </div>

          {/* Right Column: Side Posts List */}
          <div className="w-full lg:w-7/12 flex flex-col gap-4">
            {sidePosts.map((post) => (
               <article key={post.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#db2777]/30 transition-all duration-300 flex items-center gap-4 group h-full">
                  <Link href={`/blog/${post.slug || post.id}`} className="block relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                     <Image
                        src={post.image || '/placeholder.svg'}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                     />
                  </Link>

                  <div className="flex flex-col h-full py-1 flex-grow justify-between">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-medium group-hover:bg-[#db2777]/10 group-hover:text-[#db2777] transition-colors">
                              {post.category}
                           </span>
                        </div>
                        <Link href={`/blog/${post.slug || post.id}`}>
                           <h4 className="text-base sm:text-lg font-bold text-gray-800 leading-snug hover:text-[#db2777] transition-colors line-clamp-2 mb-2">
                              {post.title}
                           </h4>
                        </Link>
                     </div>
                     
                     <div className="flex items-center gap-4 text-xs text-gray-400 mt-auto">
                        <span className="flex items-center gap-1">
                           <Calendar className="w-3 h-3" />
                           {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                           <User className="w-3 h-3" />
                           {post.author}
                        </span>
                     </div>
                  </div>
                  
                  {/* Arrow Icon for Desktop */}
                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#db2777] group-hover:text-white transition-all transform group-hover:-translate-x-1">
                      <ChevronLeft className="w-5 h-5" />
                  </div>
               </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
