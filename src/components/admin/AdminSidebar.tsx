'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Settings, 
  Package, 
  Layers, 
  Tags, 
  Menu, 
  Image as ImageIcon, 
  Truck, 
  ShoppingBag, 
  Users, 
  MessageSquare, 
  MessageCircle,
  LifeBuoy,
  LogOut,
  ChevronLeft,
  X,
  Activity,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';
import clsx from 'clsx';

const menuItems = [
  { href: '/admin', label: 'داشبورد', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'سفارش‌ها', icon: ShoppingBag },
  { href: '/admin/products', label: 'محصولات', icon: Package },
  { href: '/admin/categories', label: 'دسته‌بندی‌ها', icon: Layers },
  { href: '/admin/brands', label: 'برندها', icon: Tags },
  { href: '/admin/customers', label: 'مشتریان', icon: Users },
  { href: '/admin/reviews', label: 'دیدگاه‌ها', icon: MessageSquare },
  { href: '/admin/tickets', label: 'تیکت‌ها', icon: LifeBuoy },
  { href: '/admin/chat', label: 'چت آنلاین', icon: MessageCircle },
  { href: '/admin/mega-menu', label: 'مگا منو', icon: Menu },
  { href: '/admin/media', label: 'رسانه', icon: ImageIcon },
  { href: '/admin/banners', label: 'بنرها', icon: ImageIcon },
  { href: '/admin/shipping', label: 'روش‌های ارسال', icon: Truck },
  { href: '/admin/inventory-logs', label: 'گزارشات موجودی', icon: ClipboardList },
  { href: '/admin/coupons', label: 'کدهای تخفیف', icon: Tags },
  { href: '/admin/blog', label: 'مدیریت خبرنامه', icon: MessageSquare },
  { href: '/admin/settings', label: 'تنظیمات سایت', icon: Settings },
  { href: '/admin/system', label: 'سیستم و لاگ', icon: Activity },
  { href: '/admin/admins', label: 'مدیران و دسترسی‌ها', icon: ShieldCheck },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={clsx(
          "fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={clsx(
        "w-64 bg-[#1e293b] border-l border-white/10 h-screen fixed right-0 top-0 overflow-y-auto flex flex-col z-40 shadow-xl transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
             <div className="w-9 h-9 bg-gradient-to-br from-[#83b735] to-[#6a9e2d] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#83b735]/20">S</div>
             <span className="font-bold text-xl text-white tracking-tight">پنل مدیریت</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname?.startsWith(item.href);
              
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden',
                  isActive 
                    ? 'bg-gradient-to-r from-[#83b735] to-[#72a52a] text-white shadow-md shadow-[#83b735]/25' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className={clsx("w-5 h-5 transition-colors", isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300")} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <ChevronLeft className="w-4 h-4 mr-auto opacity-75" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">خروج از پنل</span>
          </button>
        </div>
      </aside>
    </>
  );
}
