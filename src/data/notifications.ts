export type NotificationItem = {
  id: number;
  type: 'review_new' | 'review_status' | 'general';
  message: string;
  createdAt: number;
  read?: boolean;
  meta?: Record<string, unknown>;
};

const STORAGE_KEY = 'notifications';

function read(): NotificationItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const list: NotificationItem[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list: NotificationItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getNotifications(): NotificationItem[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function addNotification(type: NotificationItem['type'], message: string, meta?: Record<string, unknown>) {
  const list = read();
  const item: NotificationItem = {
    id: Date.now(),
    type,
    message,
    createdAt: Date.now(),
    read: false,
    meta,
  };
  write([item, ...list]);
  return item;
}

export function markNotificationRead(id: number) {
  const list = read();
  const idx = list.findIndex(n => n.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], read: true };
  write(list);
  return list[idx];
}

export function clearNotifications() {
  write([]);
}
