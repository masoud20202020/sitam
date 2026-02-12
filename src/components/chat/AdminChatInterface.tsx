'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Trash2, ExternalLink, Phone, FileText } from 'lucide-react';
import { 
  getChatSessionsAction, 
  sendChatMessageAction, 
  markSessionAsReadAction, 
  deleteChatSessionAction,
  ChatSession 
} from '@/actions/chat';

interface AdminChatInterfaceProps {
  isPopup?: boolean;
}

export default function AdminChatInterface({ isPopup = false }: AdminChatInterfaceProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSessions = async () => {
    const list = await getChatSessionsAction();
    setSessions(list);
    return list;
  };

  useEffect(() => {
    setTimeout(() => {
      loadSessions();
    }, 0);
    const es = new EventSource('/api/chat/stream');
    es.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'chat:update') {
          const list = await loadSessions();
          if (selectedSessionId && !list.find(s => s.id === selectedSessionId)) {
            setSelectedSessionId(null);
          }
        }
      } catch {}
    };
    return () => {
      es.close();
    };
  }, [selectedSessionId]);

  useEffect(() => {
    if (selectedSessionId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      
      const session = sessions.find(s => s.id === selectedSessionId);
      if (session && session.unreadCount > 0) {
        markSessionAsReadAction(selectedSessionId);
      }
    }
  }, [sessions, selectedSessionId]); // Re-run when sessions update (new message)

  const handleSend = () => {
    if (!inputText.trim() || !selectedSessionId) return;
    sendChatMessageAction(selectedSessionId, inputText, 'admin');
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('آیا از حذف این گفتگو مطمئن هستید؟')) {
      deleteChatSessionAction(id);
      if (selectedSessionId === id) setSelectedSessionId(null);
    }
  };

  const openPopup = () => {
    window.open('/popup-chat', 'AdminChat', 'width=900,height=700,menubar=no,toolbar=no,location=no,status=no');
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <div className={`flex bg-white border rounded-lg overflow-hidden ${isPopup ? 'h-screen border-0 rounded-none' : 'h-[600px] shadow-sm'}`}>
      {/* Sidebar - Session List */}
      <div className="w-80 border-l bg-gray-50 flex flex-col">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h2 className="font-bold text-gray-700">گفتگوها</h2>
          {!isPopup && (
            <button 
              onClick={openPopup}
              title="باز کردن در پنجره جدید"
              className="text-gray-500 hover:text-[#83b735] transition-colors"
            >
              <ExternalLink size={18} />
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="text-center p-8 text-gray-400 text-sm">
              هیچ گفتگویی وجود ندارد
            </div>
          ) : (
            sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => setSelectedSessionId(session.id)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors relative ${
                  selectedSessionId === session.id ? 'bg-white border-r-4 border-r-[#83b735]' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm text-gray-800">{session.userName}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(session.lastMessageTimestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500 truncate max-w-[180px]">
                    {session.messages[session.messages.length - 1]?.text || '...'}
                  </p>
                  {session.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {session.unreadCount}
                    </span>
                  )}
                </div>
                <button 
                  onClick={(e) => handleDelete(e, session.id)}
                  className="absolute bottom-2 left-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{selectedSession.userName}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    {selectedSession.customerPhone && (
                      <span className="flex items-center gap-1" title="شماره تماس">
                        <Phone size={12} />
                        {selectedSession.customerPhone}
                      </span>
                    )}
                    <span className="opacity-50">#{selectedSession.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>

              {selectedSession.customerSubject && (
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 max-w-[200px] truncate" title={selectedSession.customerSubject}>
                  <FileText size={12} />
                  {selectedSession.customerSubject}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f0f2f5]">
              {selectedSession.messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[70%] px-4 py-2 rounded-lg text-sm shadow-sm ${
                      msg.sender === 'admin' 
                        ? 'bg-[#83b735] text-white rounded-bl-none' 
                        : 'bg-white text-gray-800 rounded-br-none border'
                    }`}
                  >
                    {msg.text}
                    <div className={`text-[10px] mt-1 text-right ${msg.sender === 'admin' ? 'text-white/80' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 border rounded-full px-4 py-3 text-sm focus:outline-none focus:border-[#83b735] focus:ring-1 focus:ring-[#83b735] transition-colors"
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="bg-[#83b735] text-white p-3 rounded-full hover:bg-[#72a02e] disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User size={40} className="opacity-20" />
            </div>
            <p>یک گفتگو را برای شروع انتخاب کنید</p>
          </div>
        )}
      </div>
    </div>
  );
}
