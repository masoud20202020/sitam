'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search, User, Menu, ShoppingBag, LifeBuoy } from 'lucide-react';
import Link from 'next/link';
import { getUser, User as AccountUser } from '@/data/account';
import { getChatSessionsAction } from '@/actions/chat';
import { getOrdersAction } from '@/actions/orders';
import { getTicketsAction } from '@/actions/tickets';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [counts, setCounts] = useState({
    orders: 0,
    chat: 0,
    tickets: 0
  });

  const updateCounts = async () => {
    // 1. New Orders (isViewed is false) from Prisma
    let newOrders = 0;
    try {
      const res = await getOrdersAction();
      if (res.success && res.data) {
        newOrders = (res.data as Array<{ isViewed?: boolean }>).filter(o => !o.isViewed).length;
      }
    } catch {}

    // 2. Chat Unread Messages from Prisma
    let unreadChats = 0;
    try {
      const sessions = await getChatSessionsAction();
      unreadChats = (sessions as Array<{ unreadCount?: number }>).reduce((acc, s) => acc + (s.unreadCount || 0), 0);
    } catch {}

    // 3. Open Tickets from Prisma
    let openTickets = 0;
    try {
      const resT = await getTicketsAction();
      if (resT.success && resT.data) {
        openTickets = (resT.data as Array<{ status?: string }>).filter((t) => t.status === 'open' || t.status === 'pending').length;
      }
    } catch {}

    setCounts({
      orders: newOrders,
      chat: unreadChats,
      tickets: openTickets
    });
  };

  useEffect(() => {
    setTimeout(() => {
      setUser(getUser());
    }, 0);
    setTimeout(() => {
      updateCounts();
    }, 0);
    const interval = setInterval(updateCounts, 30000);
    const es = new EventSource('/api/chat/stream');
    es.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'chat:update' || data.type === 'orders:update' || data.type === 'tickets:update') {
          updateCounts();
        }
      } catch {}
    };
    return () => {
      clearInterval(interval);
      es.close();
    };
  }, []);
 
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="جستجو در پنل مدیریت..." 
            className="w-full pl-4 pr-10 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#83b735]/20 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* New Orders Notification */}
        <Link href="/admin/orders" className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors" title="سفارش‌های جدید">
          <ShoppingBag className="w-5 h-5" />
          {counts.orders > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white ring-2 ring-white">
              {counts.orders > 9 ? '+9' : counts.orders}
            </span>
          )}
        </Link>

        {/* Chat Notification */}
        <Link href="/admin/chat" className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors" title="پیام‌های چت">
          <Bell className="w-5 h-5" /> {/* Using Bell as requested for Chat/Notifications */}
          {counts.chat > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white ring-2 ring-white">
              {counts.chat > 9 ? '+9' : counts.chat}
            </span>
          )}
        </Link>

        {/* Tickets Notification */}
        <Link href="/admin/tickets" className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors" title="تیکت‌های باز">
          <LifeBuoy className="w-5 h-5" />
          {counts.tickets > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white ring-2 ring-white">
              {counts.tickets > 9 ? '+9' : counts.tickets}
            </span>
          )}
        </Link>
        
        <div className="flex items-center gap-3 border-r pr-4 mr-2">
          <div className="text-left hidden md:block">
            <div className="text-sm font-bold text-gray-800">{user?.name || 'مدیر سیستم'}</div>
            <div className="text-xs text-gray-500">مدیر کل</div>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-[#83b735] to-[#6a9e2d] rounded-full flex items-center justify-center text-white shadow-md shadow-[#83b735]/20">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
