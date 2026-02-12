export type AboutFeature = {
  title: string;
  description: string;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type SiteSettings = {
  brandName: string;
  seoTitle: string;
  seoDescription: string;
  baseUrl?: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  supportHours: string;
  phone: string;
  email: string;
  telegram: string;
  instagram: string;
  address: string;
  postalCode?: string;
  topBarMessage: string;
  freeShippingThreshold: number;
  giftWrappingCost: number;
  about: {
    title: string;
    content: string;
    features: AboutFeature[];
  };
  contact: {
    phones: string[];
    emails: string[];
    address: string;
    workingHours: { label: string; value: string }[];
    mapEmbedCode: string;
    faqs: FAQItem[];
  };
  privacy: {
    title: string;
    content: string;
    lastUpdated?: string;
  };
};

const SETTINGS_KEY = 'site_settings';
export const SETTINGS_UPDATED_EVENT = 'site_settings_updated';

export const defaultSettings: SiteSettings = {
  brandName: 'فروشگاه آنلاین شیک',
  seoTitle: 'فروشگاه آنلاین شیک | خرید اینترنتی',
  seoDescription: 'بهترین محصولات با بهترین قیمت و کیفیت تضمینی در فروشگاه آنلاین شیک',
  supportHours: '۱۰ تا ۱۹',
  phone: '۰۵۱۳۳۶۸۳۶۷۰',
  email: 'info@liparmug.ir',
  telegram: '۰۹۳۷۵۱۴۶۶۱۰',
  instagram: 'lipar.mug',
  address: 'تهران، خیابان ولیعصر، کوچه نهم، پلاک ۱۲',
  postalCode: '14155-6345',
  topBarMessage: 'ارسال رایگان برای سفارش‌های بالای ۵۰۰ هزار تومان',
  freeShippingThreshold: 500000,
  giftWrappingCost: 25000,
  about: {
    title: 'درباره ما',
    content: 'ما یک فروشگاه آنلاین هستیم که با هدف ارائه محصولات باکیفیت و تجربه خرید آسان ایجاد شده‌ایم. تلاش می‌کنیم با ارائه قیمت‌های رقابتی، پشتیبانی مناسب و ارسال سریع، رضایت شما را جلب کنیم.\n\nتیم ما شامل متخصصان حوزه فروش، تکنولوژی و پشتیبانی است که به صورت مستمر در حال بهبود خدمات و افزودن قابلیت‌های جدید به وب‌سایت هستند تا خریدی مطمئن و لذت‌بخش داشته باشید.',
    features: [
      { title: 'ارسال سریع', description: 'سفارش‌های شما در کوتاه‌ترین زمان آماده و ارسال می‌شوند.' },
      { title: 'پشتیبانی دوستانه', description: 'از طریق صفحه تماس با ما می‌توانید با تیم پشتیبانی در ارتباط باشید.' },
      { title: 'تضمین کیفیت', description: 'کیفیت محصولات قبل از عرضه بررسی می‌شود تا بهترین تجربه را داشته باشید.' },
    ],
  },
  contact: {
    phones: ['021 - 8888 1234', '0912 345 6789'],
    emails: ['info@myshop.com', 'support@myshop.com'],
    address: 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، خیابان خدامی، پلاک ۱۲، واحد ۴',
    workingHours: [
      { label: 'شنبه تا چهارشنبه', value: '۹ صبح تا ۹ شب' },
      { label: 'پنج‌شنبه‌ها', value: '۹ صبح تا ۲ بعد از ظهر' },
    ],
    mapEmbedCode: '',
    faqs: [
      {
        question: "چگونه می‌توانم سفارش خود را پیگیری کنم؟",
        answer: "شما می‌توانید با وارد شدن به حساب کاربری خود و مراجعه به بخش 'سفارش‌های من'، وضعیت سفارش خود را مشاهده کنید. همچنین کد رهگیری پستی برای شما پیامک خواهد شد."
      },
      {
        question: "هزینه ارسال چگونه محاسبه می‌شود؟",
        answer: "هزینه ارسال بسته به وزن و ابعاد سفارش و همچنین آدرس مقصد محاسبه می‌شود. در هنگام تسویه حساب، مبلغ دقیق نمایش داده خواهد شد."
      },
      {
        question: "آیا امکان مرجوع کردن کالا وجود دارد؟",
        answer: "بله، در صورت وجود نقص فنی یا مغایرت کالا با توضیحات سایت، می‌توانید تا ۷ روز پس از دریافت کالا، درخواست مرجوعی خود را ثبت کنید."
      },
      {
        question: "چه روش‌های پرداختی دارید؟",
        answer: "شما می‌توانید از طریق درگاه‌های بانکی عضو شتاب به صورت آنلاین پرداخت کنید. همچنین امکان پرداخت در محل برای برخی شهرها وجود دارد."
      },
      {
        question: "ساعات کاری پشتیبانی چگونه است؟",
        answer: "تیم پشتیبانی ما در روزهای شنبه تا چهارشنبه از ساعت ۹ صبح تا ۱۷ و پنج‌شنبه‌ها تا ساعت ۱۳ پاسخگوی شما عزیزان هستند."
      },
      {
        question: "چطور می‌توانم رمز عبور خود را بازیابی کنم؟",
        answer: "در صفحه ورود، روی گزینه 'رمز عبور را فراموش کرده‌ام' کلیک کنید. لینک بازیابی رمز عبور به ایمیل یا شماره موبایل شما ارسال خواهد شد."
      },
      {
        question: "آیا امکان ارسال به شهرستان‌ها وجود دارد؟",
        answer: "بله، ما به سراسر ایران ارسال داریم. سفارش‌های شهرستان از طریق پست پیشتاز یا تیپاکس ارسال می‌شوند و معمولاً بین ۲ تا ۴ روز کاری به دست شما می‌رسند."
      },
      {
        question: "شرایط گارانتی و ضمانت کالا چیست؟",
        answer: "تمامی محصولات دارای ضمانت اصالت و سلامت فیزیکی هستند. برخی محصولات الکترونیکی نیز دارای گارانتی شرکتی می‌باشند که در صفحه محصول قید شده است."
      }
    ]
  },
  privacy: {
    title: 'حریم خصوصی',
    content: 'ما متعهد به حفظ اطلاعات شخصی شما هستیم. اطلاعات شما فقط برای پردازش سفارش‌ها و ارائه خدمات استفاده می‌شود و هرگز بدون رضایت شما با اشخاص ثالث به اشتراک گذاشته نمی‌شود.',
    lastUpdated: new Date().toISOString().split('T')[0],
  },
};

export function getSettings(): SiteSettings {
  if (typeof window === 'undefined') return defaultSettings;
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    // Deep merge for nested objects to ensure new fields in defaultSettings are preserved
    return {
      ...defaultSettings,
      ...parsed,
      about: { ...defaultSettings.about, ...(parsed.about || {}) },
      contact: { ...defaultSettings.contact, ...(parsed.contact || {}) },
      privacy: { ...defaultSettings.privacy, ...(parsed.privacy || {}) },
    };
  } catch {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
}

export function saveSettings(s: SiteSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
}

export function updateSettings(patch: Partial<SiteSettings>) {
  const current = getSettings();
  const next = { ...current, ...patch };
  saveSettings(next);
  return next;
}

export function resetSettings() {
  saveSettings(defaultSettings);
  return defaultSettings;
}
