'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { getOrdersAction, updateOrderAction, updateReturnRequestAction } from '@/actions/orders';
import { Download, Printer, ChevronDown, ChevronUp, RefreshCw, Trash2 } from 'lucide-react';
import { formatPriceToman } from '@/data/products';
import { downloadCSV } from '@/utils/export';
import { sendOrderSMS } from '@/utils/smsService';
import { getSMSSettingsAction } from '@/app/actions/settings';

// Types matching Prisma response
type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  color: string | null;
  size: string | null;
};

type Address = {
  fullName: string;
  phone: string;
  province: string | null;
  city: string;
  addressLine: string;
  postalCode: string | null;
};

type ReturnRequest = {
  id: string;
  status: string;
  items: string; // JSON string
  reason: string;
  note: string | null;
  refundAmount: number | null;
  requestedAt: Date | string;
};

type Order = {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  status: string;
  total: number;
  discount: number | null;
  paymentMethod: string | null;
  shippingMethod: string | null;
  trackingNumber: string | null;
  estimatedDelivery: Date | string | null;
  items: OrderItem[];
  address: Address | null;
  returns: ReturnRequest[];
};

type StatusFilter = 'all' | string;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const result = await getOrdersAction();
    if (result.success && result.data) {
      setOrders(result.data as unknown as Order[]);
    } else {
      console.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const es = new EventSource('/api/chat/stream');
    es.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'orders:update') {
          await fetchData();
        }
      } catch {}
    };
    return () => {
      es.close();
    };
  }, []);

  const filtered = useMemo(() => {
    return orders
      .filter(o => (statusFilter === 'all' ? true : o.status === statusFilter))
      .filter(o => {
        const d = new Date(o.createdAt);
        const fromOk = fromDate ? d >= new Date(fromDate) : true;
        const toOk = toDate ? d <= new Date(toDate) : true;
        return fromOk && toOk;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, statusFilter, fromDate, toDate]);

  const handleExport = () => {
    const data = filtered.map(o => {
      const addr = o.address;
      return {
        'شناسه سفارش': o.id,
        'تاریخ': new Date(o.createdAt).toLocaleDateString('fa-IR'),
        'مشتری': addr?.fullName || 'ناشناس',
        'استان': addr?.province || '-',
        'شهر': addr?.city || '-',
        'تلفن': addr?.phone || '-',
        'مبلغ کل': o.total,
        'وضعیت': o.status === 'processing' ? 'در حال پردازش' : o.status === 'shipped' ? 'ارسال شده' : o.status === 'delivered' ? 'تحویل شده' : 'لغو شده',
        'روش پرداخت': o.paymentMethod === 'online' ? 'آنلاین' : 'در محل',
        'کد رهگیری': o.trackingNumber || '-'
      };
    });
    downloadCSV(data, `orders-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleSave = async (id: string, patch: import('@prisma/client').Prisma.OrderUpdateInput) => {
    // Optimistic update
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const nextPatch: Partial<Order> = {};
      if ('status' in patch && typeof patch.status === 'string') {
        nextPatch.status = patch.status;
      }
      if ('trackingNumber' in patch && typeof patch.trackingNumber === 'string') {
        nextPatch.trackingNumber = patch.trackingNumber || undefined;
      }
      return { ...o, ...nextPatch };
    }));
    
    const result = await updateOrderAction(id, patch);
    if (!result.success) {
      alert('خطا در ذخیره سازی: ' + result.error);
      fetchData(); // Revert
      return;
    }
    
    const updated = result.data;
    if (updated) {
        // Send SMS if status changed
        const statusChanged = 'status' in patch;
        const trackingSet = 'trackingNumber' in patch && updated.status === 'shipped';
        if (statusChanged || trackingSet) {
            try {
                const smsSettings = await getSMSSettingsAction();
                const statusToSend = ('status' in patch && typeof patch.status === 'string') ? patch.status : 'shipped';
                const addr = orders.find(o => o.id === id)?.address;
                await sendOrderSMS(
                  { ...updated, trackingNumber: updated.trackingNumber ?? undefined, address: addr ? { phone: addr.phone } : undefined },
                  statusToSend,
                  smsSettings
                );
            } catch (err) {
                console.error('Failed to send SMS:', err);
            }
        }
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    if (newStatus === 'shipped') {
      const order = orders.find(o => o.id === orderId);
      setTrackingInput(order?.trackingNumber || '');
      setSelectedOrderId(orderId);
      setIsTrackingModalOpen(true);
    } else {
      handleSave(orderId, { status: newStatus });
    }
  };

  const confirmShipment = () => {
    if (selectedOrderId) {
      handleSave(selectedOrderId, { 
        status: 'shipped', 
        trackingNumber: trackingInput.trim() || undefined 
      });
      setIsTrackingModalOpen(false);
      setSelectedOrderId(null);
      setTrackingInput('');
    }
  };

  const cancelShipment = () => {
    setIsTrackingModalOpen(false);
    setSelectedOrderId(null);
    setTrackingInput('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('آیا از حذف این سفارش مطمئن هستید؟ این عملیات غیرقابل بازگشت است.')) {
        const result = await import('@/actions/orders').then(m => m.deleteOrderAction(id));
        if (result.success) {
            setOrders(prev => prev.filter(o => o.id !== id));
        } else {
            alert('خطا در حذف سفارش: ' + result.error);
        }
    }
  };

  const handlePrintInvoice = (o: Order) => {
    const addr = o.address;
    const win = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    if (!win) return;
    const dateStr = new Date(o.createdAt).toLocaleDateString('fa-IR');
    const itemsRows = o.items
      .map(
        it =>
          `<tr><td>${it.name} ${it.color ? `(${it.color})` : ''}</td><td>${it.quantity.toLocaleString('fa-IR')}</td><td>${formatPriceToman(
            it.price
          )}</td><td>${formatPriceToman(it.price * it.quantity)}</td></tr>`
      )
      .join('');
    const discount = o.discount || 0;
    const totalAfterDiscount = Math.max(0, o.total - discount);
    
    // Status mapping for invoice
    const statusMap: Record<string, string> = {
      'processing': 'در حال پردازش',
      'shipped': 'ارسال شده',
      'delivered': 'تحویل داده شده',
      'cancelled': 'لغو شده'
    };

    const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<title>فاکتور سفارش #${o.id}</title>
<style>
  @font-face {
    font-family: 'Tahoma';
    src: local('Tahoma');
  }
  body {
    font-family: 'Tahoma', Arial, sans-serif;
    color: #111;
    margin: 0;
    padding: 40px;
    direction: rtl;
    line-height: 1.6;
  }
  .invoice-box {
    max-width: 800px;
    margin: auto;
    border: 1px solid #eee;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, .15);
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #83b735;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }
  .brand {
    font-weight: 700;
    font-size: 28px;
    color: #83b735;
  }
  .invoice-title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
  }
  .meta-item {
    font-size: 14px;
    color: #555;
  }
  .meta-label {
    font-weight: bold;
    color: #333;
    margin-left: 5px;
  }
  .section-title {
    font-size: 16px;
    font-weight: bold;
    background: #f9f9f9;
    padding: 8px 15px;
    border-right: 4px solid #83b735;
    margin: 20px 0 10px 0;
  }
  .addr-box {
    font-size: 14px;
    color: #333;
    background: #fff;
    border: 1px solid #eee;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 30px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  th, td {
    border: 1px solid #eee;
    padding: 12px 15px;
    text-align: right;
    font-size: 13px;
  }
  th {
    background: #f7f7f7;
    font-weight: bold;
    color: #333;
  }
  .totals-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 30px;
  }
  .totals-box {
    width: 250px;
  }
  .total-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
    font-size: 14px;
  }
  .total-item.grand-total {
    border-bottom: none;
    font-weight: bold;
    font-size: 18px;
    color: #83b735;
    padding-top: 15px;
  }
  .footer {
    margin-top: 50px;
    text-align: center;
    font-size: 12px;
    color: #888;
    border-top: 1px solid #eee;
    padding-top: 20px;
  }
  @media print {
    .print-hide { display: none !important; }
    body { padding: 0; }
    .invoice-box { border: none; box-shadow: none; }
  }
  .btn-print {
    background: #83b735;
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    font-family: 'Tahoma';
    margin-bottom: 20px;
  }
</style>
</head>
<body>
  <div style="text-align: center;" class="print-hide">
    <button class="btn-print" onclick="window.print()">چاپ و دانلود PDF فاکتور</button>
  </div>
  <div class="invoice-box">
    <div class="header">
      <div class="brand">فروشگاه سیتام</div>
      <div class="invoice-title">صورت‌حساب فروش کالا</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-label">شماره فاکتور:</span> #${o.id}
      </div>
      <div class="meta-item">
        <span class="meta-label">تاریخ صدور:</span> ${dateStr}
      </div>
      <div class="meta-item">
        <span class="meta-label">وضعیت سفارش:</span> ${statusMap[o.status] || o.status}
      </div>
      <div class="meta-item">
        <span class="meta-label">روش پرداخت:</span> ${o.paymentMethod === 'online' ? 'پرداخت آنلاین' : 'پرداخت در محل'}
      </div>
    </div>

    <div class="section-title">اطلاعات خریدار</div>
    <div class="addr-box">
      <div><span class="meta-label">نام و نام خانوادگی:</span> ${addr ? addr.fullName : '-'}</div>
      <div><span class="meta-label">شماره تماس:</span> ${addr ? addr.phone : '-'}</div>
      <div><span class="meta-label">استان و شهر:</span> ${addr ? addr.city : '-'}</div>
      <div><span class="meta-label">نشانی کامل:</span> ${addr ? addr.addressLine : '-'}</div>
    </div>

    <div class="section-title">جزئیات سفارش</div>
    <table>
      <thead>
        <tr>
          <th>نام محصول</th>
          <th>تعداد</th>
          <th>قیمت واحد (تومان)</th>
          <th>جمع جزء (تومان)</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <div class="totals-container">
      <div class="totals-box">
        <div class="total-item">
          <span>جمع کل:</span>
          <span>${formatPriceToman(o.total)}</span>
        </div>
        <div class="total-item">
          <span>تخفیف:</span>
          <span>${formatPriceToman(discount)}</span>
        </div>
        <div class="total-item grand-total">
          <span>مبلغ قابل پرداخت:</span>
          <span>${formatPriceToman(totalAfterDiscount)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      از خرید شما متشکریم! این فاکتور به صورت سیستمی صادر شده و معتبر می‌باشد.
      <br/>
      فروشگاه آنلاین سیتام - www.sitam.ir
    </div>
  </div>
</body>
</html>`;
    win.document.write(html);
    win.document.close();
  };

  const handlePrintLabel = (o: Order) => {
    // For simplicity, hardcoded settings or fetched from elsewhere.
    // In real app, settings should come from props or context.
    const settings = { brandName: 'فروشگاه سیتام', phone: '021-12345678', address: 'تهران، خیابان آزادی', postalCode: '1234567890' };
    const addr = o.address;
    
    const win = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    if (!win) return;
    
    const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<title>برچسب پستی - سفارش #${o.id}</title>
<style>
  @font-face {
    font-family: 'Tahoma';
    src: local('Tahoma');
  }
  body {
    font-family: 'Tahoma', Arial, sans-serif;
    padding: 20px;
    margin: 0;
    direction: rtl;
    background: #f5f5f5;
  }
  .label-box {
    background: white;
    border: 2px solid #000;
    padding: 30px;
    max-width: 600px;
    margin: 0 auto;
    border-radius: 8px;
    position: relative;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px dashed #ccc;
    padding-bottom: 20px;
    margin-bottom: 20px;
  }
  .brand {
    font-weight: bold;
    font-size: 24px;
  }
  .order-id {
    font-weight: bold;
    font-size: 18px;
    background: #eee;
    padding: 5px 10px;
    border-radius: 4px;
  }
  .section {
    margin-bottom: 25px;
  }
  .section-title {
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 10px;
    color: #555;
    border-right: 4px solid #83b735;
    padding-right: 10px;
  }
  .content-box {
    border: 1px solid #eee;
    padding: 15px;
    border-radius: 6px;
    line-height: 1.8;
  }
  .sender-box {
    background: #fcfcfc;
  }
  .receiver-box {
    border: 2px solid #333;
    background: #fff;
  }
  .row {
    display: flex;
    gap: 10px;
  }
  .label {
    color: #777;
    min-width: 60px;
  }
  .value {
    font-weight: 500;
  }
  .footer {
    text-align: center;
    margin-top: 30px;
    font-size: 12px;
    color: #888;
    border-top: 1px solid #eee;
    padding-top: 10px;
  }
  @media print {
    .print-btn { display: none; }
    body { background: white; padding: 0; }
    .label-box { border: 2px solid #000; max-width: none; width: 100%; height: 100%; box-sizing: border-box; border-radius: 0; }
  }
</style>
</head>
<body>
  <div style="text-align: center; margin-bottom: 20px;" class="print-btn">
    <button onclick="window.print()" style="padding: 12px 24px; background: #83b735; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-family: Tahoma;">چاپ برچسب</button>
  </div>
  
  <div class="label-box">
    <div class="header">
      <div class="brand">فروشگاه ${settings.brandName}</div>
      <div class="order-id">سفارش #${o.id}</div>
    </div>
    
    <div class="section">
      <div class="section-title">فرستنده</div>
      <div class="content-box sender-box">
        <div class="row">
          <span class="label">نام:</span>
          <span class="value">${settings.brandName}</span>
        </div>
        <div class="row">
          <span class="label">تلفن:</span>
          <span class="value">${settings.phone}</span>
        </div>
        <div class="row">
          <span class="label">آدرس:</span>
          <span class="value">${settings.address}</span>
        </div>
        <div class="row">
          <span class="label">کد پستی:</span>
          <span class="value">${settings.postalCode || '-'}</span>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">گیرنده</div>
      <div class="content-box receiver-box">
        <div class="row">
          <span class="label">نام:</span>
          <span class="value" style="font-size: 18px;">${addr ? addr.fullName : 'ناشناس'}</span>
        </div>
        <div class="row">
          <span class="label">تلفن:</span>
          <span class="value">${addr ? addr.phone : '-'}</span>
        </div>
        <div class="row">
          <span class="label">آدرس:</span>
          <span class="value">
            ${addr ? `استان ${addr.province || '-'}، شهر ${addr.city}` : ''}<br>
            ${addr ? addr.addressLine : '-'}
          </span>
        </div>
        <div class="row">
          <span class="label">کد پستی:</span>
          <span class="value">${addr?.postalCode || '-'}</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      این بسته حاوی سفارش اینترنتی است. لطفا در حمل آن دقت فرمایید.
    </div>
  </div>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
  };

  const approveReturn = async (orderId: string, returnId: string) => {
    const amountStr = prompt('مبلغ بازگشت (تومان):');
    if (!amountStr) return;
    const amount = Number(amountStr.replace(/[^\d]/g, ''));
    if (isNaN(amount)) return;
    
    const result = await updateReturnRequestAction(returnId, { status: 'approved', refundAmount: amount });
    if (result.success) {
      fetchData();
    } else {
      alert('خطا در تایید مرجوعی: ' + result.error);
    }
  };

  const rejectReturn = async (orderId: string, returnId: string) => {
    const result = await updateReturnRequestAction(returnId, { status: 'rejected' });
    if (result.success) {
      fetchData();
    } else {
      alert('خطا در رد مرجوعی: ' + result.error);
    }
  };

  const markRefunded = async (orderId: string, returnId: string) => {
    const result = await updateReturnRequestAction(returnId, { status: 'refunded' });
    if (result.success) {
      fetchData();
    } else {
      alert('خطا در ثبت عودت وجه: ' + result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">مدیریت سفارش‌ها</h1>
            {/* Live Indicator (Static for now) */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200" title="اتصال به دیتابیس برقرار است">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="font-medium">Online</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">تعداد: {filtered.length.toLocaleString('fa-IR')}</div>
        </div>

        <div className="bg-white border rounded-xl p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as StatusFilter)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="processing">در حال پردازش</option>
              <option value="shipped">ارسال شده</option>
              <option value="delivered">تحویل داده شده</option>
              <option value="cancelled">لغو شده</option>
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                setStatusFilter('all');
                setFromDate('');
                setToDate('');
              }}
              className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
            >
              پاک‌سازی
            </button>
            <button
              onClick={handleExport}
              className="bg-[#83b735] text-white rounded-md px-3 py-2 text-sm hover:bg-[#72a02d] flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              خروجی اکسل
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-blue-600 text-white rounded-md px-3 py-2 text-sm hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'در حال دریافت...' : 'بروزرسانی'}
            </button>
          </div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="text-center py-10 text-gray-500">در حال بارگذاری سفارش‌ها...</div>
        ) : (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-white rounded-xl border">هیچ سفارشی یافت نشد.</div>
            ) : (
              filtered.map(o => {
                const addr = o.address;
                const itemsCount = o.items.reduce((acc, it) => acc + it.quantity, 0);
                const estDate = o.estimatedDelivery ? new Date(o.estimatedDelivery).toISOString().slice(0, 10) : '';
                const isExpanded = expandedOrders.includes(o.id);
                
                return (
                  <div key={o.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                    {/* Summary Header - Compact */}
                    <div 
                      onClick={() => toggleExpand(o.id)}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors select-none"
                    >
                      <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
                        {/* Status & ID */}
                        <div className="flex items-center gap-3">
                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                              o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              o.status === 'processing' ? 'bg-orange-100 text-orange-700' :
                              o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {o.status === 'processing' ? 'در حال پردازش' :
                               o.status === 'shipped' ? 'ارسال شده' :
                               o.status === 'delivered' ? 'تحویل شده' : 'لغو شده'}
                            </div>
                            <span className="text-sm font-bold text-gray-800">#{o.id.slice(-6)}</span>
                            <span className="text-xs text-gray-400 hidden sm:inline">{new Date(o.createdAt).toLocaleDateString('fa-IR')}</span>
                        </div>

                        {/* Customer & Items (Brief) */}
                        <div className="flex items-center gap-4 text-xs text-gray-600 truncate">
                           <span className="truncate max-w-[150px] font-medium hidden md:inline">{addr?.fullName || 'کاربر ناشناس'}</span>
                           <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 hidden sm:inline">
                             {itemsCount} قلم
                           </span>
                        </div>
                      </div>

                      {/* Price & Toggle */}
                      <div className="flex items-center gap-3 md:gap-4 pl-1">
                         <div className="text-sm font-bold text-[#83b735] whitespace-nowrap">
                           {formatPriceToman(o.total)}
                         </div>
                         {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {/* Expanded Details Section */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50/50 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-1 duration-200">
                        
                        {/* Column 1: Customer Info */}
                        <div className="space-y-3 bg-white p-3 rounded-lg border">
                          <h4 className="text-xs font-bold text-gray-500 uppercase">اطلاعات مشتری</h4>
                          <div className="text-sm space-y-1.5">
                            <div className="font-medium text-gray-800">{addr?.fullName || 'نامشخص'}</div>
                            <div className="text-gray-600">{addr?.phone || '-'}</div>
                            <div className="text-gray-600 text-xs leading-relaxed">
                                {addr?.province} - {addr?.city}<br/>
                                {addr?.addressLine}
                            </div>
                             {addr?.postalCode && <div className="text-xs text-gray-500">کد پستی: {addr.postalCode}</div>}
                          </div>
                        </div>

                        {/* Column 2: Order Management */}
                        <div className="space-y-3 bg-white p-3 rounded-lg border">
                          <h4 className="text-xs font-bold text-gray-500 uppercase">مدیریت وضعیت</h4>
                          <div className="space-y-3">
                             <div>
                                <select
                                  value={o.status}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStatusChange(o.id, e.target.value)}
                                  className="w-full border rounded px-2 py-1.5 text-sm bg-white focus:ring-1 focus:ring-[#83b735]"
                                >
                                  <option value="processing">در حال پردازش</option>
                                  <option value="shipped">ارسال شده</option>
                                  <option value="delivered">تحویل داده شده</option>
                                  <option value="cancelled">لغو شده</option>
                                </select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] text-gray-400">کد رهگیری / تاریخ تحویل</label>
                                <input
                                    defaultValue={o.trackingNumber || ''}
                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleSave(o.id, { trackingNumber: e.target.value.trim() || undefined })}
                                    className="w-full border rounded px-2 py-1.5 text-sm dir-ltr text-right"
                                    placeholder="کد رهگیری..."
                                />
                                <input
                                  type="date"
                                  defaultValue={estDate}
                                  onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                                    handleSave(o.id, { estimatedDelivery: e.target.value ? new Date(e.target.value) : undefined })
                                  }
                                  className="w-full border rounded px-2 py-1.5 text-sm"
                                />
                             </div>
                          </div>
                        </div>

                        {/* Column 3: Items List */}
                        <div className="lg:col-span-2 space-y-3 bg-white p-3 rounded-lg border flex flex-col">
                           <h4 className="text-xs font-bold text-gray-500 uppercase">اقلام سفارش ({itemsCount})</h4>
                           <div className="flex-1 overflow-y-auto max-h-[200px] pr-1 custom-scrollbar space-y-2">
                              {o.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 py-1 border-b last:border-0 border-gray-100">
                                   <div className="w-8 h-8 rounded border bg-gray-50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                      {item.image ? (
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                      ) : (
                                        <span className="text-[10px] text-gray-400">{item.name.charAt(0)}</span>
                                      )}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <div className="text-sm text-gray-800 truncate">{item.name}</div>
                                      <div className="text-[10px] text-gray-500">
                                        {item.color && <span className="ml-1">Color: {item.color}</span>}
                                        {item.size && <span>Size: {item.size}</span>}
                                      </div>
                                   </div>
                                   <div className="text-xs font-medium text-gray-600 whitespace-nowrap">
                                      {item.quantity} × {formatPriceToman(item.price)}
                                    </div>
                                </div>
                              ))}
                           </div>
                           <div className="pt-2 border-t flex justify-between items-center text-sm font-bold text-gray-700">
                              <span>جمع کل:</span>
                              <span>{formatPriceToman(o.total)}</span>
                           </div>
                        </div>

                        {/* Column 4: Actions Row */}
                        <div className="col-span-full flex flex-wrap gap-3 pt-2">
                            <button
                              onClick={() => handlePrintInvoice(o)}
                              className="border border-gray-300 text-gray-600 rounded px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              فاکتور
                            </button>
                            <button
                              onClick={() => handlePrintLabel(o)}
                              className="border border-gray-300 text-gray-600 rounded px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              لیبل پستی
                            </button>
                            <button
                              onClick={() => handleDelete(o.id)}
                              className="border border-red-200 text-red-600 rounded px-3 py-1.5 text-sm hover:bg-red-50 flex items-center gap-2 transition-colors mr-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              حذف
                            </button>
                        </div>

                        {/* Return Requests Section (if any) */}
                        {o.returns && o.returns.length > 0 && (
                          <div className="col-span-full mt-4 bg-red-50 border border-red-100 rounded-lg p-3">
                            <h4 className="text-sm font-bold text-red-700 mb-2">درخواست‌های مرجوعی</h4>
                            <div className="space-y-2">
                              {o.returns.map(ret => (
                                <div key={ret.id} className="bg-white p-2 rounded border border-red-100 flex items-center justify-between text-sm">
                                  <div>
                                    <div className="font-bold text-gray-800">{ret.reason}</div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(ret.requestedAt).toLocaleDateString('fa-IR')}
                                        {ret.note && ` - یادداشت: ${ret.note}`}
                                    </div>
                                    {/* Items parsing if needed */}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs ${
                                      ret.status === 'approved' ? 'bg-green-100 text-green-700' :
                                      ret.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                      ret.status === 'refunded' ? 'bg-blue-100 text-blue-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {ret.status === 'approved' ? 'تایید شده' :
                                       ret.status === 'rejected' ? 'رد شده' :
                                       ret.status === 'refunded' ? 'عودت وجه' : 'در انتظار بررسی'}
                                    </span>
                                    
                                    {ret.status === 'requested' && (
                                      <>
                                        <button onClick={() => approveReturn(o.id, ret.id)} className="text-xs text-green-600 hover:underline">تایید</button>
                                        <button onClick={() => rejectReturn(o.id, ret.id)} className="text-xs text-red-600 hover:underline">رد</button>
                                      </>
                                    )}
                                    {ret.status === 'approved' && (
                                      <button onClick={() => markRefunded(o.id, ret.id)} className="text-xs text-blue-600 hover:underline">ثبت عودت وجه</button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tracking Modal */}
        {isTrackingModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
              <h3 className="text-lg font-bold mb-4 text-gray-800">ثبت کد رهگیری</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">کد رهگیری پستی</label>
                  <input
                    autoFocus
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-left dir-ltr"
                    placeholder="مثلا: 2098374..."
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={cancelShipment} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">انصراف</button>
                  <button onClick={confirmShipment} className="px-4 py-2 text-sm bg-[#83b735] text-white hover:bg-[#72a02d] rounded-lg">ثبت و ارسال پیامک</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
