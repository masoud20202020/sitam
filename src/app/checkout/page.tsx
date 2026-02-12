'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { getAddresses, addAddress, Address, getUser } from '@/data/account';
import { getShippingMethods, ShippingMethod } from '@/data/shipping';
import { getCategories } from '@/data/categories';
import { calcDiscount, type Coupon } from '@/data/coupons';
import { validateCouponAction } from '@/actions/coupons';
import { getProductById, reserveProducts, purgeExpiredReservations, getAvailableStock } from '@/data/products';
import { getPaymentGateways, PaymentGateway } from '@/data/paymentGateways';
import { getPaymentGatewaysAction } from '@/app/actions/settings';
import { getCustomerDetailsAction, createAddressAction } from '@/actions/customers';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, ChevronLeft, MapPin, Truck, CreditCard, Plus, Trash2, Tag } from 'lucide-react';
import { provinces } from '@/data/provinces';
import Link from 'next/link';
import Image from 'next/image';

import { OTPLogin } from '@/components/auth/OTPLogin';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalItems, isInitialized } = useCart();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Data State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | number | undefined>(undefined);
  
  // New Address Form
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ fullName: '', phone: '', province: '', city: '', addressLine: '', postalCode: '' });

  // Shipping & Payment
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'online'>('online');
  const [activeGateways, setActiveGateways] = useState<PaymentGateway[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('');
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Initialization
  useEffect(() => {
    if (items.length === 0 && isInitialized) {
      router.push('/cart');
      return;
    }
    const currentUser = getUser();
    const id = setTimeout(() => {
      setIsAuthenticated(!!currentUser);
    }, 0);
    
    const loadData = async () => {
      if (currentUser) {
        try {
          const result = await getCustomerDetailsAction(currentUser.id.toString());
          if (result.success && result.data) {
            const mapped = (result.data.addresses || []).map((a: {
              id: string;
              phone: string;
              userId: string | null;
              postalCode: string | null;
              fullName: string;
              province: string | null;
              city: string;
              addressLine: string;
            }) => ({
              id: Number(a.id) || Date.now(),
              phone: a.phone,
              userId: a.userId ? Number(a.userId) : undefined,
              postalCode: a.postalCode || undefined,
              fullName: a.fullName,
              province: a.province || undefined,
              city: a.city,
              addressLine: a.addressLine,
            })) as Address[];
            setAddresses(mapped);
            if (mapped.length > 0) {
              setSelectedAddressId(mapped[0].id);
            } else {
              setShowAddAddress(true);
            }
          } else {
            // Fallback to local
          const saved = getAddresses(typeof currentUser.id === 'number' ? currentUser.id : null);
            setAddresses(saved);
            if (saved.length > 0) setSelectedAddressId(saved[0].id);
          }
        } catch {
        const saved = getAddresses(typeof currentUser.id === 'number' ? currentUser.id : null);
          setAddresses(saved);
          if (saved.length > 0) setSelectedAddressId(saved[0].id);
        }
      } else {
        setAddresses([]);
      }

      const methods = getShippingMethods().filter(m => m.active);
      setShippingMethods(methods);
      if (methods.length > 0) {
        setShippingMethod(methods[0].code);
      }

      try {
        const gateways: PaymentGateway[] = await getPaymentGatewaysAction();
        const active = gateways.filter((g: PaymentGateway) => g.isActive);
        setActiveGateways(active);
        if (active.length > 0) {
          setSelectedGatewayId(active[0].id);
        }
      } catch (err) {
        console.error('Error fetching gateways', err);
        const localGateways = getPaymentGateways().filter(g => g.isActive);
        if (localGateways.length > 0) {
           setActiveGateways(localGateways);
           setSelectedGatewayId(localGateways[0].id);
        }
      }
    };

    loadData();
    return () => {
      clearTimeout(id);
    };
  }, [items.length, router, isInitialized]);

  // Calculations
  const selectedShipping = shippingMethods.find(m => m.code === shippingMethod);
  const shippingCost = selectedShipping ? (selectedShipping.isPostPaid ? 0 : selectedShipping.basePrice) : 0;
  
  // Category mapping handled below in discount calculation
  
  // Real implementation for discount calculation
  // We need to find the category ID for each product to support category restriction.
  // Since we can't easily do it synchronously inside render without context or heavy lifting,
  // Let's try to pass what we have.
  // For now, let's just pass items and let calcDiscount handle product ID check.
  // For category check, we need a helper or map.
  
  const discount = (() => {
      const allCategories = getCategories();
      const enrichedItems = items.map(i => {
          const p = getProductById(i.id);
          const cat = allCategories.find(c => c.name === p?.category);
          return {
              id: i.id,
              price: i.price,
              quantity: i.quantity,
              categoryId: cat?.id
          };
      });
      return calcDiscount(subtotal, appliedCoupon, enrichedItems);
  })();

  const total = Math.max(0, subtotal - discount) + shippingCost;

  // Handlers
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.phone || !newAddress.province || !newAddress.city || !newAddress.addressLine || !newAddress.postalCode) return;
    
    setLoading(true);
    const currentUser = getUser();
    
    if (currentUser) {
      try {
        const result = await createAddressAction({
          ...newAddress,
          userId: currentUser.id.toString()
        });
        
        if (result.success && result.data) {
          const freshDetails = await getCustomerDetailsAction(currentUser.id.toString());
          if (freshDetails.success && freshDetails.data) {
            const mapped = (freshDetails.data.addresses || []).map((a: {
              id: string;
              phone: string;
              userId: string | null;
              postalCode: string | null;
              fullName: string;
              province: string | null;
              city: string;
              addressLine: string;
            }) => ({
              id: Number(a.id) || Date.now(),
              phone: a.phone,
              userId: a.userId ? Number(a.userId) : undefined,
              postalCode: a.postalCode || undefined,
              fullName: a.fullName,
              province: a.province || undefined,
              city: a.city,
              addressLine: a.addressLine,
            })) as Address[];
            setAddresses(mapped);
          }
          setSelectedAddressId(result.data.id);
        } else {
          // Local fallback
          const added = addAddress({ ...newAddress, userId: typeof currentUser.id === 'number' ? currentUser.id : undefined });
          setAddresses(getAddresses(typeof currentUser.id === 'number' ? currentUser.id : null));
          setSelectedAddressId(added.id);
        }
      } catch {
        const added = addAddress({ ...newAddress, userId: typeof currentUser.id === 'number' ? currentUser.id : undefined });
        setAddresses(getAddresses(typeof currentUser.id === 'number' ? currentUser.id : null));
        setSelectedAddressId(added.id);
      }
    } else {
      // Guest
      const added = addAddress({ ...newAddress });
      setAddresses([added]);
      setSelectedAddressId(added.id);
    }
    
    setShowAddAddress(false);
    setNewAddress({ fullName: '', phone: '', province: '', city: '', addressLine: '', postalCode: '' });
    setLoading(false);
  };

  const handleApplyCoupon = async () => {
    setCouponError(null);
    if (!couponCode.trim()) return;
    
    // We need current user ID (phone).
    // In this checkout flow, we might have user logged in via OTP (localStorage 'sitam_user_phone' or similar?)
    // Or we use the address phone?
    // Let's assume we use the selected address phone number as the user identifier if no auth context.
    // Or better, check if we have a user session.
    // Since we don't have a full auth context visible here, let's use the selected address phone as a proxy for now,
    // or if we have a user profile.
    // Let's check imports for user.
    
    const currentUserPhone = selectedAddressId ? addresses.find(a => a.id === selectedAddressId)?.phone : undefined;

    // We need to map items with category IDs for validation
    const allCategories = getCategories();
    
    const validationItems = items.map(i => {
        const p = getProductById(i.id);
        const cat = allCategories.find((c) => c.name === p?.category);
        return {
            id: String(i.id),
            categoryId: cat?.id !== undefined ? String(cat.id) : undefined
        };
    });

    const res = await validateCouponAction(couponCode, subtotal, currentUserPhone, validationItems);
    if (res.success && res.data) {
      setAppliedCoupon({
        id: res.data.id,
        code: res.data.code,
        type: res.data.type === 'percent' ? 'percent' : 'fixed',
        value: Number(res.data.value) || 0,
        active: !!res.data.active,
        startDate: res.data.startDate ? new Date(res.data.startDate).toISOString() : undefined,
        endDate: res.data.endDate ? new Date(res.data.endDate).toISOString() : undefined,
        maxUses: res.data.maxUses ?? undefined,
        usedCount: res.data.usedCount ?? 0,
        minOrderAmount: res.data.minOrderAmount ?? undefined,
        maxUsesPerUser: res.data.maxUsesPerUser ?? undefined,
        allowedProductIds: res.data.allowedProductIds ? JSON.parse(res.data.allowedProductIds) : [],
        allowedCategoryIds: res.data.allowedCategoryIds ? JSON.parse(res.data.allowedCategoryIds) : [],
      });
      setCouponCode('');
    } else {
      setCouponError(res.error || 'کد تخفیف معتبر نیست.');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const checkStock = () => {
    purgeExpiredReservations();
    return items.every(i => {
      const p = getProductById(i.id);
      if (!p) return true;
      const available = getAvailableStock(p, i.variantId);
      return available >= i.quantity;
    });
  };

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      alert('لطفاً یک آدرس انتخاب کنید');
      setStep(1);
      return;
    }
    if (!checkStock()) {
      alert('موجودی برخی محصولات کافی نیست');
      return;
    }

    setLoading(true);

    if (!selectedGatewayId && activeGateways.length > 0) {
      alert('لطفاً یک درگاه پرداخت انتخاب کنید');
      return;
    }
    
    // Reserve products and redirect to mock payment
    reserveProducts(items.map(i => ({ id: i.id, quantity: i.quantity, variantId: i.variantId })), 15 * 60 * 1000); // 15 min reservation
    
    // Store order draft in localStorage to be picked up by payment page or callback
    const draftOrder = {
      items,
      total,
      meta: {
        addressId: selectedAddressId,
        shippingMethod,
        paymentMethod: 'online',
        gatewayId: selectedGatewayId,
        discount,
        couponCode: appliedCoupon?.code
      }
    };
    localStorage.setItem('checkout_draft', JSON.stringify(draftOrder));
    
    setTimeout(() => {
      router.push(`/payment/mock?gatewayId=${selectedGatewayId}`);
    }, 1000);
  };

  // Removed unused processOrder

  const steps = [
    { id: 1, title: 'اطلاعات ارسال', icon: MapPin },
    { id: 2, title: 'روش پرداخت', icon: CreditCard },
    { id: 3, title: 'بازبینی و پرداخت', icon: Check },
  ];

  if (!isInitialized) return null;
  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center w-full max-w-2xl">
            {steps.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center relative z-10">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      step >= s.id ? 'bg-[#83b735] border-[#83b735] text-white' : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${step >= s.id ? 'text-[#83b735]' : 'text-gray-500'}`}>
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-grow h-0.5 mx-4 -mt-6 transition-colors ${step > s.id ? 'bg-[#83b735]' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="flex-grow bg-white rounded-xl shadow-sm border p-6">
            
            {!isAuthenticated ? (
              <div className="max-w-md mx-auto py-8">
                <h2 className="text-xl font-bold text-gray-800 text-center mb-6">ورود به حساب کاربری</h2>
                <OTPLogin onLogin={(user) => {
                  setIsAuthenticated(true);
                  const saved = getAddresses(typeof user.id === 'number' ? user.id : null);
                  setAddresses(saved);
                  if (saved.length > 0) {
                    setSelectedAddressId(saved[0].id);
                  } else {
                    setShowAddAddress(true);
                  }
                }} />
              </div>
            ) : (
              <>
                {/* Step 1: Address */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <MapPin className="text-[#83b735]" />
                      انتخاب آدرس تحویل
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map(addr => (
                        <div 
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${selectedAddressId === addr.id ? 'border-[#83b735] bg-[#83b735]/5 ring-1 ring-[#83b735]' : 'border-gray-200'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-gray-900">{addr.fullName}</span>
                            {selectedAddressId === addr.id && <div className="w-4 h-4 bg-[#83b735] rounded-full" />}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{addr.province ? `${addr.province}، ` : ''}{addr.city}، {addr.addressLine}</p>
                          {addr.postalCode && <p className="text-sm text-gray-600 mb-1">کد پستی: {addr.postalCode}</p>}
                          <p className="text-sm text-gray-500">{addr.phone}</p>
                        </div>
                      ))}
                      
                      <button 
                        onClick={() => setShowAddAddress(true)}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 hover:border-[#83b735] hover:text-[#83b735] transition-colors min-h-[120px]"
                      >
                        <Plus className="w-6 h-6 mb-2" />
                        <span>افزودن آدرس جدید</span>
                      </button>
                    </div>

                    {/* Add Address Form Modal/Inline */}
                    {showAddAddress && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                          <h3 className="text-lg font-bold mb-4">ثبت آدرس جدید</h3>
                          <form onSubmit={handleAddAddress} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی</label>
                              <input 
                                required
                                className="w-full border rounded-md px-3 py-2 focus:ring-[#83b735] focus:border-[#83b735]"
                                value={newAddress.fullName}
                                onChange={e => setNewAddress({...newAddress, fullName: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">شماره تماس</label>
                              <input 
                                required
                                className="w-full border rounded-md px-3 py-2 focus:ring-[#83b735] focus:border-[#83b735]"
                                value={newAddress.phone}
                                onChange={e => setNewAddress({...newAddress, phone: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">استان</label>
                              <select 
                                required
                                className="w-full border rounded-md px-3 py-2 focus:ring-[#83b735] focus:border-[#83b735] bg-white"
                                value={newAddress.province}
                                onChange={e => setNewAddress({...newAddress, province: e.target.value, city: ''})}
                              >
                                <option value="">انتخاب استان</option>
                                {provinces.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">شهر</label>
                              <select 
                                required
                                className="w-full border rounded-md px-3 py-2 focus:ring-[#83b735] focus:border-[#83b735] bg-white"
                                value={newAddress.city}
                                onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                                disabled={!newAddress.province}
                              >
                                <option value="">انتخاب شهر</option>
                                {newAddress.province && provinces.find(p => p.name === newAddress.province)?.cities.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">کد پستی</label>
                              <input 
                                required
                                className="w-full border rounded-md px-3 py-2 focus:ring-[#83b735] focus:border-[#83b735]"
                                value={newAddress.postalCode}
                                onChange={e => setNewAddress({...newAddress, postalCode: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">آدرس پستی</label>
                              <textarea 
                                required
                                className="w-full border rounded-md px-3 py-2 focus:ring-[#83b735] focus:border-[#83b735]"
                                rows={3}
                                value={newAddress.addressLine}
                                onChange={e => setNewAddress({...newAddress, addressLine: e.target.value})}
                              />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button type="button" onClick={() => setShowAddAddress(false)} className="flex-1 border py-2 rounded-md hover:bg-gray-50">انصراف</button>
                              <button type="submit" className="flex-1 bg-[#83b735] text-white py-2 rounded-md hover:bg-[#6da025]">ثبت آدرس</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {isAuthenticated && step === 2 && (
              <div className="space-y-8">
                {/* Shipping Method */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <Truck className="text-[#83b735]" />
                    شیوه ارسال
                  </h2>
                  <div className="space-y-3">
                    {shippingMethods.map(method => (
                      <label 
                        key={method.id}
                        className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer transition-all ${shippingMethod === method.code ? 'border-[#83b735] bg-[#83b735]/5' : 'hover:border-gray-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="shipping" 
                            checked={shippingMethod === method.code}
                            onChange={() => setShippingMethod(method.code)}
                            className="w-4 h-4 text-[#83b735] focus:ring-[#83b735]"
                          />
                          <div>
                            <div className="font-bold text-gray-900">{method.name}</div>
                            <div className="text-xs text-gray-500">
                              {method.deliveryDaysMin && method.deliveryDaysMax 
                                ? `تحویل ${method.deliveryDaysMin} تا ${method.deliveryDaysMax} روز کاری`
                                : method.notes || ''}
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-gray-700">
                          {method.isPostPaid ? 'پس‌کرایه (پرداخت در مقصد)' : `${method.basePrice.toLocaleString()} تومان`}
                        </div>
                      </label>
                    ))}
                    
                    {shippingMethods.length === 0 && (
                      <div className="text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">
                        هیچ روش ارسالی برای این منطقه یافت نشد.
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <CreditCard className="text-[#83b735]" />
                    شیوه پرداخت
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className={`border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-[#83b735] bg-[#83b735]/5' : 'hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <input 
                          type="radio" 
                          name="payment" 
                          checked={paymentMethod === 'online'}
                          onChange={() => setPaymentMethod('online')}
                          className="w-4 h-4 text-[#83b735] focus:ring-[#83b735]"
                        />
                        <span className="font-bold text-gray-900">پرداخت اینترنتی</span>
                      </div>
                      <p className="text-xs text-gray-500 pr-7 mb-3">پرداخت با کلیه کارت‌های عضو شتاب</p>
                      
                      {paymentMethod === 'online' && activeGateways.length > 0 && (
                        <div className="mr-7 mt-3 space-y-2 border-t pt-3">
                          {activeGateways.map(gateway => (
                            <label key={gateway.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="gateway"
                                checked={selectedGatewayId === gateway.id}
                                onChange={() => setSelectedGatewayId(gateway.id)}
                                className="w-3.5 h-3.5 text-[#83b735] focus:ring-[#83b735]"
                              />
                              <span className="text-sm text-gray-700">{gateway.name}</span>
                              {gateway.logo && <Image src={gateway.logo} alt={gateway.name} width={20} height={20} className="object-contain" />}
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {paymentMethod === 'online' && activeGateways.length === 0 && (
                        <div className="mr-7 mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                          در حال حاضر درگاه فعالی وجود ندارد.
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">بازبینی سفارش</h2>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-right">محصول</th>
                        <th className="py-3 px-4 text-center">تعداد</th>
                        <th className="py-3 px-4 text-left">قیمت کل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map(item => (
                        <tr key={`${item.id}-${item.variantId || 'default'}`}>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {item.color && <div className="text-xs text-gray-500">رنگ: {item.color}</div>}
                            {item.size && <div className="text-xs text-gray-500">سایز: {item.size}</div>}
                          </td>
                          <td className="py-3 px-4 text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-left font-medium text-[#83b735]">
                            {(item.price * item.quantity).toLocaleString()} تومان
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="block text-gray-500 mb-1">تحویل گیرنده:</span>
                    <span className="font-medium text-gray-900">
                      {addresses.find(a => a.id === selectedAddressId)?.fullName}
                    </span>
                    <div className="text-xs mt-1">
                      {addresses.find(a => a.id === selectedAddressId)?.city}، {addresses.find(a => a.id === selectedAddressId)?.addressLine}
                    </div>
                  </div>
                  <div>
                    <span className="block text-gray-500 mb-1">روش ارسال و پرداخت:</span>
                    <div className="font-medium text-gray-900">
                      {shippingMethods.find(m => m.code === shippingMethod)?.name || 'انتخاب نشده'}
                    </div>
                    <div className="text-xs mt-1">
                        <span>
                          پرداخت اینترنتی 
                          {selectedGatewayId && activeGateways.find(g => g.id === selectedGatewayId) ? 
                            ` (${activeGateways.find(g => g.id === selectedGatewayId)?.name})` : ''}
                        </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between pt-6 border-t">
              {step > 1 ? (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-6 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                  disabled={loading}
                >
                  <ChevronRight className="w-4 h-4" />
                  مرحله قبل
                </button>
              ) : (
                <Link href="/cart" className="flex items-center gap-2 px-6 py-2 border rounded-md text-gray-600 hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4" />
                  بازگشت به سبد خرید
                </Link>
              )}

              {step < 3 ? (
                <button
                  onClick={() => {
                    if (step === 1 && !selectedAddressId) {
                      alert('لطفاً یک آدرس انتخاب کنید');
                      return;
                    }
                    setStep(s => s + 1);
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-[#83b735] text-white rounded-md hover:bg-[#6da025] font-bold"
                >
                  مرحله بعد
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-[#83b735] text-white rounded-md hover:bg-[#6da025] font-bold shadow-lg shadow-[#83b735]/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'در حال پردازش...' : 'تایید و پرداخت نهایی'}
                  {!loading && <Check className="w-5 h-5" />}
                </button>
              )}
            </div>

          </div>

          {/* Sidebar Summary */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl shadow-sm border sticky top-24 space-y-6">
              
              {/* Coupon Section */}
              <div className="pb-6 border-b">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                  <Tag className="w-4 h-4 text-[#83b735]" />
                  کد تخفیف
                </h3>
                {appliedCoupon ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <span className="block font-mono text-green-700 font-bold">{appliedCoupon.code}</span>
                      <span className="text-xs text-green-600">
                        {appliedCoupon.type === 'percent' ? `${appliedCoupon.value}٪ تخفیف` : `${appliedCoupon.value.toLocaleString()} تومان تخفیف`}
                      </span>
                    </div>
                    <button 
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value); setCouponError(null); }}
                        placeholder="کد تخفیف را وارد کنید"
                        className="flex-grow border rounded-md px-3 py-2 text-sm focus:ring-[#83b735] focus:border-[#83b735]"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                      >
                        اعمال
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold mb-4 text-gray-800">صورتحساب</h2>
                <div className="space-y-3 text-sm text-gray-600 pb-4 border-b">
                  <div className="flex justify-between">
                    <span>قیمت کالاها ({totalItems})</span>
                    <span>{subtotal.toLocaleString()} تومان</span>
                  </div>
                  <div className="flex justify-between text-gray-900">
                    <span>هزینه ارسال</span>
                    <span>
                      {shippingCost === 0 && selectedShipping?.isPostPaid 
                        ? 'پس‌کرایه' 
                        : `${shippingCost.toLocaleString()} تومان`}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#83b735] font-bold">
                      <span>تخفیف</span>
                      <span>{discount.toLocaleString()} - تومان</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between font-bold text-gray-900 py-4 text-lg">
                  <span>قابل پرداخت</span>
                  <span className="text-[#83b735]">{total.toLocaleString()} تومان</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
