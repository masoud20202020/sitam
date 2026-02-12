'use client';

import React, { useState, useEffect } from 'react';
import { 
  getCouponsAction, 
  createCouponAction, 
  updateCouponAction, 
  deleteCouponAction 
} from '@/actions/coupons';
import { getProductsAction } from '@/actions/products';
import { getCategoriesAction } from '@/actions/categories';
import { ProductItem } from '@/data/products';
import { Category } from '@/data/categories';
import { getSMSSettingsAction } from '@/app/actions/settings';
import { sendSMS } from '@/lib/smsService';
import { Pencil, Trash2, Plus, Copy, Check, Send, Loader2, X } from 'lucide-react';

// Define Coupon Type compatible with Prisma response
type Coupon = {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  active: boolean;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  maxUses?: number | null;
  usedCount: number;
  minOrderAmount?: number | null;
  maxUsesPerUser?: number | null;
  allowedProductIds?: string[]; // IDs are strings in Prisma
  allowedCategoryIds?: string[]; // IDs are strings in Prisma
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Data for selectors
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Send Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [couponToSend, setCouponToSend] = useState<Coupon | null>(null);
  const [receiverPhone, setReceiverPhone] = useState('');
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState<Omit<Coupon, 'id' | 'usedCount'>>({
    code: '',
    type: 'percent',
    value: 0,
    active: true,
    startDate: '',
    endDate: '',
    maxUses: undefined,
    minOrderAmount: 0,
    maxUsesPerUser: undefined,
    allowedProductIds: [],
    allowedCategoryIds: []
  });

  // Search states
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [couponsRes, productsRes, categoriesRes] = await Promise.all([
      getCouponsAction(),
      getProductsAction(),
      getCategoriesAction()
    ]);

    if (couponsRes.success && couponsRes.data) {
      setCoupons(couponsRes.data as Coupon[]);
    }
    if (productsRes) setProducts(productsRes);
    if (categoriesRes) setCategories(categoriesRes);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({
      code: '',
      type: 'percent',
      value: 0,
      active: true,
      startDate: '',
      endDate: '',
      maxUses: undefined,
      minOrderAmount: 0,
      maxUsesPerUser: undefined,
      allowedProductIds: [],
      allowedCategoryIds: []
    });
    setEditing(null);
    setIsModalOpen(false);
    setProductSearch('');
    setCategorySearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
        ...form,
        // Ensure dates are properly formatted or null
        startDate: form.startDate ? new Date(form.startDate) : null,
        endDate: form.endDate ? new Date(form.endDate) : null,
    };

    if (editing) {
      const result = await updateCouponAction(editing.id, submissionData);
      if (result.success) {
          setCoupons(prev => prev.map(c => c.id === editing.id ? (result.data as unknown as Coupon) : c));
          // Re-fetch to be sure about types if needed, or trust the result
          fetchData(); 
          resetForm();
      } else {
          alert('خطا در بروزرسانی کوپن: ' + result.error);
      }
    } else {
      const result = await createCouponAction(submissionData);
      if (result.success) {
          fetchData();
          resetForm();
      } else {
          alert('خطا در ایجاد کوپن: ' + result.error);
      }
    }
  };

  const onEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      type: c.type as 'percent' | 'fixed',
      value: c.value,
      active: c.active,
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 16) : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 16) : '',
      maxUses: c.maxUses,
      minOrderAmount: c.minOrderAmount || 0,
      maxUsesPerUser: c.maxUsesPerUser,
      allowedProductIds: c.allowedProductIds || [],
      allowedCategoryIds: c.allowedCategoryIds || []
    });
    setIsModalOpen(true);
  };

  const toggleProductSelection = (id: string) => {
    setForm(prev => {
      const current = prev.allowedProductIds || [];
      if (current.includes(id)) {
        return { ...prev, allowedProductIds: current.filter(x => x !== id) };
      }
      return { ...prev, allowedProductIds: [...current, id] };
    });
  };

  const toggleCategorySelection = (id: string) => {
    setForm(prev => {
      const current = prev.allowedCategoryIds || [];
      if (current.includes(id)) {
        return { ...prev, allowedCategoryIds: current.filter(x => x !== id) };
      }
      return { ...prev, allowedCategoryIds: [...current, id] };
    });
  };

  const onDelete = async (id: string) => {
    if (confirm('آیا از حذف این کد تخفیف مطمئن هستید؟')) {
      const result = await deleteCouponAction(id);
      if (result.success) {
        setCoupons(prev => prev.filter(c => c.id !== id));
      } else {
        alert('خطا در حذف: ' + result.error);
      }
    }
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openSendModal = (c: Coupon) => {
    setCouponToSend(c);
    setReceiverPhone('');
    setIsSendModalOpen(true);
  };

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponToSend || !receiverPhone) return;
    
    try {
        const settings = await getSMSSettingsAction();
        if (!settings.enabled || !settings.apiKey) {
          alert('تنظیمات پیامک فعال نیست یا کلید API تنظیم نشده است. لطفا ابتدا تنظیمات پیامک را پیکربندی کنید.');
          return;
        }

        setSending(true);
        // Customize the message as needed
        const text = `تخفیف ویژه برای شما!\nکد تخفیف: ${couponToSend.code}\n${couponToSend.type === 'percent' ? `${couponToSend.value}% تخفیف` : `${couponToSend.value.toLocaleString()} تومان تخفیف`}\nمهلت استفاده: ${couponToSend.endDate ? new Date(couponToSend.endDate).toLocaleDateString('fa-IR') : 'نامحدود'}`;
        
        const success = await sendSMS(settings.apiKey, receiverPhone, text);
        if (success) {
            alert('پیامک با موفقیت ارسال شد.');
            setIsSendModalOpen(false);
        } else {
            alert('خطا در ارسال پیامک.');
        }
    } catch (error) {
        console.error(error);
        alert('خطا در ارتباط با سرویس پیامک.');
    } finally {
        setSending(false);
    }
  };

  if (loading) {
      return <div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت کدهای تخفیف</h1>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-[#83b735] text-white px-4 py-2 rounded-lg hover:bg-[#75a32f] transition-colors"
        >
          <Plus className="w-5 h-5" />
          افزودن کد جدید
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-600">کد تخفیف</th>
              <th className="px-6 py-4 font-medium text-gray-600">نوع</th>
              <th className="px-6 py-4 font-medium text-gray-600">مقدار</th>
              <th className="px-6 py-4 font-medium text-gray-600">استفاده شده</th>
              <th className="px-6 py-4 font-medium text-gray-600">وضعیت</th>
              <th className="px-6 py-4 font-medium text-gray-600">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-gray-800">{c.code}</span>
                    <button 
                      onClick={() => copyToClipboard(c.code, c.id)}
                      className="text-gray-400 hover:text-[#83b735] transition-colors"
                      title="کپی کد"
                    >
                      {copiedId === c.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {c.type === 'percent' ? 'درصدی' : 'مبلغ ثابت'}
                </td>
                <td className="px-6 py-4 font-bold text-[#83b735]">
                  {c.type === 'percent' ? `${c.value}٪` : `${c.value.toLocaleString()} تومان`}
                </td>
                <td className="px-6 py-4">
                  {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : ''}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.active ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openSendModal(c)}
                      className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                      title="ارسال پیامک"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => onEdit(c)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => onDelete(c.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  هیچ کد تخفیفی یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800">
              {editing ? 'ویرایش کد تخفیف' : 'افزودن کد تخفیف جدید'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">کد تخفیف</label>
                <input 
                  type="text"
                  required
                  value={form.code}
                  onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                  className="w-full border rounded-lg p-2 font-mono text-left uppercase"
                  placeholder="e.g. SUMMER2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع تخفیف</label>
                  <select 
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value as 'percent' | 'fixed'})}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="percent">درصدی (%)</option>
                    <option value="fixed">مبلغ ثابت (تومان)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مقدار</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    value={form.value}
                    onChange={e => setForm({...form, value: Number(e.target.value)})}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">حداقل خرید (تومان)</label>
                  <input 
                    type="number"
                    min="0"
                    value={form.minOrderAmount || 0}
                    onChange={e => setForm({...form, minOrderAmount: Number(e.target.value)})}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">سقف استفاده (کلی)</label>
                   <input 
                    type="number"
                    min="1"
                    value={form.maxUses || ''}
                    onChange={e => setForm({...form, maxUses: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full border rounded-lg p-2"
                    placeholder="نامحدود"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ شروع</label>
                  <input 
                    type="datetime-local"
                    value={form.startDate as string || ''}
                    onChange={e => setForm({...form, startDate: e.target.value})}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ پایان</label>
                  <input 
                    type="datetime-local"
                    value={form.endDate as string || ''}
                    onChange={e => setForm({...form, endDate: e.target.value})}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Product Restriction */}
              <div className="space-y-2">
                 <label className="block text-sm font-medium text-gray-700">محدودیت محصول</label>
                 <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                    <input 
                      type="text" 
                      placeholder="جستجوی محصول..." 
                      className="w-full text-sm border-b pb-2 mb-2 outline-none"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                    />
                    <div className="space-y-1">
                      {products
                        .filter(p => p.name.includes(productSearch))
                        .map(p => (
                          <div key={p.id} className="flex items-center gap-2">
                             <input 
                               type="checkbox"
                               id={`prod-${p.id}`}
                               checked={(form.allowedProductIds || []).includes(String(p.id))}
                               onChange={() => toggleProductSelection(String(p.id))}
                               className="rounded border-gray-300"
                             />
                             <label htmlFor={`prod-${p.id}`} className="text-sm cursor-pointer select-none truncate">
                               {p.name}
                             </label>
                          </div>
                        ))
                      }
                    </div>
                 </div>
                 {form.allowedProductIds && form.allowedProductIds.length > 0 && (
                   <div className="flex flex-wrap gap-1">
                      {form.allowedProductIds.map(pid => {
                         const prod = products.find(p => String(p.id) === pid);
                         return prod ? (
                           <span key={pid} className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                             {prod.name}
                             <button type="button" onClick={() => toggleProductSelection(pid)} className="mr-1 hover:text-blue-900"><X className="w-3 h-3"/></button>
                           </span>
                         ) : null;
                      })}
                   </div>
                 )}
              </div>

              {/* Category Restriction */}
              <div className="space-y-2">
                 <label className="block text-sm font-medium text-gray-700">محدودیت دسته‌بندی</label>
                 <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                    <input 
                      type="text" 
                      placeholder="جستجوی دسته‌بندی..." 
                      className="w-full text-sm border-b pb-2 mb-2 outline-none"
                      value={categorySearch}
                      onChange={e => setCategorySearch(e.target.value)}
                    />
                    <div className="space-y-1">
                      {categories
                        .filter(c => c.name.includes(categorySearch))
                        .map(c => (
                          <div key={c.id} className="flex items-center gap-2">
                             <input 
                               type="checkbox"
                               id={`cat-${c.id}`}
                               checked={(form.allowedCategoryIds || []).includes(String(c.id))}
                               onChange={() => toggleCategorySelection(String(c.id))}
                               className="rounded border-gray-300"
                             />
                             <label htmlFor={`cat-${c.id}`} className="text-sm cursor-pointer select-none truncate">
                               {c.name}
                             </label>
                          </div>
                        ))
                      }
                    </div>
                 </div>
                 {form.allowedCategoryIds && form.allowedCategoryIds.length > 0 && (
                   <div className="flex flex-wrap gap-1">
                      {form.allowedCategoryIds.map(cid => {
                         const cat = categories.find(c => String(c.id) === cid);
                         return cat ? (
                           <span key={cid} className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs">
                             {cat.name}
                             <button type="button" onClick={() => toggleCategorySelection(cid)} className="mr-1 hover:text-purple-900"><X className="w-3 h-3"/></button>
                           </span>
                         ) : null;
                      })}
                   </div>
                 )}
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={e => setForm({...form, active: e.target.checked})}
                  className="rounded border-gray-300 w-4 h-4 text-[#83b735] focus:ring-[#83b735]"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  فعال باشد
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  انصراف
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#83b735] text-white rounded-lg hover:bg-[#75a32f]"
                >
                  {editing ? 'بروزرسانی' : 'ایجاد کد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send SMS Modal */}
      {isSendModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
               <h3 className="text-lg font-bold">ارسال کد تخفیف via SMS</h3>
               <p className="text-sm text-gray-600">
                 ارسال کد <span className="font-mono font-bold">{couponToSend?.code}</span>
               </p>
               <input 
                 type="text" 
                 placeholder="شماره موبایل (0912...)" 
                 className="w-full border p-2 rounded"
                 value={receiverPhone}
                 onChange={e => setReceiverPhone(e.target.value)}
               />
               <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsSendModalOpen(false)} className="px-4 py-2 border rounded">لغو</button>
                  <button 
                    onClick={handleSendSMS} 
                    disabled={sending || !receiverPhone}
                    className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50 flex items-center gap-2"
                  >
                    {sending && <Loader2 className="w-4 h-4 animate-spin"/>}
                    ارسال
                  </button>
               </div>
            </div>
          </div>
      )}
    </div>
  );
}
