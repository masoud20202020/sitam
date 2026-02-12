export type Banner = {
  id: string | number;
  title: string;
  subtitle?: string;
  image?: string;
  link?: string;
  active: boolean;
  order: number;
  position: 'hero' | 'middle' | 'about' | 'home_above_categories' | 'home_bottom_grid';
  backgroundColor?: string;
};

const STORAGE_KEY = 'home_banners_v8';

const seedBanners: Banner[] = [
  {
    id: 1,
    title: 'تخفیف‌های ویژه تابستانه',
    subtitle: 'بهترین محصولات با بهترین قیمت‌ها. همین حالا خرید کنید!',
    image: '/placeholder-banner.svg',
    link: '/shop',
    active: true,
    order: 1,
    position: 'hero',
  },
  {
    id: 6,
    title: 'درباره تیم ما',
    subtitle: 'آشنایی با متخصصان و اهداف فروشگاه ما',
    image: '',
    link: '',
    active: true,
    order: 1,
    position: 'about',
  },
  {
    id: 101,
    title: 'مراقبت از بدن، راز درخشیدن!',
    subtitle: '',
    image: 'https://cdn.iconscout.com/icon/free/png-256/free-shampoo-icon-download-in-svg-png-gif-file-formats--bottle-cosmetic-beauty-spa-hotel-service-pack-icons-2035655.png',
    link: '/shop?category=care',
    active: true,
    order: 1,
    position: 'home_above_categories',
    backgroundColor: '#fce7f3', // Pinkish
  },
  {
    id: 102,
    title: 'جوانی رو به پوستت هدیه بده!',
    subtitle: '',
    image: 'https://cdn.iconscout.com/icon/premium/png-256-thumb/serum-104-1165287.png',
    link: '/shop?category=skin',
    active: true,
    order: 2,
    position: 'home_above_categories',
    backgroundColor: '#e0f2fe', // Bluish
  },
  {
    id: 2,
    title: 'جشنواره فروش ویژه',
    subtitle: 'تا ۴۰٪ تخفیف روی محصولات منتخب آرایشی و بهداشتی',
    image: '',
    link: '/shop?category=sale',
    active: true,
    order: 2,
    position: 'middle',
  },
  {
    id: 3,
    title: 'کالکشن جدید پاییزه',
    subtitle: 'شیک‌ترین لباس‌های فصل را از ما بخواهید.',
    image: '',
    link: '/shop?category=autumn',
    active: true,
    order: 2,
    position: 'hero',
  },
  {
    id: 4,
    title: 'لوازم جانبی موبایل',
    subtitle: 'تنوع بی‌نظیر قاب و گلس برای تمام مدل‌ها',
    image: '',
    link: '/category/accessories',
    active: true,
    order: 3,
    position: 'hero',
  },
  {
    id: 5,
    title: 'تخفیف برای اولین خرید',
    subtitle: 'با کد تخفیف FIRST10 از ۱۰٪ تخفیف بهره‌مند شوید',
    image: '',
    link: '/register',
    active: true,
    order: 4,
    position: 'hero',
  },
  {
    id: 103,
    title: 'تخفیف ویژه ساعت‌های هوشمند',
    subtitle: 'مدل‌های جدید با قیمت‌های استثنایی',
    image: 'https://cdn.iconscout.com/icon/free/png-256/free-apple-watch-icon-download-in-svg-png-gif-file-formats--smart-wrist-wearable-device-pack-icons-1582236.png',
    link: '/shop?category=smartwatch',
    active: true,
    order: 1,
    position: 'home_bottom_grid',
    backgroundColor: '#fce7f3', // Pinkish
  },
  {
    id: 104,
    title: 'کالکشن جدید عینک آفتابی',
    subtitle: 'استایل تابستانی خودت رو بساز',
    image: 'https://cdn.iconscout.com/icon/free/png-256/free-sunglasses-icon-download-in-svg-png-gif-file-formats--glasses-summer-beach-fashion-pack-icons-1582245.png',
    link: '/shop?category=sunglasses',
    active: true,
    order: 2,
    position: 'home_bottom_grid',
    backgroundColor: '#e0f2fe', // Bluish
  },
];

export function getBanners(): Banner[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedBanners));
    return seedBanners;
  }
  try {
    const parsed: Banner[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedBanners;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedBanners));
    return seedBanners;
  }
}

export function saveBanners(list: Banner[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addBanner(item: Omit<Banner, 'id'>) {
  const items = getBanners();
  const newId = Date.now();
  const newItem: Banner = { id: newId, ...item };
  items.push(newItem);
  saveBanners(items);
  return newItem;
}

export function updateBanner(id: string | number, patch: Partial<Banner>) {
  const items = getBanners();
  const idx = items.findIndex(b => String(b.id) === String(id));
  if (idx === -1) return;
  items[idx] = { ...items[idx], ...patch };
  saveBanners(items);
  return items[idx];
}

export function deleteBanner(id: string | number) {
  const items = getBanners().filter(b => String(b.id) !== String(id));
  saveBanners(items);
}

export function getActiveBanners(position: 'hero' | 'middle' | 'about' | 'home_above_categories' | 'home_bottom_grid' = 'hero'): Banner[] {
  return getBanners()
    .filter(b => b.active && (b.position === position || (!b.position && position === 'hero')))
    .sort((a, b) => a.order - b.order);
}
