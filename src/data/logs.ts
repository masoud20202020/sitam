
export type LogEntry = {
  id: string;
  action: string;
  details?: string;
  user?: string;
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'success';
};

const LOGS_KEY = 'system_logs';

export function addLog(action: string, details?: string, type: LogEntry['type'] = 'info', user: string = 'مدیر سیستم') {
  if (typeof window === 'undefined') return;
  
  const newLog: LogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    action,
    details,
    user,
    timestamp: Date.now(),
    type
  };

  const logs = getLogs();
  // Keep only last 1000 logs
  const updatedLogs = [newLog, ...logs].slice(0, 1000);
  localStorage.setItem(LOGS_KEY, JSON.stringify(updatedLogs));
}

export function getLogs(): LogEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOGS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearLogs() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOGS_KEY);
}
