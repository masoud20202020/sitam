'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { getTicketsAction, deleteTicketAction } from '@/actions/tickets';
import { Trash2, MessageSquare, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import type { TicketStatus } from '@/data/tickets';

type StatusFilter = 'all' | TicketStatus;

export default function AdminTicketsPage() {
  type TicketItem = {
    id: string;
    subject: string;
    status: string;
    updatedAt: string | Date;
    category?: string | null;
    user?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  };
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [status, setStatus] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [/* isLoading */] = useState(true);

  const fetchTickets = async () => {
    // setIsLoading(true);
    const result = await getTicketsAction();
    if (result.success && result.data) {
      setTickets(result.data);
    }
    // setIsLoading(false);
  };

  useEffect(() => {
    const id = setTimeout(() => {
      fetchTickets();
    }, 0);
    const es = new EventSource('/api/chat/stream');
    es.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'tickets:update') {
          await fetchTickets();
        }
      } catch {}
    };
    return () => {
      es.close();
      clearTimeout(id);
    };
  }, []);

  const remove = async (id: string) => {
    if (confirm('آیا از حذف این تیکت اطمینان دارید؟')) {
      const result = await deleteTicketAction(id);
      if (result.success) {
        fetchTickets();
      } else {
        alert('خطا در حذف تیکت');
      }
    }
  };

  const filtered = useMemo(() => {
    let list = tickets.slice();
    if (status !== 'all') list = list.filter(t => t.status === status);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(t => {
        const userName = t.user?.name || 'ناشناس';
        const userEmail = t.user?.email || '';
        const userPhone = t.user?.phone || '';
        
        return userName.toLowerCase().includes(q) || 
               userEmail.toLowerCase().includes(q) || 
               userPhone.includes(q) || 
               t.subject.toLowerCase().includes(q) ||
               t.id.toLowerCase().includes(q)
      });
    }
    return list;
  }, [tickets, status, query]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-blue-100 text-blue-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'باز';
      case 'pending': return 'در انتظار';
      case 'resolved': return 'پاسخ داده شده';
      case 'closed': return 'بسته شده';
      default: return status;
    }
  };

  const getTopicLabel = (t?: string | null) => {
    switch (t) {
      case 'pre-sale': return 'سوالات قبل از خرید';
      case 'tracking': return 'پیگیری ارسال';
      case 'return': return 'مرجوعی';
      case 'technical': return 'فنی';
      case 'other': return 'سایر';
      default: return 'نامشخص';
    }
  };

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-[#83b735]" />
            پشتیبانی و تیکت‌ها
          </h1>
          <p className="text-gray-500 text-sm mt-1">مدیریت تیکت‌های پشتیبانی کاربران</p>
        </div>
        {/* <button className="bg-[#83b735] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#6da025] transition-colors shadow-sm">
          <Plus className="w-5 h-5" />
          تیکت جدید
        </button> */}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-gray-50 p-4 rounded-xl border">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="جستجو در تیکت‌ها (نام، شماره، موضوع...)" 
            className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#83b735]"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select 
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735] bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="open">باز</option>
            <option value="pending">در انتظار</option>
            <option value="resolved">پاسخ داده شده</option>
            <option value="closed">بسته شده</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm border-b">
              <th className="p-4 font-semibold rounded-tr-lg">شماره</th>
              <th className="p-4 font-semibold">کاربر</th>
              <th className="p-4 font-semibold">موضوع</th>
              <th className="p-4 font-semibold">وضعیت</th>
              <th className="p-4 font-semibold">آخرین بروزرسانی</th>
              <th className="p-4 font-semibold rounded-tl-lg">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(ticket => (
              <tr key={ticket.id} className="hover:bg-gray-50 transition-colors group">
                <td className="p-4 text-gray-500 font-mono text-sm">#{ticket.id.toString().slice(-6)}</td>
                <td className="p-4">
                  <div className="font-medium text-gray-800">{ticket.user?.name || 'ناشناس'}</div>
                  <div className="text-xs text-gray-500">{ticket.user?.email || ticket.user?.phone || '-'}</div>
                </td>
                <td className="p-4 font-medium text-gray-800">
                  {ticket.subject}
                  <div className="mt-1">
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                      {getTopicLabel(ticket.category)}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                </td>
                <td className="p-4 text-gray-500 text-sm">
                  {new Date(ticket.updatedAt).toLocaleDateString('fa-IR')}
                </td>
                <td className="p-4 flex items-center gap-2">
                  <Link 
                    href={`/admin/tickets/${ticket.id}`}
                    className="text-[#83b735] bg-[#83b735]/10 hover:bg-[#83b735] hover:text-white px-3 py-1.5 rounded-md transition-all text-sm font-medium"
                  >
                    پاسخ
                  </Link>
                  <button 
                    onClick={() => remove(ticket.id)}
                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg mt-4 border border-dashed">
          تیکتی یافت نشد.
        </div>
      )}
    </div>
  );
}
