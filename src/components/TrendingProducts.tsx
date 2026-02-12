'use client';

import React, { useState } from 'react';
import { Heart, ShoppingCart, ArrowLeft, ChevronRight, ChevronLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { formatPriceToman, ProductItem } from '@/data/products';
import Image from 'next/image';
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

export const TrendingProducts = ({ initialProducts }: { initialProducts?: ProductItem[] }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const products = (initialProducts || []).filter(p => p.isTrending && p.published !== false);
  // Removed unused scrollPosition state
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 300; // Adjust scroll amount as needed
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const handleQuickView = (e: React.MouseEvent, product: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  if (products.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <QuickViewModal 
        product={selectedProduct} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
      />
      
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
           <div className="flex items-center gap-3">
             <div className="w-2 h-10 bg-[#db2777] rounded-lg shadow-md rotate-3"></div>
             <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">محصولات <span className="text-[#db2777]">ترند</span></h2>
           </div>
           <Link href="/shop?filter=trending" className="flex items-center text-gray-500 hover:text-[#db2777] transition-colors font-medium group">
             <span className="hidden md:inline">مشاهده همه</span>
             <div className="bg-gray-100 p-2 rounded-full mr-2 group-hover:bg-[#db2777] group-hover:text-white transition-all">
                <ArrowLeft className="w-4 h-4" />
             </div>
           </Link>
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
            className="flex gap-6 overflow-x-auto pb-8 hide-scrollbar snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <div 
                key={product.id} 
                className="min-w-[280px] w-[280px] snap-start bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-[#db2777] transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <Link href={`/product/${product.slug || product.id}`} className="block relative h-72 bg-gray-50 flex items-center justify-center group/image">
                   {/* Discount Badge */}
                   {product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.basePrice && (
                     <div className="absolute top-3 right-3 bg-[#db2777] text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                       {Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)}%
                     </div>
                   )}

                   {product.image ? (
                     <div className="relative w-full h-full p-6">
                       <Image 
                         src={product.image} 
                         alt={product.name} 
                         fill 
                         className="object-contain transition-transform duration-500 group-hover/image:scale-110" 
                       />
                     </div>
                   ) : (
                     <span className="text-gray-400">تصویر محصول</span>
                   )}
                   
                   {/* Quick Actions Overlay (Center) */}
                   <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 z-20">
                     <button 
                       className={`w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition-all hover:bg-[#db2777] hover:text-white ${isInWishlist(product.id) ? 'text-[#db2777]' : 'text-gray-600'}`} 
                       title={isInWishlist(product.id) ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی"}
                       onClick={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         toggleWishlist(product);
                       }}
                     >
                       <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                     </button>
                     <button 
                      className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-[#db2777] hover:text-white transition-all" 
                      title="مشاهده سریع"
                      onClick={(e) => handleQuickView(e, product)}
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                   </div>

                   {/* Add to Cart Button (Bottom Left) */}
                   <button 
                     className="absolute bottom-3 left-3 w-10 h-10 rounded-full bg-[#db2777] text-white shadow-md flex items-center justify-center hover:bg-[#be185d] hover:scale-110 transition-all z-20 opacity-0 group-hover/image:opacity-100 translate-y-2 group-hover/image:translate-y-0 duration-300"
                     title="افزودن به سبد خرید"
                     onClick={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       // Add to cart logic here
                     }}
                   >
                     <ShoppingCart className="w-5 h-5" />
                   </button>
                </Link>
                
                <div className="p-5 text-center">
                  <div className="text-xs text-gray-400 mb-2">{product.brand || product.category}</div>
                  <Link href={`/product/${product.slug || product.id}`}>
                    <h3 className="font-bold text-gray-800 mb-3 truncate hover:text-[#db2777] transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-center gap-2">
                      {(() => {
                        const priceInfo = getProductPriceDisplay(product);
                        if (priceInfo.type === 'variants') {
                          return (
                            <>
                              <span className="text-[10px] text-gray-500 font-normal">شروع قیمت از</span>
                              <span className="text-[#db2777] font-bold text-lg">
                                {formatPriceToman(priceInfo.price)}
                              </span>
                            </>
                          );
                        }
                        return (
                          <div className="flex flex-col items-center">
                            {priceInfo.type === 'discount' && (
                              <span className="text-xs text-gray-400 line-through mb-1">
                                {formatPriceToman(priceInfo.originalPrice!)}
                              </span>
                            )}
                            <span className="text-[#db2777] font-bold text-lg">
                              {formatPriceToman(priceInfo.price)} <span className="text-sm font-normal text-gray-500">تومان</span>
                            </span>
                          </div>
                        );
                      })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
