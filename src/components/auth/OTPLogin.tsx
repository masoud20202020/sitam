'use client';

import React, { useState, useEffect } from 'react';
import { Phone, ArrowRight, Check, Loader2, MessageSquare } from 'lucide-react';
import { saveUser, User } from '@/data/account';
import { loginOrSignupAction } from '@/actions/customers';

interface OTPLoginProps {
  onLogin: (user: User) => void;
}

export const OTPLogin: React.FC<OTPLoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  // Removed unused name state

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      alert('لطفاً شماره موبایل معتبر وارد کنید');
      return;
    }
    
    setLoading(true);
    // Simulate API call to send SMS
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      setTimer(120); // 2 minutes
      // In a real app, this would be sent via SMS provider
      alert(`کد تایید آزمایشی برای ${phone}: 12345`);
    }, 1500);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 4) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 5) return;

    setLoading(true);
    // Simulate verification
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (code === '12345') {
        const result = await loginOrSignupAction(phone);
        if (result.success && result.data) {
          const user = saveUser({ 
            phone: result.data.phone || phone, 
            name: result.data.name || 'کاربر جدید'
          });
          if (user) onLogin(user);
        } else {
          alert('خطا در ورود به حساب کاربری');
        }
      } else {
        alert('کد وارد شده اشتباه است');
      }
    } catch (error) {
      console.error(error);
      alert('خطایی رخ داد');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#83b735]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-[#83b735]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">ورود / ثبت‌نام</h2>
            <p className="text-gray-500 mt-2">برای ورود یا ثبت‌نام، شماره موبایل خود را وارد کنید</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">شماره موبایل</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="09123456789"
                className="w-full pl-4 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-[#83b735] focus:border-transparent outline-none text-lg text-left dir-ltr"
                maxLength={11}
                autoFocus
              />
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || phone.length < 10}
            className="w-full bg-[#83b735] text-white py-3 rounded-xl font-bold text-lg hover:bg-[#72a02d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                ادامه
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#83b735]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-[#83b735]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">کد تایید را وارد کنید</h2>
            <p className="text-gray-500 mt-2">کد ۵ رقمی به شماره {phone} ارسال شد</p>
            <button 
              type="button" 
              onClick={() => setStep('phone')}
              className="text-[#83b735] text-sm mt-2 hover:underline"
            >
              ویرایش شماره
            </button>
          </div>

          <div className="flex justify-center gap-3 dir-ltr">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="w-12 h-14 border-2 rounded-xl text-center text-2xl font-bold focus:border-[#83b735] focus:ring-2 focus:ring-[#83b735]/20 outline-none transition-all"
                maxLength={1}
              />
            ))}
          </div>

          <div className="text-center text-sm text-gray-500">
            {timer > 0 ? (
              <span>ارسال مجدد کد تا {formatTime(timer)} دیگر</span>
            ) : (
              <button 
                type="button"
                onClick={handlePhoneSubmit}
                className="text-[#83b735] font-bold hover:underline"
              >
                ارسال مجدد کد
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join('').length !== 5}
            className="w-full bg-[#83b735] text-white py-3 rounded-xl font-bold text-lg hover:bg-[#72a02d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                تایید و ورود
                <Check className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
