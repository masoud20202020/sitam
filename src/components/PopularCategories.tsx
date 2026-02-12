'use client';

import React from 'react';
import Link from 'next/link';
import { Category } from '@/data/categories';
import { Layers, Shirt, Watch, Smartphone, Home as HomeIcon } from 'lucide-react';
import Image from 'next/image';

export const PopularCategories = ({ initialCategories }: { initialCategories?: Category[] }) => {
  const categories = (initialCategories || []).filter(c => c.isPopular);

  const getIcon = (name: string) => {
    if (name.includes('دیجیتال')) return <Smartphone className="w-8 h-8 text-white" />;
    if (name.includes('پوشاک') || name.includes('مد')) return <Shirt className="w-8 h-8 text-white" />;
    if (name.includes('ساعت') || name.includes('اکسسوری')) return <Watch className="w-8 h-8 text-white" />;
    if (name.includes('خانه') || name.includes('خانگی')) return <HomeIcon className="w-8 h-8 text-white" />;
    return <Layers className="w-8 h-8 text-white" />;
  };

  if (categories.length === 0) return null;

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">دسته‌بندی‌های محبوب</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/category/${category.slug || category.id}`}
              className="group flex flex-col items-center justify-center w-32 h-32 bg-white rounded-full shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100"
            >
              <div className="w-14 h-14 bg-[#db2777] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 overflow-hidden relative">
                {category.popularImage ? (
                  <Image 
                    src={category.popularImage} 
                    alt={category.name} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  getIcon(category.name)
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#db2777] transition-colors">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
