'use client';

import Link from 'next/link';
import { FileQuestion, Home, Search } from 'lucide-react';
import { ProductList } from '@/components/ProductList';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 404 Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="relative mb-8">
          <div className="text-[150px] font-black text-gray-100 leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FileQuestion className="w-24 h-24 text-[#83b735] drop-shadow-lg" />
          </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          صفحه‌ای که دنبالش بودید پیدا نشد!
        </h1>
        
        <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
          ممکن است آدرس را اشتباه وارد کرده باشید یا این صفحه حذف شده باشد.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2 bg-[#83b735] text-white px-8 py-3 rounded-xl hover:bg-[#72a02d] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium"
          >
            <Home className="w-5 h-5" />
            بازگشت به صفحه اصلی
          </Link>
          <Link 
            href="/shop" 
            className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-8 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
          >
            <Search className="w-5 h-5" />
            جستجو در محصولات
          </Link>
        </div>
      </div>

      {/* Recommended Products Section */}
      <div className="border-t">
        <ProductList limit={4} title="محصولات پیشنهادی" showViewAll={true} />
      </div>
    </div>
  );
}
