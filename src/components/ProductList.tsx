'use client';

import React, { useState, useRef } from 'react';
import { Heart, ShoppingCart, ArrowLeft, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getProducts, formatPriceToman, ProductItem } from '@/data/products';
import { useWishlist } from '@/context/WishlistContext';
import QuickViewModal from './QuickViewModal';

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

interface ProductListProps {
  limit?: number;
  title?: string;
  showViewAll?: boolean;
  sort?: 'default' | 'latest';
  variant?: 'default' | 'boxed';
  initialProducts?: ProductItem[];
}

const isOutOfStock = (product: ProductItem) => {
  if (product.variants && product.variants.length > 0) {
    return product.variants.every(v => (v.stock || 0) <= 0);
  }
  return typeof product.stock === 'number' && product.stock <= 0;
};

export const ProductList = ({ limit, title = "محصولات پرفروش", showViewAll = false, sort = 'default', variant = 'default', initialProducts }: ProductListProps) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth / 1.5; // Scroll 2/3 of view
      
      // In RTL, scrollLeft is negative in some browsers or positive in reverse in others.
      // But scrollBy with negative value usually moves left.
      // To move LEFT (show next items in RTL), we use negative value.
      // To move RIGHT (show prev items in RTL), we use positive value.
      
      const scrollValue = direction === 'left' ? -scrollAmount : scrollAmount;
      container.scrollBy({ left: scrollValue, behavior: 'smooth' });
    }
  };
  
  const [products] = useState<ProductItem[]>(
    () => {
      if (initialProducts && initialProducts.length > 0) return initialProducts;
      
      let items = getProducts().filter(p => p.published !== false);
      if (sort === 'latest') {
        items = items.sort((a, b) => Number(b.id) - Number(a.id));
      }
      return items;
    }
  );

  const handleQuickView = (e: React.MouseEvent, product: ProductItem) => {
    e.preventDefault();
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  const displayProducts = limit ? products.slice(0, limit) : products;

  if (variant === 'boxed') {
    return (
      <section className="py-16 overflow-hidden">
        <QuickViewModal 
          product={selectedProduct} 
          isOpen={isQuickViewOpen} 
          onClose={() => setIsQuickViewOpen(false)} 
        />
        <div className="container mx-auto px-4 relative">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#db2777] rounded-full"></div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">{title}</h2>
            </div>
            {showViewAll && (
              <Link href="/shop" className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors bg-white border border-gray-200 px-6 py-2 rounded-full font-medium text-sm hover:shadow-sm">
                <span>مشاهده همه</span>
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </Link>
            )}
          </div>

          {/* Background Shape */}
          <div className="absolute top-24 left-0 right-0 h-[420px] bg-[#fce7f3] rounded-[50px] -skew-y-1 -z-10 transform origin-right mx-4 md:mx-0"></div>

          {/* Product List */}
          <div className="relative group/slider px-2">
            {/* Navigation Buttons */}
            <button 
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white text-gray-700 p-3 rounded-full shadow-lg opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:bg-[#db2777] hover:text-white translate-x-1/2 hidden md:flex"
              aria-label="Previous"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <button 
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white text-gray-700 p-3 rounded-full shadow-lg opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hover:bg-[#db2777] hover:text-white -translate-x-1/2 hidden md:flex"
              aria-label="Next"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-6 pb-12 pt-4 px-4 custom-scrollbar scroll-smooth snap-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayProducts.map((product) => (
                <div key={product.id} className="min-w-[280px] md:min-w-[300px] shrink-0 snap-center">
                  <div className="bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col group relative border border-gray-100/50">
                    
                    {/* Image Area */}
                    <div className="relative aspect-square mb-4 bg-gray-50 rounded-2xl overflow-hidden">
                      <Link href={`/product/${product.slug || product.id}`} className="block w-full h-full">
                         {product.image ? (
                          <Image 
                            src={product.image} 
                            alt={product.name} 
                            fill 
                            sizes="(max-width: 768px) 100vw, 300px"
                            className="object-contain p-4 transition-transform duration-500 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            تصویر محصول
                          </div>
                        )}
                      </Link>

                      {/* Discount Badge */}
                      {!isOutOfStock(product) && product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.basePrice && (
                        <div className="absolute top-3 right-3 bg-[#db2777] text-white w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm shadow-md z-10">
                          {Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)}%
                        </div>
                      )}

                      {isOutOfStock(product) && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                           <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">ناموجود</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-grow text-center">
                      <Link href={`/product/${product.slug || product.id}`}>
                        <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2 hover:text-[#db2777] transition-colors min-h-[3.5rem]">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="mt-auto space-y-3">
                        {/* Price */}
                        <div className="flex items-center justify-center gap-2 h-14">
                          {(() => {
                            const priceInfo = getProductPriceDisplay(product);
                            if (priceInfo.type === 'variants') {
                              return (
                                <div className="text-[#db2777] font-bold text-xl flex flex-col items-center">
                                  <span className="text-xs text-gray-500 font-normal">شروع قیمت از</span>
                                  {formatPriceToman(priceInfo.price)}
                                </div>
                              );
                            }
                            return (
                              <div className="flex flex-col items-center justify-center">
                                {priceInfo.type === 'discount' && (
                                  <span className="text-sm text-gray-400 line-through">
                                    {formatPriceToman(priceInfo.originalPrice!)}
                                  </span>
                                )}
                                <span className={`font-bold text-xl ${priceInfo.type === 'discount' ? 'text-[#db2777]' : 'text-gray-800'}`}>
                                  {formatPriceToman(priceInfo.price)}
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button 
                            onClick={(e) => handleQuickView(e, product)}
                            className="group flex items-center justify-center gap-0 hover:gap-2 bg-pink-50 text-[#db2777] h-12 px-4 rounded-xl font-medium hover:bg-[#db2777] hover:text-white transition-all duration-700"
                            title="مشاهده سریع"
                          >
                            <Eye className="w-5 h-5 flex-shrink-0" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-700 whitespace-nowrap text-sm">
                              مشاهده سریع
                            </span>
                          </button>
                          
                          <button 
                            className="group flex items-center justify-center gap-0 hover:gap-2 bg-[#db2777] text-white h-12 px-4 rounded-xl shadow-md hover:bg-[#be185d] transition-all duration-700 hover:shadow-lg"
                            onClick={(e) => {
                              e.preventDefault();
                              // Add to cart logic
                            }} 
                            title="افزودن به سبد خرید"
                          >
                            <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 transition-all duration-700 whitespace-nowrap text-sm">
                              افزودن به سبد خرید
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <QuickViewModal 
        product={selectedProduct} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
      />
      
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
           <div className="flex items-center gap-3">
             <div className="w-2 h-10 bg-[#83b735] rounded-lg shadow-md rotate-3"></div>
             <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">{title}</h2>
           </div>
           {showViewAll && (
             <Link href="/shop" className="flex items-center text-gray-500 hover:text-[#83b735] transition-colors font-medium group">
               <span className="hidden md:inline">مشاهده همه</span>
               <div className="bg-gray-100 p-2 rounded-full mr-2 group-hover:bg-[#83b735] group-hover:text-white transition-all">
                  <ArrowLeft className="w-4 h-4" />
               </div>
             </Link>
           )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {displayProducts.map((product) => (
            <div key={product.id} className="group bg-white border rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <Link href={`/product/${product.slug || product.id}`} className="block relative h-40 md:h-64 bg-gray-100 flex items-center justify-center">
                {/* Discount Badge */}
                {product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.basePrice && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                    {Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)}%
                  </div>
                )}
                
                {product.image ? (
                  <div className="relative w-full h-full p-4">
                    <Image 
                      src={product.image} 
                      alt={product.name} 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                      className="object-contain transition-transform duration-500 group-hover:scale-105" 
                    />
                  </div>
                ) : (
                  <span className="text-gray-400">تصویر محصول</span>
                )}
                
                {/* Quick Actions */}
                {!isOutOfStock(product) && (
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className={`bg-white p-2 rounded-full shadow hover:bg-[#83b735] hover:text-white transition-colors ${isInWishlist(product.id) ? 'text-red-500 hover:bg-red-500' : ''}`} 
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWishlist(product);
                    }}
                  >
                    <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    className="bg-white p-2 rounded-full shadow hover:bg-[#83b735] hover:text-white transition-colors" 
                    onClick={(e) => handleQuickView(e, product)}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button className="bg-white p-2 rounded-full shadow hover:bg-[#83b735] hover:text-white transition-colors" onClick={(e) => e.preventDefault()}>
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
                )}
              </Link>
              
              <div className="p-4 text-center">
                <div className="text-xs text-gray-500 mb-1">{product.category}</div>
                <Link href={`/product/${product.slug || product.id}`}>
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-[#83b735] cursor-pointer transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex flex-col items-center gap-1">
                  {(() => {
                    const priceInfo = getProductPriceDisplay(product);
                    if (priceInfo.type === 'variants') {
                      return (
                        <div className="text-[#83b735] font-semibold flex flex-col items-center">
                          <span className="text-[10px] text-gray-500 font-normal">شروع قیمت از</span>
                          {formatPriceToman(priceInfo.price)}
                        </div>
                      );
                    }
                    return (
                      <>
                        {priceInfo.type === 'discount' && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPriceToman(priceInfo.originalPrice!)}
                          </span>
                        )}
                        <div className="text-[#83b735] font-semibold">
                          {formatPriceToman(priceInfo.price)}
                        </div>
                      </>
                    );
                  })()}
                </div>
                {product.stock === 0 && (
                  <div className="mt-1 text-xs text-red-600">ناموجود</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {showViewAll && (
           <div className="mt-8 text-center md:hidden">
             <Link href="/shop" className="inline-flex items-center text-[#83b735] border border-[#83b735] px-4 py-2 rounded-md hover:bg-[#83b735] hover:text-white transition-colors">
               مشاهده همه محصولات
               <ArrowLeft className="w-4 h-4 mr-2" />
             </Link>
           </div>
        )}
      </div>
    </section>
  );
};
