
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Menu, User, Phone, Clock, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { MegaMenu } from '@/components/MegaMenu';
import { SiteSettings } from '@/data/settings';
import { usePathname, useRouter } from 'next/navigation';
import { formatPriceToman, ProductItem } from '@/data/products';
import clsx from 'clsx';


interface HeaderClientProps {
  settings: SiteSettings;
}

export const HeaderClient = ({ settings }: HeaderClientProps) => {
  const { totalItems, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);
  
  // Live Search State
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);

  // Live Search Logic using server API backed by Prisma
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
          .then(res => res.json())
          .then((data: ProductItem[]) => {
            setSearchResults(Array.isArray(data) ? data : []);
            setIsSearching(false);
            setShowResults(true);
          })
          .catch(() => {
            setSearchResults([]);
            setIsSearching(false);
            setShowResults(true);
          });
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileSearchOpen(false);
      setShowResults(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const s = settings;
  return (
    <header className="w-full bg-white shadow-md sticky top-0 z-50 transition-all duration-300">
      <div className="bg-gradient-to-r from-[#db2777] to-[#be185d] text-white text-xs py-2.5 shadow-sm">
        <div className="container mx-auto px-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">ساعت پاسخگویی: {s.supportHours}</span>
            </span>
            <span className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
              <Phone className="w-3.5 h-3.5" />
              <span className="font-medium">تلفن: {s.phone}</span>
            </span>
            <span className="flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
              <span className="font-medium">تلگرام پشتیبانی: {s.telegram}</span>
            </span>
          </div>
          <div className="text-center md:text-left opacity-90 font-medium">
            {s.topBarMessage}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 flex items-center justify-between gap-6">
        {/* Mobile Menu */}
        <button className="md:hidden">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>

        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-[#db2777]">{s.brandName}</Link>

        {/* Search Bar */}
        <div className={`
          fixed inset-x-0 top-[110px] bg-white p-4 shadow-md z-40 transition-all duration-300 md:static md:shadow-none md:p-0 md:bg-transparent md:flex-1 md:max-w-xl md:mx-8 md:block
          ${isMobileSearchOpen ? 'block' : 'hidden md:block'}
        `}>
          <div className="relative group" ref={searchRef}>
            <input
              type="text"
              placeholder="جستجو در محصولات..."
              className="w-full bg-gray-50 border-2 border-transparent rounded-full py-2.5 px-6 pr-12 text-sm focus:outline-none focus:bg-white focus:border-[#db2777] focus:shadow-lg transition-all duration-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setShowResults(true);
              }}
              onKeyDown={handleKeyDown}
            />
            <button 
              onClick={handleSearch} 
              className="absolute left-3 top-2.5 text-gray-400 hover:text-[#db2777] transition-colors p-1"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Live Search Results */}
            {showResults && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-400 text-sm">در حال جستجو...</div>
                ) : searchResults.length > 0 ? (
                  <div>
                    <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 border-b">
                      پیشنهادات جستجو
                    </div>
                    {searchResults.map((product) => (
                      <Link 
                        key={product.id} 
                        href={`/product/${product.slug || product.id}`}
                        onClick={() => setShowResults(false)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                      >
                        <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                               <Search className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-800 truncate">{product.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[#83b735] text-xs font-bold">
                               {formatPriceToman(product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.basePrice)}
                             </span>
                             {product.brand && <span className="text-gray-400 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-sm">{product.brand}</span>}
                          </div>
                        </div>
                      </Link>
                    ))}
                    <Link 
                      href={`/shop?q=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={() => setShowResults(false)}
                      className="block text-center py-3 text-sm text-[#db2777] font-medium hover:bg-gray-50 transition-colors border-t"
                    >
                      مشاهده همه نتایج برای «{searchQuery}»
                    </Link>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                     <div className="text-gray-300 mb-2">
                       <Search className="w-8 h-8 mx-auto opacity-50" />
                     </div>
                     <p className="text-gray-500 text-sm">محصولی یافت نشد</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="md:hidden text-gray-800" onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}>
            <Search className="w-6 h-6" />
          </button>
          <Link href="/account" className="flex items-center gap-1 text-gray-800 hover:text-[#db2777] transition-colors">
            <User className="w-6 h-6" />
            <span className="hidden md:inline text-sm">حساب کاربری</span>
          </Link>
          <Link href="/account?tab=wishlist" className="flex items-center gap-1 text-gray-800 hover:text-[#db2777] transition-colors relative">
            <Heart className="w-6 h-6" />
            <span
              suppressHydrationWarning
              className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ${wishlistCount > 0 ? 'opacity-100' : 'opacity-0'}`}
            >
              {wishlistCount}
            </span>
            <span className="hidden md:inline text-sm">علاقه‌مندی‌ها</span>
          </Link>
          <button 
            onClick={openCart}
            className="flex items-center gap-1 text-gray-800 hover:text-[#db2777] transition-colors relative"
          >
            <ShoppingCart className="w-6 h-6" />
            <span
              suppressHydrationWarning
              className={`absolute -top-2 -right-2 bg-[#db2777] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ${totalItems > 0 ? 'opacity-100 animate-bounce' : 'opacity-0'}`}
            >
              {totalItems}
            </span>
            <span className="hidden md:inline text-sm">سبد خرید</span>
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="hidden md:block">
        <div className="container mx-auto px-4">
          <ul className="flex justify-center gap-2 py-2 text-sm font-semibold items-center">
            <li className="ml-8">
              <MegaMenu />
            </li>
            <li>
              <Link
                href="/"
                className={clsx(
                  'px-5 py-2.5 rounded-full transition-all duration-300',
                  pathname === '/' ? 'bg-[#db2777] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-[#db2777]'
                )}
              >
                خانه
              </Link>
            </li>
            <li>
              <Link
                href="/shop"
                className={clsx(
                  'px-5 py-2.5 rounded-full transition-all duration-300',
                  pathname?.startsWith('/shop') ? 'bg-[#db2777] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-[#db2777]'
                )}
              >
                فروشگاه
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                className={clsx(
                  'px-5 py-2.5 rounded-full transition-all duration-300',
                  pathname?.startsWith('/blog') ? 'bg-[#db2777] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-[#db2777]'
                )}
              >
                خبرنامه
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className={clsx(
                  'px-5 py-2.5 rounded-full transition-all duration-300',
                  pathname === '/about' ? 'bg-[#db2777] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-[#db2777]'
                )}
              >
                درباره ما
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className={clsx(
                  'px-5 py-2.5 rounded-full transition-all duration-300',
                  pathname === '/contact' ? 'bg-[#db2777] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-[#db2777]'
                )}
              >
                تماس با ما
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};
