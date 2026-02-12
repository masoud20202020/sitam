'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Category } from '@/data/categories';
import { getCategoriesAction, createCategoryAction, updateCategoryAction, deleteCategoryAction } from '@/actions/categories';
import { Pencil, Trash2, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState<{ name: string; description: string; parentId: string; slug: string; icon: string; popularImage?: string; isActive: boolean; isPopular: boolean }>({ 
    name: '', description: '', parentId: '', slug: '', icon: '', popularImage: '', isActive: true, isPopular: false 
  });
  const [editing, setEditing] = useState<Category | null>(null);

  const fetchData = async () => {
    try {
      const data = await getCategoriesAction();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', parentId: '', slug: '', icon: '', isActive: true, isPopular: false, popularImage: '' });
    setEditing(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'icon' | 'popularImage' = 'icon') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsSubmitting(true);

    const pid = form.parentId ? form.parentId : null;
    
    try {
      if (editing) {
        const result = await updateCategoryAction(String(editing.id), {
          name: form.name.trim(), 
          slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, '-'),
          description: form.description.trim() || undefined,
          parentId: pid,
          icon: form.icon,
          isActive: form.isActive,
          isPopular: form.isPopular
        });
        if (result.success) {
           await fetchData();
           resetForm();
        } else {
            alert('خطا در ویرایش: ' + result.error);
        }
      } else {
        const result = await createCategoryAction({
          name: form.name.trim(), 
          slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, '-'),
          description: form.description.trim() || undefined,
          parentId: pid,
          icon: form.icon,
          isActive: form.isActive,
          isPopular: form.isPopular
        });
        if (result.success) {
            await fetchData();
            resetForm();
        } else {
            alert('خطا در ایجاد: ' + result.error);
        }
      }
    } catch (error) {
        console.error(error);
        alert('خطای غیرمنتظره');
    } finally {
        setIsSubmitting(false);
    }
  };

  const onEdit = (c: Category) => {
    setEditing(c);
    setForm({ 
      name: c.name, 
      slug: c.slug || '',
      description: c.description || '',
      parentId: c.parentId ? String(c.parentId) : '',
      icon: c.icon || '',
      isActive: c.isActive !== undefined ? c.isActive : true,
      isPopular: c.isPopular || false
    });
  };

  const onToggleStatus = async (id: string | number, currentStatus: boolean | undefined) => {
    const newStatus = !currentStatus;
    // Optimistic update
    setCategories(prev => prev.map(c => String(c.id) === String(id) ? { ...c, isActive: newStatus } : c));
    
    const result = await updateCategoryAction(id, { isActive: newStatus });
    if (!result.success) {
        // Revert
        alert('خطا در تغییر وضعیت');
        fetchData();
    } else {
        if (editing && String(editing.id) === String(id)) {
            setForm(prev => ({ ...prev, isActive: newStatus }));
        }
    }
  };

  const onDelete = async (id: string | number) => {
    if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) return;
    
    const result = await deleteCategoryAction(id);
    if (result.success) {
        setCategories(prev => prev.filter(c => String(c.id) !== String(id)));
        if (editing && String(editing.id) === String(id)) resetForm();
    } else {
        alert('خطا در حذف: ' + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      <main className="flex-grow container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">مدیریت دسته‌بندی‌ها</h1>
          <Link href="/admin/products" className="text-sm text-[#83b735] hover:underline">مدیریت محصولات</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border p-6 h-fit sticky top-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editing ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام دسته‌بندی</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#83b735] focus:border-transparent transition-all"
                  placeholder="مثلاً: لوازم جانبی"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نامک (Slug)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#83b735] focus:border-transparent transition-all dir-ltr"
                  placeholder="accessories"
                />
                <p className="text-xs text-gray-500 mt-1">در صورت خالی بودن، از نام دسته‌بندی ساخته می‌شود.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">دسته مادر</label>
                <select
                  value={form.parentId}
                  onChange={e => setForm({ ...form, parentId: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#83b735] focus:border-transparent transition-all"
                >
                  <option value="">(بدون مادر - دسته اصلی)</option>
                  {categories.filter(c => (!editing || String(c.id) !== String(editing.id))).map(c => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#83b735] focus:border-transparent transition-all h-24"
                  placeholder="توضیحات کوتاه..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">آیکون</label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, 'icon')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {form.icon ? (
                            <div className="relative w-full h-12">
                                <Image src={form.icon} alt="Icon" fill className="object-contain" />
                            </div>
                        ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto group-hover:text-[#83b735]" />
                        )}
                        <span className="text-xs text-gray-500 mt-1 block">انتخاب فایل</span>
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تصویر محبوب</label>
                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, 'popularImage')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                         {form.popularImage ? (
                            <div className="relative w-full h-12">
                                <Image src={form.popularImage} alt="Popular" fill className="object-contain" />
                            </div>
                        ) : (
                            <Upload className="w-8 h-8 text-gray-400 mx-auto group-hover:text-[#db2777]" />
                        )}
                        <span className="text-xs text-gray-500 mt-1 block">انتخاب فایل</span>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={form.isActive}
                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        className="rounded text-[#83b735] focus:ring-[#83b735]"
                    />
                    <span className="text-sm text-gray-700">فعال</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={form.isPopular}
                        onChange={e => setForm({ ...form, isPopular: e.target.checked })}
                        className="rounded text-[#db2777] focus:ring-[#db2777]"
                    />
                    <span className="text-sm text-gray-700">محبوب</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center gap-2 bg-[#83b735] text-white py-2 rounded-lg hover:bg-[#75a62e] transition-colors shadow-sm font-bold ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                      <span>در حال ذخیره...</span>
                  ) : (
                      <>
                        {editing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editing ? 'بروزرسانی' : 'افزودن'}
                      </>
                  )}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    انصراف
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
             {loading ? (
                 <div className="text-center py-10 text-gray-500">در حال بارگذاری...</div>
             ) : categories.length === 0 ? (
                 <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                    <p className="text-gray-500">هنوز دسته‌بندی ایجاد نشده است.</p>
                 </div>
             ) : (
                categories.map((category) => (
                  <div 
                    key={category.id} 
                    className={`bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between group transition-all hover:shadow-md ${!category.isActive ? 'opacity-60 bg-gray-50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                         {category.icon ? (
                            <Image src={category.icon || ''} alt={category.name} fill className="object-contain" />
                         ) : (
                            <span className="text-xl font-bold text-gray-400">{category.name.charAt(0)}</span>
                         )}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            {category.name}
                            {category.isPopular && (
                                <span className="text-[10px] bg-[#db2777]/10 text-[#db2777] px-2 py-0.5 rounded-full">محبوب</span>
                            )}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span className="bg-gray-100 px-2 rounded text-xs font-mono">{category.slug}</span>
                            {category.parentId && (
                                <span className="text-xs text-gray-400">
                                    (زیرمجموعه {categories.find(c => String(c.id) === String(category.parentId))?.name || '...'})
                                </span>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onToggleStatus(category.id, category.isActive)}
                        className={`text-xs px-2 py-1 rounded-md border ${category.isActive ? 'border-green-200 text-green-600 hover:bg-green-50' : 'border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                      >
                        {category.isActive ? 'فعال' : 'غیرفعال'}
                      </button>
                      
                      <button
                        onClick={() => onEdit(category)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="ویرایش"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => onDelete(category.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
