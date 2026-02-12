export type ProductOption = {
  name: string;
  values: string[];
};

export type VariantSelection = {
  [key: string]: string;
};

export type ProductVariant = {
  variantId: string;
  selection: VariantSelection;
  price: number;
  stock: number;
  image?: string;
};

export type ProductItem = {
  id: string | number;
  name: string;
  basePrice: number;
  price?: number;
  category: string;
  image?: string;
  description?: string;
  shortDescription?: string;
  discountPrice?: number;
  rating?: number;
  reviews?: number;
  features?: string[];
  images?: string[];
  options?: ProductOption[];
  variants?: ProductVariant[];
  stock?: number;
  published?: boolean;
  brand?: string;
  isTrending?: boolean;
  isGiftWrapAvailable?: boolean;
  // SEO Fields
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  imageAlt?: string;
  specialSaleEndTime?: number;
  // SKU / Product ID
  sku?: string;
  // Physical Specs
  weight?: number; // in grams
  dimensions?: {
    length: number; // in cm
    width: number; // in cm
    height: number; // in cm
  };
  volume?: number; // in cubic cm or liters (optional override)
};

import { addLog } from './logs';

const STORAGE_KEY = 'products_v3';

export const seedProducts: ProductItem[] = [
  { id: 1, name: 'محصول شماره یک', basePrice: 1200000, category: 'لوازم خانگی', image: '/placeholder.svg', published: true, brand: 'سامسونگ', isTrending: true, shortDescription: 'این یک توضیح کوتاه برای محصول شماره یک است.' },
  { id: 2, name: 'کفش ورزشی نایک', basePrice: 3500000, category: 'مد و پوشاک', image: '/placeholder.svg', published: true, brand: 'نایک', isTrending: true,
    options: [{ name: 'رنگ', values: ['قرمز', 'آبی', 'کرم'] }, { name: 'سایز', values: ['40', '41', '42', '43', '44'] }],
    variants: [
      { variantId: '1-قرمز-40', selection: { رنگ: 'قرمز', سایز: '40' }, price: 3500000, stock: 5 },
      { variantId: '1-قرمز-41', selection: { رنگ: 'قرمز', سایز: '41' }, price: 3500000, stock: 8 },
      { variantId: '1-آبی-42', selection: { رنگ: 'آبی', سایز: '42' }, price: 3550000, stock: 3 },
      { variantId: '1-کرم-43', selection: { رنگ: 'کرم', سایز: '43' }, price: 3450000, stock: 10 },
    ]
  },
  { id: 3, name: 'ساعت هوشمند', basePrice: 5800000, category: 'دیجیتال', image: '/placeholder.svg', published: true, brand: 'شیائومی', discountPrice: 5500000 },
  { id: 4, name: 'هدفون بی‌سیم', basePrice: 950000, category: 'دیجیتال', image: '/placeholder.svg', published: true, brand: 'سونی' },
  { id: 5, name: 'تی‌شرت نخی', basePrice: 350000, category: 'مد و پوشاک', image: '/placeholder.svg', published: true, brand: 'ال‌سی وایکیکی', isTrending: true,
    options: [{ name: 'رنگ', values: ['سفید', 'سیاه', 'آبی تیره'] }, { name: 'سایز', values: ['S', 'M', 'L', 'XL'] }],
    variants: [
      { variantId: '5-سفید-S', selection: { رنگ: 'سفید', سایز: 'S' }, price: 350000, stock: 15 },
      { variantId: '5-سفید-M', selection: { رنگ: 'سفید', سایز: 'M' }, price: 350000, stock: 20 },
      { variantId: '5-سیاه-L', selection: { رنگ: 'سیاه', سایز: 'L' }, price: 350000, stock: 12 },
      { variantId: '5-آبی تیره-XL', selection: { رنگ: 'آبی تیره', سایز: 'XL' }, price: 350000, stock: 8 },
    ]
  },
  { id: 6, name: 'کیف چرمی', basePrice: 1800000, category: 'کیف و کفش', image: '/placeholder.svg', published: true, brand: 'چرم مشهد' },
  { id: 7, name: 'عینک آفتابی', basePrice: 700000, category: 'اکسسوری', image: '/placeholder.svg', published: true, brand: 'ری‌بن' },
  { id: 8, name: 'لپ‌تاپ گیمینگ', basePrice: 45000000, category: 'دیجیتال', image: '/placeholder.svg', published: false, brand: 'ایسوس' },
  { id: 9, name: 'محصول تست SKU', basePrice: 100000, category: 'تست', image: '/placeholder.svg', published: true, brand: 'تست', sku: '2222', description: 'این یک محصول تست برای بررسی قابلیت SKU است.' },
];

export function getProducts(): ProductItem[] {
  if (typeof window === 'undefined') return seedProducts;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedProducts));
    return seedProducts;
  }
  try {
    const parsed: ProductItem[] = JSON.parse(raw);
    const list: ProductItem[] = parsed.map((p): ProductItem => ({
      ...p,
      basePrice: typeof p.basePrice === 'number' && !isNaN(p.basePrice) ? p.basePrice : 0,
      price: typeof p.price === 'number' ? p.price : p.basePrice, // Backward compatibility
      options: Array.isArray(p.options) ? p.options : undefined,
      variants: Array.isArray(p.variants) ? p.variants : undefined,
      stock: typeof p.stock === 'number' ? p.stock : undefined,
    }));

    // Ensure test product exists (migration for testing)
    if (!list.find(p => p.sku === '2222')) {
       const testProduct = seedProducts.find(p => p.sku === '2222');
       if (testProduct) {
         list.push(testProduct);
         localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
       }
    }

    return list;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedProducts));
    return seedProducts;
  }
}

export function saveProducts(list: ProductItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getProductById(idOrSlug: string | number): ProductItem | undefined {
  const items = getProducts();
  return items.find(p => 
    String(p.id) === String(idOrSlug) || 
    (p.slug && p.slug === String(idOrSlug)) ||
    (p.sku && p.sku === String(idOrSlug))
  );
}

export function addProduct(item: Omit<ProductItem, 'id'>) {
  const items = getProducts();
  const newId = Date.now();
  // Handle backward compatibility: if price is provided but basePrice isn't, use price as basePrice
  const basePrice = typeof item.price === 'number' ? item.price : (item.basePrice || 0);
  
  // Auto-generate SKU if not provided
  const sku = item.sku && item.sku.trim() !== '' ? item.sku : `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const newItem: ProductItem = {
    id: newId,
    ...item,
    basePrice,
    sku,
    // Ensure options and variants are arrays if provided
    options: Array.isArray(item.options) ? item.options : undefined,
    variants: Array.isArray(item.variants) ? item.variants : undefined,
  };
  items.push(newItem);
  saveProducts(items);
  addLog('افزودن محصول', `محصول "${newItem.name}" با موفقیت ایجاد شد.`, 'success');
  return newItem;
}

export function updateProduct(id: string | number, patch: Partial<ProductItem>) {
  const items = getProducts();
  const idx = items.findIndex(p => String(p.id) === String(id));
  if (idx === -1) return;
  
  // Handle backward compatibility: if price is in patch, update basePrice
  const updatedPatch: Partial<ProductItem> = { ...patch };
  if (typeof updatedPatch.price === 'number') {
    updatedPatch.basePrice = updatedPatch.price;
    delete updatedPatch.price;
  }
  
  // Auto-generate SKU if it's being cleared or if original has no SKU and patch has no SKU
  if ('sku' in updatedPatch && (!updatedPatch.sku || updatedPatch.sku.trim() === '')) {
    // If user cleared it, generate new one
    updatedPatch.sku = `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  } else if (!items[idx].sku && !('sku' in updatedPatch)) {
     // If original had no SKU and patch doesn't touch it (rare, but good to handle legacy)
     // We don't necessarily want to force it here unless we want to migrate everything eagerly.
     // But let's leave it unless the user edits the product.
     // However, if the user edits OTHER fields, we might as well generate an SKU if missing.
     updatedPatch.sku = `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  const updatedItem: ProductItem = {
    ...items[idx],
    ...updatedPatch,
    // Ensure options and variants are arrays if provided
    options: 'options' in updatedPatch ? (Array.isArray(updatedPatch.options) ? updatedPatch.options : undefined) : items[idx].options,
    variants: 'variants' in updatedPatch ? (Array.isArray(updatedPatch.variants) ? updatedPatch.variants : undefined) : items[idx].variants,
  };
  
  items[idx] = updatedItem;
  saveProducts(items);
  addLog('ویرایش محصول', `محصول "${updatedItem.name}" ویرایش شد.`, 'info');
  return updatedItem;
}

export function deleteProduct(id: string | number) {
  const items = getProducts();
  const item = items.find(p => String(p.id) === String(id));
  const newItems = items.filter(p => String(p.id) !== String(id));
  saveProducts(newItems);
  if (item) {
    addLog('حذف محصول', `محصول "${item.name}" حذف شد.`, 'warning');
  }
}

export function formatPriceToman(n: number): string {
  try {
    return `${Math.floor(n).toLocaleString('fa-IR')} تومان`;
  } catch {
    return `${n} تومان`;
  }
}

// Stock reservations (temporary holds during checkout)
export type StockReservation = {
  id: string;
  productId: string | number;
  variantId?: string;
  quantity: number;
  expiresAt: number;
};

const RESERVATION_KEY = 'stock_reservations';

function nowMs() {
  return Date.now();
}

export function getReservations(): StockReservation[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(RESERVATION_KEY);
  if (!raw) return [];
  try {
    const list: StockReservation[] = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveReservations(list: StockReservation[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RESERVATION_KEY, JSON.stringify(list));
}

export function purgeExpiredReservations() {
  const list = getReservations();
  const filtered = list.filter(r => r.expiresAt > nowMs());
  if (filtered.length !== list.length) {
    saveReservations(filtered);
  }
}

export function getReservedQty(productId: string | number, variantId?: string): number {
  purgeExpiredReservations();
  return getReservations()
    .filter(r => String(r.productId) === String(productId) && 
               (variantId ? r.variantId === variantId : !r.variantId))
    .reduce((acc, r) => acc + (typeof r.quantity === 'number' ? r.quantity : 0), 0);
}

export function getAvailableStock(product: ProductItem, variantId?: string): number {
  if (variantId && product.variants) {
    const variant = product.variants.find(v => v.variantId === variantId);
    if (variant) {
      return Math.max(0, variant.stock - getReservedQty(product.id, variantId));
    }
    return 0;
  }
  if (typeof product.stock === 'number') {
    return Math.max(0, product.stock - getReservedQty(product.id));
  }
  return 0;
}

export function reserveProducts(items: { id: string | number; variantId?: string; quantity: number }[], ttlMs: number) {
  purgeExpiredReservations();
  const reservations = getReservations();
  const exp = nowMs() + Math.max(0, ttlMs);
  const newReservations: StockReservation[] = items
    .filter(i => i.quantity > 0)
    .map(i => ({
      id: `${String(i.id)}-${i.variantId || 'default'}-${nowMs()}`,
      productId: i.id,
      variantId: i.variantId,
      quantity: i.quantity,
      expiresAt: exp,
    }));
  saveReservations([...reservations, ...newReservations]);
}

export function releaseReservationsForItems(items: { id: string | number; variantId?: string }[]) {
  purgeExpiredReservations();
  const reservations = getReservations();
  const remaining = reservations.filter(r => 
    !items.some(i => 
      String(i.id) === String(r.productId) && 
      (i.variantId ? r.variantId === i.variantId : !r.variantId)
    )
  );
  saveReservations(remaining);
}
