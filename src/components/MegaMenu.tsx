'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, ChevronLeft, Menu } from 'lucide-react';
import { getMegaMenu, MegaMenuItem } from '@/actions/megaMenu';

export const MegaMenu = () => {
  const [items, setItems] = useState<MegaMenuItem[]>([]);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await getMegaMenu();
      setItems(data);
    };
    loadData();
  }, []);

  const handleMouseEnter = (itemId: string) => {
    setActiveItem(itemId);
  };

  const handleMenuEnter = () => {
      setIsMenuOpen(true);
      if (items.length > 0 && !activeItem) {
          setActiveItem(items[0].id);
      }
  };

  const handleMenuLeave = () => {
      setIsMenuOpen(false);
  };

  if (items.length === 0) return null;

  return (
    <div className="relative group" onMouseLeave={handleMenuLeave}>
      {/* Trigger Button */}
      <div 
        className={`flex items-center gap-2 cursor-pointer px-5 py-2.5 rounded-full transition-all duration-300 ${isMenuOpen ? 'bg-[#db2777] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-[#db2777]'}`}
        onMouseEnter={handleMenuEnter}
      >
        <Menu className="w-5 h-5" />
        <span className="font-bold text-sm">دسته‌بندی محصولات</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Mega Menu Overlay */}
      <div 
        className={`absolute top-full right-0 w-[900px] bg-white shadow-2xl rounded-b-xl border-t border-gray-100 z-50 transition-all duration-200 origin-top ${
          isMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
        }`}
        style={{ minHeight: '400px' }}
      >
        <div className="flex h-full min-h-[400px]">
          {/* Sidebar (Main Categories) */}
          <div className="w-64 bg-gray-50 border-l py-4 h-full">
            {items.map((item) => (
              <div
                key={item.id}
                onMouseEnter={() => handleMouseEnter(item.id)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  activeItem === item.id 
                    ? 'bg-white text-[#db2777] border-r-4 border-[#db2777] font-bold' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                   {item.icon && (
                     <Image
                       src={item.icon}
                       alt=""
                       width={20}
                       height={20}
                       className="object-contain"
                     />
                   )}
                   <span className="text-sm">{item.title}</span>
                </div>
                {activeItem === item.id && <ChevronLeft className="w-4 h-4" />}
              </div>
            ))}
            

          </div>

          {/* Content Area (Subcategories) */}
          <div className="flex-1 p-6 bg-white rounded-bl-xl">
             {items.map((item) => (
               <div 
                 key={item.id} 
                 className={`${activeItem === item.id ? 'block' : 'hidden'} animate-fadeIn`}
               >
                 <div className="flex items-center gap-2 mb-6 border-b pb-2">
                    <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
                    <Link href={item.href || '#'} className="text-xs text-[#db2777] hover:underline mr-auto">
                        مشاهده همه {item.title}
                    </Link>
                 </div>
                 
                 {item.subCategories && item.subCategories.length > 0 ? (
                     <div className="grid grid-cols-3 gap-x-8 gap-y-8">
                        {item.subCategories.map((sub) => (
                            <div key={sub.id} className="space-y-3">
                                <Link href="#" className="block font-bold text-sm text-gray-800 hover:text-[#db2777] mb-2 border-r-2 border-[#db2777] pr-2">
                                    {sub.title}
                                </Link>
                                <ul className="space-y-2 pr-4">
                                    {sub.links.map((link) => (
                                        <li key={link.id}>
                                            <Link href={link.href} className="text-sm text-gray-500 hover:text-[#db2777] hover:pr-1 transition-all">
                                                {link.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                     </div>
                 ) : (
                     <div className="text-center text-gray-400 py-12">
                         <p>هیچ زیرمجموعه‌ای برای این دسته تعریف نشده است.</p>
                     </div>
                 )}
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
