
import { addLog } from './logs';

export type AdminPermission = 
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'categories'
  | 'brands'
  | 'customers'
  | 'reviews'
  | 'tickets'
  | 'mega-menu'
  | 'media'
  | 'banners'
  | 'shipping'
  | 'coupons'
  | 'blog'
  | 'settings'
  | 'system'
  | 'admins'; // New permission for managing admins

export const PERMISSIONS: { id: AdminPermission; label: string }[] = [
  { id: 'dashboard', label: 'داشبورد' },
  { id: 'orders', label: 'سفارش‌ها' },
  { id: 'products', label: 'محصولات' },
  { id: 'categories', label: 'دسته‌بندی‌ها' },
  { id: 'brands', label: 'برندها' },
  { id: 'customers', label: 'مشتریان' },
  { id: 'reviews', label: 'دیدگاه‌ها' },
  { id: 'tickets', label: 'تیکت‌ها' },
  { id: 'mega-menu', label: 'مگا منو' },
  { id: 'media', label: 'رسانه' },
  { id: 'banners', label: 'بنرها' },
  { id: 'shipping', label: 'روش‌های ارسال' },
  { id: 'coupons', label: 'کدهای تخفیف' },
  { id: 'blog', label: 'مدیریت خبرنامه' },
  { id: 'settings', label: 'تنظیمات سایت' },
  { id: 'system', label: 'سیستم و لاگ' },
  { id: 'admins', label: 'مدیران و دسترسی‌ها' },
];

export type AdminUser = {
  id: string;
  name: string;
  username: string;
  password?: string; // In a real app, this should be hashed. Here we just store it or ignore it for mock.
  role: 'super_admin' | 'admin' | 'editor';
  permissions: AdminPermission[];
  isActive: boolean;
  lastLogin?: number;
};

const STORAGE_KEY = 'admin_users';

export const SEED_ADMINS: AdminUser[] = [
  {
    id: '1',
    name: 'مدیر کل',
    username: 'admin',
    role: 'super_admin',
    permissions: PERMISSIONS.map(p => p.id), // All permissions
    isActive: true,
  }
];

export function getAdmins(): AdminUser[] {
  if (typeof window === 'undefined') return SEED_ADMINS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ADMINS));
    return SEED_ADMINS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return SEED_ADMINS;
  }
}

export function saveAdmins(list: AdminUser[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addAdmin(admin: Omit<AdminUser, 'id'>) {
  const list = getAdmins();
  if (list.some(a => a.username === admin.username)) {
    throw new Error('نام کاربری تکراری است.');
  }
  
  const newAdmin: AdminUser = {
    id: Math.random().toString(36).substring(2, 9),
    ...admin,
  };
  
  list.push(newAdmin);
  saveAdmins(list);
  addLog('افزودن مدیر', `مدیر جدید "${newAdmin.name}" (${newAdmin.username}) اضافه شد.`, 'success');
  return newAdmin;
}

export function updateAdmin(id: string, patch: Partial<AdminUser>) {
  const list = getAdmins();
  const idx = list.findIndex(a => a.id === id);
  if (idx === -1) return;
  
  // Prevent changing super_admin role if it's the only one or restricted (logic can be expanded)
  if (list[idx].role === 'super_admin' && patch.role && patch.role !== 'super_admin') {
     // Maybe prevent demoting the main super admin? 
     // For now, let's just allow it but log it.
  }

  const updated = { ...list[idx], ...patch };
  list[idx] = updated;
  saveAdmins(list);
  addLog('ویرایش مدیر', `اطلاعات مدیر "${updated.name}" ویرایش شد.`, 'info');
  return updated;
}

export function deleteAdmin(id: string) {
  const list = getAdmins();
  const admin = list.find(a => a.id === id);
  
  if (admin?.role === 'super_admin') {
    throw new Error('امکان حذف مدیر کل وجود ندارد.');
  }
  
  const newList = list.filter(a => a.id !== id);
  saveAdmins(newList);
  if (admin) {
    addLog('حذف مدیر', `مدیر "${admin.name}" حذف شد.`, 'warning');
  }
}
