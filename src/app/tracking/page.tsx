'use client';

import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react';
import { getOrders, Order } from '@/data/account';
import { formatPriceToman } from '@/data/products';
import Link from 'next/link';

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setSearched(true);
    setError('');
    
    const allOrders = getOrders();
    // Try to find by exact ID match (string or number comparison)
    const found = allOrders.find(o => String(o.id) === orderId.trim() || o.trackingNumber === orderId.trim());

    if (found) {
      setOrder(found);
    } else {
      setOrder(null);
      setError('سفارشی با این شماره پیدا نشد. لطفاً شماره سفارش یا کد رهگیری را به درستی وارد کنید.');
    }
  };

  const getStepStatus = (step: number, currentStatus: Order['status']) => {
    if (currentStatus === 'cancelled') return 'cancelled';
    
    const statusMap = {
      'processing': 2,
      'shipped': 3,
      'delivered': 4
    };
    
    const currentStep = statusMap[currentStatus] || 1;
    
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  const steps = [
    { id: 1, label: 'ثبت سفارش', icon: Package },
    { id: 2, label: 'پردازش در انبار', icon: Clock },
    { id: 3, label: 'تحویل به پست', icon: Truck },
    { id: 4, label: 'تحویل به مشتری', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">پیگیری هوشمند سفارش</h1>
          <p className="text-gray-500">شماره سفارش یا کد رهگیری خود را وارد کنید تا از وضعیت لحظه‌ای آن مطلع شوید.</p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="شماره سفارش (مثال: 1715432100) یا کد رهگیری"
                className="w-full pl-4 pr-12 py-4 border rounded-xl focus:ring-2 focus:ring-[#83b735] focus:border-transparent outline-none text-lg"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            </div>
            <button 
              type="submit"
              className="bg-[#83b735] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#72a02d] transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              جستجو
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Error Message */}
        {searched && !order && error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center animate-in fade-in slide-in-from-top-4">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-700 mb-1">سفارش پیدا نشد</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Order Details */}
        {searched && order && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-8">
            {/* Header */}
            <div className="bg-gray-50 border-b p-6 flex flex-wrap justify-between items-center gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">شماره سفارش</div>
                <div className="text-xl font-bold text-gray-800 font-mono">#{order.id}</div>
              </div>
              <div className="text-left">
                <div className="text-sm text-gray-500 mb-1">تاریخ ثبت</div>
                <div className="font-medium text-gray-800">{new Date(order.createdAt).toLocaleDateString('fa-IR')}</div>
              </div>
            </div>

            {/* Status Stepper */}
            <div className="p-8 border-b">
              {order.status === 'cancelled' ? (
                <div className="flex flex-col items-center justify-center text-red-500 py-8">
                  <XCircle className="w-16 h-16 mb-4" />
                  <h3 className="text-2xl font-bold">سفارش لغو شده است</h3>
                  <p className="text-gray-500 mt-2">برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Progress Bar Background */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 hidden md:block" />
                  
                  {/* Steps */}
                  <div className="flex flex-col md:flex-row justify-between relative z-10 gap-8 md:gap-0">
                    {steps.map((step, index) => {
                      const status = getStepStatus(step.id, order.status);
                      const isCompleted = status === 'completed';
                      const isCurrent = status === 'current';
                      
                      return (
                        <div key={step.id} className="flex md:flex-col items-center gap-4 md:gap-2 md:w-1/4">
                          <div 
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                              isCompleted || isCurrent 
                                ? 'bg-[#83b735] border-[#83b735] text-white shadow-lg scale-110' 
                                : 'bg-white border-gray-200 text-gray-300'
                            }`}
                          >
                            <step.icon className="w-5 h-5" />
                          </div>
                          <div className={`text-base font-bold ${
                            isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </div>
                          
                          {/* Mobile Connector Line */}
                          {index < steps.length - 1 && (
                            <div className={`md:hidden flex-1 h-1 ${isCompleted ? 'bg-[#83b735]' : 'bg-gray-100'} mx-4`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100">
              <div className="bg-white p-6">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#83b735]" />
                  اطلاعات ارسال
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">روش ارسال:</span>
                    <span className="font-medium">{order.shippingMethod === 'express' ? 'پست پیشتاز' : 'پست سفارشی'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">کد رهگیری پستی:</span>
                    <span className="font-mono font-medium">{order.trackingNumber || '---'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">زمان تحویل تقریبی:</span>
                    <span className="font-medium">
                      {order.estimatedDelivery 
                        ? new Date(order.estimatedDelivery).toLocaleDateString('fa-IR') 
                        : 'تعیین نشده'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#83b735]" />
                  خلاصه سفارش
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">تعداد اقلام:</span>
                    <span className="font-medium">{order.items.length} عدد</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">مبلغ کل:</span>
                    <span className="font-bold text-[#83b735]">{formatPriceToman(order.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">روش پرداخت:</span>
                    <span className="font-medium">{order.paymentMethod === 'online' ? 'پرداخت آنلاین' : 'پرداخت در محل'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 flex justify-center">
              <Link href="/account" className="text-[#83b735] font-bold hover:underline">
                مشاهده جزئیات کامل در حساب کاربری
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
