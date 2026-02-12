'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ProductItem, formatPriceToman } from '@/data/products';
import { getProductsAction, createProductAction, updateProductAction, deleteProductAction } from '@/actions/products';
import { getCategoriesAction } from '@/actions/categories';
import { getBrandsAction } from '@/actions/brands';
import { addInventoryLogAction } from '@/actions/inventory';
import { Pencil, Trash2, Plus, Search, X, Wand2, Image as ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/admin/RichTextEditor';
import MediaPickerModal from '@/components/admin/MediaPickerModal';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  type CategoryItem = { id: string; name: string };
  type BrandItem = { id: string; name: string };
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<Omit<ProductItem, 'id'>>({
    name: '',
    basePrice: 0,
    category: '',
    image: '/placeholder.svg',
    description: '',
    shortDescription: '',
    options: [],
    variants: [],
    stock: 0,
    published: true,
    isTrending: false,
    discountPrice: 0,
    slug: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [],
    imageAlt: '',
    brand: '',
    specialSaleEndTime: 0,
    sku: '',
    weight: undefined,
    dimensions: undefined,
    volume: undefined
  });
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');
  const [activeOptionIndex, setActiveOptionIndex] = useState<number | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  
  // AI Generation State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiFeatures, setAiFeatures] = useState(['', '', '']);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [p, c, b] = await Promise.all([
        getProductsAction(),
        getCategoriesAction(),
        getBrandsAction()
      ]);
      setProducts(p);
      setCategories((c as Array<{ id: string; name: string }>).map((cat) => ({ id: String(cat.id), name: cat.name })));
      setBrands(((b && b.success ? (b.data ?? []) : []) as Array<{ id: string; name: string }>).map((br) => ({ id: String(br.id), name: br.name || '' })));
      
      // Initial category default if form is empty
      setForm(prev => {
        if (!prev.category && c.length > 0) {
          return { ...prev, category: c[0].name };
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchData]);

  const handleGenerateAIDescription = async () => {
    if (!form.name) {
      alert('لطفا ابتدا نام محصول را وارد کنید.');
      return;
    }
    const validFeatures = aiFeatures.filter(f => f.trim() !== '');
    if (validFeatures.length === 0) {
      alert('لطفا حداقل یک ویژگی وارد کنید.');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/admin/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.name,
          features: validFeatures
        })
      });
      const data = await res.json();
      if (data.description) {
        setForm(prev => ({ ...prev, description: data.description }));
        setIsAIModalOpen(false);
      } else {
        alert('خطا در تولید توضیحات: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('خطا در برقراری ارتباط با سرور');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      basePrice: 0,
      category: categories[0]?.name || '',
      image: '/placeholder.svg',
      description: '',
      shortDescription: '',
      options: [],
      variants: [],
      stock: 0,
      published: true,
      isTrending: false,
      discountPrice: 0,
      slug: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: [],
      imageAlt: '',
      brand: '',
      specialSaleEndTime: 0,
      sku: '',
      weight: undefined,
      dimensions: undefined,
      volume: undefined
    });
    setEditing(null);
    setNewOptionName('');
    setNewOptionValue('');
    setActiveOptionIndex(null);
  };

  const handleAutoGenerateSEO = () => {
    if (!form.name) {
      alert('لطفا ابتدا نام محصول را وارد کنید.');
      return;
    }

    // Generate Title
    let generatedTitle = form.name;
    if (form.brand) {
      generatedTitle += ` | ${form.brand}`;
    }

    // Generate Description
    let generatedDesc = form.description || '';
    // Remove newlines and extra spaces
    generatedDesc = generatedDesc.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (generatedDesc.length > 160) {
      generatedDesc = generatedDesc.substring(0, 157) + '...';
    }

    setForm(prev => ({
      ...prev,
      seoTitle: generatedTitle.substring(0, 60),
      seoDescription: generatedDesc
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editing) {
        // Inventory Logging Logic
        // 1. Simple product stock change
        if ((!editing.options || editing.options.length === 0) && editing.stock !== form.stock) {
          await addInventoryLogAction({
            productId: String(editing.id),
            productName: editing.name,
            adminName: 'Admin', 
            changeType: 'manual_update',
            oldStock: editing.stock || 0,
            newStock: form.stock || 0
          });
        }

        // 2. Variant stock changes
        if (editing.variants && form.variants) {
          for (const newVar of form.variants) {
            const oldVar = editing.variants?.find(v => v.variantId === newVar.variantId);
            if (oldVar && oldVar.stock !== newVar.stock) {
              const variantName = Object.entries(newVar.selection)
                .map(([, val]) => `${val}`)
                .join(' / ');
                
              await addInventoryLogAction({
                 productId: String(editing.id),
                 productName: `${editing.name} (${variantName})`,
                 adminName: 'Admin',
                 changeType: 'manual_update',
                 oldStock: oldVar.stock,
                 newStock: newVar.stock
              });
            }
          }
        }

        const result = await updateProductAction(String(editing.id), form);
        if (result.success) {
          // Success
          await fetchData();
          resetForm();
        } else {
          alert('خطا در ویرایش محصول: ' + result.error);
        }
      } else {
        const result = await createProductAction(form);
        if (result.success) {
          await fetchData();
          resetForm();
        } else {
          alert('خطا در ایجاد محصول: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('خطا در ذخیره اطلاعات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEdit = (p: ProductItem) => {
    setEditing(p);
    setForm({
      name: p.name,
      basePrice: p.basePrice || 0,
      category: p.category,
      image: p.image,
      description: p.description,
      shortDescription: p.shortDescription || '',
      options: p.options || [],
      variants: p.variants || [],
      stock: p.stock ?? 0,
      published: p.published ?? true,
      isTrending: p.isTrending ?? false,
      discountPrice: p.discountPrice || 0,
      slug: p.slug || '',
      seoTitle: p.seoTitle || '',
      seoDescription: p.seoDescription || '',
      seoKeywords: p.seoKeywords || [],
      imageAlt: p.imageAlt || '',
      brand: p.brand || '',
      specialSaleEndTime: p.specialSaleEndTime || 0,
      sku: p.sku || '',
      weight: p.weight,
      dimensions: p.dimensions,
      volume: p.volume
    });
  };

  const onDelete = async (id: string | number) => {
    if (!confirm('آیا از حذف این محصول اطمینان دارید؟')) return;
    
    try {
      await deleteProductAction(String(id));
      await fetchData();
    } catch {
      alert('خطا در حذف محصول');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.includes(searchTerm) || 
    p.category.includes(searchTerm)
  );

  // Helper to add option
  const addOption = () => {
    if (!newOptionName) return;
    setForm(prev => ({
      ...prev,
      options: [...(prev.options || []), { name: newOptionName, values: [] }]
    }));
    setNewOptionName('');
  };

  const removeOption = (idx: number) => {
    const newOptions = [...(form.options || [])];
    newOptions.splice(idx, 1);
    setForm(prev => ({ ...prev, options: newOptions }));
  };

  const addOptionValue = (idx: number) => {
    if (!newOptionValue) return;
    const newOptions = [...(form.options || [])];
    newOptions[idx].values.push(newOptionValue);
    setForm(prev => ({ ...prev, options: newOptions }));
    setNewOptionValue('');
  };

  const removeOptionValue = (optIdx: number, valIdx: number) => {
    const newOptions = [...(form.options || [])];
    newOptions[optIdx].values.splice(valIdx, 1);
    setForm(prev => ({ ...prev, options: newOptions }));
  };

  // Generate variants from options
  const generateVariants = () => {
    if (!form.options || form.options.length === 0) return;

    const cartesian = (...a: string[][]) => a.reduce((acc, b) => acc.flatMap(d => b.map(e => [d, e].flat())), [] as string[][]);
    const values = form.options.map(o => o.values);
    
    if (values.some(v => v.length === 0)) {
      alert('لطفا برای همه ویژگی‌ها مقدار وارد کنید');
      return;
    }

    const combinations = values.length > 1 ? cartesian(...values) : values[0].map(v => [v]);
    
    const newVariants = combinations.map((combo: string[]) => {
      const selection: Record<string, string> = {};
      form.options?.forEach((opt, idx) => {
        selection[opt.name] = combo[idx];
      });
      
      return {
        variantId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        selection,
        price: form.basePrice,
        stock: 0
      };
    });

    setForm(prev => ({ ...prev, variants: newVariants }));
  };

  const handleMediaSelect = (url: string) => {
    setForm(prev => ({ ...prev, image: url }));
    setIsMediaPickerOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" suppressHydrationWarning>

      <main className="flex-grow container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">مدیریت محصولات</h1>
          <Link href="/admin/categories" className="text-sm text-[#83b735] hover:underline">مدیریت دسته‌بندی‌ها</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex justify-between items-center">
              <span>{editing ? 'ویرایش محصول' : 'افزودن محصول جدید'}</span>
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin text-[#83b735]" />}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">نام محصول</label>
                  <input
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">شناسه محصول (SKU)</label>
                  <input
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={form.sku || ''}
                    onChange={e => setForm({ ...form, sku: e.target.value })}
                    placeholder="خودکار پر می‌شود"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">قیمت اصلی (بدون تخفیف)</label>
                  <input
                    type="number"
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={form.basePrice}
                    onChange={e => setForm({ ...form, basePrice: Number(e.target.value) || 0 })}
                    min={0}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">قیمت با تخفیف (تومان)</label>
                  <input
                    type="number"
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={form.discountPrice || ''}
                    onChange={e => setForm({ ...form, discountPrice: Number(e.target.value) || 0 })}
                    placeholder="اختیاری"
                    min={0}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm text-gray-700">زمان پایان فروش ویژه (اختیاری)</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={form.specialSaleEndTime ? new Date(form.specialSaleEndTime - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
                    onChange={e => {
                        const val = e.target.value;
                        if (!val) {
                            setForm({ ...form, specialSaleEndTime: 0 });
                        } else {
                            setForm({ ...form, specialSaleEndTime: new Date(val).getTime() });
                        }
                    }}
                  />
                  <p className="text-xs text-gray-500">اگر تنظیم شود، تایمر معکوس در صفحه محصول نمایش داده می‌شود.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">دسته‌بندی</label>
                  <select
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    required
                    suppressHydrationWarning
                  >
                    {categories.map(c => (
                      <option key={String(c.id)} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">برند</label>
                  <select
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                    value={form.brand || ''}
                    onChange={e => setForm({ ...form, brand: e.target.value })}
                  >
                    <option value="">بدون برند</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">آدرس تصویر (اختیاری)</label>
                <div className="flex gap-2">
                  <input
                    className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735] ltr text-left"
                    value={form.image || ''}
                    onChange={e => setForm({ ...form, image: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="bg-gray-100 text-gray-600 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors"
                    title="انتخاب از کتابخانه رسانه"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">متن جایگزین تصویر (Alt Text) - برای سئو</label>
                <input
                  className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                  value={form.imageAlt || ''}
                  onChange={e => setForm({ ...form, imageAlt: e.target.value })}
                  placeholder="توصیف تصویر برای موتورهای جستجو"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-700">توضیحات کوتاه (نمایش زیر قیمت)</label>
                <textarea
                  className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735] resize-none"
                  rows={2}
                  value={form.shortDescription || ''}
                  onChange={e => setForm({ ...form, shortDescription: e.target.value })}
                  placeholder="توضیح مختصر که در زیر قیمت نمایش داده می‌شود"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <span className="text-sm text-gray-700 font-medium">توضیحات محصول</span>
                   <button
                    type="button"
                    onClick={() => setIsAIModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors border border-purple-200"
                   >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>تولید با هوش مصنوعی</span>
                   </button>
                </div>
                <RichTextEditor
                  label=""
                  value={form.description || ''}
                  onChange={val => setForm({ ...form, description: val })}
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
                    checked={form.isTrending || false}
                    onChange={e => setForm({ ...form, isTrending: e.target.checked })}
                  />
                  <span className="text-gray-700">نمایش در محصولات ترند</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
                    checked={form.isGiftWrapAvailable || false}
                    onChange={e => setForm({ ...form, isGiftWrapAvailable: e.target.checked })}
                  />
                  <span className="text-gray-700">قابلیت بسته‌بندی کادویی</span>
                </label>
              </div>

              {/* Physical Specs */}
              <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2">مشخصات فیزیکی (اختیاری)</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">وزن (گرم)</label>
                    <input
                      type="number"
                      className="w-full border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#83b735] text-sm"
                      value={form.weight || ''}
                      onChange={e => setForm({ ...form, weight: Number(e.target.value) || undefined })}
                      placeholder="مثلا: 500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">طول (cm)</label>
                    <input
                      type="number"
                      className="w-full border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#83b735] text-sm"
                      value={form.dimensions?.length || ''}
                      onChange={e => setForm({ 
                        ...form, 
                        dimensions: { ...form.dimensions, length: Number(e.target.value) || 0, width: form.dimensions?.width || 0, height: form.dimensions?.height || 0 } 
                      })}
                      placeholder="طول"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">عرض (cm)</label>
                    <input
                      type="number"
                      className="w-full border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#83b735] text-sm"
                      value={form.dimensions?.width || ''}
                      onChange={e => setForm({ 
                        ...form, 
                        dimensions: { ...form.dimensions, length: form.dimensions?.length || 0, width: Number(e.target.value) || 0, height: form.dimensions?.height || 0 } 
                      })}
                      placeholder="عرض"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-600">ارتفاع (cm)</label>
                    <input
                      type="number"
                      className="w-full border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#83b735] text-sm"
                      value={form.dimensions?.height || ''}
                      onChange={e => setForm({ 
                        ...form, 
                        dimensions: { ...form.dimensions, length: form.dimensions?.length || 0, width: form.dimensions?.width || 0, height: Number(e.target.value) || 0 } 
                      })}
                      placeholder="ارتفاع"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs text-gray-600">حجم (cm³)</label>
                    <input
                      type="number"
                      className="w-full border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#83b735] text-sm"
                      value={form.volume || ''}
                      onChange={e => setForm({ ...form, volume: Number(e.target.value) || undefined })}
                      placeholder="محاسبه خودکار در صورت خالی بودن"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Fields */}
              <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                 <div className="flex justify-between items-center border-b pb-2">
                   <h3 className="text-sm font-bold text-gray-800">تنظیمات سئو (SEO)</h3>
                   <button
                    type="button"
                    onClick={handleAutoGenerateSEO}
                    className="text-xs bg-[#83b735] text-white px-3 py-1 rounded hover:bg-[#72a02e] transition-colors flex items-center gap-1"
                   >
                    <Wand2 className="w-3 h-3" />
                    تولید خودکار
                   </button>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs text-gray-600">عنوان سئو (Title Tag)</label>
                    <div className="relative">
                      <input
                        className="w-full border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#83b735] text-sm"
                        value={form.seoTitle || ''}
                        onChange={e => setForm({ ...form, seoTitle: e.target.value })}
                        placeholder="عنوان محصول | نام برند"
                        maxLength={60}
                      />
                      <span className={`absolute left-2 top-1.5 text-xs ${
                        (form.seoTitle?.length || 0) > 60 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {form.seoTitle?.length || 0}/60
                      </span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs text-gray-600">توضیحات متا (Meta Description)</label>
                    <div className="relative">
                      <textarea
                        className="w-full border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#83b735] text-sm resize-none"
                        rows={3}
                        value={form.seoDescription || ''}
                        onChange={e => setForm({ ...form, seoDescription: e.target.value })}
                        placeholder="توضیحات جذاب شامل کلمات کلیدی..."
                        maxLength={160}
                      />
                      <span className={`absolute left-2 bottom-2 text-xs ${
                        (form.seoDescription?.length || 0) > 160 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {form.seoDescription?.length || 0}/160
                      </span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs text-gray-600">نامک (Slug) - آدرس صفحه</label>
                    <input
                      className="w-full border rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#83b735] text-sm ltr text-left"
                      value={form.slug || ''}
                      onChange={e => setForm({ ...form, slug: e.target.value })}
                      placeholder="product-name-english"
                    />
                    <p className="text-[10px] text-gray-400">فقط حروف انگلیسی، اعداد و خط تیره (-)</p>
                 </div>
              </div>

              {/* Options & Variants */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800">ویژگی‌ها</h3>
                  <div className="flex gap-2">
                    <input
                      className="border rounded px-2 py-1 text-sm"
                      placeholder="نام ویژگی (مثلا: رنگ)"
                      value={newOptionName}
                      onChange={e => setNewOptionName(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={addOption}
                      className="bg-gray-100 p-1 rounded hover:bg-gray-200"
                    >
                      <Plus className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {form.options?.map((opt, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{opt.name}</span>
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {opt.values.map((val, vIdx) => (
                        <span key={vIdx} className="bg-white px-2 py-1 rounded border text-sm flex items-center gap-1">
                          {val}
                          <button
                            type="button"
                            onClick={() => removeOptionValue(idx, vIdx)}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    {activeOptionIndex === idx ? (
                      <div className="flex gap-2">
                        <input
                          className="border rounded px-2 py-1 text-sm"
                          placeholder="مقدار جدید"
                          value={newOptionValue}
                          onChange={e => setNewOptionValue(e.target.value)}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => addOptionValue(idx)}
                          className="bg-[#83b735] text-white px-2 py-1 rounded text-sm"
                        >
                          افزودن
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveOptionIndex(null)}
                          className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-sm"
                        >
                          لغو
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveOptionIndex(idx)}
                        className="text-sm text-[#83b735] hover:underline"
                      >
                        + افزودن مقدار
                      </button>
                    )}
                  </div>
                ))}

                {form.options && form.options.length > 0 && (
                  <button
                    type="button"
                    onClick={generateVariants}
                    className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    تولید تنوع‌ها (Variants)
                  </button>
                )}
              </div>

              {form.variants && form.variants.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-bold text-gray-800">مدیریت موجودی و قیمت تنوع‌ها</h3>
                  <div className="space-y-2">
                    {form.variants.map((v, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded text-sm">
                        <div className="flex-grow">
                          {Object.entries(v.selection).map(([key, val]) => (
                            <span key={key} className="ml-2 text-gray-600">
                              {key}: <span className="font-bold text-gray-800">{String(val)}</span>
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                           <label className="text-xs text-gray-500">قیمت:</label>
                           <input
                            type="number"
                            className="w-24 border rounded px-2 py-1"
                            value={v.price}
                            onChange={e => {
                              const newVars = [...(form.variants || [])];
                              newVars[idx].price = Number(e.target.value);
                              setForm({ ...form, variants: newVars });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                           <label className="text-xs text-gray-500">موجودی:</label>
                           <input
                            type="number"
                            className="w-16 border rounded px-2 py-1"
                            value={v.stock}
                            onChange={e => {
                              const newVars = [...(form.variants || [])];
                              newVars[idx].stock = Number(e.target.value);
                              setForm({ ...form, variants: newVars });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                           <button
                            type="button"
                            onClick={() => {
                                // Simple image prompt for now
                                const url = prompt('آدرس تصویر این تنوع:', v.image || '');
                                if (url !== null) {
                                    const newVars = [...(form.variants || [])];
                                    newVars[idx].image = url;
                                    setForm({ ...form, variants: newVars });
                                }
                            }}
                            className="text-gray-400 hover:text-blue-500"
                            title="تغییر تصویر"
                           >
                             <ImageIcon className="w-4 h-4" />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!form.variants?.length && (
                 <div className="space-y-2 border-t pt-4">
                    <label className="text-sm text-gray-700">موجودی انبار</label>
                    <input
                      type="number"
                      className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                      value={form.stock}
                      onChange={e => setForm({ ...form, stock: Number(e.target.value) || 0 })}
                      min={0}
                    />
                 </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-grow bg-[#83b735] text-white py-3 rounded-xl font-bold hover:bg-[#72a02e] transition-colors shadow-lg shadow-[#83b735]/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {editing ? 'بروزرسانی محصول' : 'افزودن محصول'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-100 text-gray-600 px-6 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    انصراف
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
              <div className="relative flex-grow">
                <input
                  className="w-full bg-gray-50 border rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
                  placeholder="جستجو در محصولات..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>تعداد:</span>
                <span className="font-bold text-gray-800">{filteredProducts.length}</span>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#83b735]" />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-right py-4 px-6 text-sm font-bold text-gray-600">تصویر</th>
                      <th className="text-right py-4 px-6 text-sm font-bold text-gray-600">نام محصول</th>
                      <th className="text-right py-4 px-6 text-sm font-bold text-gray-600">قیمت</th>
                      <th className="text-right py-4 px-6 text-sm font-bold text-gray-600">موجودی</th>
                      <th className="text-right py-4 px-6 text-sm font-bold text-gray-600">وضعیت</th>
                      <th className="text-left py-4 px-6 text-sm font-bold text-gray-600">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden border bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.image || '/placeholder.svg'}
                              alt={product.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-800">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.category}</div>
                          {product.sku && <div className="text-[10px] text-gray-400 mt-1">SKU: {product.sku}</div>}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-800">
                            {formatPriceToman(product.discountPrice || product.basePrice)}
                          </div>
                          {product.discountPrice ? (
                             <div className="text-xs text-red-500 line-through">
                               {formatPriceToman(product.basePrice)}
                             </div>
                          ) : null}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            (product.stock || 0) > 0 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {(product.stock || 0) > 0 ? `${product.stock} عدد` : 'ناموجود'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                           {product.published ? (
                             <span className="text-green-600 text-xs font-bold">منتشر شده</span>
                           ) : (
                             <span className="text-gray-400 text-xs">پیش‌نویس</span>
                           )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => onEdit(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="ویرایش"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-gray-500">
                          محصولی یافت نشد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
      />
      
      {/* AI Modal */}
      {isAIModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setIsAIModalOpen(false)}
              className="absolute left-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">تولید توضیحات هوشمند</h3>
                <p className="text-xs text-gray-500">با کمک هوش مصنوعی توضیحات جذاب بسازید</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">ویژگی‌های کلیدی محصول</label>
                <div className="space-y-2">
                  {aiFeatures.map((feat, idx) => (
                    <input
                      key={idx}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder={`ویژگی ${idx + 1} (مثلا: ضد آب)`}
                      value={feat}
                      onChange={e => {
                        const newFeats = [...aiFeatures];
                        newFeats[idx] = e.target.value;
                        setAiFeatures(newFeats);
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateAIDescription}
                disabled={isGeneratingAI}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>در حال نوشتن...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>تولید توضیحات</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
