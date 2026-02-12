'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import type { Banner } from '@/actions/banners';

export const BottomBanners = ({ initialBanners = [] }: { initialBanners?: Banner[] }) => {
  const banners = initialBanners.filter(b => b.active && b.position === 'home_bottom_grid').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (banners.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <div 
            key={banner.id} 
            className="relative rounded-2xl overflow-hidden shadow-xl group h-[300px] flex items-center"
            style={{ 
              background: banner.backgroundColor || 'linear-gradient(to right, #831843, #db2777)'
            }}
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black opacity-10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

            <div className="flex flex-row items-center justify-between p-6 w-full h-full relative z-10">
              
              {/* Text Content */}
              <div className="w-1/2 space-y-4 pr-4">
                <h3 className={`text-2xl font-bold leading-tight ${banner.backgroundColor ? 'text-gray-800' : 'text-white'}`}>
                  {banner.title}
                </h3>
                {banner.subtitle && (
                  <p className={`text-sm ${banner.backgroundColor ? 'text-gray-600' : 'text-pink-100'}`}>
                    {banner.subtitle}
                  </p>
                )}
                <div className="pt-2">
                  <Link
                    href={banner.link || '/shop'}
                    className={`inline-flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1 ${
                      banner.backgroundColor 
                        ? 'bg-[#db2777] text-white hover:bg-[#be185d]' 
                        : 'bg-white text-[#db2777] hover:bg-gray-50'
                    }`}
                  >
                    {banner.link ? 'مشاهده' : 'خرید کنید'}
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Image Content */}
              <div className="w-1/2 flex justify-center relative h-full items-center">
                 {banner.image ? (
                   <div className="relative w-full h-4/5 animate-float">
                      <Image
                        src={banner.image}
                        alt={banner.title}
                        fill
                        className="object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-110"
                      />
                   </div>
                 ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                        <span className="text-white/50 text-sm">تصویر</span>
                    </div>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
