
import { addLog } from './logs';

const BACKUP_KEYS = [
  'products_v3',
  'categories',
  'brands_v1',
  'crm_customers',
  'account_orders',
  'site_settings',
  'shipping_methods',
  'sitam_coupons',
  'stock_reservations',
  'system_logs',
  'admin_notifications',
  'media_library_v1'
];

export function createBackup(): string {
  if (typeof window === 'undefined') return '';
  
  const backupData: Record<string, unknown> = {};
  
  BACKUP_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        backupData[key] = JSON.parse(value);
      } catch {
        backupData[key] = value;
      }
    }
  });
  
  const backupString = JSON.stringify({
    timestamp: Date.now(),
    version: '1.0',
    data: backupData
  }, null, 2);
  
  addLog('ایجاد نسخه پشتیبان', 'نسخه پشتیبان با موفقیت ایجاد شد.', 'success');
  return backupString;
}

export function restoreBackup(jsonString: string): { success: boolean; message: string } {
  if (typeof window === 'undefined') return { success: false, message: 'محیط اجرا نامعتبر است.' };
  
  try {
    const backup = JSON.parse(jsonString);
    
    if (!backup.data || typeof backup.data !== 'object') {
      throw new Error('فرمت فایل پشتیبان نامعتبر است.');
    }
    
    Object.keys(backup.data).forEach(key => {
      if (BACKUP_KEYS.includes(key)) {
        const value = backup.data[key];
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
    });
    
    addLog('بازیابی نسخه پشتیبان', 'نسخه پشتیبان با موفقیت بازیابی شد.', 'success');
    return { success: true, message: 'اطلاعات با موفقیت بازیابی شد. لطفاً صفحه را رفرش کنید.' };
  } catch (err) {
    console.error(err);
    addLog('خطا در بازیابی', 'بازیابی نسخه پشتیبان با خطا مواجه شد.', 'error');
    return { success: false, message: 'خطا در خواندن فایل پشتیبان. لطفاً از سالم بودن فایل اطمینان حاصل کنید.' };
  }
}

export function downloadBackup() {
  const data = createBackup();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
