
'use client';

import React, { useMemo } from 'react';
import { SiteSettings } from '@/data/settings';
import type { Banner } from '@/actions/banners';
import { Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface AboutClientProps {
  settings: SiteSettings;
  initialBanners?: Banner[];
}

export default function AboutClient({ settings, initialBanners = [] }: AboutClientProps) {
  const banner = useMemo(() => {
    const list = initialBanners.filter(b => b.active && b.position === 'about').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return list[0] || null;
  }, [initialBanners]);

  const data = settings.about;

  return (
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border overflow-hidden">
          {banner ? (
            banner.image ? (
              <div className="w-full h-64 md:h-80 relative">
                <Image
                  src={banner.image}
                  alt={banner.title || data.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1200px"
                  priority
                />
                {(banner.title || banner.subtitle) && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
                    {banner.title && <h2 className="text-2xl md:text-3xl font-bold mb-2">{banner.title}</h2>}
                    {banner.subtitle && <p className="text-lg opacity-90">{banner.subtitle}</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 border-b border-gray-200 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm font-bold">{banner.title || 'محل نمایش بنر درباره ما'}</p>
                <p className="text-xs opacity-75 mt-1">برای تنظیم تصویر، به پنل مدیریت، بخش بنرها مراجعه کنید</p>
              </div>
            )
          ) : (
             <div className="w-full h-32 bg-gray-50 border-b border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                <p className="text-xs font-medium">محل قرارگیری بنر (خالی)</p>
             </div>
          )}
          
          <div className="p-8 md:p-10">
            {data.content.split('\n').map((paragraph, index) => (
              paragraph.trim() && <p key={index}>{paragraph}</p>
            ))}
          </div>

          {data.features && data.features.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {data.features.map((feature, idx) => (
                <div key={idx} className="border rounded-xl p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h2>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
  );
}
