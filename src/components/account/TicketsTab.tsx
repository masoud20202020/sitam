import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getUserTicketsAction, createTicketAction, addMessageToTicketAction, getTicketByIdAction } from '@/actions/tickets';
import { Plus, MessageSquare, ArrowLeft, Send, Paperclip, X, FileText } from 'lucide-react';

interface TicketsTabProps {
  user: { id: string };
}

type ViewMode = 'list' | 'create' | 'details';

export function TicketsTab({ user }: TicketsTabProps) {
  const [view, setView] = useState<ViewMode>('list');
  type TicketMessage = { id: string; sender: 'user' | 'admin'; content: string; createdAt: string | Date; isInternal?: boolean; attachment?: string | null };
  type Ticket = { id: string; subject: string; status: string; priority?: string; category?: string | null; createdAt: string | Date; updatedAt: string | Date; messages: TicketMessage[] };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [/* isLoading */] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Create Form State
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<string>('medium');
  const [newTicketTopic, setNewTicketTopic] = useState<string>('other');
  
  // Reply State
  const [replyMessage, setReplyMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Attachment State
  const [createAttachments, setCreateAttachments] = useState<string[]>([]);
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadKeyCreate, setUploadKeyCreate] = useState(0);
  const [uploadKeyReply, setUploadKeyReply] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean) => {
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
          if (isReply) {
            setReplyAttachments(prev => [...prev, data.url]);
          } else {
            setCreateAttachments(prev => [...prev, data.url]);
          }
        } else {
          alert('خطا در آپلود فایل: ' + data.message);
        }
      } catch (err) {
        console.error(err);
        alert('خطا در آپلود فایل');
      }
    }
    setIsUploading(false);
    if (isReply) {
      setUploadKeyReply(k => k + 1);
    } else {
      setUploadKeyCreate(k => k + 1);
    }
  };

  const removeAttachment = (url: string, isReply: boolean) => {
    if (isReply) {
      setReplyAttachments(prev => prev.filter(a => a !== url));
    } else {
      setCreateAttachments(prev => prev.filter(a => a !== url));
    }
  };

  const loadTickets = useCallback(async () => {
    // setIsLoading(true);
    const result = await getUserTicketsAction(user.id);
    if (result.success && result.data) {
      type ApiTicketMessage = { id: string; createdAt: Date | string; content: string; ticketId: string; sender: string; attachment: string | null; isInternal: boolean };
      type ApiTicket = { id: string; subject: string; status: string; priority?: string; category?: string | null; createdAt: Date | string; updatedAt: Date | string; messages: ApiTicketMessage[] };
      const mapped = (result.data as ApiTicket[]).map((t) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        category: t.category,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
          messages: (t.messages || []).filter(Boolean).map((m) => ({
          id: m.id,
            sender: m.sender === 'admin' ? ('admin' as const) : ('user' as const),
          content: m.content,
          createdAt: m.createdAt,
          isInternal: m.isInternal,
          attachment: m.attachment,
        })),
      }));
      setTickets(mapped);
    }
    // setIsLoading(false);
  }, [user.id]);

  useEffect(() => {
    if (user?.id) {
      setTimeout(() => {
        loadTickets();
      }, 0);
    }
  }, [user?.id, loadTickets]);

  useEffect(() => {
    if (view === 'details' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages, view]);

  

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;

    const result = await createTicketAction({
      userId: user.id,
      subject: newTicketSubject,
      message: newTicketMessage,
      priority: newTicketPriority,
      category: newTicketTopic
      // Note: attachments are not yet supported in createTicketAction
    });

    if (result.success) {
      setNewTicketSubject('');
      setNewTicketMessage('');
      setNewTicketPriority('medium');
      setNewTicketTopic('other');
      setCreateAttachments([]);
      loadTickets();
      setView('list');
    } else {
      alert('خطا در ثبت تیکت: ' + result.error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    const result = await addMessageToTicketAction(selectedTicket.id, {
      sender: 'user',
      content: replyMessage
    });

    if (result.success) {
      // Refresh selected ticket
      const updated = await getTicketByIdAction(selectedTicket.id);
      if (updated.success && updated.data) {
        const upd = updated.data as {
          id: string;
          subject: string;
          status: string;
          priority?: string;
          category?: string | null;
          createdAt: Date | string;
          updatedAt: Date | string;
          messages: Array<{ id: string; createdAt: Date | string; content: string; ticketId: string; sender: string; attachment: string | null; isInternal: boolean }>;
        };
        const mapped: Ticket = {
          id: upd.id,
          subject: upd.subject,
          status: upd.status,
          priority: upd.priority,
          category: upd.category,
          createdAt: upd.createdAt,
          updatedAt: upd.updatedAt,
          messages: (upd.messages || []).map((m) => ({
            id: m.id,
            sender: m.sender === 'admin' ? ('admin' as const) : ('user' as const),
            content: m.content,
            createdAt: m.createdAt,
            isInternal: m.isInternal,
            attachment: m.attachment,
          })),
        };
        setSelectedTicket(mapped);
      }
      setReplyMessage('');
      setReplyAttachments([]);
      loadTickets();
    } else {
      alert('خطا در ثبت پاسخ: ' + result.error);
    }
  };

  const openTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setView('details');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'resolved': return 'bg-blue-100 text-blue-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'باز';
      case 'pending': return 'در انتظار پاسخ';
      case 'resolved': return 'پاسخ داده شده';
      case 'closed': return 'بسته شده';
      default: return status;
    }
  };

  // Removed unused getPriorityLabel

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

  // --- Views ---

  const renderList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">تیکت‌های پشتیبانی</h2>
        <button 
          onClick={() => setView('create')}
          className="bg-[#83b735] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#6da025] transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          ثبت تیکت جدید
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">هنوز هیچ تیکتی ثبت نکرده‌اید.</p>
          <button 
            onClick={() => setView('create')}
            className="text-[#83b735] font-medium hover:underline"
          >
            اولین تیکت خود را ثبت کنید
          </button>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-600 text-sm">
                <tr>
                  <th className="p-4 font-semibold">شماره تیکت</th>
                  <th className="p-4 font-semibold">موضوع</th>
                  <th className="p-4 font-semibold">وضعیت</th>
                  <th className="p-4 font-semibold">تاریخ بروزرسانی</th>
                  <th className="p-4 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-500 font-mono text-sm">#{ticket.id.toString().slice(-6)}</td>
                    <td className="p-4 font-medium text-gray-800">{ticket.subject}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(ticket.updatedAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => openTicket(ticket)}
                        className="text-[#83b735] hover:bg-[#83b735]/10 px-3 py-1 rounded-md transition-colors text-sm font-medium"
                      >
                        مشاهده
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderCreate = () => (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => setView('list')}
        className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 ml-1" />
        بازگشت به لیست
      </button>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">ثبت تیکت جدید</h2>
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">موضوع</label>
            <input
              type="text"
              required
              value={newTicketSubject}
              onChange={(e) => setNewTicketSubject(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#83b735] focus:border-transparent outline-none"
              placeholder="مثلا: مشکل در پرداخت سفارش..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
              <select
                value={newTicketTopic}
                onChange={(e) => setNewTicketTopic(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#83b735] focus:border-transparent outline-none bg-white"
              >
                <option value="other">سایر</option>
                <option value="pre-sale">سوالات قبل از خرید</option>
                <option value="tracking">پیگیری ارسال</option>
                <option value="return">مرجوعی</option>
                <option value="technical">فنی</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اولویت</label>
              <select
                value={newTicketPriority}
                onChange={(e) => setNewTicketPriority(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#83b735] focus:border-transparent outline-none bg-white"
              >
                <option value="low">کم</option>
                <option value="medium">متوسط</option>
                <option value="high">زیاد</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">پیام شما</label>
            <textarea
              required
              rows={6}
              value={newTicketMessage}
              onChange={(e) => setNewTicketMessage(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#83b735] focus:border-transparent outline-none resize-none"
              placeholder="توضیحات کامل مشکل خود را بنویسید..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">پیوست فایل</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {createAttachments.map((url, index) => (
                <div key={index} className="relative group bg-gray-50 border rounded-lg p-2 pr-8 flex items-center gap-2">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                    <FileText className="w-4 h-4" />
                    <span>فایل ضمیمه {index + 1}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => removeAttachment(url, false)}
                    className="absolute top-1/2 -translate-y-1/2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className={`cursor-pointer inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#83b735] transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Paperclip className="w-4 h-4" />
                <span>افزودن فایل</span>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e, false)}
                  className="hidden"
                  disabled={isUploading}
                  key={uploadKeyCreate}
                />
              </label>
              {isUploading && <span className="text-xs text-gray-400">در حال آپلود...</span>}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="bg-[#83b735] text-white px-6 py-2.5 rounded-lg hover:bg-[#6da025] transition-colors font-medium flex items-center gap-2 shadow-md"
            >
              <Send className="w-4 h-4 -rotate-90" />
              ارسال تیکت
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderDetails = () => {
    if (!selectedTicket) return null;

    return (
      <div className="h-[600px] flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gray-50 border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView('list')}
              className="p-2 hover:bg-white rounded-full transition-colors text-gray-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                {selectedTicket.subject}
                <span className="text-xs font-normal text-gray-500 font-mono">#{selectedTicket.id.toString().slice(-6)}</span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusLabel(selectedTicket.status)}
                </span>
                <span>•</span>
                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">
                  {getTopicLabel(selectedTicket.category)}
                </span>
                <span>•</span>
                <span>{new Date(selectedTicket.createdAt).toLocaleDateString('fa-IR')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
          {selectedTicket.messages?.filter(msg => !msg.isInternal).map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id} 
                className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    isUser 
                      ? 'bg-white border border-gray-100 rounded-tr-none' 
                      : 'bg-[#83b735]/10 border border-[#83b735]/20 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <span className={`text-xs font-bold ${isUser ? 'text-gray-700' : 'text-[#83b735]'}`}>
                      {isUser ? 'شما' : 'پشتیبانی'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                  {msg.attachment && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50 flex flex-wrap gap-2">
                      <a 
                        href={msg.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs bg-white/50 px-2 py-1 rounded border border-gray-200 hover:bg-white hover:text-blue-600 transition-colors"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>پیوست</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Input */}
        <div className="p-4 border-t bg-white">
          {selectedTicket.status === 'closed' ? (
            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              این تیکت بسته شده است و امکان ارسال پاسخ وجود ندارد.
            </div>
          ) : (
            <div className="space-y-3">
              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {replyAttachments.map((url, index) => (
                    <div key={index} className="relative group bg-gray-50 border rounded-lg p-1 pr-6 flex items-center gap-2">
                      <span className="text-xs text-blue-600 truncate max-w-[100px]">فایل {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(url, true)}
                        className="absolute top-1/2 -translate-y-1/2 right-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleReply} className="flex gap-2">
                <label className={`flex items-center justify-center w-10 h-10 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors ${isUploading ? 'opacity-50' : ''}`}>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                    disabled={isUploading}
                  key={uploadKeyReply}
                  />
                  <Paperclip className="w-5 h-5 text-gray-500" />
                </label>
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#83b735] focus:border-transparent outline-none"
                />
                <button 
                  type="submit"
                  disabled={!replyMessage.trim()}
                  className="bg-[#83b735] text-white px-4 py-2 rounded-lg hover:bg-[#6da025] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[50px]"
                >
                  <Send className="w-5 h-5 -rotate-90" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in duration-300">
      {view === 'list' && renderList()}
      {view === 'create' && renderCreate()}
      {view === 'details' && renderDetails()}
    </div>
  );
}
