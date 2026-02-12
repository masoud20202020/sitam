
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Brand } from '@/data/brands';

export const TopBrands = ({ initialBrands }: { initialBrands?: Brand[] }) => {
  const brands = initialBrands || [];

  if (brands.length === 0) return null;

  return (
    <section className="py-12 bg-white mb-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
           <div className="flex items-center gap-3">
             <div className="w-2 h-10 bg-[#db2777] rounded-lg shadow-md rotate-3"></div>
             <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight">برندهای <span className="text-[#db2777]">برتر</span></h2>
           </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {brands.map((brand) => (
            <Link 
              key={brand.id} 
              href={`/brand/${brand.slug || brand.id}`}
              className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#db2777]/20 rounded-xl bg-white hover:bg-white hover:shadow-lg hover:border-[#db2777] transition-all duration-300 transform hover:-translate-y-1 h-32"
            >
              {brand.logo ? (
                 <div className="relative h-16 w-full mb-2">
                   <Image 
                     src={brand.logo} 
                     alt={brand.name} 
                     fill
                     className="object-contain grayscale group-hover:grayscale-0 transition-all duration-300" 
                     sizes="(max-width: 768px) 33vw, 16vw"
                   />
                 </div>
              ) : null}
              <span className={`text-lg font-bold ${brand.logo ? 'text-gray-600 text-sm' : 'text-gray-400 text-xl'} group-hover:text-[#db2777] transition-colors`}>
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
