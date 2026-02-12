'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Pencil, Trash2, Plus, Download, ShoppingBag, X, Heart } from 'lucide-react';
import { formatPriceToman } from '@/data/products';
import { downloadCSV } from '@/utils/export';
import { 
  getCustomersAction, 
  createCustomerAction, 
  updateCustomerAction, 
  deleteCustomerAction, 
  getCustomerDetailsAction 
} from '@/actions/customers';
import type { Order, WishlistItem } from '@/data/account';

// Type definitions matching the server action return
type Customer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: Date | null;
};

type CustomerDetails = Customer & {
  orders: Order[];
  wishlist: WishlistItem[];
};

type Segment = 'loyal' | 'new' | 'inactive' | 'normal';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; phone: string }>({ name: '', email: '', phone: '' });
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<Segment | 'all'>('all');
  
  // History Modal State
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist'>('orders');

  const fetchCustomers = async () => {
    setLoading(true);
    const result = await getCustomersAction();
    if (result.success && result.data) {
      setCustomers(result.data as Customer[]);
    } else {
      console.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const id = setTimeout(() => {
      fetchCustomers();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const result = await updateCustomerAction(editing.id, form);
      if (result.success) {
        fetchCustomers();
        setEditing(null);
        setForm({ name: '', email: '', phone: '' });
      } else {
        alert(result.error);
      }
    } else {
      const result = await createCustomerAction(form);
      if (result.success) {
        fetchCustomers();
        setForm({ name: '', email: '', phone: '' });
      } else {
        alert(result.error);
      }
    }
  };

  const onEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '' });
  };

  const onDelete = async (id: string) => {
    if (confirm('آیا از حذف این مشتری مطمئن هستید؟')) {
      const result = await deleteCustomerAction(id);
      if (result.success) {
        fetchCustomers();
      } else {
        alert(result.error);
      }
    }
  };

  const openHistory = async (c: Customer) => {
    setHistoryCustomer(c);
    setDetailsLoading(true);
    setCustomerDetails(null);
    const result = await getCustomerDetailsAction(c.id);
    if (result.success && result.data) {
        const resp = result.data as {
          orders: Array<{
            id: string | number;
            items?: Array<{
              productId?: string | number;
              id?: string | number;
              name: string;
              price: number;
              quantity: number;
              image?: string | null;
              color?: string | null;
              size?: string | null;
              variantId?: string | null;
            }>;
            total?: number;
            createdAt?: string | number | Date;
            status?: string;
            addressId?: string | number | null;
            shippingMethod?: string | null;
            paymentMethod?: string | null;
            discount?: number | null;
            userId?: string | number | null;
          }>;
          wishlist: Array<{
            productId?: string | number;
            id?: string | number;
            name?: string;
            price?: number | string;
            image?: string | null;
          }>;
        };
        const prismaOrders = resp.orders || [];
        const mappedOrders: Order[] = prismaOrders.map((o) => ({
          id: Number(o.id) || Date.now(),
          items: Array.isArray(o.items)
            ? o.items.map((it) => ({
                id: (it.productId ?? it.id) as string | number,
                name: it.name,
                price: it.price,
                quantity: it.quantity,
                image: it.image || undefined,
                color: it.color || undefined,
                size: it.size || undefined,
                variantId: it.variantId || undefined,
              }))
            : [],
          total: o.total ?? 0,
          createdAt: o.createdAt ? new Date(o.createdAt as string | number | Date).valueOf() : Date.now(),
          status: (o.status as Order['status']) ?? 'processing',
          addressId: o.addressId ? Number(o.addressId) : undefined,
          shippingMethod: o.shippingMethod ?? undefined,
          paymentMethod:
            o.paymentMethod === 'cod' || o.paymentMethod === 'online'
              ? (o.paymentMethod as 'cod' | 'online')
              : undefined,
          discount: o.discount ?? undefined,
          userId: o.userId ? Number(o.userId) : undefined,
        }));
        const prismaWishlist = resp.wishlist || [];
        const mappedWishlist: WishlistItem[] = Array.isArray(prismaWishlist)
          ? prismaWishlist.map((w) => ({
              productId: (w.productId ?? w.id) as string | number,
              name: w.name ?? '',
              price: Number(w.price) || 0,
              image: w.image || undefined,
            }))
          : [];
        setCustomerDetails({
          ...c,
          orders: mappedOrders,
          wishlist: mappedWishlist,
        } as CustomerDetails);
    }
    setDetailsLoading(false);
    setActiveTab('orders');
  };

  const getCustomerSegment = (c: Customer): Segment => {
    if (c.totalOrders > 5) return 'loyal';
    if (c.totalOrders === 0) return 'new'; // or inactive if created long ago
    // Simple logic for now
    return 'normal';
  };

  const filtered = useMemo(() => {
    let list = customers.slice();
    if (segment !== 'all') list = list.filter(c => getCustomerSegment(c) === segment);
    if (query.trim()) {
      const q = query.trim();
      list = list.filter(c => 
        (c.name && c.name.includes(q)) || 
        (c.email && c.email.includes(q)) || 
        (c.phone && c.phone.includes(q))
      );
    }
    return list;
  }, [customers, segment, query]);

  const getSegmentLabel = (s: Segment) => {
    switch (s) {
      case 'loyal': return 'وفادار';
      case 'new': return 'جدید';
      case 'inactive': return 'غیرفعال';
      default: return 'عادی';
    }
  };

  const handleExport = () => {
    const data = filtered.map(c => {
      const seg = getCustomerSegment(c);
      return {
        'شناسه': c.id,
        'نام': c.name,
        'ایمیل': c.email || '-',
        'تلفن': c.phone || '-',
        'سگمنت': getSegmentLabel(seg),
        'تعداد سفارش': c.totalOrders,
        'جمع خرید': c.totalSpend,
        'آخرین خرید': c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('fa-IR') : '-'
      };
    });
    downloadCSV(data, `customers-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت مشتریان (CRM)</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {editing ? 'ویرایش مشتری' : 'افزودن مشتری جدید'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-700">نام</label>
              <input
                className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700">ایمیل</label>
              <input
                className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-700">شماره تماس</label>
              <input
                className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#83b735] text-white font-bold py-2 rounded-md hover:bg-[#6da025] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {editing ? 'ثبت تغییرات' : 'افزودن مشتری'}
                <Plus className="w-4 h-4" />
              </button>
              {editing && (
                <button
                  type="button"
                  className="flex-1 border text-gray-700 font-bold py-2 rounded-md hover:bg-gray-50"
                  onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '' }); }}
                >
                  انصراف
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              className="flex-1 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
              placeholder="جستجو نام/ایمیل/شماره"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <select
              className="border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
              value={segment}
              onChange={e => setSegment(e.target.value as Segment | 'all')}
            >
              <option value="all">همه</option>
              <option value="loyal">وفادار</option>
              <option value="new">جدید</option>
              <option value="inactive">غیرفعال</option>
            </select>
            <button
              onClick={handleExport}
              className="bg-[#83b735] text-white rounded-md px-4 py-2 hover:bg-[#72a02d] flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              خروجی اکسل
            </button>
          </div>
          
          {loading ? (
             <div className="text-center py-12 text-gray-500">در حال بارگذاری...</div>
          ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-right p-3">نام</th>
                  <th className="text-right p-3">ایمیل</th>
                  <th className="text-right p-3">شماره</th>
                  <th className="text-right p-3">سگمنت</th>
                  <th className="text-right p-3">تعداد سفارش</th>
                  <th className="text-right p-3">جمع خرید</th>
                  <th className="text-right p-3">آخرین خرید</th>
                  <th className="text-right p-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const seg = getCustomerSegment(c);
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="p-3 font-medium text-gray-900">{c.name}</td>
                      <td className="p-3 text-gray-600">{c.email || '-'}</td>
                      <td className="p-3 text-gray-600">{c.phone || '-'}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-md border ${seg === 'loyal' ? 'text-green-700 border-green-200' : seg === 'new' ? 'text-blue-700 border-blue-200' : seg === 'inactive' ? 'text-red-700 border-red-200' : 'text-gray-600 border-gray-200'}`}>
                          {getSegmentLabel(seg)}
                        </span>
                      </td>
                      <td className="p-3">{c.totalOrders}</td>
                      <td className="p-3 text-[#83b735] font-bold">{formatPriceToman(c.totalSpend)}</td>
                      <td className="p-3 text-gray-600">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('fa-IR') : '-'}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                             className="p-2 border rounded-md hover:bg-blue-50 text-blue-600"
                             onClick={() => openHistory(c)}
                             title="جزئیات و تاریخچه"
                          >
                             <ShoppingBag className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 border rounded-md hover:bg-gray-50"
                            onClick={() => onEdit(c)}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 border rounded-md hover:bg-red-50 text-red-600"
                            onClick={() => onDelete(c.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={8}>
                      مشتری‌ای یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {/* History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setHistoryCustomer(null)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b z-10">
               <div className="p-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                     <ShoppingBag className="w-5 h-5 text-[#83b735]" />
                     جزئیات مشتری: {historyCustomer.name}
                  </h3>
                  <button onClick={() => setHistoryCustomer(null)} className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors">
                    <X className="w-6 h-6" />
                  </button>
               </div>
               
               {/* Tabs */}
               <div className="flex px-4 gap-6">
                  <button 
                    onClick={() => setActiveTab('orders')} 
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'orders' ? 'border-[#83b735] text-[#83b735]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    سفارشات
                    {customerDetails && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">{customerDetails.orders.length}</span>}
                  </button>
                  <button 
                    onClick={() => setActiveTab('wishlist')} 
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'wishlist' ? 'border-[#83b735] text-[#83b735]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    <Heart className="w-4 h-4" />
                    علاقه‌مندی‌ها
                    {customerDetails && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">{customerDetails.wishlist.length}</span>}
                  </button>
               </div>
            </div>
            
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
               {detailsLoading ? (
                   <div className="text-center py-12 text-gray-500">در حال دریافت اطلاعات...</div>
               ) : customerDetails ? (
                   <>
                   {activeTab === 'orders' && (
                     customerDetails.orders.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                          <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                          <p>این مشتری تاکنون سفارشی ثبت نکرده است.</p>
                       </div>
                     ) : (
                       customerDetails.orders.map(order => (
                          <div key={order.id} className="border rounded-xl overflow-hidden bg-gray-50/50 mb-4">
                             <div className="bg-white p-4 border-b flex flex-wrap gap-4 justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded text-xs">#{String(order.id).slice(-6)}</span>
                                   <span className={`text-xs px-2 py-1 rounded-full ${
                                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                       order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                       'bg-gray-100 text-gray-700'
                                   }`}>
                                       {order.status}
                                   </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                   {new Date(order.createdAt).toLocaleDateString('fa-IR')}
                                </div>
                             </div>
                             <div className="p-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">مبلغ کل:</span>
                                    <span className="font-bold text-[#83b735]">{formatPriceToman(order.total || 0)}</span>
                                </div>
                             </div>
                          </div>
                       ))
                     )
                   )}
                   
                   {activeTab === 'wishlist' && (
                       customerDetails.wishlist.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                           <Heart className="w-16 h-16 mb-4 opacity-20" />
                           <p>لیست علاقه‌مندی‌ها خالی است.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {customerDetails.wishlist.map(item => (
                                <div key={item.productId} className="border rounded-lg p-3 flex gap-3 items-center">
                                    <div className="w-12 h-12 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                                        {item.image && <Image src={item.image} alt="" fill className="object-cover" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-[#83b735]">{formatPriceToman(item.price)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                      )
                   )}
                   </>
               ) : (
                   <div className="text-center text-red-500">خطا در دریافت اطلاعات</div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
