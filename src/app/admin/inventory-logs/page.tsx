'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getInventoryLogsAction, clearInventoryLogsAction } from '@/actions/inventory';
import { ClipboardList, Trash2, RefreshCw } from 'lucide-react';

type LogItem = {
  id: string;
  productId: string;
  productName: string;
  adminName: string;
  changeType: string;
  oldStock: number;
  newStock: number;
  createdAt: string | Date;
};

export default function InventoryLogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const mapLog = (l: unknown): LogItem => {
    const r = l as Record<string, unknown>;
    return {
      id: String(r.id),
      productId: String(r.productId),
      productName: String(r.productName || ''),
      adminName: String(r.adminName || ''),
      changeType: String(r.changeType || ''),
      oldStock: typeof r.oldStock === 'number' ? r.oldStock : Number(r.oldStock) || 0,
      newStock: typeof r.newStock === 'number' ? r.newStock : Number(r.newStock) || 0,
      createdAt: (r.createdAt as string | Date) ?? new Date().toISOString(),
    };
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInventoryLogsAction();
      if (res.success && res.data) {
        const data = (res.data as unknown[]).map(mapLog);
        setLogs(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const es = new EventSource('/api/chat/stream');
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'inventory:update') {
          fetchLogs();
        }
      } catch {}
    };
    return () => {
      es.close();
    };
  }, [fetchLogs]);

  const clearLogs = async () => {
    const ok = confirm('آیا از پاک کردن لاگ‌های انبار اطمینان دارید؟');
    if (!ok) return;
    const res = await clearInventoryLogsAction();
    if (res.success) {
      fetchLogs();
    } else {
      alert('خطا در پاکسازی لاگ‌ها');
    }
  };

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-[#83b735]" />
          گزارش تغییرات انبار
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={fetchLogs} className="px-3 py-2 border rounded-md hover:bg-gray-50 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            بروزرسانی
          </button>
          <button onClick={clearLogs} className="px-3 py-2 border rounded-md hover:bg-gray-50 text-red-600 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            پاکسازی
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">در حال بارگذاری...</div>
      ) : logs.length === 0 ? (
        <div className="text-gray-500">لاگی یافت نشد.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                <th className="p-3 font-semibold">محصول</th>
                <th className="p-3 font-semibold">مدیر</th>
                <th className="p-3 font-semibold">نوع تغییر</th>
                <th className="p-3 font-semibold">موجودی قبلی</th>
                <th className="p-3 font-semibold">موجودی جدید</th>
                <th className="p-3 font-semibold">تاریخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <div className="font-medium text-gray-800">{l.productName}</div>
                    <div className="text-xs text-gray-500">#{l.productId}</div>
                  </td>
                  <td className="p-3 text-sm text-gray-700">{l.adminName}</td>
                  <td className="p-3 text-sm text-gray-700">{l.changeType}</td>
                  <td className="p-3 text-sm text-gray-700">{l.oldStock}</td>
                  <td className="p-3 text-sm text-gray-700">{l.newStock}</td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(l.createdAt).toLocaleString('fa-IR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
