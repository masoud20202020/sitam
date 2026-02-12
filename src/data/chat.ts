import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: number;
  read: boolean;
}

export interface ChatSession {
  id: string;
  userName: string; // "Visitor <ID>" or real name if available
  customerName?: string;
  customerPhone?: string;
  customerSubject?: string;
  messages: ChatMessage[];
  lastMessageTimestamp: number;
  unreadCount: number; // For admin
}

const CHAT_STORAGE_KEY = 'site_chat_sessions';
export const CHAT_UPDATED_EVENT = 'site_chat_updated';

export function getChatSessions(): Record<string, ChatSession> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Failed to parse chat sessions', e);
    return {};
  }
}

export function saveChatSessions(sessions: Record<string, ChatSession>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
  window.dispatchEvent(new Event(CHAT_UPDATED_EVENT));
}

// For the customer side
export function getOrCreateCurrentSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('current_chat_session_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('current_chat_session_id', id);
  }
  return id;
}

export function getSession(sessionId: string): ChatSession | null {
  const sessions = getChatSessions();
  return sessions[sessionId] || null;
}

export function startNewSession(sessionId: string, name: string, phone: string, subject: string): ChatSession {
  const sessions = getChatSessions();
  let session = sessions[sessionId];

  if (!session) {
    session = {
      id: sessionId,
      userName: name,
      customerName: name,
      customerPhone: phone,
      customerSubject: subject,
      messages: [],
      lastMessageTimestamp: Date.now(),
      unreadCount: 0,
    };
  } else {
    // Update existing session details
    session.customerName = name;
    session.customerPhone = phone;
    session.customerSubject = subject;
    session.userName = name;
  }

  sessions[sessionId] = session;
  saveChatSessions(sessions);
  return session;
}

export function sendMessage(sessionId: string, text: string, sender: 'user' | 'admin') {
  const sessions = getChatSessions();
  let session = sessions[sessionId];

  if (!session) {
    // Only create session if it doesn't exist (usually initiated by user, but admin needs safety)
    if (sender === 'admin') {
      console.error('Cannot send message to non-existent session');
      return;
    }
    session = {
      id: sessionId,
      userName: `بازدیدکننده ${sessionId.slice(0, 4)}`,
      messages: [],
      lastMessageTimestamp: Date.now(),
      unreadCount: 0,
    };
  }

  const newMessage: ChatMessage = {
    id: uuidv4(),
    sender,
    text,
    timestamp: Date.now(),
    read: false, // You might want logic here: if sender is user, admin unread++, etc.
  };

  session.messages.push(newMessage);
  session.lastMessageTimestamp = newMessage.timestamp;

  if (sender === 'user') {
    session.unreadCount = (session.unreadCount || 0) + 1;
  }

  sessions[sessionId] = session;
  saveChatSessions(sessions);
}

export function markSessionAsRead(sessionId: string) {
  const sessions = getChatSessions();
  if (sessions[sessionId] && sessions[sessionId].unreadCount > 0) {
    sessions[sessionId].unreadCount = 0;
    saveChatSessions(sessions);
  }
}

export function deleteSession(sessionId: string) {
    const sessions = getChatSessions();
    if (sessions[sessionId]) {
        delete sessions[sessionId];
        saveChatSessions(sessions);
    }
}
