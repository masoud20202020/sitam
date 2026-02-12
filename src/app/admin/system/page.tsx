
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getLogs, clearLogs, LogEntry } from '@/data/logs';
import { downloadBackup, restoreBackup } from '@/data/backup';
import { 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  Activity,
  Database
} from 'lucide-react';

export default function SystemPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'backup'>('logs');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshLogs = () => {
    setLogs(getLogs());
  };

  useEffect(() => {
    const id = setTimeout(() => {
      refreshLogs();
    }, 0);
    return () => clearTimeout(id);
  }, []);


  const handleClearLogs = () => {
    if (confirm('آیا از پاک کردن تمام گزارش‌ها اطمینان دارید؟')) {
      clearLogs();
      refreshLogs();
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = restoreBackup(content);
        alert(result.message);
        if (result.success) {
          window.location.reload();
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">سیستم و پشتیبان‌گیری</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border p-1 flex gap-1 w-fit">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'logs' 
              ? 'bg-[#83b735] text-white shadow-sm' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          گزارش فعالیت‌ها
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'backup' 
              ? 'bg-[#83b735] text-white shadow-sm' 
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Database className="w-4 h-4" />
          پشتیبان‌گیری
        </button>
      </div>

      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-gray-700">آخرین فعالیت‌ها</h2>
            <div className="flex gap-2">
              <button 
                onClick={refreshLogs} 
                className="p-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                title="بروزرسانی"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button 
                onClick={handleClearLogs} 
                className="p-2 text-red-500 hover:bg-red-50 hover:shadow-sm rounded-lg transition-all"
                title="پاک کردن گزارش‌ها"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-right p-4 w-16">نوع</th>
                  <th className="text-right p-4">عملیات</th>
                  <th className="text-right p-4">جزئیات</th>
                  <th className="text-right p-4">کاربر</th>
                  <th className="text-right p-4">زمان</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      هیچ گزارشی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">{getLogIcon(log.type)}</td>
                      <td className="p-4 font-medium text-gray-900">{log.action}</td>
                      <td className="p-4 text-gray-600 truncate max-w-xs" title={log.details}>{log.details || '-'}</td>
                      <td className="p-4 text-gray-600">{log.user || 'سیستم'}</td>
                      <td className="p-4 text-gray-500 dir-ltr text-right">
                        {new Date(log.timestamp).toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">تهیه نسخه پشتیبان</h2>
            <p className="text-gray-600 text-sm mb-6">
              دانلود تمام اطلاعات سایت (محصولات، سفارش‌ها، تنظیمات و...) در قالب یک فایل JSON.
              این فایل را می‌توانید برای بازیابی اطلاعات در آینده استفاده کنید.
            </p>
            <button
              onClick={downloadBackup}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              دانلود فایل پشتیبان
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">بازیابی اطلاعات</h2>
            <p className="text-gray-600 text-sm mb-6">
              بازگردانی اطلاعات از فایل پشتیبان.
              <span className="text-red-500 block mt-1 font-bold">هشدار: تمام اطلاعات فعلی جایگزین خواهند شد!</span>
            </p>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleRestore}
                className="hidden"
                id="restore-file"
              />
              <label
                htmlFor="restore-file"
                className="w-full bg-white border-2 border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50 text-gray-600 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-medium"
              >
                <Upload className="w-5 h-5" />
                انتخاب فایل و بازیابی
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
