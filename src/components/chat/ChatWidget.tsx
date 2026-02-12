'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Minimize2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { 
  getChatSessionAction, 
  sendChatMessageAction, 
  startNewSessionAction,
  ChatSession 
} from '@/actions/chat';

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const [sessionId, setSessionId] = useState<string>('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [inputText, setInputText] = useState('');
  
  // Pre-chat form state
  const [formData, setFormData] = useState({ name: '', phone: '', subject: '' });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to load session data
  const loadSession = React.useCallback(async () => {
    if (!sessionId) return;
    const s = await getChatSessionAction(sessionId);
    setSession(s);
  }, [sessionId]);

  useEffect(() => {
    // Initialize session ID on mount (stored locally to keep continuity per visitor)
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('current_chat_session_id');
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('current_chat_session_id', id);
      }
      setTimeout(() => {
        setSessionId(id);
      }, 0);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      loadSession();
    }, 0);
    const es = new EventSource('/api/chat/stream');
    es.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'chat:update' && data.sessionId === sessionId) {
          await loadSession();
        }
      } catch {}
    };
    return () => {
      es.close();
    };
  }, [sessionId, loadSession]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.messages, isOpen]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.subject) return;
    if (!sessionId) return;
    
    const newSession = await startNewSessionAction(sessionId, formData.name, formData.phone, formData.subject);
    setSession(newSession);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !sessionId) return;
    await sendChatMessageAction(sessionId, inputText, 'user');
    setInputText('');
    loadSession();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't show chat widget on admin pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/popup-chat')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 md:w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="bg-[#83b735] p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <span className="font-bold">پشتیبانی آنلاین</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded transition-colors"
            >
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Content Area */}
          {!session?.customerName ? (
            // Pre-Chat Form
            <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
              <div className="text-center mb-6">
                <h3 className="font-bold text-gray-800 mb-2">خوش آمدید!</h3>
                <p className="text-xs text-gray-500">لطفا برای شروع گفتگو اطلاعات زیر را تکمیل کنید.</p>
              </div>
              
              <form onSubmit={handleStartChat} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">نام و نام خانوادگی</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#83b735]"
                    placeholder="مثال: علی محمدی"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">شماره تماس</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#83b735]"
                    placeholder="مثال: 09123456789"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">موضوع درخواست</label>
                  <input 
                    type="text" 
                    required
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#83b735]"
                    placeholder="مثال: پیگیری سفارش"
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-[#83b735] text-white py-2 rounded-lg hover:bg-[#72a02e] transition-colors text-sm font-medium mt-2"
                >
                  شروع گفتگو
                </button>
              </form>
            </div>
          ) : (
            // Messages Area
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {session.messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-10 text-sm">
                    <p>گفتگو شروع شد</p>
                    <p className="mt-2 text-xs font-medium text-gray-800">موضوع: {session.customerSubject}</p>
                  </div>
                ) : (
                  session.messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                          msg.sender === 'user' 
                            ? 'bg-[#83b735] text-white rounded-bl-none' 
                            : 'bg-white border border-gray-200 text-gray-800 rounded-br-none shadow-sm'
                        }`}
                      >
                        {msg.text}
                        <div className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-white/80' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="پیام خود را بنویسید..."
                    className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#83b735] transition-colors"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="bg-[#83b735] text-white p-2 rounded-full hover:bg-[#72a02e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#83b735] hover:bg-[#72a02e] text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 group"
        >
          <MessageCircle size={28} className="group-hover:animate-pulse" />
          {/* Notification Badge could go here */}
        </button>
      )}
    </div>
  );
}
