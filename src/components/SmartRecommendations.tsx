'use client';

import React, { useEffect, useState } from 'react';
import { ProductItem } from '@/data/products';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Sparkles } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';

export const SmartRecommendations = ({ initialProducts }: { initialProducts?: ProductItem[] }) => {
  const [recommendations, setRecommendations] = useState<ProductItem[]>([]);
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    try {
      // 1. Get History
      const rawHistory = localStorage.getItem('viewed_history');
      if (!rawHistory) return;

      const history: { id: string | number; category: string; timestamp: number }[] = JSON.parse(rawHistory);
      if (history.length === 0) return;

      // 2. Get most recent interaction
      const lastViewed = history[0];
      const recentCategories = Array.from(new Set(history.map(h => h.category).filter(Boolean)));
      const viewedIds = new Set(history.map(h => String(h.id)));

      // 3. Get all products
      const allProducts = initialProducts || [];

      // 4. Algorithm: Find related products
      // Priority 1: Same category as last viewed, but not viewed yet
      // Priority 2: Same category as other viewed items
      
      let recs = allProducts.filter(p => 
        p.category === lastViewed.category && 
        !viewedIds.has(String(p.id)) &&
        p.published !== false
      );

      // If not enough, look at other recent categories
      if (recs.length < 4) {
        const otherRecs = allProducts.filter(p => 
          recentCategories.includes(p.category) && 
          p.category !== lastViewed.category &&
          !viewedIds.has(String(p.id)) &&
          p.published !== false
        );
        recs = [...recs, ...otherRecs];
      }

      // If still not enough, fill with trending
      if (recs.length < 4) {
        const trending = allProducts.filter(p => 
          p.isTrending && 
          !viewedIds.has(String(p.id)) && 
          !recs.find(r => r.id === p.id) &&
          p.published !== false
        );
        recs = [...recs, ...trending];
      }

      setTimeout(() => {
        setRecommendations(recs.slice(0, 8));
      }, 0);
      
      // Set dynamic title based on context
      const lastProduct = allProducts.find(p => String(p.id) === String(lastViewed.id));
      if (lastProduct) {
        setTimeout(() => {
          setReason(`چون از "${lastProduct.name}" بازدید کردید`);
        }, 0);
      } else {
        setTimeout(() => {
          setReason('پیشنهادات ویژه برای شما');
        }, 0);
      }

    } catch (e) {
      console.error('Error generating recommendations', e);
    }
  }, [initialProducts]);

  if (recommendations.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-6 h-6 text-[#83b735]" />
        <h2 className="text-2xl font-bold text-gray-800">پیشنهادهای هوشمند</h2>
        <span className="text-sm text-gray-500 mr-auto bg-gray-100 px-3 py-1 rounded-full">
          {reason}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border group overflow-hidden">
            <Link href={`/product/${product.slug || product.id}`} className="block relative aspect-square overflow-hidden bg-gray-100">
              {product.image ? (
                <Image 
                  src={product.image} 
                  alt={product.name} 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">تصویر</div>
              )}
              
              {/* Overlay Actions */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-300">
                <button 
                  className={`p-2 rounded-full shadow-md transition-colors ${isInWishlist(product.id) ? 'bg-white text-red-500' : 'bg-white text-gray-600 hover:text-[#83b735]'}`}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleWishlist(product);
                  }}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </button>
                <button className="bg-white p-2 rounded-full shadow-md text-gray-600 hover:text-[#83b735] transition-colors">
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>

              {product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.basePrice && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                  {Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)}%
                </div>
              )}
            </Link>

            <div className="p-4">
              <div className="text-xs text-gray-500 mb-1">{product.category}</div>
              <Link href={`/product/${product.slug || product.id}`}>
                <h3 className="font-bold text-gray-800 mb-2 truncate group-hover:text-[#83b735] transition-colors">
                  {product.name}
                </h3>
              </Link>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex flex-col">
                  {product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.basePrice ? (
                    <>
                      <span className="text-xs text-gray-400 line-through decoration-red-500/50">
                        {product.basePrice.toLocaleString()}
                      </span>
                      <span className="font-bold text-[#83b735]">
                        {product.discountPrice.toLocaleString()} <span className="text-xs text-gray-500">تومان</span>
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-gray-800">
                      {product.basePrice.toLocaleString()} <span className="text-xs text-gray-500">تومان</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
