
'use client';

import React, { useState } from 'react';
import { SiteSettings, AboutFeature, defaultSettings, FAQItem } from '@/data/settings';
import { SMSSettings, defaultSMSSettings } from '@/data/smsSettings';
import { AdminNotificationSettings, defaultAdminNotificationSettings, AdminTelegramSettings, AdminWhatsAppSettings, AdminSMSSettings } from '@/data/adminNotificationSettings';
import { PaymentGateway } from '@/data/paymentGateways';
import { sendTestSMS } from '@/utils/smsService';
import { Settings, MessageSquare, Info, Plus, Trash2, Bell, CreditCard, Send, Search, Phone, Shield } from 'lucide-react';
import { updateSiteSettings, updateSMSSettings, updateAdminNotificationSettings, updatePaymentGateways } from '@/app/actions/settings';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

interface SettingsClientProps {
  initialSettings: SiteSettings;
  initialSmsSettings: SMSSettings;
  initialAdminNotifSettings: AdminNotificationSettings;
  initialPaymentGateways: PaymentGateway[];
}

export default function SettingsClient({
  initialSettings,
  initialSmsSettings,
  initialAdminNotifSettings,
  initialPaymentGateways
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'seo' | 'sms' | 'about' | 'admin-notif' | 'payment' | 'contact' | 'privacy'>('general');
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [smsSettings, setSmsSettings] = useState<SMSSettings>(initialSmsSettings);
  const [adminNotifSettings, setAdminNotifSettings] = useState<AdminNotificationSettings>(initialAdminNotifSettings);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>(initialPaymentGateways);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (patch: Partial<SiteSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaved(false);
  };

  const handleSmsChange = (patch: Partial<SMSSettings>) => {
    const next = { ...smsSettings, ...patch };
    setSmsSettings(next);
    setSaved(false);
  };

  const handleAdminNotifChange = (section: keyof AdminNotificationSettings, patch: Partial<AdminTelegramSettings | AdminWhatsAppSettings | AdminSMSSettings>) => {
    const next = {
      ...adminNotifSettings,
      [section]: { ...adminNotifSettings[section], ...patch }
    };
    setAdminNotifSettings(next);
    setSaved(false);
  };

  const handleTemplateChange = (key: keyof SMSSettings['templates'], value: string) => {
    const next = { 
      ...smsSettings, 
      templates: { ...smsSettings.templates, [key]: value } 
    };
    setSmsSettings(next);
    setSaved(false);
  };

  const handleAboutChange = (patch: Partial<SiteSettings['about']>) => {
    const nextAbout = { ...settings.about, ...patch };
    handleChange({ about: nextAbout });
  };

  const handleFeatureChange = (index: number, patch: Partial<AboutFeature>) => {
    const newFeatures = [...settings.about.features];
    newFeatures[index] = { ...newFeatures[index], ...patch };
    handleAboutChange({ features: newFeatures });
  };

  const handleAddFeature = () => {
    const newFeatures = [...settings.about.features, { title: '', description: '' }];
    handleAboutChange({ features: newFeatures });
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = settings.about.features.filter((_, i) => i !== index);
    handleAboutChange({ features: newFeatures });
  };

  const handleContactChange = (patch: Partial<SiteSettings['contact']>) => {
    const nextContact = { ...settings.contact, ...patch };
    handleChange({ contact: nextContact });
  };

  const handlePrivacyChange = (patch: Partial<SiteSettings['privacy']>) => {
    const nextPrivacy = { ...settings.privacy, ...patch };
    handleChange({ privacy: nextPrivacy });
  };

  const handleAddPhone = () => {
    const newPhones = [...(settings.contact?.phones || []), ''];
    handleContactChange({ phones: newPhones });
  };

  const handlePhoneChange = (index: number, value: string) => {
    const newPhones = [...(settings.contact?.phones || [])];
    newPhones[index] = value;
    handleContactChange({ phones: newPhones });
  };

  const handleRemovePhone = (index: number) => {
    const newPhones = (settings.contact?.phones || []).filter((_, i) => i !== index);
    handleContactChange({ phones: newPhones });
  };

  const handleAddEmail = () => {
    const newEmails = [...(settings.contact?.emails || []), ''];
    handleContactChange({ emails: newEmails });
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...(settings.contact?.emails || [])];
    newEmails[index] = value;
    handleContactChange({ emails: newEmails });
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = (settings.contact?.emails || []).filter((_, i) => i !== index);
    handleContactChange({ emails: newEmails });
  };

  const handleAddWorkingHour = () => {
    const newHours = [...(settings.contact?.workingHours || []), { label: '', value: '' }];
    handleContactChange({ workingHours: newHours });
  };

  const handleWorkingHourChange = (index: number, patch: Partial<{ label: string; value: string }>) => {
    const newHours = [...(settings.contact?.workingHours || [])];
    newHours[index] = { ...newHours[index], ...patch };
    handleContactChange({ workingHours: newHours });
  };

  const handleRemoveWorkingHour = (index: number) => {
    const newHours = (settings.contact?.workingHours || []).filter((_, i) => i !== index);
    handleContactChange({ workingHours: newHours });
  };

  const handleAddFaq = () => {
    const newFaqs = [...(settings.contact?.faqs || []), { question: '', answer: '' }];
    handleContactChange({ faqs: newFaqs });
  };

  const handleFaqChange = (index: number, patch: Partial<FAQItem>) => {
    const newFaqs = [...(settings.contact?.faqs || [])];
    newFaqs[index] = { ...newFaqs[index], ...patch };
    handleContactChange({ faqs: newFaqs });
  };

  const handleRemoveFaq = (index: number) => {
    const newFaqs = (settings.contact?.faqs || []).filter((_, i) => i !== index);
    handleContactChange({ faqs: newFaqs });
  };

  const handlePaymentGatewayChange = (id: string, patch: Partial<PaymentGateway> | { config: Partial<PaymentGateway['config']> }) => {
    const newGateways = paymentGateways.map(g => {
      if (g.id !== id) return g;
      if ('config' in patch) {
        return { ...g, config: { ...g.config, ...patch.config } };
      }
      return { ...g, ...patch };
    });
    setPaymentGateways(newGateways);
    setSaved(false);
  };

  const handleAddGateway = () => {
    // Note: addPaymentGateway helper currently uses localStorage internally in the original file,
    // but here we just want the logic to create a new object.
    // We should probably refactor addPaymentGateway to just return the object, 
    // but for now let's manually create it or use the helper if it doesn't side-effect too much.
    // Looking at the helper: it calls savePaymentGateways. We should avoid that side effect.
    // So I'll implement the logic here directly or use a modified helper.
    // For now, let's copy the logic.
    const newGateway: PaymentGateway = {
      id: uuidv4(),
      name: 'درگاه جدید',
      slug: `custom-${Date.now()}`,
      description: 'توضیحات درگاه',
      isActive: true,
      isSystem: false,
      config: {}
    };
    setPaymentGateways([...paymentGateways, newGateway]);
    setSaved(false);
  };

  const handleDeleteGateway = (id: string) => {
    if (confirm('آیا از حذف این درگاه اطمینان دارید؟')) {
      const newGateways = paymentGateways.filter(g => g.id !== id || g.isSystem);
      setPaymentGateways(newGateways);
      setSaved(false);
    }
  };

  const handleTestSMS = async () => {
    if (!smsSettings.enabled) {
      alert('لطفا ابتدا سیستم پیامک را فعال کنید.');
      return;
    }
    if (!smsSettings.senderNumber) {
      alert('لطفا شماره فرستنده را وارد کنید.');
      return;
    }
    
    try {
      const recipient = prompt('شماره موبایل گیرنده برای تست:', '09123456789');
      if (!recipient) return;

      await sendTestSMS(recipient, smsSettings);
      alert(`پیامک تست با موفقیت به ${recipient} ارسال شد.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`خطا در ارسال پیامک: ${msg}`);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (['general', 'seo', 'about', 'contact', 'privacy'].includes(activeTab)) {
        await updateSiteSettings(settings);
      } else if (activeTab === 'sms') {
        await updateSMSSettings(smsSettings);
      } else if (activeTab === 'admin-notif') {
        await updateAdminNotificationSettings(adminNotifSettings);
      } else if (activeTab === 'payment') {
        await updatePaymentGateways(paymentGateways);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
      alert('خطا در ذخیره تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('آیا از بازنشانی تنظیمات این بخش به حالت پیش‌فرض اطمینان دارید؟')) return;
    
    setLoading(true);
    try {
      if (['general', 'seo', 'about', 'contact', 'privacy'].includes(activeTab)) {
        setSettings(defaultSettings);
        await updateSiteSettings(defaultSettings);
      } else if (activeTab === 'sms') {
        setSmsSettings(defaultSMSSettings);
        await updateSMSSettings(defaultSMSSettings);
      } else if (activeTab === 'admin-notif') {
        setAdminNotifSettings(defaultAdminNotificationSettings);
        await updateAdminNotificationSettings(defaultAdminNotificationSettings);
      }
      // Payment gateways usually don't have a "reset" to default that is destructive, 
      // but if we wanted to, we could reset to defaultGateways.
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
      alert('خطا در بازنشانی تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">تنظیمات سایت</h1>
      </div>

      <div className="flex border-b mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'general'
              ? 'border-[#83b735] text-[#83b735] font-bold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          عمومی
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'seo'
              ? 'border-[#83b735] text-[#83b735] font-bold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Search className="w-4 h-4" />
          سئو (SEO)
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'sms'
              ? 'border-[#83b735] text-[#83b735] font-bold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          پیامک مشتری
        </button>
        <button
          onClick={() => setActiveTab('admin-notif')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'admin-notif'
              ? 'border-[#83b735] text-[#83b735] font-bold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          اعلان‌های ادمین
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'payment'
              ? 'border-[#83b735] text-[#83b735] font-bold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          درگاه پرداخت
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'about'
              ? 'border-[#83b735] text-[#83b735] font-bold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Info className="w-4 h-4" />
          درباره ما
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'contact'
              ? 'border-[#83b735] text-[#83b735] font-bold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Phone className="w-4 h-4" />
          تماس با ما
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'border-[#83b735] text-[#83b735] font-bold'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          حریم خصوصی
        </button>
      </div>

      {activeTab === 'privacy' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            در این بخش می‌توانید متن صفحه حریم خصوصی را ویرایش کنید.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-600">عنوان صفحه</label>
              <input
                value={settings.privacy?.title || 'حریم خصوصی'}
                onChange={e => handlePrivacyChange({ title: e.target.value })}
                className="w-full border rounded-md px-4 py-2"
                placeholder="مثلا: حریم خصوصی کاربران"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">تاریخ آخرین بروزرسانی</label>
              <input
                value={settings.privacy?.lastUpdated || ''}
                onChange={e => handlePrivacyChange({ lastUpdated: e.target.value })}
                className="w-full border rounded-md px-4 py-2"
                placeholder="مثلا: 1402/12/01"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">متن حریم خصوصی</label>
              <textarea
                value={settings.privacy?.content || ''}
                onChange={e => handlePrivacyChange({ content: e.target.value })}
                className="w-full border rounded-md px-4 py-2 h-96"
                placeholder="متن کامل قوانین و حریم خصوصی..."
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="space-y-8">
          <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            در این بخش می‌توانید درگاه‌های پرداخت اینترنتی را فعال و تنظیم کنید. همچنین می‌توانید درگاه‌های پرداخت دستی یا سفارشی اضافه نمایید.
          </p>

          <div className="space-y-6">
            {paymentGateways.map((gateway) => (
              <div key={gateway.id} className="border rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border shrink-0">
                      {gateway.logo ? (
                        <Image src={gateway.logo} alt={gateway.name} fill className="object-contain p-1" />
                      ) : (
                        <CreditCard className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      {gateway.isSystem ? (
                        <div>
                          <h3 className="font-bold text-gray-800">{gateway.name}</h3>
                          <p className="text-xs text-gray-500">{gateway.description}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input 
                            value={gateway.name}
                            onChange={(e) => handlePaymentGatewayChange(gateway.id, { name: e.target.value })}
                            className="font-bold text-gray-800 border-b border-dashed border-gray-300 focus:border-[#83b735] outline-none bg-transparent w-full max-w-[200px]"
                            placeholder="نام درگاه"
                          />
                          <input 
                            value={gateway.description}
                            onChange={(e) => handlePaymentGatewayChange(gateway.id, { description: e.target.value })}
                            className="text-xs text-gray-500 border-b border-dashed border-gray-300 focus:border-[#83b735] outline-none bg-transparent w-full"
                            placeholder="توضیحات"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <span className="text-sm text-gray-600">{gateway.isActive ? 'فعال' : 'غیرفعال'}</span>
                       <input
                        id={`gateway-${gateway.id}`}
                        type="checkbox"
                        checked={gateway.isActive}
                        onChange={e => handlePaymentGatewayChange(gateway.id, { isActive: e.target.checked })}
                        className="w-5 h-5 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
                      />
                    </div>
                    {!gateway.isSystem && (
                      <button 
                        onClick={() => handleDeleteGateway(gateway.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="حذف درگاه"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {gateway.isActive && (
                  <div className="animate-in fade-in slide-in-from-top-2 pt-4 border-t mt-4">
                    {gateway.slug === 'cod' ? (
                       <p className="text-sm text-gray-500">
                         این روش پرداخت نیاز به تنظیمات خاصی ندارد.
                       </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.keys(gateway.config).map((key) => (
                          <div key={key} className="space-y-2">
                            <label className="text-sm text-gray-600 capitalize">
                              {key === 'merchantId' ? 'کد پذیرنده (Merchant ID)' : 
                               key === 'terminalId' ? 'ترمینال آیدی (Terminal ID)' :
                               key === 'username' ? 'نام کاربری' :
                               key === 'password' ? 'رمز عبور' :
                               key === 'apiKey' ? 'کلید دسترسی (API Key)' : key}
                            </label>
                            <input
                              type={key.toLowerCase().includes('password') || key.includes('Key') ? 'password' : 'text'}
                              value={gateway.config[key] || ''}
                              onChange={e => handlePaymentGatewayChange(gateway.id, { config: { [key]: e.target.value } })}
                              className="w-full border rounded-md px-3 py-2 dir-ltr text-right"
                            />
                          </div>
                        ))}
                        {!gateway.isSystem && (
                           <div className="col-span-full">
                             <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                               برای درگاه‌های دستی/سفارشی، اتصال فنی خودکار وجود ندارد. این گزینه صرفاً جهت نمایش به کاربر و یا مدیریت دستی (کارت به کارت) می‌باشد.
                             </p>
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            <button
              onClick={handleAddGateway}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#83b735] hover:text-[#83b735] hover:bg-[#83b735]/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>افزودن درگاه دستی / سفارشی جدید</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            در این بخش می‌توانید اطلاعات تماس، آدرس، شماره تلفن‌ها و ساعات کاری را مدیریت کنید.
            این اطلاعات در صفحه &quot;تماس با ما&quot; نمایش داده می‌شود.
          </p>

          <div className="grid grid-cols-1 gap-6">
             <div className="space-y-3">
              <label className="text-sm text-gray-600">آدرس کامل</label>
              <textarea
                value={settings.contact?.address || settings.address}
                onChange={e => handleContactChange({ address: e.target.value })}
                className="w-full border rounded-md px-4 py-2 h-20"
                placeholder="آدرس دقیق پستی"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">شماره‌های تماس</label>
                <button onClick={handleAddPhone} className="text-xs text-[#83b735] flex items-center gap-1 hover:underline">
                  <Plus className="w-3 h-3" /> افزودن شماره
                </button>
              </div>
              <div className="space-y-3">
                {(settings.contact?.phones || []).map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={phone}
                      onChange={e => handlePhoneChange(index, e.target.value)}
                      className="flex-1 border rounded-md px-4 py-2 dir-ltr text-right"
                      placeholder="021-..."
                    />
                    <button onClick={() => handleRemovePhone(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">ایمیل‌ها</label>
                <button onClick={handleAddEmail} className="text-xs text-[#83b735] flex items-center gap-1 hover:underline">
                  <Plus className="w-3 h-3" /> افزودن ایمیل
                </button>
              </div>
              <div className="space-y-3">
                {(settings.contact?.emails || []).map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={email}
                      onChange={e => handleEmailChange(index, e.target.value)}
                      className="flex-1 border rounded-md px-4 py-2 dir-ltr text-right"
                      placeholder="info@..."
                    />
                    <button onClick={() => handleRemoveEmail(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-md">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

             <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">ساعات کاری</label>
                <button onClick={handleAddWorkingHour} className="text-xs text-[#83b735] flex items-center gap-1 hover:underline">
                  <Plus className="w-3 h-3" /> افزودن ساعت کاری
                </button>
              </div>
              <div className="space-y-3">
                {(settings.contact?.workingHours || []).map((wh, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                        <input
                          value={wh.label}
                          onChange={e => handleWorkingHourChange(index, { label: e.target.value })}
                          className="border rounded-md px-4 py-2"
                          placeholder="عنوان (مثلاً: شنبه تا چهارشنبه)"
                        />
                         <input
                          value={wh.value}
                          onChange={e => handleWorkingHourChange(index, { value: e.target.value })}
                          className="border rounded-md px-4 py-2"
                          placeholder="ساعت (مثلاً: ۹ صبح تا ۵ عصر)"
                        />
                    </div>
                    <button onClick={() => handleRemoveWorkingHour(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-md mt-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-600">کد امبد نقشه (iframe)</label>
              <textarea
                value={settings.contact?.mapEmbedCode || ''}
                onChange={e => handleContactChange({ mapEmbedCode: e.target.value })}
                className="w-full border rounded-md px-4 py-2 h-24 dir-ltr text-left font-mono text-xs"
                placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
              />
              <p className="text-xs text-gray-400">کد iframe را از گوگل مپ کپی کنید و اینجا قرار دهید.</p>
            </div>

            <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-800">سوالات متداول (FAQ)</h3>
              <button
                onClick={handleAddFaq}
                className="flex items-center gap-1 text-sm text-[#83b735] hover:text-[#72a02e]"
              >
                <Plus className="w-4 h-4" />
                افزودن سوال
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {settings.contact?.faqs?.map((faq, idx) => (
                <div key={idx} className="flex gap-4 items-start border rounded-lg p-4 bg-gray-50">
                  <div className="flex-grow space-y-3">
                    <input
                      value={faq.question}
                      onChange={e => handleFaqChange(idx, { question: e.target.value })}
                      className="w-full border rounded-md px-3 py-2 text-sm font-bold"
                      placeholder="سوال..."
                    />
                    <textarea
                      value={faq.answer}
                      onChange={e => handleFaqChange(idx, { answer: e.target.value })}
                      className="w-full border rounded-md px-3 py-2 text-sm h-20"
                      placeholder="پاسخ..."
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveFaq(idx)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="حذف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              {(!settings.contact?.faqs || settings.contact.faqs.length === 0) && (
                <p className="text-gray-500 text-sm text-center py-4">هنوز سوالی اضافه نشده است.</p>
              )}
            </div>
          </div>

          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm text-gray-600">نام برند</label>
            <input 
              value={settings.brandName} 
              onChange={e => {
                const newBrand = e.target.value;
                const oldBrand = settings.brandName;
                const updates: Partial<SiteSettings> = { brandName: newBrand };
                
                if (oldBrand && oldBrand.length > 0) {
                  // Smart update for SEO Title
                  if (settings.seoTitle && settings.seoTitle.includes(oldBrand)) {
                    updates.seoTitle = settings.seoTitle.replace(oldBrand, newBrand);
                  }
                  
                  // Smart update for SEO Description
                  if (settings.seoDescription && settings.seoDescription.includes(oldBrand)) {
                    updates.seoDescription = settings.seoDescription.replace(oldBrand, newBrand);
                  }
                }

                handleChange(updates);
              }} 
              className="w-full border rounded-md px-4 py-2" 
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm text-gray-600">ساعات پاسخگویی</label>
            <input value={settings.supportHours} onChange={e => handleChange({ supportHours: e.target.value })} className="w-full border rounded-md px-4 py-2" />
          </div>
          <div className="space-y-3">
            <label className="text-sm text-gray-600">تلفن</label>
            <input value={settings.phone} onChange={e => handleChange({ phone: e.target.value })} className="w-full border rounded-md px-4 py-2 dir-ltr text-right" />
          </div>
          <div className="space-y-3">
            <label className="text-sm text-gray-600">ایمیل</label>
            <input value={settings.email} onChange={e => handleChange({ email: e.target.value })} className="w-full border rounded-md px-4 py-2" />
          </div>
          <div className="space-y-3">
            <label className="text-sm text-gray-600">تلگرام پشتیبانی</label>
            <input value={settings.telegram} onChange={e => handleChange({ telegram: e.target.value })} className="w-full border rounded-md px-4 py-2 dir-ltr text-right" />
          </div>
          <div className="space-y-3">
            <label className="text-sm text-gray-600">اینستاگرام</label>
            <input value={settings.instagram} onChange={e => handleChange({ instagram: e.target.value })} className="w-full border rounded-md px-4 py-2" />
          </div>
          <div className="space-y-3 md:col-span-2">
            <label className="text-sm text-gray-600">پیام نوار بالای سایت</label>
            <input value={settings.topBarMessage} onChange={e => handleChange({ topBarMessage: e.target.value })} className="w-full border rounded-md px-4 py-2" />
          </div>
          <div className="space-y-3">
            <label className="text-sm text-gray-600">آستانه ارسال رایگان (تومان)</label>
            <input
              type="number"
              min={0}
              value={settings.freeShippingThreshold}
              onChange={e => handleChange({ freeShippingThreshold: Math.max(0, Number(e.target.value) || 0) })}
              className="w-full border rounded-md px-4 py-2"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm text-gray-600">هزینه بسته‌بندی کادویی (تومان)</label>
            <input
              type="number"
              min={0}
              value={settings.giftWrappingCost || 0}
              onChange={e => handleChange({ giftWrappingCost: Math.max(0, Number(e.target.value) || 0) })}
              className="w-full border rounded-md px-4 py-2"
            />
          </div>
          <div className="space-y-3 md:col-span-2">
            <label className="text-sm text-gray-600">آدرس فروشگاه</label>
            <textarea
              value={settings.address}
              onChange={e => handleChange({ address: e.target.value })}
              className="w-full border rounded-md px-4 py-2 h-20"
              placeholder="آدرس پستی فروشگاه جهت نمایش در فوتر و فاکتورها"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm text-gray-600">کد پستی فرستنده</label>
            <input
              value={settings.postalCode || ''}
              onChange={e => handleChange({ postalCode: e.target.value })}
              className="w-full border rounded-md px-4 py-2 dir-ltr text-right"
              placeholder="1234567890"
            />
            <p className="text-xs text-gray-400">این کد پستی در برچسب‌های پستی به عنوان فرستنده درج می‌شود.</p>
          </div>
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="space-y-8">
          <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            در این بخش می‌توانید تنظیمات سئو و اتصال به ابزارهای وبمستر (گوگل و بینگ) را مدیریت کنید.
          </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 md:col-span-2">
              <label className="text-sm text-gray-600">آدرس اصلی سایت (Base URL)</label>
              <input 
                value={settings.baseUrl || ''} 
                onChange={e => handleChange({ baseUrl: e.target.value })} 
                className="w-full border rounded-md px-4 py-2 dir-ltr text-right" 
                placeholder="https://example.com" 
              />
              <p className="text-xs text-gray-400">
                آدرس دامنه اصلی سایت را وارد کنید. این آدرس برای ساخت تگ Canonical استفاده می‌شود.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-600">عنوان سئو (Title)</label>
              <input 
                value={settings.seoTitle || ''} 
                onChange={e => handleChange({ seoTitle: e.target.value })} 
                className="w-full border rounded-md px-4 py-2" 
                placeholder="نمایش در تب مرورگر و نتایج گوگل" 
              />
              <p className="text-xs text-gray-400">این عنوان جایگزین عنوان پیش‌فرض تمام صفحات می‌شود.</p>
            </div>
            
            <div className="space-y-3 md:col-span-2">
              <label className="text-sm text-gray-600">توضیحات سئو (Meta Description)</label>
              <textarea 
                value={settings.seoDescription || ''} 
                onChange={e => handleChange({ seoDescription: e.target.value })} 
                className="w-full border rounded-md px-4 py-2 h-20" 
                placeholder="توضیحاتی که زیر لینک در گوگل نمایش داده می‌شود" 
              />
            </div>

            <div className="md:col-span-2 border-t pt-6 mt-2">
               <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <Search className="w-5 h-5 text-[#83b735]" />
                 تایید مالکیت وب‌سایت (Verification)
               </h3>
               <p className="text-sm text-gray-500 mb-4">
                 برای اتصال سایت به Google Search Console و Bing Webmaster Tools، کدهای تایید را در اینجا وارد کنید.
                 این کدها به صورت متاتگ در هدر سایت قرار می‌گیرند.
               </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-600">کد تایید گوگل (Google)</label>
              <input 
                value={settings.googleSiteVerification || ''} 
                onChange={e => handleChange({ googleSiteVerification: e.target.value })} 
                className="w-full border rounded-md px-4 py-2 dir-ltr text-right" 
                placeholder="content code" 
              />
              <p className="text-xs text-gray-400 dir-rtl">
                کد موجود در ویژگی content تگ meta name=&quot;google-site-verification&quot; را وارد کنید.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-600">کد تایید بینگ (Bing)</label>
              <input 
                value={settings.bingSiteVerification || ''} 
                onChange={e => handleChange({ bingSiteVerification: e.target.value })} 
                className="w-full border rounded-md px-4 py-2 dir-ltr text-right" 
                placeholder="content code" 
              />
              <p className="text-xs text-gray-400 dir-rtl">
                کد موجود در ویژگی content تگ meta name=&quot;msvalidate.01&quot; را وارد کنید.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sms' && (
        <div className="space-y-8">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center h-5">
              <input
                id="sms-enabled"
                type="checkbox"
                checked={smsSettings.enabled}
                onChange={e => handleSmsChange({ enabled: e.target.checked })}
                className="w-5 h-5 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
              />
            </div>
            <label htmlFor="sms-enabled" className="font-medium text-gray-700">
              فعالسازی سیستم ارسال پیامک به مشتری
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm text-gray-600">کلید دسترسی (API Key)</label>
              <input
                type="password"
                value={smsSettings.apiKey}
                onChange={e => handleSmsChange({ apiKey: e.target.value })}
                className="w-full border rounded-md px-4 py-2 dir-ltr text-right"
                placeholder="مثال: A8s7d6f5..."
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm text-gray-600">شماره فرستنده</label>
              <input
                value={smsSettings.senderNumber}
                onChange={e => handleSmsChange({ senderNumber: e.target.value })}
                className="w-full border rounded-md px-4 py-2 dir-ltr text-right"
                placeholder="مثال: +981000..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2">قالب‌های پیامک</h3>
            <p className="text-xs text-gray-500">
              از متغیرهای <span className="dir-ltr inline-block px-1 bg-gray-100 rounded">{'{orderId}'}</span> (شماره سفارش) و 
              <span className="dir-ltr inline-block px-1 bg-gray-100 rounded">{'{trackingNumber}'}</span> (کد رهگیری) در متن استفاده کنید.
            </p>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ثبت سفارش / در حال پردازش</label>
                <textarea
                  value={smsSettings.templates.processing}
                  onChange={e => handleTemplateChange('processing', e.target.value)}
                  className="w-full border rounded-md px-4 py-2 h-20 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ارسال شده (تحویل پست)</label>
                <textarea
                  value={smsSettings.templates.shipped}
                  onChange={e => handleTemplateChange('shipped', e.target.value)}
                  className="w-full border rounded-md px-4 py-2 h-20 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">تحویل داده شده</label>
                <textarea
                  value={smsSettings.templates.delivered}
                  onChange={e => handleTemplateChange('delivered', e.target.value)}
                  className="w-full border rounded-md px-4 py-2 h-20 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">لغو شده</label>
                <textarea
                  value={smsSettings.templates.cancelled}
                  onChange={e => handleTemplateChange('cancelled', e.target.value)}
                  className="w-full border rounded-md px-4 py-2 h-20 text-sm"
                />
              </div>
            </div>

            <div className="border-t pt-6 mt-4">
              <button
                onClick={handleTestSMS}
                className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>ارسال پیامک تست</span>
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                یک پیامک تستی به شماره دلخواه ارسال می‌شود تا از صحت تنظیمات اطمینان حاصل کنید.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'admin-notif' && (
        <div className="space-y-8">
          <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            در این بخش می‌توانید مشخص کنید که هنگام ثبت سفارش جدید، از چه طریقی به شما (مدیر سایت) اطلاع داده شود.
          </p>

          {/* Telegram Section */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </div>
                <h3 className="font-bold text-gray-800">تلگرام</h3>
              </div>
              <div className="flex items-center h-5">
                <input
                  id="telegram-enabled"
                  type="checkbox"
                  checked={adminNotifSettings.telegram.enabled}
                  onChange={e => handleAdminNotifChange('telegram', { enabled: e.target.checked })}
                  className="w-5 h-5 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
                />
              </div>
            </div>
            
            {adminNotifSettings.telegram.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">توکن ربات (Bot Token)</label>
                  <input
                    type="password"
                    value={adminNotifSettings.telegram.botToken}
                    onChange={e => handleAdminNotifChange('telegram', { botToken: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 dir-ltr text-right"
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">آیدی چت (Chat ID)</label>
                  <input
                    value={adminNotifSettings.telegram.chatId}
                    onChange={e => handleAdminNotifChange('telegram', { chatId: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 dir-ltr text-right"
                    placeholder="123456789"
                  />
                  <p className="text-xs text-gray-400 dir-rtl">می‌توانید از ربات‌های userinfobot برای دریافت Chat ID استفاده کنید.</p>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Section */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                </div>
                <h3 className="font-bold text-gray-800">واتساپ</h3>
              </div>
              <div className="flex items-center h-5">
                <input
                  id="whatsapp-enabled"
                  type="checkbox"
                  checked={adminNotifSettings.whatsapp.enabled}
                  onChange={e => handleAdminNotifChange('whatsapp', { enabled: e.target.checked })}
                  className="w-5 h-5 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
                />
              </div>
            </div>
            
            {adminNotifSettings.whatsapp.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">کلید API</label>
                  <input
                    type="password"
                    value={adminNotifSettings.whatsapp.apiKey}
                    onChange={e => handleAdminNotifChange('whatsapp', { apiKey: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 dir-ltr text-right"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">شماره موبایل مدیر (جهت دریافت)</label>
                  <input
                    value={adminNotifSettings.whatsapp.phoneNumber}
                    onChange={e => handleAdminNotifChange('whatsapp', { phoneNumber: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 dir-ltr text-right"
                    placeholder="+989123456789"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SMS Section */}
          <div className="border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-800">پیامک (SMS)</h3>
              </div>
              <div className="flex items-center h-5">
                <input
                  id="sms-admin-enabled"
                  type="checkbox"
                  checked={adminNotifSettings.sms.enabled}
                  onChange={e => handleAdminNotifChange('sms', { enabled: e.target.checked })}
                  className="w-5 h-5 text-[#83b735] border-gray-300 rounded focus:ring-[#83b735]"
                />
              </div>
            </div>
            
            {adminNotifSettings.sms.enabled && (
              <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                <p className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                  نکته: برای استفاده از این قابلیت، باید پنل پیامک در تب «پیامک مشتری» فعال و تنظیم شده باشد.
                </p>
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">شماره موبایل مدیر (جهت دریافت)</label>
                  <input
                    value={adminNotifSettings.sms.phoneNumber}
                    onChange={e => handleAdminNotifChange('sms', { phoneNumber: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 dir-ltr text-right"
                    placeholder="09123456789"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'about' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-100">
            در این بخش می‌توانید محتوای صفحه &quot;درباره ما&quot; را ویرایش کنید.
          </p>
          
          <div className="space-y-3">
            <label className="text-sm text-gray-600">عنوان صفحه</label>
            <input 
              value={settings.about?.title || 'درباره ما'} 
              onChange={e => handleAboutChange({ title: e.target.value })} 
              className="w-full border rounded-md px-4 py-2" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm text-gray-600">متن توضیحات</label>
            <textarea 
              value={settings.about?.content || ''} 
              onChange={e => handleAboutChange({ content: e.target.value })} 
              className="w-full border rounded-md px-4 py-2 h-48" 
              placeholder="توضیحات کامل درباره فروشگاه..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-800">ویژگی‌های فروشگاه</h3>
              <button 
                onClick={handleAddFeature}
                className="flex items-center gap-1 text-sm text-[#83b735] hover:text-[#72a02e]"
              >
                <Plus className="w-4 h-4" />
                افزودن ویژگی
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {settings.about?.features?.map((feature, idx) => (
                <div key={idx} className="flex gap-4 items-start border rounded-lg p-4 bg-gray-50">
                  <div className="flex-grow space-y-3">
                    <input 
                      value={feature.title} 
                      onChange={e => handleFeatureChange(idx, { title: e.target.value })} 
                      className="w-full border rounded-md px-3 py-2 text-sm font-bold" 
                      placeholder="عنوان ویژگی"
                    />
                    <textarea 
                      value={feature.description} 
                      onChange={e => handleFeatureChange(idx, { description: e.target.value })} 
                      className="w-full border rounded-md px-3 py-2 text-sm h-20" 
                      placeholder="توضیحات ویژگی"
                    />
                  </div>
                  <button 
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="حذف"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              {(!settings.about?.features || settings.about.features.length === 0) && (
                <p className="text-gray-500 text-sm text-center py-4">هنوز ویژگی اضافه نشده است.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-8 pt-6 border-t">
        <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-[#83b735] text-white px-6 py-2 rounded-md hover:bg-[#72a02e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </button>
        <button 
            onClick={handleReset} 
            disabled={loading}
            className="border px-6 py-2 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          بازگردانی پیش‌فرض‌ها
        </button>
        {saved && <span className="text-sm text-green-600 font-medium animate-pulse">تغییرات با موفقیت ذخیره شد.</span>}
      </div>
    </div>
  );
}
