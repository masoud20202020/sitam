
'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { SiteSettings } from '@/data/settings';
import { sanitizeMapEmbedCode } from '@/utils/sanitizer';

interface ContactClientProps {
  settings: SiteSettings;
}

export default function ContactClient({ settings }: ContactClientProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('پیام شما با موفقیت ارسال شد! کارشناسان ما به زودی با شما تماس خواهند گرفت.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const { contact } = settings;

  return (
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">تماس با ما</h1>
          <p className="text-gray-600">
            سوالی دارید؟ خوشحال می‌شویم صدای شما را بشنویم.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">اطلاعات تماس</h2>
              
              <div className="flex items-start gap-4">
                <div className="bg-[#db2777]/10 p-3 rounded-full text-[#db2777]">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">آدرس فروشگاه</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {contact?.address || settings.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-[#db2777]/10 p-3 rounded-full text-[#db2777]">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">تلفن تماس</h3>
                  {contact?.phones && contact.phones.length > 0 ? (
                    contact.phones.map((phone, index) => (
                      <p key={index} className="text-gray-600 dir-ltr text-right">{phone}</p>
                    ))
                  ) : (
                    <p className="text-gray-600 dir-ltr text-right">{settings.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-[#db2777]/10 p-3 rounded-full text-[#db2777]">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">ایمیل پشتیبانی</h3>
                  {contact?.emails && contact.emails.length > 0 ? (
                     contact.emails.map((email, index) => (
                       <p key={index} className="text-gray-600 dir-ltr text-right">{email}</p>
                     ))
                  ) : (
                    <p className="text-gray-600 dir-ltr text-right">{settings.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-[#db2777]/10 p-3 rounded-full text-[#db2777]">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">ساعات کاری</h3>
                  <p className="text-gray-600">
                    {contact?.workingHours && contact.workingHours.length > 0
                      ? contact.workingHours.map(h => `${h.label}: ${h.value}`).join('، ')
                      : settings.supportHours}
                  </p>
                </div>
              </div>
            </div>

            {/* Google Map */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border h-[300px] overflow-hidden relative">
              {contact?.mapEmbedCode ? (
                <div 
                  className="w-full h-full rounded-xl overflow-hidden"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeMapEmbedCode(contact.mapEmbedCode) 
                  }} 
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>نقشه یافت نشد</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Form & FAQ */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border">
              <h2 className="text-xl font-bold text-gray-900 mb-6">ارسال پیام</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-transparent transition-all outline-none"
                      placeholder="مثال: علی محمدی"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-transparent transition-all outline-none"
                      placeholder="example@mail.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">موضوع پیام</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-transparent transition-all outline-none"
                    placeholder="موضوع پیام خود را بنویسید"
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">متن پیام</label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#db2777] focus:border-transparent transition-all outline-none resize-none"
                    placeholder="پیام خود را اینجا بنویسید..."
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#db2777] text-white py-3 rounded-lg hover:bg-[#be185d] transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Send className="w-5 h-5" />
                  ارسال پیام
                </button>
              </form>
            </div>

            {/* FAQ Section */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border">
               <h2 className="text-xl font-bold text-gray-900 mb-6">سوالات متداول</h2>
               <div className="space-y-4">
                  {[
                    { q: 'چطور می‌توانم سفارش خود را پیگیری کنم؟', a: 'برای پیگیری سفارش، به بخش حساب کاربری و سپس سفارش‌های من مراجعه کنید. در آنجا می‌توانید وضعیت لحظه‌ای سفارش خود را مشاهده کنید.' },
                    { q: 'هزینه ارسال چگونه محاسبه می‌شود؟', a: 'هزینه ارسال بر اساس وزن و ابعاد سفارش و همچنین شهر مقصد محاسبه می‌شود. در هنگام تسویه حساب، مبلغ دقیق نمایش داده خواهد شد.' },
                    { q: 'آیا امکان مرجوعی کالا وجود دارد؟', a: 'بله، تا ۷ روز پس از دریافت کالا، در صورت وجود نقص فنی یا مغایرت با توضیحات، می‌توانید درخواست مرجوعی دهید.' },
                    { q: 'روش‌های پرداخت چیست؟', a: 'شما می‌توانید از طریق درگاه‌های بانکی معتبر با کلیه کارت‌های عضو شتاب پرداخت خود را انجام دهید.' },
                    { q: 'ساعات پاسخگویی پشتیبانی چه زمانی است؟', a: `تیم پشتیبانی ما در روزهای شنبه تا چهارشنبه از ساعت ${settings.supportHours} پاسخگوی شما هستند.` }
                  ].map((item, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <button 
                        onClick={() => toggleFaq(index)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-right"
                      >
                        <span className="font-medium text-gray-800 text-sm">{item.q}</span>
                        {openFaqIndex === index ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </button>
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                      >
                         <div className="p-4 text-sm text-gray-600 bg-white border-t leading-relaxed">
                           {item.a}
                         </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

          </div>
        </div>
      </main>
  );
}
