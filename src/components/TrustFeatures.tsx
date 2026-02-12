import React from 'react';
import { ShieldCheck, Truck, CreditCard, Headphones } from 'lucide-react';

const features = [
  {
    icon: <ShieldCheck className="w-10 h-10 text-[#db2777]" />,
    title: 'ضمانت اصالت کالا',
    description: 'تضمین اصالت و سلامت تمام محصولات'
  },
  {
    icon: <Truck className="w-10 h-10 text-[#db2777]" />,
    title: 'ارسال سریع',
    description: 'ارسال به سراسر کشور در کمترین زمان'
  },
  {
    icon: <CreditCard className="w-10 h-10 text-[#db2777]" />,
    title: 'پرداخت امن',
    description: 'درگاه پرداخت ایمن و قابل اعتماد'
  },
  {
    icon: <Headphones className="w-10 h-10 text-[#db2777]" />,
    title: 'پشتیبانی ۲۴/۷',
    description: 'پاسخگویی و پشتیبانی در تمام ساعات'
  }
];

export const TrustFeatures = () => {
  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl hover:shadow-md transition-shadow duration-300 group">
              <div className="mb-4 bg-white p-4 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
