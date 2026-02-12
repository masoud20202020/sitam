import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getOrderById } from '@/data/account';
import Link from 'next/link';
import Image from 'next/image';

export default async function OrderConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrderById(id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white border rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">تأیید سفارش</h1>
          {order ? (
            <>
              <div className="text-sm text-gray-600 mb-6">
                <div>شماره سفارش: <span className="font-bold text-gray-900">{order.id}</span></div>
                <div>وضعیت: <span className="font-bold">{order.status}</span></div>
                {order.shippingMethod && <div>روش ارسال: {order.shippingMethod === 'express' ? 'فوری' : 'عادی'}</div>}
                {order.trackingNumber && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg inline-block">
                    <span className="text-blue-800 font-medium">کد رهگیری مرسوله: </span>
                    <span className="font-mono font-bold text-blue-900 mr-2 select-all">{order.trackingNumber}</span>
                  </div>
                )}
                {order.paymentMethod && <div className="mt-2">روش پرداخت: {order.paymentMethod === 'online' ? 'آنلاین' : 'پرداخت در محل'}</div>}
              </div>

              <div className="space-y-4">
                {order.items.map((it, idx) => (
                  <div key={`${it.id}-${it.variantId || idx}`} className="flex items-center justify-between border rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      {it.image && (
                        <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          <Image 
                            src={it.image} 
                            alt={it.name} 
                            fill 
                            className="object-cover" 
                            sizes="64px"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900">{it.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1 flex-wrap">
                          <span>تعداد: {it.quantity}</span>
                          {it.color && (
                            <>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>رنگ: {it.color}</span>
                            </>
                          )}
                          {it.size && (
                            <>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span>سایز: {it.size}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-[#83b735] font-bold">{it.price.toLocaleString()} تومان</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6 border-t pt-6">
                <div className="text-sm text-gray-600">
                  {typeof order.discount === 'number' && order.discount > 0 && (
                    <div>تخفیف اعمال‌شده: {order.discount.toLocaleString()} تومان</div>
                  )}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  مبلغ کل: <span className="text-[#83b735]">{order.total.toLocaleString()} تومان</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Link href="/account" className="text-sm text-[#83b735]">مشاهده در حساب کاربری</Link>
                <Link href="/shop" className="text-sm text-gray-600 hover:text-gray-900">ادامه خرید</Link>
              </div>
            </>
          ) : (
            <div className="text-gray-600">
              سفارش یافت نشد. لطفاً از حساب کاربری وضعیت سفارش‌ها را بررسی کنید.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
