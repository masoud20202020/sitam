'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { getUser, saveUser, logoutUser, getOrders, getAddresses, addAddress, deleteAddress, addReturnRequest, type User, type Address } from '@/data/account';
import { getCustomerDetailsAction, createAddressAction, deleteAddressAction } from '@/actions/customers';
import { getUserOrdersAction } from '@/actions/orders';
import { useWishlist } from '@/context/WishlistContext';
import type { Order, ReturnRequest } from '@/data/account';
import { Calendar, MapPin, Phone, LogOut, Trash2, Edit2, Loader2 } from 'lucide-react';
import { formatPriceToman } from '@/data/products';
import { provinces } from '@/data/provinces';
import Link from 'next/link';
import Image from 'next/image';

import { TicketsTab } from '@/components/account/TicketsTab';
import { OTPLogin } from '@/components/auth/OTPLogin';

type TabKey = 'profile' | 'orders' | 'addresses' | 'wishlist' | 'tickets';

export default function AccountPage() {
  const searchParams = useSearchParams();
  const { items: wishlist, removeFromWishlist } = useWishlist();
  const [active, setActive] = useState<TabKey>('profile');
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addrForm, setAddrForm] = useState({ fullName: '', phone: '', province: '', city: '', addressLine: '', postalCode: '' });
  // Removed local wishlist state as we use context now
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});

  const toMs = (val: number | string | Date): number => {
    if (typeof val === 'number') return val;
    if (val instanceof Date) return val.getTime();
    const t = new Date(val).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  type PrismaOrderItem = {
    id: string | number;
    productId: string | number;
    name?: string;
    price?: number | string;
    quantity?: number | string;
    image?: string | null;
    color?: string | null;
    size?: string | null;
  };
  type PrismaReturnItem = { productId: string | number; quantity: number | string };
  type PrismaReturn = {
    id: string | number;
    items?: PrismaReturnItem[];
    reason?: string | null;
    requestedAt: Date | string | number;
    status?: string;
    refundAmount?: number | null;
    decisionAt?: Date | string | number | null;
    note?: string | null;
  };
  type PrismaOrder = {
    id: string | number;
    items?: PrismaOrderItem[];
    total?: number | string;
    createdAt: Date | string | number;
    status: string;
    addressId?: string | number | null;
    shippingMethod?: string | null;
    paymentMethod?: string | null;
    discount?: number | null;
    trackingNumber?: string | null;
    estimatedDelivery?: Date | string | number | null;
    userId?: string | number | null;
    returns?: PrismaReturn[];
    isViewed?: boolean;
  };
  const mapPrismaOrders = React.useCallback((rows: unknown[]): Order[] => {
    return rows.map((raw) => {
      const r = raw as PrismaOrder;
      const prismaItems = Array.isArray(r.items) ? r.items : [];
      const prismaReturns = Array.isArray(r.returns) ? r.returns : [];
      return {
        id: typeof r.id === 'string' ? parseInt(r.id) : r.id,
        items: prismaItems.map((item) => ({
          id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
          productId: typeof item.productId === 'string' ? parseInt(item.productId) : item.productId,
          name: item.name || '',
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 0,
          image: item.image || undefined,
          color: item.color || undefined,
          size: item.size || undefined,
        })),
        total: Number(r.total) || 0,
        createdAt: r.createdAt,
        status: (r.status as Order['status']) || 'processing',
        addressId: r.addressId || undefined,
        shippingMethod: r.shippingMethod || undefined,
        paymentMethod: r.paymentMethod === 'cod' || r.paymentMethod === 'online' ? r.paymentMethod : undefined,
        discount: typeof r.discount === 'number' ? r.discount : undefined,
        trackingNumber: r.trackingNumber || undefined,
        estimatedDelivery: r.estimatedDelivery || undefined,
        userId: r.userId || undefined,
        returns: prismaReturns.map((ret) => ({
          id: typeof ret.id === 'string' ? parseInt(ret.id) : ret.id,
          items: Array.isArray(ret.items)
            ? ret.items.map((ri) => ({
                id: typeof ri.productId === 'string' ? parseInt(ri.productId) : ri.productId,
                quantity: Number(ri.quantity) || 0,
              }))
            : [],
          reason: ret.reason ?? '',
          requestedAt: ret.requestedAt,
          status: (ret.status as ReturnRequest['status']) ?? 'requested',
          refundAmount: typeof ret.refundAmount === 'number' ? ret.refundAmount : undefined,
          decisionAt: ret.decisionAt || undefined,
          note: ret.note || undefined,
        })),
        isViewed: typeof r.isViewed === 'boolean' ? r.isViewed : undefined,
      } as Order;
    });
  }, []);

  type PrismaAddress = {
    id: string;
    fullName: string;
    phone: string;
    province: string | null;
    city: string;
    addressLine: string;
    postalCode: string | null;
    userId: string | null;
  };
  const mapPrismaAddresses = React.useCallback((rows: unknown[]): Address[] => {
    return rows.map((a) => {
      const r = a as PrismaAddress;
      return {
        id: r.id,
        fullName: r.fullName,
        phone: r.phone,
        province: r.province || undefined,
        city: r.city,
        addressLine: r.addressLine,
        postalCode: r.postalCode || undefined,
        userId: r.userId || undefined,
      };
    });
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'orders', 'addresses', 'wishlist', 'tickets'].includes(tab)) {
      setActive(tab as TabKey);
    }
  }, [searchParams]);

  React.useEffect(() => {
    setUser(getUser());
  }, []);

  React.useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = getUser();
      setUser(currentUser);

      if (currentUser) {
        // Fetch orders
        setLoadingOrders(true);
        try {
          const ordersResult = await getUserOrdersAction(currentUser.id.toString());
          if (ordersResult.success && ordersResult.data) {
            setOrders(mapPrismaOrders(ordersResult.data as unknown[]));
          } else {
            // Fallback to localStorage
            setOrders(getOrders(currentUser.id));
          }
        } catch (error) {
          console.error('Failed to fetch orders from Prisma:', error);
          setOrders(getOrders(currentUser.id));
        } finally {
          setLoadingOrders(false);
        }

        // Fetch addresses
        setLoadingAddresses(true);
        try {
          const customerDetailsResult = await getCustomerDetailsAction(currentUser.id.toString());
          if (customerDetailsResult.success && customerDetailsResult.data) {
            setAddresses(mapPrismaAddresses((customerDetailsResult.data.addresses || []) as unknown[]));
          } else {
            // Fallback to localStorage
            setAddresses(getAddresses(currentUser.id));
          }
        } catch (error) {
          console.error('Failed to fetch addresses from Prisma:', error);
          setAddresses(getAddresses(currentUser.id));
        } finally {
          setLoadingAddresses(false);
        }
      } else {
        // For guest users or if no user is logged in, clear orders and addresses
        setOrders([]);
        setAddresses([]);
        setLoadingOrders(false);
        setLoadingAddresses(false);
      }
    };

    fetchUserData();
  }, [mapPrismaOrders, mapPrismaAddresses]); // run on mount; stable callbacks satisfy deps

  // Update user state when it changes (e.g., after login/logout)
  React.useEffect(() => {
    if (user) {
      const fetchUserSpecificData = async () => {
        // Fetch orders
        setLoadingOrders(true);
        try {
          const ordersResult = await getUserOrdersAction(user.id.toString());
          if (ordersResult.success && ordersResult.data) {
            setOrders(mapPrismaOrders(ordersResult.data as unknown[]));
          } else {
            setOrders(getOrders(user.id));
          }
        } catch (error) {
          console.error('Failed to fetch orders from Prisma:', error);
          setOrders(getOrders(user.id));
        } finally {
          setLoadingOrders(false);
        }

        // Fetch addresses
        setLoadingAddresses(true);
        try {
          const customerDetailsResult = await getCustomerDetailsAction(user.id.toString());
          if (customerDetailsResult.success && customerDetailsResult.data) {
            setAddresses(mapPrismaAddresses((customerDetailsResult.data.addresses || []) as unknown[]));
          } else {
            setAddresses(getAddresses(user.id));
          }
        } catch (error) {
          console.error('Failed to fetch addresses from Prisma:', error);
          setAddresses(getAddresses(user.id));
        } finally {
          setLoadingAddresses(false);
        }
      };
      fetchUserSpecificData();
    } else {
      setOrders([]);
      setAddresses([]);
      setLoadingOrders(false);
      setLoadingAddresses(false);
    }
  }, [user, mapPrismaOrders, mapPrismaAddresses]); // include stable callbacks

  const handlePrintInvoice = (o: Order) => {
    const addr = addresses.find(a => String(a.id) === String(o.addressId));
    const win = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    if (!win) return;
    const dateStr = new Date(o.createdAt).toLocaleDateString('fa-IR');
    const itemsRows = o.items
      .map(
        it =>
          `<tr><td>${it.name} ${it.color ? `(${it.color})` : ''}</td><td>${it.quantity.toLocaleString('fa-IR')}</td><td>${formatPriceToman(
            it.price
          )}</td><td>${formatPriceToman(it.price * it.quantity)}</td></tr>`
      )
      .join('');
    const discount = o.discount || 0;
    const totalAfterDiscount = Math.max(0, o.total - discount);
    
    const statusMap = {
      'processing': 'در حال پردازش',
      'shipped': 'ارسال شده',
      'delivered': 'تحویل داده شده',
      'cancelled': 'لغو شده'
    };

    const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<title>فاکتور سفارش #${o.id}</title>
<style>
  @font-face {
    font-family: 'Tahoma';
    src: local('Tahoma');
  }
  body {
    font-family: 'Tahoma', Arial, sans-serif;
    color: #111;
    margin: 0;
    padding: 40px;
    direction: rtl;
    line-height: 1.6;
  }
  .invoice-box {
    max-width: 800px;
    margin: auto;
    border: 1px solid #eee;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, .15);
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #83b735;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }
  .brand {
    font-weight: 700;
    font-size: 28px;
    color: #83b735;
  }
  .invoice-title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
  }
  .meta-item {
    font-size: 14px;
    color: #555;
  }
  .meta-label {
    font-weight: bold;
    color: #333;
    margin-left: 5px;
  }
  .section-title {
    font-size: 16px;
    font-weight: bold;
    background: #f9f9f9;
    padding: 8px 15px;
    border-right: 4px solid #83b735;
    margin: 20px 0 10px 0;
  }
  .addr-box {
    font-size: 14px;
    color: #333;
    background: #fff;
    border: 1px solid #eee;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 30px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  th, td {
    border: 1px solid #eee;
    padding: 12px 15px;
    text-align: right;
    font-size: 13px;
  }
  th {
    background: #f7f7f7;
    font-weight: bold;
    color: #333;
  }
  .totals-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 30px;
  }
  .totals-box {
    width: 250px;
  }
  .total-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
    font-size: 14px;
  }
  .total-item.grand-total {
    border-bottom: none;
    font-weight: bold;
    font-size: 18px;
    color: #83b735;
    padding-top: 15px;
  }
  .footer {
    margin-top: 50px;
    text-align: center;
    font-size: 12px;
    color: #888;
    border-top: 1px solid #eee;
    padding-top: 20px;
  }
  @media print {
    .print-hide { display: none !important; }
    body { padding: 0; }
    .invoice-box { border: none; box-shadow: none; }
  }
  .btn-print {
    background: #83b735;
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    font-family: 'Tahoma';
    margin-bottom: 20px;
  }
</style>
</head>
<body>
  <div style="text-align: center;" class="print-hide">
    <button class="btn-print" onclick="window.print()">چاپ و دانلود PDF فاکتور</button>
  </div>
  <div class="invoice-box">
    <div class="header">
      <div class="brand">فروشگاه سیتام</div>
      <div class="invoice-title">صورت‌حساب فروش کالا</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">شماره فاکتور:</span> #${o.id}
      </div>
      <div class="meta-item">
        <span class="meta-label">تاریخ صدور:</span> ${dateStr}
      </div>
      <div class="meta-item">
        <span class="meta-label">وضعیت سفارش:</span> ${statusMap[o.status] || o.status}
      </div>
      <div class="meta-item">
        <span class="meta-label">روش پرداخت:</span> ${o.paymentMethod === 'online' ? 'پرداخت آنلاین' : 'پرداخت در محل'}
      </div>
    </div>

    <div class="section-title">اطلاعات خریدار</div>
    <div class="addr-box">
      <div><span class="meta-label">نام و نام خانوادگی:</span> ${addr ? addr.fullName : '-'}</div>
      <div><span class="meta-label">شماره تماس:</span> ${addr ? addr.phone : '-'}</div>
      <div><span class="meta-label">استان و شهر:</span> ${addr ? (addr.province ? addr.province + '، ' : '') + addr.city : '-'}</div>
      <div><span class="meta-label">نشانی کامل:</span> ${addr ? addr.addressLine : '-'}</div>
    </div>

    <div class="section-title">جزئیات سفارش</div>
    <table>
      <thead>
        <tr>
          <th>نام محصول</th>
          <th>تعداد</th>
          <th>قیمت واحد (تومان)</th>
          <th>جمع جزء (تومان)</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <div class="totals-container">
      <div class="totals-box">
        <div class="total-item">
          <span>جمع کل:</span>
          <span>${formatPriceToman(o.total)}</span>
        </div>
        <div class="total-item">
          <span>تخفیف:</span>
          <span>${formatPriceToman(discount)}</span>
        </div>
        <div class="total-item grand-total">
          <span>مبلغ قابل پرداخت:</span>
          <span>${formatPriceToman(totalAfterDiscount)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      از خرید شما متشکریم! این فاکتور به صورت سیستمی صادر شده و معتبر می‌باشد.
      <br/>
      فروشگاه آنلاین سیتام - www.sitam.ir
    </div>
  </div>
</body>
</html>`;
    win.document.write(html);
    win.document.close();
  };


  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveUser({ ...user, name: editName });
    setUser(updated);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.fullName || !addrForm.phone || !addrForm.province || !addrForm.city || !addrForm.addressLine || !addrForm.postalCode) return;

    setLoadingAddresses(true);
    const currentUser = getUser();

    if (currentUser) {
      try {
        const result = await createAddressAction({
          ...addrForm,
          userId: currentUser.id.toString()
        });

        if (result.success && result.data) {
          const freshDetails = await getCustomerDetailsAction(currentUser.id.toString());
          if (freshDetails.success && freshDetails.data) {
            setAddresses(mapPrismaAddresses((freshDetails.data.addresses || []) as unknown[]));
          }
        } else {
          // Local fallback
          addAddress({ ...addrForm, userId: currentUser.id });
          setAddresses(getAddresses(currentUser.id));
        }
      } catch (err) {
        console.error('Failed to add address via Prisma:', err);
        addAddress({ ...addrForm, userId: currentUser.id });
        setAddresses(getAddresses(currentUser.id));
      }
    } else {
      // Guest
      addAddress({ ...addrForm });
      setAddresses(getAddresses(null));
    }

    setAddrForm({ fullName: '', phone: '', province: '', city: '', addressLine: '', postalCode: '' });
    setLoadingAddresses(false);
  };

  const removeAddress = async (id: string | number) => {
    setLoadingAddresses(true);
    const currentUser = getUser();

    if (currentUser) {
      try {
        const result = await deleteAddressAction(String(id));
        if (result.success) {
          const freshDetails = await getCustomerDetailsAction(currentUser.id.toString());
          if (freshDetails.success && freshDetails.data) {
            setAddresses(mapPrismaAddresses((freshDetails.data.addresses || []) as unknown[]));
          }
        } else {
          // Local fallback
          deleteAddress(id);
          setAddresses(getAddresses(currentUser.id));
        }
      } catch (err) {
        console.error('Failed to delete address via Prisma:', err);
        deleteAddress(id);
        setAddresses(getAddresses(currentUser.id));
      }
    } else {
      // Guest
      deleteAddress(id);
      setAddresses(getAddresses(null));
    }
    setLoadingAddresses(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="bg-white border rounded-xl p-6">
            <div className="space-y-3">
              <button onClick={() => setActive('profile')} className={`w-full text-right py-2 rounded-md ${active==='profile' ? 'text-[#83b735] font-bold' : 'text-gray-700'}`}>پروفایل</button>
              <button onClick={() => setActive('orders')} className={`w-full text-right py-2 rounded-md ${active==='orders' ? 'text-[#83b735] font-bold' : 'text-gray-700'}`}>سفارش‌ها</button>
              <button onClick={() => setActive('addresses')} className={`w-full text-right py-2 rounded-md ${active==='addresses' ? 'text-[#83b735] font-bold' : 'text-gray-700'}`}>آدرس‌ها</button>
              <button onClick={() => setActive('wishlist')} className={`w-full text-right py-2 rounded-md ${active==='wishlist' ? 'text-[#83b735] font-bold' : 'text-gray-700'}`}>علاقه‌مندی‌ها</button>
              <button onClick={() => setActive('tickets')} className={`w-full text-right py-2 rounded-md ${active==='tickets' ? 'text-[#83b735] font-bold' : 'text-gray-700'}`}>پشتیبانی</button>
            </div>
          </aside>

          <section className="lg:col-span-3 space-y-8">
            {active === 'profile' && (
              <div className="bg-white border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">پروفایل کاربری</h2>
                {user ? (
                  <div className="space-y-4">
                    <div className="text-gray-700">
                      {isEditing ? (
                        <form onSubmit={handleUpdateProfile} className="flex items-center gap-2">
                          <label>نام:</label>
                          <input 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)} 
                            className="border rounded px-2 py-1 text-sm"
                            autoFocus
                          />
                          <button type="submit" className="text-green-600 text-sm font-bold">ذخیره</button>
                          <button type="button" onClick={() => setIsEditing(false)} className="text-red-500 text-sm">لغو</button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>نام: <span className="font-bold">{user.name || 'کاربر مهمان'}</span></span>
                          <button onClick={() => { setEditName(user.name || ''); setIsEditing(true); }} className="text-gray-400 hover:text-gray-600">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-gray-700">شماره موبایل: <span className="font-bold">{user.phone}</span></div>
                    {user.email && <div className="text-gray-700">ایمیل: <span className="font-bold">{user.email}</span></div>}
                    <button onClick={handleLogout} className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md flex items-center gap-2">
                      خروج
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <OTPLogin onLogin={(u) => setUser(u)} />
                )}
              </div>
            )}

            {active === 'orders' && (
              <div className="bg-white border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">سفارش‌ها</h2>
                {loadingOrders ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-[#83b735]" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as 'all' | Order['status'])} className="border rounded-md px-3 py-2 text-sm">
                        <option value="all">همه وضعیت‌ها</option>
                        <option value="processing">در حال پردازش</option>
                        <option value="shipped">ارسال شد</option>
                        <option value="delivered">تحویل شد</option>
                        <option value="cancelled">لغو شده</option>
                      </select>
                      <input type="date" value={fromDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
                      <input type="date" value={toDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)} className="border rounded-md px-3 py-2 text-sm" />
                      <button onClick={() => { setStatusFilter('all'); setFromDate(''); setToDate(''); }} className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50">پاک‌سازی</button>
                    </div>
                    <div className="space-y-4">
                      {orders
                        .filter(o => statusFilter === 'all' ? true : o.status === statusFilter)
                        .filter(o => {
                          const d = new Date(o.createdAt);
                          const fromOk = fromDate ? d >= new Date(fromDate) : true;
                          const toOk = toDate ? d <= new Date(toDate) : true;
                          return fromOk && toOk;
                        })
                        .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
                        .map((o: Order) => {
                        const addr = addresses.find(a => a.id === o.addressId);
                        const itemsCount = o.items.reduce((acc, it) => acc + it.quantity, 0);
                        return (
                          <div key={o.id} className="border rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(o.createdAt).toLocaleDateString('fa-IR')}
                            </div>
                            <div className="text-sm text-gray-600">{itemsCount} قلم</div>
                            <div className="text-xs text-gray-500">
                              {o.shippingMethod === 'express' ? 'ارسال فوری' : 'ارسال عادی'} • {o.paymentMethod === 'online' ? 'پرداخت آنلاین' : 'پرداخت در محل'}
                              {o.discount && o.discount > 0 ? ` • تخفیف: ${o.discount.toLocaleString()} تومان` : ''}
                            </div>
                            <div className="flex items-center justify-between md:justify-end gap-3">
                              <div className="font-bold text-[#83b735]">{formatPriceToman(o.total)}</div>
                              <div className="text-xs text-gray-500">{o.status}</div>
                              {o.trackingNumber && (
                                <div className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded select-all">
                                  {o.trackingNumber}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handlePrintInvoice(o)}
                                  className="text-xs text-[#83b735] hover:underline"
                                >
                                  چاپ فاکتور
                                </button>
                                <span className="text-gray-300">|</span>
                                <Link href={`/order/${o.id}`} className="text-xs text-[#83b735] hover:underline">مشاهده</Link>
                              </div>
                            </div>
                            {addr && (
                              <div className="md:col-span-4 text-xs text-gray-500">
                                گیرنده: {addr.fullName} — {addr.city} — {addr.addressLine}
                              </div>
                            )}
                            <div className="md:col-span-4">
                              <div className="border-t pt-3 mt-2">
                                <div className="text-sm font-semibold mb-2">درخواست مرجوعی</div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <input
                                    value={returnReasons[String(o.id)] || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setReturnReasons(prev => ({ ...prev, [String(o.id)]: e.target.value }))
                                    }
                                    placeholder="دلیل مرجوعی (مثلاً آسیب‌دیدگی، عدم تطابق)"
                                    className="border rounded-md px-3 py-2 text-sm w-64"
                                  />
                                  <button
                                    onClick={async () => {
                                      const reason = (returnReasons[String(o.id)] || '').trim();
                                      const items = o.items.map(it => ({ id: it.id, quantity: it.quantity }));
                                      if (user?.id) {
                                        await addReturnRequest(o.id, { items, reason }, user.id.toString());
                                        const ordersResult = await getUserOrdersAction(user.id.toString());
                                        if (ordersResult.success && ordersResult.data) {
                                          setOrders(mapPrismaOrders(ordersResult.data as unknown[]));
                                        } else {
                                          setOrders(getOrders(user.id));
                                        }
                                      } else {
                                        addReturnRequest(o.id, { items, reason });
                                        setOrders(getOrders());
                                      }
                                      setReturnReasons(prev => ({ ...prev, [o.id]: '' }));
                                    }}
                                    className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
                                  >
                                    ثبت درخواست
                                  </button>
                                </div>
                                {(o.returns && o.returns.length > 0) && (
                                  <div className="mt-3 space-y-2">
                                    <div className="text-sm font-semibold">تاریخچه مرجوعی‌ها</div>
                                    {o.returns.map(r => (
                                      <div key={r.id} className="flex flex-wrap items-center gap-2 text-xs">
                                        <div className="px-2 py-1 rounded bg-gray-100">کد: {r.id}</div>
                                        <div className="px-2 py-1 rounded bg-gray-100">وضعیت: {r.status}</div>
                                        <div className="px-2 py-1 rounded bg-gray-100">دلیل: {r.reason || '-'}</div>
                                        {typeof r.refundAmount === 'number' && (
                                          <div className="px-2 py-1 rounded bg-gray-100">مبلغ بازگشت: {formatPriceToman(r.refundAmount)}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {orders.length === 0 && (
                        <div className="text-center text-gray-500 py-10">
                          سفارشی یافت نشد.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {active === 'addresses' && (
              <div className="bg-white border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">آدرس‌ها</h2>
                {loadingAddresses ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-[#83b735]" />
                  </div>
                ) : (
                  <>
                <form onSubmit={handleAddAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <input placeholder="نام گیرنده" value={addrForm.fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddrForm({ ...addrForm, fullName: e.target.value })} className="border rounded-md px-4 py-2" required />
                  <input placeholder="شماره تماس" value={addrForm.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddrForm({ ...addrForm, phone: e.target.value })} className="border rounded-md px-4 py-2" required />
                  
                  <select 
                    value={addrForm.province} 
                    onChange={(e) => setAddrForm({ ...addrForm, province: e.target.value, city: '' })} 
                    className="border rounded-md px-4 py-2 bg-white" 
                    required
                  >
                    <option value="">انتخاب استان</option>
                    {provinces.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>

                  <select 
                    value={addrForm.city} 
                    onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} 
                    className="border rounded-md px-4 py-2 bg-white" 
                    required
                    disabled={!addrForm.province}
                  >
                    <option value="">انتخاب شهر</option>
                    {addrForm.province && provinces.find(p => p.name === addrForm.province)?.cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  
                  <input placeholder="کد پستی" value={addrForm.postalCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddrForm({ ...addrForm, postalCode: e.target.value })} className="border rounded-md px-4 py-2" required />

                  <input placeholder="نشانی" value={addrForm.addressLine} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddrForm({ ...addrForm, addressLine: e.target.value })} className="border rounded-md px-4 py-2 md:col-span-2" required />
                  <button type="submit" className="bg-[#83b735] text-white px-4 py-2 rounded-md md:col-span-2">افزودن آدرس</button>
                </form>
                <div className="space-y-4">
                  {addresses.map(a => (
                    <div key={a.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-gray-700">
                        <MapPin className="w-5 h-5 text-[#83b735]" />
                        <div>
                          <div className="font-bold">{a.fullName} — {a.province ? `${a.province}، ` : ''}{a.city}</div>
                          <div className="text-sm">{a.addressLine}</div>
                          {a.postalCode && <div className="text-sm">کد پستی: {a.postalCode}</div>}
                          <div className="text-sm flex items-center gap-2"><Phone className="w-4 h-4" />{a.phone}</div>
                        </div>
                      </div>
                      <button onClick={() => removeAddress(a.id)} className="text-red-600 border px-3 py-1 rounded-md">حذف</button>
                    </div>
                  ))}
                  {addresses.length === 0 && <div className="text-gray-500">آدرسی ثبت نشده است.</div>}
                </div>
              </>
            )}
          </div>
            )}

            {active === 'wishlist' && (
              <div className="bg-white border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">علاقه‌مندی‌ها</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlist.map(w => (
                    <div key={w.id} className="border rounded-lg p-4 relative group hover:shadow-md transition-shadow">
                      <button 
                        onClick={() => removeFromWishlist(w.id)}
                        className="absolute top-2 left-2 z-10 p-1.5 bg-red-50 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                        title="حذف از علاقه‌مندی‌ها"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <Link href={`/product/${w.slug || w.id}`} className="block">
                        <div className="h-40 bg-gray-50 flex items-center justify-center relative rounded-md overflow-hidden mb-3">
                          {w.image ? (
                            <Image 
                              src={w.image} 
                              alt={w.name} 
                              fill 
                              className="object-contain p-2" 
                            />
                          ) : (
                            <span className="text-gray-400">تصویر محصول</span>
                          )}
                        </div>
                        <div className="font-bold text-gray-900 mb-1 line-clamp-1">{w.name}</div>
                        <div className="flex flex-col">
                           {w.discountPrice && w.discountPrice > 0 && w.discountPrice < w.basePrice && (
                             <span className="text-xs text-gray-400 line-through">
                               {formatPriceToman(w.basePrice)}
                             </span>
                           )}
                           <div className="text-[#83b735] font-bold">
                             {formatPriceToman(w.discountPrice && w.discountPrice > 0 ? w.discountPrice : w.basePrice)}
                           </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                  {wishlist.length === 0 && <div className="text-gray-500 col-span-full text-center py-8">محصولی در علاقه‌مندی‌ها نیست.</div>}
                </div>
              </div>
            )}

            {active === 'tickets' && user && (
              <TicketsTab user={{ id: user.id.toString() }} />
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
