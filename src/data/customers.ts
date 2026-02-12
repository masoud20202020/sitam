export type Customer = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  createdAt: number;
};

const STORAGE_KEY = 'crm_customers';

function read(): Customer[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const list: Customer[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: Customer[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getCustomers(): Customer[] {
  const list = read();
  // Deduplicate by ID to prevent key errors
  const unique = Array.from(new Map(list.map(item => [item.id, item])).values());
  return unique.sort((a, b) => b.createdAt - a.createdAt);
}

export function addCustomer(input: Omit<Customer, 'id' | 'createdAt'>) {
  const list = read();
  const item: Customer = { id: Date.now(), createdAt: Date.now(), ...input };
  write([item, ...list]);
  return item;
}

export function updateCustomer(id: number, patch: Partial<Customer>) {
  const list = read();
  const idx = list.findIndex(c => c.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  write(list);
  return list[idx];
}

export function deleteCustomer(id: number) {
  const list = read().filter(c => c.id !== id);
  write(list);
}

import { getOrders, AccountCartItem } from '@/data/account';
import { getProducts, ProductItem } from '@/data/products';

export function getCustomerMetrics(c: Customer) {
  const orders = getOrders().filter(o => o.userId === c.id);
  const totalOrders = orders.length;
  const totalSpend = orders.reduce((acc, o) => acc + (o.total ?? 0), 0);
  const toMs = (val: number | string | Date): number => {
    if (typeof val === 'number') return val;
    if (val instanceof Date) return val.getTime();
    const parsed = new Date(val).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const lastOrder = orders.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))[0];
  const lastOrderDate = lastOrder
    ? toMs(lastOrder.createdAt)
    : undefined;
  return { totalOrders, totalSpend, lastOrderDate };
}

export function getCustomerWishlist(c: Customer): ProductItem[] {
  // Mock logic: generate deterministic wishlist based on user ID
  const allProducts = getProducts();
  const seed = c.id % 3; // 0, 1, or 2
  if (seed === 0) return [allProducts[1], allProducts[3]].filter(Boolean);
  if (seed === 1) return [allProducts[2]].filter(Boolean);
  return [];
}

export function getCustomerCart(c: Customer): AccountCartItem[] {
  // Mock logic: generate deterministic cart based on user ID
  const seed = c.id % 4;
  if (seed === 0) return [
    { id: 5, name: 'تی‌شرت نخی', price: 350000, quantity: 1, image: '/placeholder.svg', color: 'سفید', size: 'M' }
  ];
  if (seed === 2) return [
    { id: 2, name: 'کفش ورزشی نایک', price: 3500000, quantity: 1, image: '/placeholder.svg', color: 'قرمز', size: '42' },
    { id: 7, name: 'عینک آفتابی', price: 700000, quantity: 1, image: '/placeholder.svg' }
  ];
  return [];
}

export type Segment = 'loyal' | 'new' | 'inactive' | 'none';

export function getCustomerSegment(c: Customer): Segment {
  const { totalOrders, totalSpend, lastOrderDate } = getCustomerMetrics(c);
  const now = Date.now();
  const daysSinceLast = lastOrderDate !== undefined
    ? Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24))
    : Infinity;
  if (totalOrders >= 3 || totalSpend >= 5000000) return 'loyal';
  if (totalOrders === 1 && daysSinceLast <= 30) return 'new';
  if (daysSinceLast >= 90) return 'inactive';
  return 'none';
}

export function buildCustomersFromOrders(): Customer[] {
  const list = getCustomers();
  const orders = getOrders();
  const knownIds = new Set(list.map(c => c.id));
  
  // Deduplicate order user IDs
  const allOrderUserIds = orders
    .map(o => o.userId)
    .filter((uid): uid is number => typeof uid === 'number');
  const uniqueOrderUserIds = Array.from(new Set(allOrderUserIds));

  const fromOrders = uniqueOrderUserIds
    .filter(uid => !knownIds.has(uid))
    .map(uid => ({ id: uid, name: `کاربر ${uid}`, createdAt: Date.now() } as Customer));

  if (fromOrders.length > 0) {
    // Write back the clean list (getCustomers already deduplicated 'list')
    write([...fromOrders, ...list]);
  }
  return getCustomers();
}
