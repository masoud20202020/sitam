'use client';

import React, { useState, useEffect } from 'react';
import { getBrandsAction, createBrandAction, updateBrandAction, deleteBrandAction } from '@/actions/brands';
import { Pencil, Trash2, Plus, Wand2, Upload, Loader2, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
  _count?: { products: number };
};

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState<{ 
    name: string; 
    slug: string; 
    logo: string; 
    description: string;
    seoTitle: string;
    seoDescription: string;
    isActive: boolean;
  }>({ 
    name: '', 
    slug: '', 
    logo: '', 
    description: '',
    seoTitle: '',
    seoDescription: '',
    isActive: true
  });
  
  const [editing, setEditing] = useState<Brand | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBrands = async () => {
    setIsLoading(true);
    const result = await getBrandsAction();
    if (result.success && result.data) {
      setBrands(result.data as Brand[]);
    } else {
      console.error(result.error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchBrands();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const resetForm = () => {
    setForm({ name: '', slug: '', logo: '', description: '', seoTitle: '', seoDescription: '', isActive: true });
    setEditing(null);
    setIsSubmitting(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoGenerateSEO = () => {
    if (!form.name) {
      alert('لطفا ابتدا نام برند را وارد کنید.');
      return;
    }

    // Generate Title
    const generatedTitle = form.name;

    // Generate Description
    let generatedDesc = form.description || '';
    // Remove newlines and extra spaces
    generatedDesc = generatedDesc.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (generatedDesc.length > 160) {
      generatedDesc = generatedDesc.substring(0, 157) + '...';
    }

    setForm(prev => ({
      ...prev,
      seoTitle: generatedTitle,
      seoDescription: generatedDesc
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    setIsSubmitting(true);
    
    // Auto-generate slug if empty
    const slug = form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, '-');
    
    const payload = {
      name: form.name.trim(),
      slug,
      logo: form.logo.trim() || undefined,
      description: form.description.trim() || undefined,
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
      isActive: form.isActive
    };

    let result;
    if (editing) {
      result = await updateBrandAction(editing.id, payload);
    } else {
      result = await createBrandAction({ ...payload, isActive: payload.isActive ?? true });
    }

    if (result.success) {
      fetchBrands();
      resetForm();
    } else {
      alert('خطا در ذخیره سازی: ' + result.error);
    }
    setIsSubmitting(false);
  };

  const onEdit = (b: Brand) => {
    setEditing(b);
    setForm({ 
      name: b.name, 
      slug: b.slug,
      logo: b.logo || '', 
      description: b.description || '',
      seoTitle: b.seoTitle || '',
      seoDescription: b.seoDescription || '',
      isActive: b.isActive
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onToggleStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setBrands(prev => prev.map(b => b.id === id ? { ...b, isActive: !currentStatus } : b));
    
    const result = await updateBrandAction(id, { isActive: !currentStatus });
    if (!result.success) {
      alert('خطا در تغییر وضعیت: ' + result.error);
      fetchBrands(); // Revert
    } else {
        if (editing && editing.id === id) {
            setForm(prev => ({ ...prev, isActive: !currentStatus }));
        }
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('آیا از حذف این برند اطمینان دارید؟')) return;

    const result = await deleteBrandAction(id);
    if (result.success) {
      setBrands(prev => prev.filter(b => b.id !== id));
      if (editing && editing.id === id) resetForm();
    } else {
      alert('خطا در حذف برند: ' + result.error);
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      <main className="flex-grow container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">مدیریت برندها</h1>
          <div className="flex gap-4">
             <Link href="/admin/products" className="text-sm text-[#83b735] hover:underline">مدیریت محصولات</Link>
             <Link href="/admin/categories" className="text-sm text-[#83b735] hover:underline">مدیریت دسته‌بندی‌ها</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border p-6 h-fit sticky top-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
              <span>{editing ? 'ویرایش برند' : 'افزودن برند جدید'}</span>
              {editing && (
                <button onClick={resetForm} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" />
                  انصراف
                </button>
              )}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-700">نام برند</label>
                <input
                  className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="مثال: سامسونگ"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">نامک (Slug)</label>
                <input
                  className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735] ltr text-left"
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder="brand-slug"
                />
                <p className="text-xs text-gray-500">در صورت خالی بودن، از نام برند ساخته می‌شود.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-700">لوگو</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    {form.logo ? (
                      <div className="relative w-full h-full">
                        <Image src={form.logo} alt="Preview" fill className="object-contain" />
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">بدون تصویر</span>
                    )}
                  </div>
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    آپلود تصویر
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-700">توضیحات</label>
                <textarea
                  className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735] h-24 text-sm"
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="توضیحات مختصر درباره برند..."
                />
              </div>

              {/* SEO Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">تنظیمات SEO</label>
                  <button 
                    type="button"
                    onClick={handleAutoGenerateSEO}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    تولید خودکار
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#83b735]"
                      placeholder="SEO Title"
                      value={form.seoTitle || ''}
                      onChange={e => setForm({ ...form, seoTitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#83b735] h-20"
                      placeholder="SEO Description"
                      value={form.seoDescription || ''}
                      onChange={e => setForm({ ...form, seoDescription: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-[#83b735] focus:ring-[#83b735]"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 select-none">فعال باشد</label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#83b735] text-white py-2.5 rounded-lg hover:bg-[#72a02d] transition-colors font-bold shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        در حال ذخیره...
                    </>
                ) : (
                    <>
                        {editing ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editing ? 'بروزرسانی برند' : 'افزودن برند'}
                    </>
                )}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input 
                    placeholder="جستجو در برندها..." 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 flex flex-col items-center justify-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span>در حال بارگذاری...</span>
                </div>
            ) : filteredBrands.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
                    هیچ برندی یافت نشد.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBrands.map(brand => (
                    <div key={brand.id} className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md ${!brand.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border flex items-center justify-center overflow-hidden">
                            {brand.logo ? (
                              <div className="relative w-full h-full">
                                <Image src={brand.logo} alt={brand.name} fill className="object-contain" />
                              </div>
                            ) : (
                            <span className="text-xl font-bold text-gray-300">{brand.name.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">{brand.name}</h3>
                            <div className="text-xs text-gray-500 ltr">{brand.slug}</div>
                        </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onEdit(brand)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="ویرایش"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(brand.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="حذف"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t text-sm">
                        <div className="text-gray-500">
                        {brand._count?.products || 0} محصول
                        </div>
                        <button
                        onClick={() => onToggleStatus(brand.id, brand.isActive)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            brand.isActive 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        >
                        {brand.isActive ? 'فعال' : 'غیرفعال'}
                        </button>
                    </div>
                    </div>
                ))}
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
