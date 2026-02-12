'use client';

import React, { useState, useEffect } from 'react';
import { 
  getBannersAction, 
  createBannerAction, 
  updateBannerAction, 
  deleteBannerAction, 
  Banner 
} from '@/actions/banners';
import { Pencil, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import MediaPickerModal from '@/components/admin/MediaPickerModal';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  
  const [form, setForm] = useState<Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>>({
    title: '',
    subtitle: '',
    image: '',
    link: '/shop',
    active: true,
    order: 1,
    position: 'hero',
    backgroundColor: '',
  });

  const fetchBanners = async () => {
    setIsLoading(true);
    const result = await getBannersAction();
    if (result.success && result.data) {
      setBanners(result.data as Banner[]);
    } else {
      console.error(result.error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const id = setTimeout(() => {
      fetchBanners();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const getSizeHint = (pos: string) => {
    switch (pos) {
      case 'hero': return 'سایز پیشنهادی: ۶۰۰×۴۰۰ پیکسل (تصویر سمت چپ)';
      case 'middle': return 'سایز پیشنهادی: ۴۰۰×۴۰۰ پیکسل (بدون پس‌زمینه)';
      case 'about': return 'سایز پیشنهادی: ۹۰۰×۳۲۰ پیکسل (عریض)';
      case 'home_above_categories': return 'سایز پیشنهادی: ۳۰۰×۳۰۰ پیکسل (بدون پس‌زمینه)';
      case 'home_bottom_grid': return 'سایز پیشنهادی: ۳۰۰×۳۰۰ پیکسل (بدون پس‌زمینه)';
      default: return '';
    }
  };

  const resetForm = () => {
    setForm({ title: '', subtitle: '', image: '', link: '/shop', active: true, order: 1, position: 'hero', backgroundColor: '' });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (editing) {
      const result = await updateBannerAction(editing.id, form);
      if (!result.success) {
        alert('خطا در ویرایش بنر: ' + result.error);
      }
    } else {
      const result = await createBannerAction(form);
      if (!result.success) {
        alert('خطا در ایجاد بنر: ' + result.error);
      }
    }
    
    await fetchBanners();
    resetForm();
    setIsLoading(false);
  };

  const onEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      image: b.image || '',
      link: b.link || '',
      active: b.active,
      order: b.order,
      position: b.position || 'hero',
      backgroundColor: b.backgroundColor || '',
    });
  };

  const onDelete = async (id: string) => {
    if (!confirm('آیا از حذف این بنر اطمینان دارید؟')) return;
    
    setIsLoading(true);
    const result = await deleteBannerAction(id);
    if (!result.success) {
      alert('خطا در حذف بنر: ' + result.error);
    }
    await fetchBanners();
    setIsLoading(false);
  };

  if (isLoading && banners.length === 0) {
    return <div className="p-10 text-center">در حال بارگذاری...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      <main className="flex-grow container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">مدیریت بنرهای صفحه اصلی</h1>
          <Link href="/admin/products" className="text-sm text-[#db2777] hover:underline">مدیریت محصولات</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editing ? 'ویرایش بنر' : 'افزودن بنر جدید'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700">عنوان</label>
                <input
                  className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#db2777]"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">زیرعنوان</label>
                <textarea
                  className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#db2777] resize-none"
                  rows={3}
                  value={form.subtitle || ''}
                  onChange={e => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm text-gray-700">آدرس تصویر (اختیاری)</label>
                  <span className="text-xs text-[#db2777] font-medium">{getSizeHint(form.position)}</span>
                </div>
                <div className="flex gap-2">
                  <input
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#db2777] dir-ltr text-left"
                    value={form.image || ''}
                    onChange={e => setForm({ ...form, image: e.target.value })}
                    placeholder="/images/banner.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMediaModalOpen(true)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-md border transition-colors"
                    title="انتخاب از کتابخانه"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">رنگ پس‌زمینه (برای بنرهای خاص)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-12 h-10 border rounded-md cursor-pointer"
                    value={form.backgroundColor || '#ffffff'}
                    onChange={e => setForm({ ...form, backgroundColor: e.target.value })}
                  />
                  <input
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#db2777] dir-ltr text-left"
                    value={form.backgroundColor || ''}
                    onChange={e => setForm({ ...form, backgroundColor: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">لینک اقدام</label>
                <input
                  className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#db2777]"
                  value={form.link || ''}
                  onChange={e => setForm({ ...form, link: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">موقعیت</label>
                  <select
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#db2777]"
                    value={form.position}
                    onChange={e => setForm({ ...form, position: e.target.value })}
                  >
                    <option value="hero">اسلایدر اصلی (Hero)</option>
                    <option value="middle">بنر میانی (تکی)</option>
                    <option value="about">صفحه درباره ما</option>
                    <option value="home_above_categories">بالای دسته‌بندی‌های محبوب (دو تایی)</option>
                    <option value="home_bottom_grid">شبکه بنرهای پایین (دو تایی)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">فعال</label>
                  <select
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#db2777]"
                    value={form.active ? 'true' : 'false'}
                    onChange={e => setForm({ ...form, active: e.target.value === 'true' })}
                  >
                    <option value="true">بله</option>
                    <option value="false">خیر</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">ترتیب نمایش</label>
                  <input
                    type="number"
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#db2777]"
                    value={form.order}
                    onChange={e => setForm({ ...form, order: Number(e.target.value) || 1 })}
                    min={1}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[#db2777] text-white font-bold py-2 rounded-md hover:bg-[#be185d] transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300"
                >
                  {editing ? 'ثبت تغییرات' : 'افزودن بنر'}
                  <Plus className="w-4 h-4" />
                </button>
                {editing && (
                  <button
                    type="button"
                    className="flex-1 border text-gray-700 font-bold py-2 rounded-md hover:bg-gray-50"
                    onClick={resetForm}
                  >
                    انصراف
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-right p-3">عنوان</th>
                  <th className="text-right p-3">زیرعنوان</th>
                  <th className="text-right p-3">تصویر</th>
                  <th className="text-right p-3">لینک</th>
                  <th className="text-right p-3">موقعیت</th>
                  <th className="text-right p-3">فعال</th>
                  <th className="text-right p-3">ترتیب</th>
                  <th className="text-right p-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {banners.map(b => (
                  <tr key={b.id} className="border-t">
                    <td className="p-3 font-medium text-gray-900">{b.title}</td>
                    <td className="p-3 text-gray-600 truncate max-w-xs">{b.subtitle}</td>
                    <td className="p-3 text-gray-600">{b.image ? <a href={b.image} className="text-[#db2777]">تصویر</a> : '-'}</td>
                    <td className="p-3 text-gray-600">{b.link || '-'}</td>
                    <td className="p-3 text-gray-600">
                      {b.position === 'middle' ? 'بنر میانی' : 
                       b.position === 'about' ? 'درباره ما' :
                       b.position === 'home_above_categories' ? 'بالای دسته‌بندی‌ها' :
                       b.position === 'home_bottom_grid' ? 'بنرهای پایین' :
                       'اسلایدر اصلی'}
                    </td>
                    <td className="p-3">{b.active ? 'فعال' : 'غیرفعال'}</td>
                    <td className="p-3">{b.order}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          className="p-2 border rounded-md hover:bg-gray-50"
                          onClick={() => onEdit(b)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 border rounded-md hover:bg-red-50 text-red-600"
                          onClick={() => onDelete(b.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {banners.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={8}>
                      بنری ثبت نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <MediaPickerModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => setForm({ ...form, image: url })}
      />

    </div>
  );
}
