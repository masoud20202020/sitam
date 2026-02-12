
'use client';

import React from 'react';
import Link from 'next/link';
import { SiteSettings } from '@/data/settings';
import { Category } from '@/data/categories';

interface FooterClientProps {
  settings: SiteSettings;
  categories: Category[];
}

export const FooterClient = ({ settings, categories }: FooterClientProps) => {
  const s = settings;
  return (
    <footer className="bg-[#2d2d2d] text-gray-400 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h4 className="text-white text-lg font-bold mb-4">درباره ما</h4>
          <p className="text-sm leading-6">
            ما بهترین محصولات را با بالاترین کیفیت و کمترین قیمت به شما ارائه می‌دهیم. هدف ما رضایت شماست.
          </p>
        </div>
        <div>
          <h4 className="text-white text-lg font-bold mb-4">دسترسی سریع</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/shop" className="hover:text-white">فروشگاه</Link></li>
            <li><Link href="/account" className="hover:text-white">حساب کاربری</Link></li>
            <li><Link href="/privacy" className="hover:text-white">حریم خصوصی</Link></li>
            <li><Link href="/blog" className="hover:text-white">خبرنامه</Link></li>
            <li><Link href="/contact" className="hover:text-white">تماس با ما</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-lg font-bold mb-4">دسته‌بندی‌ها</h4>
          <ul className="space-y-2 text-sm">
            {categories.map(c => (
              <li key={c.id}><Link href={`/category/${c.slug || c.id}`} className="hover:text-white">{c.name}</Link></li>
            ))}
            {categories.length === 0 && (
               <li><span className="text-gray-500">دسته‌بندی‌ها بارگذاری نشد</span></li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-white text-lg font-bold mb-4">ارتباط با ما</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`https://t.me/${s.telegram.replace(/^0/, '+98').replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-2">
                 <span>تلگرام پشتیبانی:</span>
                 <span className="dir-ltr">{s.telegram}</span>
              </a>
            </li>
            <li>
              <a href={`tel:${s.phone.replace(/^0/, '+98').replace(/\s/g, '')}`} className="hover:text-white flex items-center gap-2">
                 <span>تلفن:</span>
                 <span className="dir-ltr">{s.phone}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${s.email}`} className="hover:text-white flex items-center gap-2">
                 <span>ایمیل:</span>
                 <span className="dir-ltr">{s.email}</span>
              </a>
            </li>
            <li>
              <a href={`https://instagram.com/${s.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-2">
                <span>اینستاگرام:</span>
                <span className="dir-ltr">@{s.instagram.replace('@', '')}</span>
              </a>
            </li>
            <li className="mt-2 text-gray-500 text-xs">{s.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} تمامی حقوق محفوظ است.</p>
      </div>
    </footer>
  );
};
