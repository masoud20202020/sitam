'use client';

import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, ArrowLeft, ChevronRight, ChevronLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { getProducts, formatPriceToman, ProductItem } from '@/data/products';
import { getActiveCategories } from '@/data/categories';
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

interface RelatedProductsProps {
  categoryId?: string;
  currentProductId: string | number;
}

export const RelatedProducts = ({ categoryId, currentProductId }: RelatedProductsProps) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const handleQuickView = (e: React.MouseEvent, product: ProductItem) => {
    e.preventDefault();
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  useEffect(() => {
    if (!categoryId) return;
    
    // Find category slug
    const cats = getActiveCategories();
    const c = cats.find(cat => cat.name === categoryId);
    if (c?.slug) {
      setTimeout(() => {
        setCategorySlug(c.slug!);
      }, 0);
    }

    // Filter products that are in the same category and not the current product
    const related = getProducts().filter(p => 
      p.category === categoryId && 
      String(p.id) !== String(currentProductId) &&
      p.published !== false
    );
    setTimeout(() => {
      setProducts(related);
    }, 0);
  }, [categoryId, currentProductId]);

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

  if (products.length === 0) return null;

  return (
    <section className="py-8 bg-white border-t mt-8">
      <QuickViewModal 
        product={selectedProduct} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
      />
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold text-gray-800 border-r-4 border-[#db2777] pr-3">محصولات مرتبط</h2>
          <Link href={categorySlug ? `/category/${categorySlug}` : `/shop?category=${categoryId}`} className="flex items-center text-[#db2777] text-sm hover:underline">
             مشاهده همه
             <ArrowLeft className="w-4 h-4 mr-1" />
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
                className="min-w-[280px] w-[280px] snap-start bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <Link href={`/product/${product.slug || product.id}`} className="block relative h-64 bg-gray-50 flex items-center justify-center">
                   {/* Discount Badge */}
                   {product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.basePrice && (
                     <div className="absolute top-3 left-3 bg-[#db2777] text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                       {Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)}%
                     </div>
                   )}

                   {/* Wishlist Button - Top Right */}
                   <button 
                      className={`absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all z-10 ${isInWishlist(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                   >
                      <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                   </button>

                   {product.image ? (
                     <div className="relative w-full h-full p-4">
                       <Image 
                         src={product.image} 
                         alt={product.name} 
                         fill 
                         className="object-contain transition-transform duration-500 group-hover:scale-110" 
                       />
                     </div>
                   ) : (
                     <span className="text-gray-400">تصویر محصول</span>
                   )}
               </Link>
               
               <div className="p-4 flex flex-col">
                 <div className="text-xs text-gray-400 mb-2">{product.brand || product.category}</div>
                 <Link href={`/product/${product.slug || product.id}`}>
                   <h3 className="font-bold text-gray-800 mb-3 truncate hover:text-[#db2777] transition-colors">
                     {product.name}
                   </h3>
                 </Link>
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex flex-col">
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
                         <>
                           {priceInfo.type === 'discount' && (
                             <span className="text-xs text-gray-400 line-through">
                               {formatPriceToman(priceInfo.originalPrice!)}
                             </span>
                           )}
                           <span className="text-[#db2777] font-bold text-lg">
                             {formatPriceToman(priceInfo.price)}
                           </span>
                         </>
                       );
                     })()}
                   </div>
                    {product.stock === 0 && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">ناموجود</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-3 pt-2 border-t border-gray-50">
                    <button 
                      onClick={(e) => handleQuickView(e, product)}
                      className="group/btn flex items-center justify-center gap-0 hover:gap-2 bg-pink-50 text-[#db2777] h-10 px-3 rounded-xl font-medium hover:bg-[#db2777] hover:text-white transition-all duration-700"
                      title="مشاهده سریع"
                    >
                      <Eye className="w-4 h-4 flex-shrink-0" />
                      <span className="max-w-0 overflow-hidden opacity-0 group-hover/btn:max-w-[100px] group-hover/btn:opacity-100 transition-all duration-700 whitespace-nowrap text-xs">
                        مشاهده سریع
                      </span>
                    </button>
                    
                    <button 
                      className="group/btn flex items-center justify-center gap-0 hover:gap-2 bg-[#db2777] text-white h-10 px-3 rounded-xl shadow-md hover:bg-[#be185d] transition-all duration-700 hover:shadow-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        // Add to cart logic
                      }} 
                      title="افزودن به سبد خرید"
                    >
                      <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                      <span className="max-w-0 overflow-hidden opacity-0 group-hover/btn:max-w-[120px] group-hover/btn:opacity-100 transition-all duration-700 whitespace-nowrap text-xs">
                        افزودن به سبد خرید
                      </span>
                    </button>
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
