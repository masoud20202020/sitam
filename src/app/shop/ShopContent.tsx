'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductItem, formatPriceToman } from '@/data/products';
import { Category } from '@/data/categories';
import { ArrowUpDown, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type SortKey = 'latest' | 'price_asc' | 'price_desc' | 'stock';

// Simple Levenshtein Distance for fuzzy search
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function normalizePersian(str: string): string {
  if (!str) return '';
  return str
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/آ/g, 'ا')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/۰/g, '0')
    .replace(/۱/g, '1')
    .replace(/۲/g, '2')
    .replace(/۳/g, '3')
    .replace(/۴/g, '4')
    .replace(/۵/g, '5')
    .replace(/۶/g, '6')
    .replace(/۷/g, '7')
    .replace(/۸/g, '8')
    .replace(/۹/g, '9')
    .trim()
    .toLowerCase();
}

function fuzzyMatch(text: string, query: string, threshold = 2): boolean {
  if (!query) return true;
  const normText = normalizePersian(text);
  const normQuery = normalizePersian(query);
  
  if (normText.includes(normQuery)) return true;
  
  const queryTerms = normQuery.split(/\s+/).filter(Boolean);
  const textTerms = normText.split(/\s+/).filter(Boolean);
  
  return queryTerms.every(qTerm => {
    return textTerms.some(tTerm => {
      if (tTerm.includes(qTerm)) return true;
      return levenshteinDistance(tTerm, qTerm) <= threshold;
    });
  });
}

interface ShopContentProps {
  initialCategorySlug?: string;
  initialProducts: ProductItem[];
  initialCategories: Category[];
}

export function ShopContent({ initialCategorySlug, initialProducts, initialCategories }: ShopContentProps) {
  const searchParams = useSearchParams();
  const [products] = useState<ProductItem[]>(initialProducts);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState<string>('همه');

  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<SortKey>('latest');
  
  // New Filters
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [allCategories] = useState<Category[]>(initialCategories);

  // Update query and category when URL parameters change
  React.useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setQuery(q);
    }
    
    const catSlug = searchParams.get('category');
    if (catSlug && allCategories.length > 0) {
      const found = allCategories.find(c => c.slug === catSlug || c.slug === decodeURIComponent(catSlug) || String(c.id) === catSlug);
      if (found) {
        setCategory(found.name);
      }
    }
  }, [searchParams, allCategories]);

  // Handle initial category slug
  React.useEffect(() => {
    if (initialCategorySlug && allCategories.length > 0) {
      const found = allCategories.find(c => c.slug === initialCategorySlug || c.slug === decodeURIComponent(initialCategorySlug) || String(c.id) === initialCategorySlug);
      if (found) {
        setCategory(found.name);
      }
    }
  }, [initialCategorySlug, allCategories]);

  const categories = ['همه', ...allCategories.map(c => c.name)];

  // Helper to find all child categories recursively
  const getChildCategories = React.useCallback((parentName: string): string[] => {
    const parent = allCategories.find(c => c.name === parentName);
    if (!parent) return [];
    const results: string[] = [];
    const stack = allCategories.filter(c => String(c.parentId) === String(parent.id));
    while (stack.length) {
      const current = stack.pop()!;
      results.push(current.name);
      const children = allCategories.filter(c => String(c.parentId) === String(current.id));
      stack.push(...children);
    }
    return results;
  }, [allCategories]);

  // Extract unique options dynamically
  const brands = useMemo(() => Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[], [products]);
  
  const colors = useMemo(() => {
    const allColors = new Set<string>();
    products.forEach(p => {
      const colorOption = p.options?.find(o => o.name === 'رنگ');
      if (colorOption) {
        colorOption.values.forEach(v => allColors.add(v));
      }
    });
    return Array.from(allColors);
  }, [products]);

  const sizes = useMemo(() => {
    const allSizes = new Set<string>();
    products.forEach(p => {
      const sizeOption = p.options?.find(o => o.name === 'سایز');
      if (sizeOption) {
        sizeOption.values.forEach(v => allSizes.add(v));
      }
    });
    return Array.from(allSizes);
  }, [products]);

  const toggleFilter = (item: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(item)) {
      setter(current.filter(i => i !== item));
    } else {
      setter([...current, item]);
    }
  };

  const filtered: ProductItem[] = useMemo(() => {
    let list = products.slice();
    
    // Category Filter
    if (category !== 'همه') {
      const subCategories = getChildCategories(category);
      const targetCategories = [category, ...subCategories];
      list = list.filter(p => p.category && targetCategories.includes(p.category));
    }
    
    // Search (Fuzzy)
    if (query.trim()) {
      const q = query.trim();
      list = list.filter(p => 
        fuzzyMatch(p.name, q) || 
        (p.description && fuzzyMatch(p.description, q)) ||
        (p.brand && fuzzyMatch(p.brand, q)) ||
        (p.category && fuzzyMatch(p.category, q)) ||
        (p.seoKeywords && p.seoKeywords.some(k => fuzzyMatch(k, q)))
      );
    }

    // Price Filter
    const getPrice = (p: ProductItem) => {
      const base = typeof p.basePrice === 'number' ? p.basePrice : 0;
      const discount = typeof p.discountPrice === 'number' ? p.discountPrice : undefined;
      return typeof discount === 'number' ? discount : base;
    };
    if (minPrice !== '') list = list.filter(p => getPrice(p) >= Number(minPrice));
    if (maxPrice !== '') list = list.filter(p => getPrice(p) <= Number(maxPrice));

    // Availability Filter
    if (onlyAvailable) list = list.filter(p => (p.stock ?? 0) > 0);

    // Brand Filter
    if (selectedBrands.length > 0) {
      list = list.filter(p => p.brand && selectedBrands.includes(p.brand));
    }

    // Color Filter
    if (selectedColors.length > 0) {
      list = list.filter(p => 
        p.options?.some(o => o.name === 'رنگ' && o.values.some(v => selectedColors.includes(v)))
      );
    }

    // Size Filter
    if (selectedSizes.length > 0) {
      list = list.filter(p => 
        p.options?.some(o => o.name === 'سایز' && o.values.some(v => selectedSizes.includes(v)))
      );
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        list.sort((a, b) => getPrice(a) - getPrice(b));
        break;
      case 'price_desc':
        list.sort((a, b) => getPrice(b) - getPrice(a));
        break;
      case 'stock':
        list.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
        break;
      default:
        list.sort((a, b) => Number(b.id) - Number(a.id));
    }
    return list;
  }, [products, category, query, minPrice, maxPrice, onlyAvailable, sort, selectedBrands, selectedColors, selectedSizes, getChildCategories]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">فروشگاه</h1>
          <div className="text-sm text-gray-500">تعداد نتایج: {filtered.length.toLocaleString('fa-IR')}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="bg-white rounded-xl shadow-sm border p-6 h-fit sticky top-4">
            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="text-sm font-medium text-gray-700">جستجو</label>
                <input
                  className="w-full border rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-[#db2777]"
                  placeholder="نام، برند یا توضیحات..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-gray-700">دسته‌بندی</label>
                <select
                  className="w-full border rounded-md px-4 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-[#db2777]"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium text-gray-700">بازه قیمت (تومان)</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <input
                    type="number"
                    className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#db2777] text-sm"
                    placeholder="حداقل"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                    min={0}
                  />
                  <input
                    type="number"
                    className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#db2777] text-sm"
                    placeholder="حداکثر"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                    min={0}
                  />
                </div>
              </div>

              {/* Brand Filter */}
              {brands.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">برند</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pl-2">
                    {brands.map(brand => (
                      <div key={brand} className="flex items-center gap-2">
                        <input 
                          id={`brand-${brand}`} 
                          type="checkbox" 
                          checked={selectedBrands.includes(brand)} 
                          onChange={() => toggleFilter(brand, selectedBrands, setSelectedBrands)}
                          className="rounded border-gray-300 text-[#db2777] focus:ring-[#db2777]"
                        />
                        <label htmlFor={`brand-${brand}`} className="text-sm text-gray-600 cursor-pointer">{brand}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Filter */}
              {colors.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">رنگ</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => toggleFilter(color, selectedColors, setSelectedColors)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${selectedColors.includes(color) ? 'bg-[#db2777] text-white border-[#db2777]' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Filter */}
              {sizes.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">سایز</label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => toggleFilter(size, selectedSizes, setSelectedSizes)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-xs border transition-colors ${selectedSizes.includes(size) ? 'bg-[#db2777] text-white border-[#db2777]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <input 
                  id="avail" 
                  type="checkbox" 
                  checked={onlyAvailable} 
                  onChange={e => setOnlyAvailable(e.target.checked)} 
                  className="rounded border-gray-300 text-[#db2777] focus:ring-[#db2777]"
                />
                <label htmlFor="avail" className="text-sm text-gray-700 cursor-pointer">فقط کالاهای موجود</label>
              </div>

              {/* Reset Button */}
              <button
                className="w-full border border-red-200 text-red-600 rounded-md px-4 py-2 hover:bg-red-50 text-sm transition-colors flex items-center justify-center gap-2"
                onClick={() => {
                  setQuery('');
                  setCategory('همه');
                  setMinPrice('');
                  setMaxPrice('');
                  setOnlyAvailable(false);
                  setSort('latest');
                  setSelectedBrands([]);
                  setSelectedColors([]);
                  setSelectedSizes([]);
                }}
              >
                <X className="w-4 h-4" />
                پاک‌سازی همه فیلترها
              </button>
            </div>
          </aside>

          {/* Results Area */}
          <section className="lg:col-span-3">
            {/* Sorting Header */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
                <span className="text-sm text-gray-600 whitespace-nowrap ml-2">مرتب‌سازی:</span>
                <button
                  className={`text-sm border px-3 py-1.5 rounded-md flex items-center gap-1 whitespace-nowrap transition-colors ${sort === 'latest' ? 'bg-[#db2777]/10 border-[#db2777] text-[#db2777]' : 'hover:bg-gray-50'}`}
                  onClick={() => setSort('latest')}
                >
                  <ArrowUpDown className="w-4 h-4" /> جدیدترین
                </button>
                <button
                  className={`text-sm border px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${sort === 'price_asc' ? 'bg-[#db2777]/10 border-[#db2777] text-[#db2777]' : 'hover:bg-gray-50'}`}
                  onClick={() => setSort('price_asc')}
                >
                  ارزان‌ترین
                </button>
                <button
                  className={`text-sm border px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${sort === 'price_desc' ? 'bg-[#db2777]/10 border-[#db2777] text-[#db2777]' : 'hover:bg-gray-50'}`}
                  onClick={() => setSort('price_desc')}
                >
                  گران‌ترین
                </button>
                <button
                  className={`text-sm border px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${sort === 'stock' ? 'bg-[#db2777]/10 border-[#db2777] text-[#db2777]' : 'hover:bg-gray-50'}`}
                  onClick={() => setSort('stock')}
                >
                  بیشترین موجودی
                </button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(p => (
                <div key={String(p.id)} className="group bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                     {/* Discount Badge */}
                     {p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.basePrice && (
                       <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
                         {Math.round(((p.basePrice - p.discountPrice) / p.basePrice) * 100)}%
                       </div>
                     )}

                     {p.image ? (
                        <Image 
                          src={p.image} 
                          alt={p.name} 
                          fill 
                          sizes="(max-width: 768px) 100vw, 33vw" 
                          className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                     ) : (
                        <span className="text-gray-400">تصویر محصول</span>
                     )}
                     {p.stock === 0 && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                           <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">ناموجود</span>
                        </div>
                     )}
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{p.category}</span>
                       {p.brand && <span className="text-xs text-[#db2777] font-medium">{p.brand}</span>}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 h-12 group-hover:text-[#db2777] transition-colors">{p.name}</h3>
                    <div className="flex flex-col items-start gap-1">
                       {p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.basePrice && (
                         <span className="text-xs text-gray-400 line-through">
                           {formatPriceToman(p.basePrice)}
                         </span>
                       )}
                       <div className="text-[#db2777] font-bold text-lg">
                         {formatPriceToman(p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.basePrice)}
                       </div>
                    </div>
                    
                    <Link href={`/product/${p.slug || p.id}`} className="block w-full text-center mt-4 bg-gray-50 hover:bg-[#db2777] hover:text-white text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-100">
                      مشاهده و خرید
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="bg-white rounded-xl border p-12 text-center">
                 <div className="text-gray-400 mb-4 text-6xl">🔍</div>
                 <h3 className="text-lg font-bold text-gray-800 mb-2">نتیجه‌ای یافت نشد</h3>
                 <p className="text-gray-500">متاسفانه محصولی با فیلترهای انتخاب شده پیدا نشد. لطفا فیلترها را تغییر دهید.</p>
                 <button 
                   onClick={() => {
                    setQuery('');
                    setCategory('همه');
                    setMinPrice('');
                    setMaxPrice('');
                    setOnlyAvailable(false);
                    setSort('latest');
                    setSelectedBrands([]);
                    setSelectedColors([]);
                    setSelectedSizes([]);
                   }}
                   className="mt-6 text-[#db2777] font-medium hover:underline"
                 >
                    پاک‌سازی تمام فیلترها
                 </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
