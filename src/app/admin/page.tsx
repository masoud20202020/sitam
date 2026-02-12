'use client';

import React, { useEffect, useState } from 'react';
import { getDashboardStatsAction } from '@/actions/dashboard';
import { formatPriceToman } from '@/data/products'; // Keep using this utility or move to a shared utils
import { ShoppingBag, Users, DollarSign, Clock, ArrowRight, TrendingUp, CreditCard, Activity, RefreshCw } from 'lucide-react';
import SalesChart from '@/components/admin/SalesChart';
import Link from 'next/link';
import clsx from 'clsx';

// Types matching Server Action response
type RecentOrder = {
  id: string;
  createdAt: string | Date;
  total: number;
  status: string;
};

type DashboardStats = {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  recentOrders: RecentOrder[];
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const result = await getDashboardStatsAction();
    if (result.success && result.data) {
      setStats(result.data);
    } else {
      console.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchStats();
    }, 0);
    const es = new EventSource('/api/chat/stream');
    es.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'orders:update' || data.type === 'tickets:update') {
          setTimeout(() => {
            fetchStats();
          }, 0);
        }
      } catch {}
    };
    return () => {
      es.close();
      clearTimeout(t);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">داشبورد مدیریت</h1>
          <p className="text-gray-500 text-sm mt-1">نگاهی کلی به وضعیت فروشگاه شما</p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={fetchStats} 
                disabled={loading}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="بروزرسانی"
            >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border text-sm text-gray-600 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleDateString('fa-IR', { dateStyle: 'full' })}
            </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="فروش کل" 
          value={`${formatPriceToman(stats.totalSales)}`} 
          icon={<DollarSign className="w-6 h-6" />} 
          // trend="+۱۲٪" // TODO: Calculate trend
          // trendUp={true}
          variant="green"
        />
        <StatCard 
          title="تعداد سفارشات" 
          value={stats.totalOrders.toLocaleString('fa-IR')} 
          icon={<ShoppingBag className="w-6 h-6" />} 
          // trend="+۵"
          // trendUp={true}
          variant="blue"
        />
        <StatCard 
          title="مشتریان ثبت‌نامی" 
          value={stats.totalCustomers.toLocaleString('fa-IR')} 
          icon={<Users className="w-6 h-6" />} 
          // trend="+۳٪"
          // trendUp={true}
          variant="purple"
        />
        <StatCard 
          title="سفارشات جاری" 
          value={stats.pendingOrders.toLocaleString('fa-IR')} 
          icon={<Activity className="w-6 h-6" />} 
          variant="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-[#83b735]" />
               آمار فروش
             </h3>
             <select className="bg-gray-50 border-none text-sm rounded-lg px-3 py-1 text-gray-600 focus:ring-0">
               <option>هفته گذشته</option>
               <option>ماه گذشته</option>
               <option>سال گذشته</option>
             </select>
          </div>
          <SalesChart />
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              سفارشات اخیر
            </h3>
            <Link href="/admin/orders" className="text-xs font-medium text-blue-500 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
              مشاهده همه <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {stats.recentOrders.map((order: RecentOrder) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                    #{order.id.slice(-4)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{formatPriceToman(order.total)}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString('fa-IR')}</div>
                  </div>
                </div>
                <StatusBadge status={order.status} />
              </div>
            ))}
            {stats.recentOrders.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm flex flex-col items-center gap-2">
                <ShoppingBag className="w-8 h-8 opacity-20" />
                هنوز سفارشی ثبت نشده است
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp, variant }: { 
  title: string, 
  value: string, 
  icon: React.ReactNode, 
  trend?: string, 
  trendUp?: boolean,
  variant: 'green' | 'blue' | 'purple' | 'orange' 
}) {
  const styles = {
    green: { 
      border: 'border-emerald-500', 
      iconBg: 'bg-emerald-100 text-emerald-600', 
      text: 'text-emerald-900',
      trendInfo: 'bg-emerald-100 text-emerald-700'
    },
    blue: { 
      border: 'border-blue-500', 
      iconBg: 'bg-blue-100 text-blue-600', 
      text: 'text-blue-900',
      trendInfo: 'bg-blue-100 text-blue-700'
    },
    purple: { 
      border: 'border-purple-500', 
      iconBg: 'bg-purple-100 text-purple-600', 
      text: 'text-purple-900',
      trendInfo: 'bg-purple-100 text-purple-700'
    },
    orange: { 
      border: 'border-orange-500', 
      iconBg: 'bg-orange-100 text-orange-600', 
      text: 'text-orange-900',
      trendInfo: 'bg-orange-100 text-orange-700'
    },
  };

  const style = styles[variant];

  return (
    <div className={`bg-white rounded-2xl p-6 border-t-4 ${style.border} shadow-sm hover:shadow-md transition-all duration-300 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={clsx("p-3 rounded-xl transition-colors", style.iconBg)}>
          {icon}
        </div>
        {trend && (
          <div className={clsx(
            "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1",
            trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {trend}
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
          </div>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className={clsx("text-2xl font-black tracking-tight", style.text)}>{value}</h3>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    processing: 'bg-orange-100 text-orange-700 border-orange-200',
    shipped: 'bg-blue-100 text-blue-700 border-blue-200',
    delivered: 'bg-green-100 text-green-700 border-green-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200'
  };
  
  const labels: Record<string, string> = {
    processing: 'در حال پردازش',
    shipped: 'ارسال شده',
    delivered: 'تحویل شده',
    cancelled: 'لغو شده'
  };

  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  );
}
