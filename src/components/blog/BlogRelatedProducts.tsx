'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getProducts, ProductItem } from '@/data/products';
import Image from 'next/image';

const getProductPriceDisplay = (product: ProductItem) => {
  const hasVariants = product.variants && product.variants.length > 0;
  if (hasVariants) {
    const minPrice = Math.min(...product.variants!.map(v => v.price));
    return {
      type: 'variants',
      price: minPrice
    };
  }
  
  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.basePrice;
  return {
    type: hasDiscount ? 'discount' : 'standard',
    price: hasDiscount ? product.discountPrice! : product.basePrice,
    originalPrice: product.basePrice
  };
};

interface BlogRelatedProductsProps {
  productIds: number[];
}

export const BlogRelatedProducts = ({ productIds }: BlogRelatedProductsProps) => {
  const [products, setProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    if (!productIds || productIds.length === 0) return;
    
    const allProducts = getProducts();
    const related = allProducts.filter(p => productIds.includes(Number(p.id)));
    setTimeout(() => {
      setProducts(related);
    }, 0);
  }, [productIds]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 300;
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="py-8 bg-gray-50 border-t mt-12 rounded-xl px-6">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold text-gray-800 border-r-4 border-[#db2777] pr-3">محصولات مرتبط با مقاله</h2>
      </div>
      
      <div className="relative group">
        {/* Navigation Buttons */}
        <button 
          onClick={() => scroll('right')} 
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 text-gray-600 hover:text-[#db2777] opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
          style={{ marginRight: '-20px' }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        
        <button 
          onClick={() => scroll('left')} 
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 text-gray-600 hover:text-[#db2777] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ marginLeft: '-20px' }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Container */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="min-w-[260px] w-[260px] snap-start bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <Link href={`/product/${product.slug || product.id}`} className="block relative h-56 bg-gray-50 flex items-center justify-center group/image">
                 {/* Discount Badge */}
                 {product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.basePrice && (
                   <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                     {Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)}%
                   </div>
                 )}
                 
                 <div className="w-40 h-40 relative transition-transform duration-500 group-hover/image:scale-110">
                    <Image
                      src={product.image || '/placeholder.svg'}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                 </div>
              </Link>

              <div className="p-4">
                 <div className="text-xs text-gray-400 mb-1">{product.category}</div>
                 <Link href={`/product/${product.slug || product.id}`}>
                    <h3 className="font-bold text-gray-800 mb-2 truncate hover:text-[#db2777] transition-colors">{product.name}</h3>
                 </Link>
                 
                 <div className="flex items-center justify-between mt-3">
                   <div className="flex flex-col">
                      {(() => {
                        const priceInfo = getProductPriceDisplay(product);
                        if (priceInfo.type === 'variants') {
                          return (
                            <>
                              <span className="text-[10px] text-gray-500 font-normal">شروع قیمت از</span>
                              <span className="text-[#db2777] font-bold text-lg">
                                {priceInfo.price.toLocaleString()} <span className="text-xs text-gray-500">تومان</span>
                              </span>
                            </>
                          );
                        }
                        return (
                          <>
                            {priceInfo.type === 'discount' && (
                              <span className="text-gray-400 text-xs line-through">{priceInfo.originalPrice!.toLocaleString()}</span>
                            )}
                            <span className={priceInfo.type === 'discount' ? "text-[#db2777] font-bold text-lg" : "text-gray-800 font-bold text-lg"}>
                              {priceInfo.price.toLocaleString()} <span className="text-xs text-gray-500">تومان</span>
                            </span>
                          </>
                        );
                      })()}
                   </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
