'use client';

import React, { useState } from 'react';
import { X, ShoppingCart, Check, Star, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductItem, formatPriceToman } from '@/data/products';
import { useCart } from '@/context/CartContext';

interface QuickViewModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    const price = typeof product.discountPrice === 'number' && product.discountPrice > 0
      ? product.discountPrice
      : product.basePrice;
    addToCart({
      id: product.id,
      name: product.name,
      price,
      quantity: 1,
      image: product.image || '/placeholder.svg',
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-gray-100 transition-colors shadow-sm"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-gray-50 relative min-h-[300px] md:min-h-full flex items-center justify-center p-8">
          <div className="relative w-full aspect-square max-w-[350px]">
            <Image
              src={product.image || '/placeholder.svg'}
              alt={product.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
          <div className="mb-auto">
             <div className="text-sm text-gray-500 mb-2">{product.category}</div>
             <h2 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h2>
             
             <div className="flex items-center gap-4 mb-6">
               <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-sm font-medium">
                 <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                 {product.rating || 4.5}
               </div>
               <div className="text-sm text-gray-400">
                 ({product.reviews || 0} دیدگاه)
               </div>
             </div>

             <div className="flex items-center gap-3 mb-6">
               {product.discountPrice && product.discountPrice > 0 ? (
                 <>
                   <span className="text-2xl font-bold text-[#83b735]">
                     {formatPriceToman(product.discountPrice)}
                   </span>
                   <span className="text-lg text-gray-400 line-through">
                     {formatPriceToman(product.basePrice)}
                   </span>
                 </>
               ) : (
                 <span className="text-2xl font-bold text-[#83b735]">
                   {formatPriceToman(product.basePrice)}
                 </span>
               )}
             </div>

             <p className="text-gray-600 leading-relaxed mb-6 line-clamp-4 text-sm md:text-base">
               {product.description}
             </p>

             {product.stock === 0 && (
                <div className="mb-4 text-red-500 font-medium bg-red-50 p-3 rounded-lg text-center">
                  این محصول در حال حاضر ناموجود است.
                </div>
             )}
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                product.stock === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isAdded 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-200' 
                    : 'bg-[#83b735] text-white hover:bg-[#6da025] shadow-lg shadow-[#83b735]/30'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-5 h-5" />
                  به سبد اضافه شد
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  {product.stock === 0 ? 'ناموجود' : 'افزودن به سبد خرید'}
                </>
              )}
            </button>
            <Link 
              href={`/product/${product.slug || product.id}`}
              className="px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              جزئیات
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
