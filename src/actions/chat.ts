'use server';

import { emitChatUpdate } from '@/lib/chatEvents';

export type ChatMessage = {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: number;
  read: boolean;
};

export type ChatSession = {
  id: string;
  userName: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerSubject?: string | null;
  lastMessageTimestamp: number;
  unreadCount: number;
  messages: ChatMessage[];
};

export async function getChatSessionsAction(): Promise<ChatSession[]> {
  return [];
}

export async function getChatSessionAction(id: string): Promise<ChatSession | null> {
  void id;
  return null;
}

export async function startNewSessionAction(id: string, name: string, phone: string, subject: string): Promise<ChatSession> {
  const now = Date.now();
  emitChatUpdate(id);
  return {
    id,
    userName: name,
    customerName: name,
    customerPhone: phone,
    customerSubject: subject,
    lastMessageTimestamp: now,
    unreadCount: 0,
    messages: [],
  };
}

export async function sendChatMessageAction(sessionId: string, text: string, sender: 'user' | 'admin'): Promise<void> {
  void text;
  void sender;
  emitChatUpdate(sessionId);
}

export async function markSessionAsReadAction(sessionId: string): Promise<void> {
  emitChatUpdate(sessionId);
}

export async function deleteChatSessionAction(sessionId: string): Promise<void> {
  emitChatUpdate(sessionId);
}
