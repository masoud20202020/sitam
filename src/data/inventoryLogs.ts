import { v4 as uuidv4 } from 'uuid';

export type InventoryChangeType = 'manual_update' | 'order' | 'return' | 'initial';

export type InventoryLog = {
  id: string;
  productId: string | number;
  productName: string;
  adminName: string;
  changeType: InventoryChangeType;
  oldStock: number;
  newStock: number;
  createdAt: number;
};

const LOGS_STORAGE_KEY = 'inventory_logs';

export function getInventoryLogs(): InventoryLog[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOGS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addInventoryLog(log: Omit<InventoryLog, 'id' | 'createdAt'>) {
  if (typeof window === 'undefined') return;
  const logs = getInventoryLogs();
  const newLog: InventoryLog = {
    ...log,
    id: uuidv4(),
    createdAt: Date.now(),
  };
  logs.unshift(newLog); // Add to beginning
  // Limit logs to last 1000 entries to prevent localStorage overflow
  if (logs.length > 1000) {
    logs.length = 1000;
  }
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
}

export function clearInventoryLogs() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOGS_STORAGE_KEY);
}
