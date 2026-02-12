import { sendAdminTicketNotification } from '@/lib/adminNotificationService';
import { getAdminNotificationSettings } from '@/data/adminNotificationSettings';
import { getSMSSettings } from '@/data/smsSettings';

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketTopic = 'pre-sale' | 'tracking' | 'return' | 'technical' | 'other';

export type TicketMessage = {
  id: string;
  sender: 'user' | 'admin';
  content: string;
  createdAt: number;
  isAdmin?: boolean;
  attachments?: string[];
  isInternal?: boolean;
};

export type Ticket = {
  id: number;
  userId?: number; // Link to registered user
  customerId?: number; // Legacy/Admin created
  name: string;
  email?: string;
  phone?: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  topic?: TicketTopic;
  createdAt: number;
  updatedAt: number;
  messages: TicketMessage[];
  // Legacy field support (optional, for backward compatibility during runtime)
  message?: string;
};

const STORAGE_KEY = 'crm_tickets';

const seedTickets: Ticket[] = [
  {
    id: 1001,
    name: 'علی محمدی',
    phone: '09121111111',
    subject: 'مشکل در پرداخت آنلاین',
    status: 'open',
    priority: 'high',
    createdAt: Date.now() - 3600000, // 1 hour ago
    updatedAt: Date.now() - 3600000,
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        content: 'سلام، من سعی کردم سفارش رو پرداخت کنم ولی ارور داد. مبلغ از حسابم کم شده ولی سفارش ثبت نشده.',
        createdAt: Date.now() - 3600000,
        isAdmin: false
      }
    ]
  },
  {
    id: 1002,
    name: 'سارا احمدی',
    phone: '09122222222',
    subject: 'سوال درباره زمان ارسال',
    status: 'pending',
    priority: 'medium',
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 43200000, // 12 hours ago
    messages: [
      {
        id: 'msg-2',
        sender: 'user',
        content: 'سلام، سفارش من کی ارسال میشه؟ عجله دارم.',
        createdAt: Date.now() - 86400000,
        isAdmin: false
      },
      {
        id: 'msg-3',
        sender: 'admin',
        content: 'سلام خانم احمدی، سفارش شما فردا صبح تحویل پست داده میشه.',
        createdAt: Date.now() - 43200000,
        isAdmin: true
      }
    ]
  }
];

function read(): Ticket[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTickets));
    return seedTickets;
  }
  try {
    const list: Ticket[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    
    // If empty list, repopulate seeds (for dev convenience)
    if (list.length === 0 && seedTickets.length > 0) {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTickets));
       return seedTickets;
    }
    
    // Migration: Ensure messages array exists
    return list.map(t => {
      if (!t.messages || t.messages.length === 0) {
        if (t.message) {
          return {
            ...t,
            messages: [{
              id: 'initial-' + t.id,
              sender: 'user',
              content: t.message,
              createdAt: t.createdAt,
              isAdmin: false
            }]
          };
        } else {
            return { ...t, messages: [] };
        }
      }
      return t;
    });
  } catch {
    return [];
  }
}

function write(list: Ticket[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getTickets(): Ticket[] {
  return read().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getUserTickets(userId: number): Ticket[] {
  return getTickets().filter(t => t.userId === userId);
}

export function getTicketById(id: number): Ticket | undefined {
  return getTickets().find(t => t.id === id);
}

export function addTicket(input: {
  userId?: number;
  customerId?: number;
  name: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string; // Initial message
  priority?: TicketPriority;
  status?: TicketStatus;
  topic?: TicketTopic;
  attachments?: string[];
}) {
  const list = read();
  const now = Date.now();
  const ticketId = now;
  
  const item: Ticket = {
    id: ticketId,
    userId: input.userId,
    customerId: input.customerId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    subject: input.subject,
    status: input.status ?? 'open',
    priority: input.priority ?? 'medium',
    topic: input.topic ?? 'other',
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: crypto.randomUUID(),
        sender: input.userId ? 'user' : 'admin',
        content: input.message,
        createdAt: now,
        isAdmin: !input.userId,
        attachments: input.attachments
      }
    ]
  };
  
  write([item, ...list]);

  // Send Admin Notification (Async, Fire-and-forget)
  // Only send if it's a user created ticket (userId is present) or explicitly requested
  if (item.userId) {
    try {
      const adminSettings = getAdminNotificationSettings();
      const smsSettings = getSMSSettings();
      sendAdminTicketNotification(item, adminSettings, smsSettings).catch(err => console.error('Failed to send admin notification:', err));
    } catch (err) {
      console.error('Failed to prepare admin notification settings:', err);
    }
  }

  return item;
}

export function addMessageToTicket(ticketId: number, message: { sender: 'user' | 'admin', content: string, attachments?: string[], isInternal?: boolean }) {
  const list = read();
  const idx = list.findIndex(t => t.id === ticketId);
  if (idx === -1) return null;
  
  const newMessage: TicketMessage = {
    id: crypto.randomUUID(),
    sender: message.sender,
    content: message.content,
    createdAt: Date.now(),
    isAdmin: message.sender === 'admin',
    attachments: message.attachments,
    isInternal: message.isInternal
  };
  
  list[idx].messages.push(newMessage);
  list[idx].updatedAt = Date.now();
  
  // Auto update status on reply
  if (message.sender === 'admin') {
    list[idx].status = 'resolved'; // Or 'pending' depending on logic, let's say 'resolved' or 'answered'
  } else {
    list[idx].status = 'open'; // User replied, so it's open for admin
  }
  
  write(list);
  return list[idx];
}

export function updateTicket(id: number, patch: Partial<Ticket>) {
  const list = read();
  const idx = list.findIndex(t => t.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch, updatedAt: Date.now() };
  write(list);
  return list[idx];
}

export function deleteTicket(id: number) {
  const list = read().filter(t => t.id !== id);
  write(list);
}
