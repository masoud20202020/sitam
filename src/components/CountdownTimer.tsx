'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: number;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      setIsExpired(false);
      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    };

    // Initial calculation
    setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 0);

    const timer = setInterval(() => {
      setTimeout(() => {
        setTimeLeft(calculateTimeLeft());
      }, 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isExpired) return null;

  return (
    <div className="bg-red-50 border border-red-100 rounded-lg p-3 inline-block">
      <div className="flex items-center gap-2 mb-2 text-red-600">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-bold">پیشنهاد ویژه به مدت محدود</span>
      </div>
      <div className="flex items-center gap-2 text-gray-800 direction-ltr">
        <div className="flex flex-col items-center min-w-[40px]">
          <span className="text-xl font-bold font-mono bg-white shadow-sm rounded px-2 py-1 min-w-[36px] text-center text-red-600">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-gray-500 mt-1">ثانیه</span>
        </div>
        <span className="text-red-300 text-xl font-bold">:</span>
        <div className="flex flex-col items-center min-w-[40px]">
          <span className="text-xl font-bold font-mono bg-white shadow-sm rounded px-2 py-1 min-w-[36px] text-center text-red-600">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-gray-500 mt-1">دقیقه</span>
        </div>
        <span className="text-red-300 text-xl font-bold">:</span>
        <div className="flex flex-col items-center min-w-[40px]">
          <span className="text-xl font-bold font-mono bg-white shadow-sm rounded px-2 py-1 min-w-[36px] text-center text-red-600">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-gray-500 mt-1">ساعت</span>
        </div>
        {timeLeft.days > 0 && (
          <>
            <span className="text-red-300 text-xl font-bold">:</span>
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-xl font-bold font-mono bg-white shadow-sm rounded px-2 py-1 min-w-[36px] text-center text-red-600">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-gray-500 mt-1">روز</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
