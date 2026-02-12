import { v4 as uuidv4 } from 'uuid';

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  active: boolean;
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
  maxUses?: number;   // Total times this coupon can be used
  usedCount: number;  // How many times it has been used
  minOrderAmount?: number;
  
  // New Limits
  maxUsesPerUser?: number;
  userUsage?: Record<string, number>; // Map of userId/phone -> count
  
  // Restrictions
  allowedProductIds?: (string | number)[];
  allowedCategoryIds?: (string | number)[];
}

const STORAGE_KEY = 'sitam_coupons';

const DEFAULT_COUPONS: Coupon[] = [
  { 
    id: '1', 
    code: 'OFF10', 
    type: 'percent', 
    value: 10, 
    active: true, 
    usedCount: 0,
    maxUses: 100
  },
  { 
    id: '2', 
    code: 'FIX50', 
    type: 'fixed', 
    value: 50000, 
    active: true, 
    usedCount: 0 
  },
];

export function getCoupons(): Coupon[] {
  if (typeof window === 'undefined') return DEFAULT_COUPONS;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COUPONS));
    return DEFAULT_COUPONS;
  }
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse coupons', e);
    return DEFAULT_COUPONS;
  }
}

export function saveCoupons(coupons: Coupon[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
}

export function addCoupon(coupon: Omit<Coupon, 'id' | 'usedCount'>): Coupon {
  const coupons = getCoupons();
  const newCoupon: Coupon = {
    ...coupon,
    id: uuidv4(),
    usedCount: 0
  };
  coupons.push(newCoupon);
  saveCoupons(coupons);
  return newCoupon;
}

export function updateCoupon(id: string, updates: Partial<Coupon>): Coupon | null {
  const coupons = getCoupons();
  const index = coupons.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  coupons[index] = { ...coupons[index], ...updates };
  saveCoupons(coupons);
  return coupons[index];
}

export function deleteCoupon(id: string) {
  const coupons = getCoupons();
  const filtered = coupons.filter(c => c.id !== id);
  saveCoupons(filtered);
}


export type CouponValidationResult = 
  | { valid: true; coupon: Coupon }
  | { valid: false; error: string };

export function validateCoupon(
  code: string, 
  orderTotal: number = 0, 
  userId?: string | number,
  cartItems?: { id: string | number; category?: string }[]
): CouponValidationResult {
  const coupons = getCoupons();
  const coupon = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());

  if (!coupon) {
    return { valid: false, error: 'کد تخفیف معتبر نیست.' };
  }

  if (!coupon.active) {
    return { valid: false, error: 'این کد تخفیف غیرفعال شده است.' };
  }

  // Check Expiration
  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return { valid: false, error: 'زمان استفاده از این کد فرا نرسیده است.' };
  }
  if (coupon.endDate && new Date(coupon.endDate) < now) {
    return { valid: false, error: 'مهلت استفاده از این کد تمام شده است.' };
  }

  // Check Global Usage Limits
  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: 'ظرفیت استفاده از این کد تکمیل شده است.' };
  }

  // Check Per User Usage Limits
  if (userId && coupon.maxUsesPerUser !== undefined) {
    const userCount = coupon.userUsage?.[String(userId)] || 0;
    if (userCount >= coupon.maxUsesPerUser) {
      return { valid: false, error: 'شما بیش از حد مجاز از این کد تخفیف استفاده کرده‌اید.' };
    }
  }

  // Check Min Order Amount
  if (coupon.minOrderAmount !== undefined && orderTotal < coupon.minOrderAmount) {
    return { valid: false, error: `حداقل مبلغ سفارش برای این کد ${coupon.minOrderAmount.toLocaleString()} تومان است.` };
  }

  // Check Product/Category Restrictions
  if (cartItems && cartItems.length > 0) {
    const hasProductRestriction = coupon.allowedProductIds && coupon.allowedProductIds.length > 0;
    const hasCategoryRestriction = coupon.allowedCategoryIds && coupon.allowedCategoryIds.length > 0;

    if (hasProductRestriction || hasCategoryRestriction) {
      // Eligibility is enforced in calcDiscount; here we skip heavy checks

      // We need a more robust check. Let's defer strict eligibility check to calcDiscount 
      // but ensure at least ONE item matches if restrictions apply.
      // However, we can't easily check category ID without fetching product details.
      // Let's update calcDiscount to handle this fully.
    }
  }

  return { valid: true, coupon };
}

export function incrementCouponUsage(code: string, userId?: string | number) {
  const coupons = getCoupons();
  const index = coupons.findIndex(c => c.code.toUpperCase() === code.trim().toUpperCase());
  if (index !== -1) {
    coupons[index].usedCount += 1;
    
    if (userId) {
      if (!coupons[index].userUsage) {
        coupons[index].userUsage = {};
      }
      const uid = String(userId);
      coupons[index].userUsage![uid] = (coupons[index].userUsage![uid] || 0) + 1;
    }

    saveCoupons(coupons);
  }
}

export function calcDiscount(
  subtotal: number, 
  coupon: Coupon | null, 
  cartItems: { id: string | number; price: number; quantity: number; category?: string; categoryId?: string | number }[] = []
): number {
  if (!coupon) return 0;

  let eligibleTotal = subtotal;

  // Apply restrictions
  const hasProductRestriction = coupon.allowedProductIds && coupon.allowedProductIds.length > 0;
  const hasCategoryRestriction = coupon.allowedCategoryIds && coupon.allowedCategoryIds.length > 0;

  if (hasProductRestriction || hasCategoryRestriction) {
    eligibleTotal = 0;
    cartItems.forEach(item => {
      let isEligible = true;

      if (hasProductRestriction) {
        if (!coupon.allowedProductIds!.some(id => String(id) === String(item.id))) {
          isEligible = false;
        }
      }

      // OR logic for category? usually it's AND if both present, or OR? 
      // Typically: Allowed if in AllowedProducts OR in AllowedCategories.
      // Let's implement OR logic: If product is allowed OR category is allowed.
      // Wait, if BOTH lists exist, usually it means "must be this product" OR "must be in this category".
      
      let categoryMatch = false;
      if (hasCategoryRestriction) {
        // We need category ID. If not present in item, we might fail or need to fetch.
        // Assuming item might have categoryId or we match by something else.
        // For simplicity in this iteration, let's assume we pass categoryId if available.
        if (item.categoryId && coupon.allowedCategoryIds!.some(id => String(id) === String(item.categoryId))) {
            categoryMatch = true;
        }
      }
      
      let productMatch = false;
      if (hasProductRestriction) {
         if (coupon.allowedProductIds!.some(id => String(id) === String(item.id))) {
             productMatch = true;
         }
      }

      // Logic: 
      // If only product restriction: must match product.
      // If only category restriction: must match category.
      // If both: match EITHER? or match intersection? 
      // Common e-commerce: "Applies to these products and these categories". So union.
      
      const productRestricted = hasProductRestriction;
      const categoryRestricted = hasCategoryRestriction;

      if (productRestricted && !categoryRestricted) {
          isEligible = productMatch;
      } else if (!productRestricted && categoryRestricted) {
          isEligible = categoryMatch;
      } else if (productRestricted && categoryRestricted) {
          isEligible = productMatch || categoryMatch;
      }

      if (isEligible) {
        eligibleTotal += (item.price * item.quantity);
      }
    });
  }

  if (eligibleTotal <= 0) return 0;

  if (coupon.type === 'percent') {
    return Math.floor((eligibleTotal * coupon.value) / 100);
  }
  
  // Fixed amount: cannot exceed eligible total
  return Math.min(eligibleTotal, coupon.value);
}
