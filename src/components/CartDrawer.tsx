'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const CartDrawer = () => {
  const { 
    isCartOpen, 
    closeCart, 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    subtotal, 
    totalItems 
  } = useCart();
  
  // We need a mounted state to prevent hydration errors or initial flash
  const [mounted, setMounted] = useState(false);

  const handleClearCart = () => {
    if (window.confirm('آیا از خالی کردن سبد خرید اطمینان دارید؟')) {
      clearCart();
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 z-[60] ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 transition-all duration-500 ease-in-out ${
          isCartOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-full sm:w-[400px] bg-white shadow-2xl transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col ${
          isCartOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#83b735]" />
            <h2 className="font-bold text-gray-800">سبد خرید ({totalItems})</h2>
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button 
                onClick={handleClearCart}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center gap-1"
                title="خالی کردن سبد خرید"
              >
                <span className="text-xs font-medium hidden sm:inline">خالی کردن</span>
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={closeCart}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <ShoppingBag className="w-16 h-16 opacity-20" />
              <p>سبد خرید شما خالی است</p>
              <button 
                onClick={closeCart}
                className="text-[#83b735] font-medium hover:underline"
              >
                بازگشت به فروشگاه
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={`${item.id}-${item.variantId || 'default'}-${item.hasGiftWrap ? 'gift' : 'no-gift'}`} className="flex gap-4 border-b pb-4 last:border-0">
                <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 relative overflow-hidden">
                  {item.image ? (
                     <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">تصویر</div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2">{item.name}</h3>
                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                      {item.color && <span>رنگ: {item.color} | </span>}
                      {item.size && <span>سایز: {item.size}</span>}
                      {item.hasGiftWrap && (
                        <div className="text-[#83b735] flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-[#83b735]"></span>
                          <span>بسته‌بندی کادویی (+{(item.giftWrapPrice || 0).toLocaleString()} تومان)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border rounded-md h-8">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId, item.hasGiftWrap)}
                        className="px-2 hover:bg-gray-100 text-gray-600 disabled:opacity-50 h-full flex items-center"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId, item.hasGiftWrap)}
                        className="px-2 hover:bg-gray-100 text-gray-600 disabled:opacity-50 h-full flex items-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#83b735]">
                        {(item.price * item.quantity + (item.hasGiftWrap ? (item.giftWrapPrice || 0) * item.quantity : 0)).toLocaleString()} تومان
                      </span>
                      <button 
                        onClick={() => removeFromCart(item.id, item.variantId, item.hasGiftWrap)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t bg-gray-50 space-y-4 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-10">
            <div className="flex justify-between items-center font-bold text-gray-800">
              <span>جمع کل:</span>
              <span>{subtotal.toLocaleString()} تومان</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Link 
                href="/cart"
                onClick={closeCart}
                className="col-span-1 py-3 px-4 bg-white border border-[#83b735] text-[#83b735] text-center rounded-lg font-bold hover:bg-[#83b735] hover:text-white transition-colors"
              >
                مشاهده سبد خرید
              </Link>
              <Link 
                href="/checkout"
                onClick={closeCart}
                className="col-span-1 py-3 px-4 bg-[#83b735] text-white text-center rounded-lg font-bold hover:bg-[#6da025] transition-colors shadow-lg shadow-[#83b735]/30"
              >
                تسویه حساب
              </Link>
            </div>
            
            <button 
              onClick={closeCart}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1"
            >
              <span>ادامه خرید</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
