'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPriceToman, ProductItem } from '@/data/products';
import { ChevronLeft, Eye, Star } from 'lucide-react';
import QuickViewModal from './QuickViewModal';

const getProductPriceDisplay = (product: ProductItem) => {
  const hasVariants = product.variants && product.variants.length > 0;
  if (hasVariants) {
    const minPrice = Math.min(...product.variants!.map(v => v.price));
    return { type: 'variants', price: minPrice };
  }
  const hasDiscount = product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.basePrice;
  return {
    type: hasDiscount ? 'discount' : 'standard',
    price: hasDiscount ? product.discountPrice! : product.basePrice,
    originalPrice: product.basePrice
  };
};

export const FeaturedProducts = ({ initialProducts }: { initialProducts?: ProductItem[] }) => {
  const products: ProductItem[] = (initialProducts || []).slice(0, 6);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  // Removed unused wishlist hooks

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % products.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [products.length, activeIndex]);

  const handleQuickView = (e: React.MouseEvent, product: ProductItem) => {
    e.preventDefault();
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  if (products.length === 0) return null;

  const activeProduct = products[activeIndex];

  return (
    <section className="py-12 bg-white">
      <QuickViewModal 
        product={selectedProduct} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
      />
      
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 bg-[#db2777] rounded-full"></div>
             <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">محصولات ویژه و پرفروش</h2>
          </div>
          <Link href="/shop" className="group flex items-center gap-2 text-gray-500 hover:text-[#db2777] transition-colors bg-white border border-gray-200 px-4 py-2 rounded-full font-medium text-sm hover:shadow-sm">
            <span>مشاهده همه</span>
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side: Highlighted Product (Big Card) */}
          {/* Using order-last lg:order-first to put it on Left in LTR, but in RTL layout it should be on the Right? 
              User said "Left section". In Persian (RTL), "Left" is the end. 
              If I use flex-row, the first item is Right. 
              To put it on the Left (visually), I need it to be the last item in DOM or use flex-row-reverse.
              Let's assume standard RTL: First item = Right. Last item = Left.
              User said "Left section". So I will place it physically on the left.
              In RTL, 'flex-row' puts first child on Right. 
              So for "Left Section", I should put this div SECOND in the code, or use 'order'.
              Let's just use flex-row and put this as the SECOND child in the code for RTL natural flow?
              Wait, if I want it on the Left, in RTL, that's the END of the row.
              So: [Grid (Right)] [Highlight (Left)]
          */}
          
          <div className="w-full lg:w-[35%] order-2 lg:order-2 flex flex-col">
             {activeProduct && (
               <div className="bg-white border-2 border-dashed border-[#db2777]/30 rounded-[32px] p-6 h-full relative group transition-all duration-500 hover:border-[#db2777] flex flex-col">
                 
                 {/* Number Badge */}
                 <div className="absolute top-6 right-6 w-12 h-12 rounded-full border-2 border-[#db2777] flex items-center justify-center text-[#db2777] font-bold text-xl z-10 bg-white">
                   {activeIndex + 1}
                 </div>

                 {/* Discount Badge */}
                 {activeProduct.discountPrice && activeProduct.discountPrice < activeProduct.basePrice && (
                    <div className="absolute top-6 left-6 bg-[#db2777] text-white px-3 py-1 rounded-full font-bold shadow-md z-10">
                      {Math.round(((activeProduct.basePrice - activeProduct.discountPrice) / activeProduct.basePrice) * 100)}%
                    </div>
                 )}

                 {/* Image */}
                 <div className="relative aspect-square w-full mb-6 bg-gray-50 rounded-2xl overflow-hidden group-hover:shadow-inner transition-all">
                    <Link href={`/product/${activeProduct.slug || activeProduct.id}`} className="block w-full h-full">
                      {activeProduct.image ? (
                        <Image
                          src={activeProduct.image}
                          alt={activeProduct.name}
                          fill
                          className="object-contain p-8 transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">تصویر محصول</div>
                      )}
                    </Link>
                    
                    {/* Timer / Progress Bar */}
                    <div className="absolute bottom-0 left-0 h-1.5 bg-[#db2777] z-20" key={activeIndex} style={{ animation: 'progress 5s linear' }}></div>
                    <style jsx global>{`
                      @keyframes progress {
                        from { width: 0%; }
                        to { width: 100%; }
                      }
                    `}</style>
                 </div>

                 {/* Content */}
                 <div className="flex-grow flex flex-col text-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2 line-clamp-2 hover:text-[#db2777] transition-colors">
                      <Link href={`/product/${activeProduct.slug || activeProduct.id}`}>{activeProduct.name}</Link>
                    </h3>
                    
                    <div className="flex items-center justify-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-xs text-gray-400 mr-2">(۵ نظر)</span>
                    </div>

                    <div className="mt-auto space-y-4">
                      {/* Price */}
                      <div className="flex items-center justify-center gap-3">
                         {(() => {
                            const priceInfo = getProductPriceDisplay(activeProduct);
                            if (priceInfo.type === 'variants') {
                              return <div className="text-[#db2777] font-bold text-2xl">{formatPriceToman(priceInfo.price)} <span className="text-sm font-normal text-gray-500">شروع از</span></div>;
                            }
                            return (
                              <>
                                {priceInfo.type === 'discount' && (
                                  <span className="text-gray-400 line-through text-lg">{formatPriceToman(priceInfo.originalPrice!)}</span>
                                )}
                                <span className="text-[#db2777] font-bold text-2xl">{formatPriceToman(priceInfo.price)}</span>
                              </>
                            );
                         })()}
                      </div>

                      <div className="text-gray-500 text-sm mb-4">
                         موجودی محدود! همین حالا سفارش دهید.
                      </div>

                      {/* Action Button */}
                      <div className="flex gap-3">
                        <button 
                           onClick={(e) => handleQuickView(e, activeProduct)}
                           className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:border-[#db2777] hover:text-[#db2777] transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="w-5 h-5" />
                          مشاهده سریع
                        </button>
                        <button className="flex-1 py-3 rounded-xl bg-[#db2777] text-white font-bold hover:bg-[#be185d] transition-colors shadow-lg shadow-pink-200">
                          افزودن به سبد
                        </button>
                      </div>
                    </div>
                 </div>
               </div>
             )}
          </div>

          {/* Right Side: Grid of Small Cards */}
          {/* order-1 to put it on Right in RTL */}
          <div className="w-full lg:w-[65%] order-1 lg:order-1">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
               {products.map((product, idx) => (
                 <div 
                   key={product.id} 
                   className={`bg-white rounded-2xl p-4 border transition-all duration-300 hover:shadow-lg group flex flex-col relative
                     ${idx === activeIndex ? 'border-[#db2777] ring-1 ring-[#db2777] shadow-md transform scale-[1.02]' : 'border-gray-100 hover:border-gray-200'}
                   `}
                   onMouseEnter={() => setActiveIndex(idx)} // Interactive: Hover to set active
                 >
                   {/* Discount % */}
                   {product.discountPrice && product.discountPrice < product.basePrice && (
                      <div className="absolute top-3 left-3 bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)}%
                      </div>
                   )}

                   <div className="relative h-32 w-full mb-3 bg-gray-50 rounded-xl overflow-hidden">
                      <Link href={`/product/${product.slug || product.id}`}>
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill className="object-contain p-2" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">تصویر</div>
                        )}
                      </Link>
                   </div>

                   <div className="text-center flex-grow flex flex-col">
                      <Link href={`/product/${product.slug || product.id}`}>
                        <h4 className={`font-bold text-sm mb-2 line-clamp-2 min-h-[2.5rem] transition-colors ${idx === activeIndex ? 'text-[#db2777]' : 'text-gray-800'}`}>
                          {product.name}
                        </h4>
                      </Link>
                      
                      <div className="mt-auto">
                        {(() => {
                            const priceInfo = getProductPriceDisplay(product);
                            if (priceInfo.type === 'variants') {
                              return <div className="text-gray-800 font-bold text-sm">{formatPriceToman(priceInfo.price)}</div>;
                            }
                            return (
                              <div className="flex flex-col items-center">
                                {priceInfo.type === 'discount' && (
                                  <span className="text-xs text-gray-400 line-through">{formatPriceToman(priceInfo.originalPrice!)}</span>
                                )}
                                <span className={`font-bold text-sm ${priceInfo.type === 'discount' ? 'text-[#db2777]' : 'text-gray-800'}`}>
                                  {formatPriceToman(priceInfo.price)}
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
      </div>
    </section>
  );
};
