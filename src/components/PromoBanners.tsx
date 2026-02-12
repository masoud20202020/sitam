'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import type { Banner } from '@/actions/banners';

export const PromoBanners = ({ initialBanners = [] }: { initialBanners?: Banner[] }) => {
  const banners = initialBanners.filter(b => b.active && b.position === 'home_above_categories').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (banners.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <div 
            key={banner.id} 
            className="relative rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group min-h-[220px] flex items-center"
            style={{ 
              backgroundColor: banner.backgroundColor || '#f3f4f6',
              // Fallback gradient if no color provided and odd/even logic if desired, 
              // but we expect backgroundColor to be set via admin for these specific banners.
            }}
          >
            {/* Background Image if exists */}
            {banner.image && (
              <div className="absolute inset-0 z-0">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex w-full items-center justify-center p-6 md:p-10 relative z-10">
              
              {/* Text Content */}
              <div className="w-full flex flex-col items-center text-center space-y-4">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                  {banner.title}
                </h3>
                {banner.subtitle && (
                  <p className="text-sm md:text-base text-gray-600">
                    {banner.subtitle}
                  </p>
                )}
                <div className="pt-2">
                  <Link
                    href={banner.link || '/shop'}
                    className="inline-flex items-center gap-2 text-gray-800 font-bold text-sm md:text-base hover:gap-3 transition-all group-hover:text-gray-900"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:bg-gray-800 group-hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <span>مشاهده بیشتر</span>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            {!banner.image && (
              <>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl pointer-events-none"></div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
