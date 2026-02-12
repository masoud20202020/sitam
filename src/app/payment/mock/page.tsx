'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import type { CartItem } from '@/context/CartContext';
import { addOrder } from '@/data/account';
import type { Order as LocalOrder } from '@/data/account';
import { updateProduct, releaseReservationsForItems, getProductById } from '@/data/products';
import { incrementCouponUsageAction } from '@/actions/coupons';
import { getPaymentGateways } from '@/data/paymentGateways';
import type { PaymentGateway } from '@/data/paymentGateways';
import { getPaymentGatewaysAction, getAdminNotificationSettingsAction, getSMSSettingsAction } from '@/app/actions/settings';
import { createOrderAction } from '@/actions/orders';
import { sendAdminNotification } from '@/lib/adminNotificationService';
import { Loader2, CheckCircle, XCircle, CreditCard, Lock } from 'lucide-react';
import Image from 'next/image';

export default function MockPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gatewayId = searchParams.get('gatewayId');
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>(() => {
    const draftOrderJson = typeof window !== 'undefined' ? localStorage.getItem('checkout_draft') : null;
    return draftOrderJson ? 'idle' : 'failed';
  });
  const [message, setMessage] = useState<string>(() => {
    const draftOrderJson = typeof window !== 'undefined' ? localStorage.getItem('checkout_draft') : null;
    return draftOrderJson ? '' : 'اطلاعات سفارش یافت نشد';
  });
  type DraftOrderMeta = {
    userId?: string | number;
    discount?: number;
    paymentMethod?: string;
    shippingMethod?: string;
    addressId?: string | number;
    note?: string;
    couponCode?: string;
  };
  type DraftOrder = { items: CartItem[]; total: number; meta: DraftOrderMeta };
  const [draftOrder] = useState<DraftOrder | null>(() => {
    const draftOrderJson = typeof window !== 'undefined' ? localStorage.getItem('checkout_draft') : null;
    return draftOrderJson ? (JSON.parse(draftOrderJson) as DraftOrder) : null;
  });
  const [gateway, setGateway] = useState<PaymentGateway | null>(null);

  // Mock Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cvv2, setCvv2] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // 1. Load Draft Order
    const draftOrderJson = localStorage.getItem('checkout_draft');
    if (!draftOrderJson) return;

    // 2. Load Gateway Info
    const loadGateway = async () => {
      try {
        const gateways = await getPaymentGatewaysAction();
        const currentGateway = gateways.find(g => g.id === gatewayId);
        if (currentGateway) {
            setGateway(currentGateway || null);
        } else {
            // Fallback
            const localGateways = getPaymentGateways();
            const local = localGateways.find(g => g.id === gatewayId);
            setGateway(local || null);
        }
      } catch {
         const localGateways = getPaymentGateways();
         const local = localGateways.find(g => g.id === gatewayId);
         setGateway(local || null);
      }
    };
    loadGateway();

  }, [gatewayId]);

  const handlePaymentSuccess = async () => {
    if (!draftOrder) return;
    
    setStatus('processing');
    setMessage('در حال انجام تراکنش...');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay

      const { items, total, meta } = draftOrder;

      // Finalize order with Prisma
      const orderResult = await createOrderAction({
        userId: meta.userId?.toString(),
        total: total,
        discount: meta.discount,
        paymentMethod: (meta.paymentMethod ?? 'online'),
        shippingMethod: (meta.shippingMethod ?? 'standard'),
        addressId: meta.addressId?.toString(),
        items: items.map((item) => ({
          productId: item.id.toString(),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          color: item.color,
          size: item.size,
          variantId: item.variantId
        })),
        note: meta.note
      });

      let order;
      if (orderResult.success && orderResult.data) {
        order = orderResult.data;
      } else {
        // Fallback to local
        order = addOrder(items, total, {
          addressId: typeof meta.addressId === 'number' ? meta.addressId : undefined,
          shippingMethod: meta.shippingMethod ?? 'standard',
          paymentMethod: (meta.paymentMethod as LocalOrder['paymentMethod']) ?? 'online',
          discount: meta.discount,
        });
      }

      // Increment Coupon Usage
      if (meta.couponCode) {
          await incrementCouponUsageAction(meta.couponCode);
      }

      // Send admin notification
      try {
        const [adminSettings, smsSettings] = await Promise.all([
          getAdminNotificationSettingsAction(),
          getSMSSettingsAction()
        ]);
        const notifyOrder: LocalOrder = order && typeof order === 'object'
          ? {
              id: Number((order as { id: string | number }).id) || Date.now(),
              items: (order as { items: Array<{ productId?: string | number; id?: string | number; name: string; price: number; quantity: number; image?: string; color?: string; size?: string; variantId?: string }> }).items?.map((it) => ({
                id: (it.productId ?? it.id) as string | number,
                name: it.name,
                price: it.price,
                quantity: it.quantity,
                image: it.image,
                color: it.color,
                size: it.size,
                variantId: it.variantId,
              })) || items,
              total: (order as { total?: number }).total ?? total,
              createdAt: Date.now(),
              status: ((order as { status?: LocalOrder['status'] }).status) || 'processing',
              addressId: (order as { addressId?: string | number }).addressId ? Number((order as { addressId?: string | number }).addressId) : undefined,
              shippingMethod: (order as { shippingMethod?: string }).shippingMethod,
              paymentMethod: (order as { paymentMethod?: LocalOrder['paymentMethod'] }).paymentMethod,
              discount: (order as { discount?: number }).discount,
              userId: (order as { userId?: string | number }).userId ? Number((order as { userId?: string | number }).userId) : undefined,
            }
          : {
              id: Date.now(),
              items,
              total,
              createdAt: Date.now(),
              status: 'processing',
              addressId: meta.addressId ? Number(meta.addressId) : undefined,
              shippingMethod: meta.shippingMethod,
              paymentMethod: (meta.paymentMethod as LocalOrder['paymentMethod']) ?? 'online',
              discount: meta.discount,
              userId: meta.userId ? Number(meta.userId) : undefined,
            };
        sendAdminNotification(notifyOrder, adminSettings, smsSettings).catch(console.error);
      } catch (err) {
        console.error('Failed to fetch settings for notification', err);
      }

      // Update stock
      items.forEach((item) => {
          const p = getProductById(item.id);
          if (!p) return;

          if (item.variantId && p.variants) {
              const updatedVariants = p.variants.map(v => {
                  if (v.variantId === item.variantId) {
                      return { ...v, stock: Math.max(0, v.stock - item.quantity) };
                  }
                  return v;
              });
              updateProduct(item.id, { variants: updatedVariants });
          } else if (typeof p.stock === 'number') {
              const newStock = Math.max(0, p.stock - item.quantity);
              updateProduct(item.id, { stock: newStock });
          }
      });

      // Release reservations
      releaseReservationsForItems(items.map((i) => ({ id: i.id, variantId: i.variantId })));

      // Clear cart and storage
      clearCart();
      localStorage.removeItem('checkout_draft');

      setStatus('success');
      setMessage('تراکنش با موفقیت انجام شد');
      
      setTimeout(() => {
          router.push(`/order/${order.id}`);
      }, 2000);

    } catch (error) {
      console.error(error);
      setStatus('failed');
      setMessage('خطا در پردازش سفارش');
    }
  };

  const handlePaymentFailure = async () => {
    setStatus('processing');
    setMessage('در حال لغو تراکنش...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStatus('failed');
    setMessage('پرداخت توسط کاربر لغو شد یا با خطا مواجه گردید.');
    
    setTimeout(() => {
        router.push('/checkout');
    }, 2000);
  };

  if (!draftOrder && status !== 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-green-600">پرداخت موفق</h2>
          <p className="text-gray-600">{message}</p>
          <p className="text-sm text-gray-400">در حال انتقال به فروشگاه...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <XCircle className="w-20 h-20 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-600">پرداخت ناموفق</h2>
          <p className="text-gray-600">{message}</p>
          <p className="text-sm text-gray-400">در حال بازگشت به فروشگاه...</p>
        </div>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">در حال پردازش...</h2>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-100 p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
                {gateway?.logo ? (
                    <Image src={gateway.logo} alt={gateway.name} width={40} height={40} className="object-contain" />
                ) : (
                    <CreditCard className="w-8 h-8 text-gray-600" />
                )}
                <div>
                    <h1 className="font-bold text-gray-800 text-lg">{gateway?.name || 'درگاه پرداخت اینترنتی'}</h1>
                    <p className="text-xs text-gray-500">پرداخت امن شاپرک</p>
                </div>
            </div>
            <div className="text-left">
                <div className="text-xs text-gray-500">مبلغ قابل پرداخت</div>
                <div className="font-bold text-xl text-blue-600">
                    {(draftOrder?.total ?? 0).toLocaleString()} <span className="text-sm font-normal">تومان</span>
                </div>
            </div>
        </div>

        {/* Payment Form */}
        <div className="p-8 space-y-6">
            <div className="space-y-4">
                {/* Card Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">شماره کارت</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            dir="ltr"
                            className="w-full border rounded-lg px-4 py-3 text-lg tracking-widest text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="0000 - 0000 - 0000 - 0000"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => {
                                let v = e.target.value.replace(/\D/g, '');
                                if (v.length > 16) v = v.slice(0, 16);
                                setCardNumber(v.replace(/(\d{4})/g, '$1 ').trim());
                            }}
                        />
                        <CreditCard className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* CVV2 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">CVV2</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                dir="ltr"
                                className="w-full border rounded-lg px-4 py-3 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="CVV2"
                                maxLength={4}
                                value={cvv2}
                                onChange={(e) => setCvv2(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            />
                            <Lock className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                        </div>
                    </div>

                    {/* Expiry Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">تاریخ انقضا</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                dir="ltr"
                                className="w-full border rounded-lg px-2 py-3 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="ماه"
                                maxLength={2}
                                value={expiryMonth}
                                onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                            />
                            <span className="text-2xl text-gray-300">/</span>
                            <input 
                                type="text" 
                                dir="ltr"
                                className="w-full border rounded-lg px-2 py-3 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="سال"
                                maxLength={2}
                                value={expiryYear}
                                onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
                            />
                        </div>
                    </div>
                </div>

                {/* Password / Pin */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">رمز دوم (اینترنتی)</label>
                    <div className="relative">
                        <input 
                            type="password" 
                            dir="ltr"
                            className="w-full border rounded-lg px-4 py-3 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="رمز پویا"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <div className="absolute left-3 top-2 bg-blue-50 text-blue-600 text-xs px-2 py-1.5 rounded cursor-pointer hover:bg-blue-100">
                            درخواست رمز پویا
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
                <button 
                    onClick={handlePaymentFailure}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                    انصراف
                </button>
                <button 
                    onClick={handlePaymentSuccess}
                    className="flex-[2] bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                >
                    پرداخت {(draftOrder?.total ?? 0).toLocaleString()} تومان
                </button>
            </div>
            
            <div className="text-center">
                <p className="text-xs text-gray-400">
                    این صفحه صرفاً جهت نمایش عملکرد سیستم است و هیچگونه تراکنش مالی واقعی انجام نمی‌شود.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
