'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { getProductById, getReservedQty } from '@/data/products';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();
  
  const handleCheckout = () => {
    if (items.length === 0) return;
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">سبد خرید شما</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Cart Items List */}
          <div className="flex-grow space-y-4">
            {items.map((item) => (
              <div key={`${item.id}-${item.variantId || 'default'}-${item.hasGiftWrap ? 'gift' : 'no-gift'}`} className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center text-gray-400 text-xs overflow-hidden relative">
                  {item.image ? (
                     <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                  ) : (
                    <span>تصویر</span>
                  )}
                </div>
                
                <div className="flex-grow">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  {item.color && <p className="text-sm text-gray-500 mb-2">رنگ: {item.color}</p>}
                  {item.size && <p className="text-sm text-gray-500 mb-2">سایز: {item.size}</p>}
                  {item.hasGiftWrap && (
                    <p className="text-sm text-[#83b735] mb-2 font-medium">
                      بسته‌بندی کادویی (+{(item.giftWrapPrice || 0).toLocaleString()} تومان)
                    </p>
                  )}
                  <div className="text-[#83b735] font-semibold">
                    {(item.price + (item.hasGiftWrap ? (item.giftWrapPrice || 0) : 0)).toLocaleString()} تومان
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-md">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId, item.hasGiftWrap)}
                      className="p-2 hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId, item.hasGiftWrap)}
                      className="p-2 hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                      disabled={item.quantity >= Math.max(0, ((getProductById(item.id)?.stock ?? Infinity) as number) - getReservedQty(item.id))}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id, item.variantId, item.hasGiftWrap)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border">
                <p className="text-gray-500 mb-4">سبد خرید شما خالی است</p>
                <Link href="/shop" className="text-[#83b735] hover:underline">بازگشت به فروشگاه</Link>
              </div>
            )}
          </div>

          {/* Order Summary */}
          {items.length > 0 && (
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-24">
                <h2 className="text-lg font-bold mb-4 text-gray-800">خلاصه سفارش</h2>
                
                <div className="space-y-3 text-sm text-gray-600 pb-4 border-b">
                  <div className="flex justify-between">
                    <span>مجموع اقلام ({totalItems})</span>
                    <span>{subtotal.toLocaleString()} تومان</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    هزینه ارسال و مالیات در مرحله پرداخت محاسبه می‌شود.
                  </div>
                </div>
                
                <div className="flex justify-between font-bold text-gray-900 py-4 text-lg">
                  <span>مبلغ قابل پرداخت</span>
                  <span className="text-[#83b735]">{subtotal.toLocaleString()} تومان</span>
                </div>

                <button onClick={handleCheckout} className="w-full bg-[#83b735] text-white py-3 rounded-md font-bold hover:bg-[#6da025] transition-colors flex items-center justify-center gap-2">
                  ادامه جهت تسویه حساب
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
