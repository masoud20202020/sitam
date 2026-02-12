'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import type { Banner } from '@/actions/banners';

export const MiddleBanner = ({ initialBanners = [] }: { initialBanners?: Banner[] }) => {
  const banner = initialBanners.filter(b => b.active && b.position === 'middle').sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0] || null;
  if (!banner) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#831843] to-[#db2777] shadow-xl group">
        <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12 relative z-10">
          
          {/* Text Content */}
          <div className="text-white space-y-6 md:w-1/2 text-center md:text-right">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight animate-fade-in-up opacity-0">
              {banner.title}
            </h2>
            {banner.subtitle && (
              <p className="text-lg md:text-xl text-pink-100 opacity-0 animate-fade-in-up animation-delay-500">
                {banner.subtitle}
              </p>
            )}
            <div className="pt-4 opacity-0 animate-fade-in-up animation-delay-500">
              <Link
                href={banner.link || '/shop'}
                className="inline-flex items-center gap-2 bg-white text-[#db2777] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
              >
                {banner.link ? 'مشاهده و خرید' : 'مشاهده محصولات'}
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Image Content */}
          <div className="md:w-1/2 flex justify-center mt-10 md:mt-0 relative">
             {/* Abstract Shapes/Glow for decoration */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#db2777] rounded-full blur-3xl opacity-30 animate-pulse"></div>
             
             {banner.image ? (
               <div className="relative w-64 h-64 md:w-80 md:h-80 animate-float">
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    className="object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-110"
                  />
               </div>
             ) : (
                <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center bg-white/10 rounded-full backdrop-blur-sm border border-white/20 animate-float">
                    <span className="text-white/50 text-xl">تصویر بنر</span>
                </div>
             )}
          </div>
        </div>
        
        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}>
        </div>
        
        {/* Animated Background Blobs */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-pink-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
    </section>
  );
};
