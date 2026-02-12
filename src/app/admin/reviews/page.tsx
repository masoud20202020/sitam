'use client';

import React, { useState } from 'react';
import { ReviewItem, getReviewsAction, updateReviewStatusAction, deleteReviewAction, replyToReviewAction } from '@/actions/reviews';
import { Pencil, Trash2, CheckCircle, XCircle, MessageSquare, X } from 'lucide-react';
import { addNotification } from '@/data/notifications';

type StatusFilter = 'all' | ReviewItem['status'];

export default function AdminReviewsPage() {
  const [comments, setComments] = useState<ReviewItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selectedComment, setSelectedComment] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState('');

  React.useEffect(() => {
    (async () => {
      const res = await getReviewsAction();
      if (res.success && res.data) {
        setComments(res.data);
      }
      setMounted(true);
    })();
  }, []);

  const openCommentModal = (c: ReviewItem) => {
    setSelectedComment(c);
    setReplyText(c.reply || '');
  };

  const saveReply = () => {
    if (!selectedComment) return;
    (async () => {
      const res = await replyToReviewAction(selectedComment.id, replyText);
      if (res.success && res.data) {
        addNotification('review_status', 'پاسخ شما ثبت شد', {
          id: res.data.id,
          productId: res.data.productId,
          author: res.data.author,
          status: res.data.status,
        });
        const list = await getReviewsAction();
        if (list.success && list.data) setComments(list.data);
        setSelectedComment(null);
      }
    })();
  };

  const filtered = (() => {
    let list = comments.slice();
    if (status !== 'all') list = list.filter(c => c.status === status);
    if (query.trim()) {
      const q = query.trim();
      list = list.filter(c => {
        return String(c.productId).includes(q) || (c.productName ?? '').includes(q) || c.author.includes(q);
      });
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  })();

  const setStatusOf = (id: string, s: ReviewItem['status']) => {
    (async () => {
      const res = await updateReviewStatusAction(id, s);
      if (res.success && res.data) {
        addNotification('review_status', s === 'approved' ? 'نظر تایید شد' : s === 'rejected' ? 'نظر رد شد' : 'نظر به حالت انتظار برگشت', {
          id: res.data.id,
          productId: res.data.productId,
          author: res.data.author,
          status: res.data.status,
        });
      }
      const list = await getReviewsAction();
      if (list.success && list.data) setComments(list.data);
    })();
  };

  const remove = (id: string) => {
    (async () => {
      await deleteReviewAction(id);
      const list = await getReviewsAction();
      if (list.success && list.data) setComments(list.data);
    })();
  };

  if (!mounted) {
    return null; // Or a loading spinner
  }

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت نظرات کاربران</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl border p-6 lg:col-span-3">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input
              className="flex-1 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
              placeholder="جستجو (نام محصول، شناسه محصول یا نام کاربر)"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <select
              className="border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#83b735]"
              value={status}
              onChange={e => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="pending">در انتظار تایید</option>
              <option value="approved">تایید شده</option>
              <option value="rejected">رد شده</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-right p-3">محصول</th>
                  <th className="text-right p-3">کاربر</th>
                  <th className="text-right p-3">امتیاز</th>
                  <th className="text-right p-3">متن نظر</th>
                  <th className="text-right p-3">وضعیت</th>
                  <th className="text-right p-3">تاریخ</th>
                  <th className="text-right p-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  return (
                    <tr key={c.id} className="border-t">
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{c.productName ?? `#${c.productId}`}</div>
                        <div className="text-xs text-gray-500">شناسه: {String(c.productId)}</div>
                      </td>
                      <td className="p-3">{c.author}</td>
                      <td className="p-3">{c.rating}</td>
                      <td 
                        className="p-3 max-w-md cursor-pointer hover:bg-gray-50 group transition-colors"
                        onClick={() => openCommentModal(c)}
                        title="برای مشاهده جزئیات و پاسخ کلیک کنید"
                      >
                        <div className="line-clamp-2">{c.content}</div>
                        {c.reply && (
                          <div className="text-xs text-[#83b735] mt-1 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>پاسخ داده شده</span>
                          </div>
                        )}
                        <div className="text-xs text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          مشاهده و پاسخ
                        </div>
                      </td>
                      <td className="p-3">
                        {c.status === 'approved' && <span className="text-green-700">تایید شده</span>}
                        {c.status === 'pending' && <span className="text-yellow-700">در انتظار تایید</span>}
                        {c.status === 'rejected' && <span className="text-red-700">رد شده</span>}
                      </td>
                      <td className="p-3 text-gray-500">{new Date(c.createdAt).toLocaleString('fa-IR')}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            className="p-2 border rounded-md hover:bg-green-50 text-green-700"
                            onClick={() => setStatusOf(c.id, 'approved')}
                            title="تایید"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 border rounded-md hover:bg-yellow-50 text-yellow-700"
                            onClick={() => setStatusOf(c.id, 'pending')}
                            title="در انتظار"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 border rounded-md hover:bg-red-50 text-red-600"
                            onClick={() => setStatusOf(c.id, 'rejected')}
                            title="رد"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 border rounded-md hover:bg-red-50 text-red-600"
                            onClick={() => remove(c.id)}
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={7}>
                      نظری یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedComment && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" 
          onClick={() => setSelectedComment(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#83b735]" />
                جزئیات نظر و پاسخ
              </h3>
              <button onClick={() => setSelectedComment(null)} className="text-gray-500 hover:text-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
               {/* Details Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm bg-gray-50 p-4 rounded-xl border">
                  <div>
                    <span className="text-gray-500 block mb-1">نام کاربر:</span>
                    <span className="font-medium text-gray-900">{selectedComment.author}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">تاریخ ثبت:</span>
                    <span className="font-medium text-gray-900">{new Date(selectedComment.createdAt).toLocaleString('fa-IR')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">محصول مرتبط:</span>
                    <span className="font-medium text-gray-900">{selectedComment.productName || 'ناشناس'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">امتیاز کاربر:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-gray-900">{selectedComment.rating}</span>
                      <span className="text-xs text-gray-400">از 5</span>
                      <div className="flex text-yellow-400 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < selectedComment.rating ? 'fill-current' : 'text-gray-300'}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">وضعیت فعلی:</span>
                    <span className={`font-medium ${
                      selectedComment.status === 'approved' ? 'text-green-600' : 
                      selectedComment.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {selectedComment.status === 'approved' ? 'تایید شده' : 
                       selectedComment.status === 'rejected' ? 'رد شده' : 'در انتظار تایید'}
                    </span>
                  </div>
               </div>
               
               {/* Full Content */}
               <div>
                 <span className="text-gray-700 font-medium block mb-2">متن کامل نظر:</span>
                 <div className="bg-white border p-4 rounded-lg text-gray-800 leading-relaxed whitespace-pre-wrap shadow-sm">
                   {selectedComment.content}
                 </div>
               </div>

               {/* Reply Section */}
               <div className="border-t pt-6">
                 <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#83b735]"></div>
                   پاسخ ادمین
                 </label>
                 <textarea
                   className="w-full border rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-[#83b735] focus:outline-none transition-shadow"
                   placeholder="پاسخ خود را اینجا بنویسید..."
                   value={replyText}
                   onChange={e => setReplyText(e.target.value)}
                 />
                 <div className="text-xs text-gray-500 mt-2">
                   * این پاسخ در صفحه محصول برای کاربر نمایش داده خواهد شد.
                 </div>
               </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0 rounded-b-xl">
               <button 
                 onClick={() => setSelectedComment(null)}
                 className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white hover:border-gray-400 transition-colors"
               >
                 انصراف
               </button>
               <button 
                 onClick={saveReply}
                 className="px-6 py-2 bg-[#83b735] text-white rounded-lg hover:bg-[#75a62e] shadow-md hover:shadow-lg transition-all"
               >
                 ثبت پاسخ
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
