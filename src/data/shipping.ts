export type ShippingMethod = {
  id: number;
  name: string;
  code: string;
  active: boolean;
  basePrice: number;
  perKgPrice?: number;
  maxWeightKg?: number;
  deliveryDaysMin?: number;
  deliveryDaysMax?: number;
  codAvailable: boolean; // Cash on Delivery (payment method)
  isPostPaid?: boolean; // Shipping cost is paid on delivery (Pas-Kerayeh)
  regions?: string[];
  notes?: string;
};

const STORAGE_KEY = 'shipping_methods';

const seedMethods: ShippingMethod[] = [
  {
    id: 1,
    name: 'پست سفارشی',
    code: 'standard',
    active: true,
    basePrice: 45000,
    perKgPrice: 8000,
    deliveryDaysMin: 3,
    deliveryDaysMax: 6,
    codAvailable: false,
    isPostPaid: false,
  },
  {
    id: 2,
    name: 'پست پیشتاز',
    code: 'express',
    active: true,
    basePrice: 75000,
    perKgPrice: 12000,
    deliveryDaysMin: 1,
    deliveryDaysMax: 3,
    codAvailable: false,
    isPostPaid: false,
  },
  {
    id: 3,
    name: 'تیپاکس',
    code: 'tipax',
    active: false,
    basePrice: 0,
    perKgPrice: 0,
    deliveryDaysMin: 2,
    deliveryDaysMax: 4,
    codAvailable: true,
    isPostPaid: true,
  },
  {
    id: 4,
    name: 'پیک درون شهری (پس‌کرایه)',
    code: 'courier',
    active: true,
    basePrice: 0,
    perKgPrice: 0,
    deliveryDaysMin: 0,
    deliveryDaysMax: 1,
    codAvailable: true,
    isPostPaid: true,
    notes: 'هزینه ارسال توسط مشتری در مقصد پرداخت می‌شود.'
  },
];

export function getShippingMethods(): ShippingMethod[] {
  if (typeof window === 'undefined') return seedMethods;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedMethods));
    return seedMethods;
  }
  try {
    const parsed = JSON.parse(raw) as ShippingMethod[];
    
    // Check if new methods exist, if not add them
    if (Array.isArray(parsed)) {
       const hasCourier = parsed.some(m => m.code === 'courier');
       if (!hasCourier) {
          const courier = seedMethods.find(m => m.code === 'courier');
          if (courier) {
            parsed.push(courier);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            return parsed;
          }
       }
       return parsed;
    }
    return seedMethods;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedMethods));
    return seedMethods;
  }
}

export function saveShippingMethods(list: ShippingMethod[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addShippingMethod(method: Omit<ShippingMethod, 'id'>) {
  const list = getShippingMethods();
  const newItem: ShippingMethod = { id: Date.now(), ...method };
  list.push(newItem);
  saveShippingMethods(list);
  return newItem;
}

export function updateShippingMethod(id: number, patch: Partial<ShippingMethod>) {
  const list = getShippingMethods();
  const idx = list.findIndex(m => m.id === id);
  if (idx === -1) return;
  const updated: ShippingMethod = { ...list[idx], ...patch };
  list[idx] = updated;
  saveShippingMethods(list);
  return updated;
}

export function deleteShippingMethod(id: number) {
  const list = getShippingMethods().filter(m => m.id !== id);
  saveShippingMethods(list);
}
