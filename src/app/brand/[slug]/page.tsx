
'use server';

import React from 'react';
import { formatPriceToman } from '@/data/products';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { getBrandsAction } from '@/actions/brands';
import { getProductsAction } from '@/actions/products';

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [brandsRes, products] = await Promise.all([getBrandsAction(), getProductsAction()]);
  type BrandItem = { id: string; slug: string; name: string; description?: string | null; logo?: string | null };
  const brands: BrandItem[] = (brandsRes.success && brandsRes.data)
    ? (brandsRes.data as Array<{ id: string; slug: string; name?: string | null; description?: string | null; logo?: string | null }>).map(b => ({
        id: b.id,
        slug: b.slug,
        name: b.name || '',
        description: b.description ?? null,
        logo: b.logo ?? null,
      }))
    : [];
  const brand = brands.find((b) => b.slug === slug) || brands.find((b) => b.id === slug) || null;

  if (!brand) {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">برند یافت نشد</h1>
            <Link href="/" className="text-[#83b735] mt-4 inline-block hover:underline">بازگشت به صفحه اصلی</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-10">
        {/* Brand Header */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#83b735] to-transparent opacity-50"></div>
          <div className="w-32 h-32 mx-auto relative mb-4 flex items-center justify-center p-2">
             {brand.logo ? (
                 <Image src={brand.logo} alt={brand.name} width={128} height={128} className="max-w-full max-h-full object-contain" />
             ) : (
                 <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-3xl font-bold text-gray-400 border border-gray-200">
                    {brand.name.charAt(0).toUpperCase()}
                 </div>
             )}
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">{brand.name}</h1>
          {brand.description && <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">{brand.description}</p>}
        </div>

        {/* Products Grid */}
        <div className="flex items-center gap-3 mb-6">
             <div className="w-1.5 h-8 bg-[#83b735] rounded-full"></div>
             <h2 className="text-xl font-bold text-gray-800">محصولات {brand.name} <span className="text-sm font-normal text-gray-500">({products.filter(p => p.brand === brand.name && p.published !== false).length} محصول)</span></h2>
        </div>
        
        {products.filter(p => p.brand === brand.name && p.published !== false).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.filter(p => p.brand === brand.name && p.published !== false).map((product) => (
                <div key={product.id} className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-[#83b735]/30">
                  <Link href={`/product/${product.slug || product.id}`} className="block relative h-48 bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                    {product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.basePrice && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm">
                        {Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)}%
                      </div>
                    )}
                    {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.imageAlt || product.name}
                          fill
                          className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <span className="text-gray-400 text-sm">تصویر محصول</span>
                    )}
                  </Link>
                  
                  <div className="p-4 text-center">
                    <div className="text-xs text-gray-500 mb-1">{product.category}</div>
                    <Link href={`/product/${product.slug || product.id}`}>
                      <h3 className="font-bold text-gray-800 mb-2 group-hover:text-[#83b735] cursor-pointer transition-colors line-clamp-2 min-h-[2.5rem] text-sm leading-6">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex flex-col items-center gap-1 mb-3">
                      {product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.basePrice && (
                        <span className="text-xs text-gray-400 line-through decoration-red-400">
                          {formatPriceToman(product.basePrice)}
                        </span>
                      )}
                      <div className="text-[#83b735] font-bold text-lg">
                        {formatPriceToman(product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.basePrice)}
                        <span className="text-xs font-normal text-gray-500 mr-1">تومان</span>
                      </div>
                    </div>
                    
                    <Link href={`/product/${product.slug || product.id}`} className="block w-full text-center mt-2 bg-gray-50 hover:bg-[#83b735] hover:text-white text-gray-700 py-2 rounded-lg text-sm font-bold transition-colors border border-gray-200 hover:border-[#83b735]">
                      مشاهده و خرید
                    </Link>
                  </div>
                </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="text-gray-400 mb-2 text-4xl">☹️</div>
            <div className="text-gray-600 font-medium">هیچ محصولی برای این برند یافت نشد.</div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
