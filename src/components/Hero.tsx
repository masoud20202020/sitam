'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '@/actions/banners';

export const Hero = ({ initialBanners = [] }: { initialBanners?: Banner[] }) => {
  const banners = useMemo(() => initialBanners.filter(b => b.active && b.position === 'hero').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [initialBanners]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide effect
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [banners.length]);

  const banner = banners[currentIndex];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (!banner) {
    return (
      <div className="bg-gray-100 py-12 md:py-24 text-center">
        <div className="container mx-auto px-4">
           <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
             تخفیف‌های ویژه <span className="text-[#db2777]">تابستانه</span>
           </h1>
           <p className="text-lg text-gray-600 mb-8">
             بنری برای نمایش وجود ندارد. لطفاً از پنل مدیریت بنر اضافه کنید.
           </p>
           <Link
             href="/shop"
             className="inline-block bg-[#db2777] text-white px-8 py-3 rounded-full font-medium hover:bg-[#be185d] transition-colors"
           >
             مشاهده محصولات
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] md:h-[600px] overflow-hidden group bg-gray-900">
      
      {/* Slider Container */}
      <div className="relative w-full h-full">
        {banners.map((item, index) => (
          <div 
            key={item.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out
              ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}
            `}
          >
            {/* Image Background */}
            {item.image ? (
              <Image 
                src={item.image} 
                alt={item.title} 
                fill 
                priority={index === 0}
                className="object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                 <span className="text-white opacity-20 text-4xl font-bold">بدون تصویر</span>
              </div>
            )}

            {/* Dark Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/30 md:to-transparent opacity-80" />

            {/* Text Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4 md:px-8">
                <div className={`max-w-2xl space-y-6 transform transition-all duration-700 delay-300 ${index === currentIndex ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
                    {item.title}
                  </h1>
                  <p className="text-lg md:text-2xl text-gray-100 font-medium drop-shadow-md">
                    {item.subtitle}
                  </p>
                  <div className="pt-4">
                    <Link
                      href={item.link || '/shop'}
                      className="inline-flex items-center justify-center bg-[#db2777] text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-[#be185d] hover:scale-105 transition-all shadow-lg hover:shadow-pink-500/30"
                    >
                      {item.link ? 'مشاهده کنید' : 'مشاهده محصولات'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows (Only if multiple banners) */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white text-white hover:text-[#db2777] backdrop-blur-md p-3 rounded-full shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 focus:outline-none transform hover:scale-110"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white text-white hover:text-[#db2777] backdrop-blur-md p-3 rounded-full shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 focus:outline-none transform hover:scale-110"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Dots Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-3 rounded-full transition-all duration-500 shadow-sm ${
                  idx === currentIndex ? 'bg-[#db2777] w-10' : 'bg-white/50 w-3 hover:bg-white'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
