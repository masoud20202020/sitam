'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getTicketByIdAction, addMessageToTicketAction, updateTicketStatusAction } from '@/actions/tickets';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Send, User, Mail, Phone, Calendar, Clock, Paperclip, X, EyeOff, Tag } from 'lucide-react';
import Link from 'next/link';
import type { TicketMessage } from '@/data/tickets';

const getTopicLabel = (t?: string | null) => {
  switch (t) {
    case 'pre-sale': return 'سوالات قبل از خرید';
    case 'tracking': return 'پیگیری ارسال';
    case 'return': return 'مرجوعی';
    case 'technical': return 'فنی';
    case 'other': return 'سایر';
    default: return 'نامشخص';
  }
};

export default function AdminTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  type ServerMessage = {
    id: string;
    sender: 'user' | 'admin';
    content: string;
    createdAt: string | number | Date;
    isInternal?: boolean;
    attachment?: string | null;
  };
  type UiTicket = {
    id: string;
    subject: string;
    status: string;
    createdAt: string | number | Date;
    category?: string | null;
    priority?: string;
    user?: { name?: string | null; email?: string | null; phone?: string | null } | null;
    name?: string;
    email?: string | null;
    phone?: string | null;
    messages: TicketMessage[];
  };
  const [ticket, setTicket] = useState<UiTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Attachment State
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const res = await fetch('/api/upload-ticket', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        
        if (data.success) {
          setAttachments(prev => [...prev, data.url]);
        } else {
          alert('خطا در آپلود فایل: ' + data.message);
        }
      } catch (err) {
        console.error(err);
        alert('خطا در آپلود فایل');
      }
    }
    setIsUploading(false);
    setUploadKey(k => k + 1);
  };

  const removeAttachment = (url: string) => {
    setAttachments(prev => prev.filter(a => a !== url));
  };

  const loadTicket = useCallback(async () => {
    setIsLoading(true);
    const result = await getTicketByIdAction(params.id as string);
    if (result.success && result.data) {
      const t = result.data as unknown as {
        id: string;
        subject: string;
        status: string;
        createdAt: string | number | Date;
        category?: string | null;
        priority?: string;
        user?: { name?: string | null; email?: string | null; phone?: string | null } | null;
        name?: string;
        email?: string | null;
        phone?: string | null;
        messages?: ServerMessage[];
      };
      const transformed: UiTicket = {
        id: t.id,
        subject: t.subject,
        status: t.status,
        createdAt: t.createdAt,
        category: t.category ?? null,
        priority: t.priority,
        user: t.user ?? null,
        name: t.name,
        email: t.email ?? null,
        phone: t.phone ?? null,
        messages: (t.messages || []).map((m) => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          createdAt: typeof m.createdAt === 'string' || typeof m.createdAt === 'number' ? Number(m.createdAt) : (m.createdAt as Date).getTime(),
          isInternal: m.isInternal,
          attachments: m.attachment ? [m.attachment] : [],
        })),
      };
      setTicket(transformed);
    } else {
      router.push('/admin/tickets');
    }
    setIsLoading(false);
  }, [params.id, router]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.messages]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (params.id) {
      timer = setTimeout(() => {
        loadTicket();
      }, 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [params.id, loadTicket]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !replyMessage.trim()) return;

    const result = await addMessageToTicketAction(ticket.id, {
      sender: 'admin',
      content: replyMessage,
      isInternal: isInternal,
      attachments: attachments
    });

    if (result.success) {
      setReplyMessage('');
      setAttachments([]);
      setIsInternal(false);
      loadTicket();
    } else {
      alert('خطا در ثبت پاسخ: ' + result.error);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!ticket) return;
    const result = await updateTicketStatusAction(ticket.id, status);
    if (result.success) {
      loadTicket();
    } else {
      alert('خطا در بروزرسانی وضعیت: ' + result.error);
    }
  };

  if (isLoading) return <div className="p-8 text-center">در حال بارگذاری...</div>;
  if (!ticket) return null;

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/admin/tickets" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {ticket.subject}
              <span className="text-sm font-normal text-gray-500 font-mono">#{ticket.id.slice(-6)}</span>
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {ticket.user?.name || 'ناشناس'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(ticket.createdAt).toLocaleDateString('fa-IR')}
              </span>
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 text-gray-600">
                <Tag className="w-3 h-3" />
                {getTopicLabel(ticket.category)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#83b735] ${
              ticket.status === 'open' ? 'bg-green-50 text-green-700 border-green-200' :
              ticket.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              ticket.status === 'resolved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            <option value="open">باز</option>
            <option value="pending">در انتظار</option>
            <option value="resolved">پاسخ داده شده</option>
            <option value="closed">بسته شده</option>
          </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50/50">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {ticket.messages?.map((msg: TicketMessage) => {
              const isAdmin = msg.sender === 'admin';
              const isInternalNote = msg.isInternal;
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`rounded-2xl p-4 shadow-sm ${
                        isAdmin 
                          ? isInternalNote 
                            ? 'bg-amber-100 border border-amber-200 text-amber-900 rounded-tl-none'
                            : 'bg-[#83b735] text-white rounded-tl-none' 
                          : 'bg-white border border-gray-100 rounded-tr-none'
                      }`}
                    >
                      {isInternalNote && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-2 pb-2 border-b border-amber-200/50">
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>یادداشت داخلی (مخفی از مشتری)</span>
                        </div>
                      )}
                      <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isAdmin && !isInternalNote ? 'text-white' : 'text-gray-800'}`}>
                        {msg.content}
                      </p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className={`mt-3 pt-3 border-t flex flex-wrap gap-2 ${isAdmin && !isInternalNote ? 'border-white/20' : isInternalNote ? 'border-amber-200/50' : 'border-gray-200/50'}`}>
                          {msg.attachments.map((url: string, idx: number) => (
                            <a 
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
                                isAdmin && !isInternalNote
                                  ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' 
                                  : isInternalNote
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                    : 'bg-white/50 text-gray-700 border-gray-200 hover:bg-white hover:text-blue-600'
                              }`}
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>پیوست {idx + 1}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {isAdmin ? 'شما' : ticket.name} • {new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((url, index) => (
                  <div key={index} className="relative group bg-gray-50 border rounded-lg p-1 pr-6 flex items-center gap-2">
                    <span className="text-xs text-blue-600 truncate max-w-[100px]">فایل {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(url)}
                      className="absolute top-1/2 -translate-y-1/2 right-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#83b735] focus:ring-[#83b735]"
                />
                <span className={isInternal ? "text-amber-600 font-bold" : ""}>ارسال به عنوان یادداشت داخلی (مخفی از مشتری)</span>
              </label>
            </div>

            <form onSubmit={handleReply} className={`flex gap-3 p-1 rounded-xl transition-colors ${isInternal ? 'bg-amber-50 border border-amber-200' : ''}`}>
              <label className={`flex items-center justify-center w-12 h-12 rounded-xl border hover:bg-gray-50 cursor-pointer transition-colors ${isUploading ? 'opacity-50' : ''} ${isInternal ? 'bg-white border-amber-200' : ''}`}>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                  key={uploadKey}
                />
                <Paperclip className={`w-5 h-5 ${isInternal ? 'text-amber-500' : 'text-gray-500'}`} />
              </label>
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={isInternal ? "یادداشت داخلی خود را بنویسید..." : "پاسخ خود را بنویسید..."}
                className={`flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 bg-gray-50 focus:bg-white transition-colors ${
                  isInternal 
                    ? 'border-amber-200 focus:ring-amber-500 focus:border-amber-500 placeholder-amber-400 text-amber-900' 
                    : 'focus:ring-[#83b735]'
                }`}
              />
              <button 
                type="submit"
                disabled={!replyMessage.trim()}
                className={`text-white px-6 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm ${
                  isInternal 
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                    : 'bg-[#83b735] hover:bg-[#6da025] shadow-[#83b735]/20'
                }`}
              >
                {isInternal ? <EyeOff className="w-4 h-4" /> : <Send className="w-4 h-4 -rotate-90" />}
                {isInternal ? 'ثبت یادداشت' : 'ارسال'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-80 bg-white border-r p-6 hidden lg:block overflow-y-auto">
          <h3 className="font-bold text-gray-800 mb-6">اطلاعات کاربر</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">نام کاربر</div>
                <div className="font-medium text-gray-800">{ticket.name}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">ایمیل</div>
                <div className="font-medium text-gray-800 break-all">{ticket.email || '-'}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">شماره تماس</div>
                <div className="font-medium text-gray-800 font-mono" dir="ltr">{ticket.phone || '-'}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">تاریخ ایجاد</div>
                <div className="font-medium text-gray-800">
                  {new Date(ticket.createdAt).toLocaleDateString('fa-IR')}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(ticket.createdAt).toLocaleTimeString('fa-IR')}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="font-bold text-gray-800 mb-4">یادداشت‌های سیستم</h3>
            <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
              اولویت تیکت: 
              <span className="font-bold mr-1 text-yellow-700">
                {ticket.priority === 'high' ? 'زیاد' : ticket.priority === 'medium' ? 'متوسط' : 'کم'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
