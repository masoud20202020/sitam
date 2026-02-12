'use client';

import React, { useState, useEffect } from 'react';
import { 
  getBlogPostsAction, 
  createBlogPostAction, 
  updateBlogPostAction, 
  deleteBlogPostAction, 
  BlogPost 
} from '@/actions/blog';
import { getProductsAction } from '@/actions/products';
import { ProductItem } from '@/data/products';
import { Plus, Pencil, Trash2, Search, X, Save, Image as ImageIcon, Wand2 } from 'lucide-react';
import Image from 'next/image';
import RichTextEditor from '@/components/admin/RichTextEditor';
import MediaPickerModal from '@/components/admin/MediaPickerModal';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Product Selection State
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Form State
  const [form, setForm] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    category: '',
    image: '',
    excerpt: '',
    content: '',
    author: '',
    seoTitle: '',
    seoDescription: '',
    published: true,
    relatedProductIds: [],
  });

  const fetchData = async () => {
    setIsLoading(true);
    const [postsResult, productsResult] = await Promise.all([
      getBlogPostsAction(),
      getProductsAction()
    ]);

    if (postsResult.success && postsResult.data) {
      setPosts(postsResult.data as BlogPost[]);
    } else {
      console.error(postsResult.error);
    }

    setAvailableProducts(productsResult);
    setIsLoading(false);
  };

  useEffect(() => {
    const id = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const generateSEO = () => {
    if (!form.title) return alert('لطفا ابتدا عنوان مقاله را وارد کنید.');

    // Generate Slug: Keep Persian chars, numbers, english chars. Replace spaces with -.
    const slug = form.title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u0600-\u06FF-]/g, ''); // Remove special chars

    // Generate Description
    let description = form.excerpt || '';
    if (!description && form.content) {
      // Strip HTML
      const text = form.content.replace(/<[^>]*>?/gm, '');
      description = text.slice(0, 160).trim() + (text.length > 160 ? '...' : '');
    }

    setForm(prev => ({
      ...prev,
      slug,
      seoTitle: prev.title,
      seoDescription: description
    }));
  };

  const handleSave = async () => {
    if (!form.title) return alert('عنوان الزامی است');
    
    setIsLoading(true);
    const postData = {
      title: form.title || '',
      slug: (form.slug || form.title || '').toLowerCase().trim().replace(/\s+/g, '-'),
      category: form.category || 'عمومی',
      image: form.image || '',
      excerpt: form.excerpt || '',
      content: form.content || '',
      author: form.author || 'مدیر سایت',
      seoTitle: form.seoTitle || form.title,
      seoDescription: form.seoDescription || form.excerpt,
      published: form.published !== false,
      relatedProductIds: form.relatedProductIds,
    };

    if (editing) {
      const result = await updateBlogPostAction(editing.id, postData);
      if (!result.success) {
        alert('خطا در ویرایش مقاله: ' + result.error);
      }
    } else {
      const result = await createBlogPostAction(postData);
      if (!result.success) {
        alert('خطا در ایجاد مقاله: ' + result.error);
      }
    }

    await fetchData();
    resetForm();
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('آیا از حذف این مقاله اطمینان دارید؟')) {
      setIsLoading(true);
      const result = await deleteBlogPostAction(id);
      if (!result.success) {
        alert('خطا در حذف مقاله: ' + result.error);
      }
      await fetchData();
      setIsLoading(false);
    }
  };

  const startEdit = (post: BlogPost) => {
    setEditing(post);
    setForm(post);
    setIsCreating(true);
  };

  const resetForm = () => {
    setEditing(null);
    setIsCreating(false);
    setForm({
      title: '',
      slug: '',
      category: '',
      image: '',
      excerpt: '',
      content: '',
      author: '',
      seoTitle: '',
      seoDescription: '',
      published: true,
      relatedProductIds: [],
    });
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && posts.length === 0) {
    return <div className="p-10 text-center">در حال بارگذاری...</div>;
  }

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت خبرنامه</h1>
        
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-[#83b735] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#6da025] transition-colors"
          >
            <Plus className="w-5 h-5" />
            افزودن مقاله جدید
          </button>
        )}
      </div>

      {isCreating ? (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {editing ? 'ویرایش مقاله' : 'افزودن مقاله جدید'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">عنوان مقاله</label>
                  <input
                    className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-[#83b735] outline-none"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">متن کامل</label>
                  <RichTextEditor
                    value={form.content || ''}
                    onChange={val => setForm({ ...form, content: val })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">خلاصه (Excerpt)</label>
                  <textarea
                    className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-[#83b735] outline-none"
                    rows={3}
                    value={form.excerpt}
                    onChange={e => setForm({ ...form, excerpt: e.target.value })}
                  />
                </div>
              </div>

              {/* Sidebar Settings */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                  <h3 className="font-bold text-gray-800 border-b pb-2">تنظیمات انتشار</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-gray-700">وضعیت</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 bg-white"
                      value={form.published ? 'true' : 'false'}
                      onChange={e => setForm({ ...form, published: e.target.value === 'true' })}
                    >
                      <option value="true">منتشر شده</option>
                      <option value="false">پیش‌نویس</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-700">دسته‌بندی</label>
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      placeholder="مثلاً: اخبار، تکنولوژی"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-700">نویسنده</label>
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={form.author}
                      onChange={e => setForm({ ...form, author: e.target.value })}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                  <h3 className="font-bold text-gray-800 border-b pb-2">تصویر شاخص</h3>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-700">آدرس تصویر</label>
                    <div className="flex gap-2">
                      <input
                        className="w-full border rounded-md px-3 py-2 text-left ltr"
                        value={form.image}
                        onChange={e => setForm({ ...form, image: e.target.value })}
                        placeholder="/images/blog/..."
                      />
                      <button
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="bg-gray-100 text-gray-600 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors"
                        title="انتخاب از کتابخانه رسانه"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  {form.image && (
                    <div className="relative aspect-video rounded-md overflow-hidden border bg-gray-200">
                      <Image src={form.image} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-gray-800">سئو (SEO)</h3>
                    <button
                      onClick={generateSEO}
                      className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors flex items-center gap-1.5"
                      title="تولید خودکار اطلاعات سئو"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      تولید خودکار
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-gray-700">نامک (Slug)</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-left ltr"
                      value={form.slug}
                      onChange={e => setForm({ ...form, slug: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-700">عنوان سئو</label>
                    <input
                      className="w-full border rounded-md px-3 py-2"
                      value={form.seoTitle}
                      onChange={e => setForm({ ...form, seoTitle: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-700">توضیحات متا</label>
                    <textarea
                      className="w-full border rounded-md px-3 py-2"
                      rows={3}
                      value={form.seoDescription}
                      onChange={e => setForm({ ...form, seoDescription: e.target.value })}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                  <h3 className="font-bold text-gray-800 border-b pb-2">محصولات مرتبط</h3>
                  <div className="space-y-2">
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      placeholder="جستجوی محصول..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                    />
                    
                    {/* Selected Products */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.relatedProductIds?.map(id => {
                        const product = availableProducts.find(p => p.id === String(id));
                        if (!product) return null;
                        return (
                          <div key={id} className="bg-[#83b735]/10 text-[#83b735] text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <span>{product.name}</span>
                            <button 
                              onClick={() => setForm(prev => ({ 
                                ...prev, 
                                relatedProductIds: prev.relatedProductIds?.filter(pid => pid !== id) 
                              }))}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Search Results */}
                    {productSearch && (
                      <div className="max-h-40 overflow-y-auto border rounded-md bg-white divide-y">
                        {availableProducts
                          .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) && !form.relatedProductIds?.includes(Number(p.id)))
                          .map(product => (
                            <button
                              key={product.id}
                              onClick={() => {
                                setForm(prev => ({
                                  ...prev,
                                  relatedProductIds: [...(prev.relatedProductIds || []), Number(product.id)]
                                }));
                                setProductSearch('');
                              }}
                              className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between group"
                            >
                              <span className="truncate">{product.name}</span>
                              <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#83b735]" />
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full bg-[#83b735] text-white py-3 rounded-lg font-bold hover:bg-[#6da025] transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300"
                >
                  <Save className="w-5 h-5" />
                  {editing ? 'بروزرسانی مقاله' : 'انتشار مقاله'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input 
                className="flex-1 outline-none text-sm"
                placeholder="جستجو در مقالات..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-right p-4">عنوان</th>
                    <th className="text-right p-4">دسته‌بندی</th>
                    <th className="text-right p-4">نویسنده</th>
                    <th className="text-right p-4">تاریخ</th>
                    <th className="text-right p-4">وضعیت</th>
                    <th className="text-right p-4">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredPosts.map(post => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{post.title}</td>
                      <td className="p-4 text-gray-600">{post.category}</td>
                      <td className="p-4 text-gray-600">{post.author}</td>
                      <td className="p-4 text-gray-600">{post.date}</td>
                      <td className="p-4">
                        {post.published !== false ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">منتشر شده</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">پیش‌نویس</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => startEdit(post)}
                            className="p-2 border rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(post.id)}
                            className="p-2 border rounded-md hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <a
                            href={`/blog/${post.slug || post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
                          >
                            <Search className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPosts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        مقاله‌ای یافت نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      <MediaPickerModal 
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => {
          setForm({ ...form, image: url });
        }}
      />
    </div>
  );
}
