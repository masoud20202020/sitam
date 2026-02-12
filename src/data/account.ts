import { addReturnRequestAction } from '@/actions/returns';
import { updateOrderAction, updateReturnRequestAction } from '@/actions/orders';

export type User = {
  id: string | number;
  name?: string;
  email?: string;
  phone?: string;
  createdAt: number | string | Date;
};

export type AccountCartItem = {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  size?: string;
  variantId?: string;
};

export type Order = {
  id: string | number;
  items: AccountCartItem[];
  total: number;
  createdAt: number | string | Date;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  addressId?: number | string;
  shippingMethod?: string; // Changed from 'standard' | 'express' to string to support dynamic methods
  paymentMethod?: 'cod' | 'online';
  discount?: number;
  trackingNumber?: string;
  estimatedDelivery?: number | string | Date;
  userId?: number | string;
  returns?: ReturnRequest[];
  isViewed?: boolean;
};

export type ReturnItem = {
  id: string | number;
  quantity: number;
};

export type ReturnRequest = {
  id: string | number;
  items: ReturnItem[];
  reason: string;
  requestedAt: number | string;
  status: 'requested' | 'approved' | 'rejected' | 'refunded';
  refundAmount?: number;
  decisionAt?: number | string;
  note?: string;
};

export type Address = {
  id: string | number;
  fullName: string;
  phone: string;
  province?: string;
  city: string;
  addressLine: string;
  postalCode?: string;
  userId?: number | string;
};

export type WishlistItem = {
  productId: string | number;
  name: string;
  price: number;
  image?: string;
};

const USER_KEY = 'account_user';
export const ORDERS_KEY = 'account_orders';
const ADDRESSES_KEY = 'account_addresses';
const WISHLIST_KEY = 'account_wishlist';

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveUser(user: Omit<User, 'id' | 'createdAt'>) {
  if (typeof window === 'undefined') return null;
  const newUser: User = { id: Date.now(), createdAt: Date.now(), ...user };
  localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  window.dispatchEvent(new Event('user-change'));
  return newUser;
}

export function logoutUser() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('user-change'));
}

export function getOrders(userId?: string | number | null): Order[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(ORDERS_KEY);
  if (!raw) return [];
  try {
    const all = JSON.parse(raw) as Order[];
    if (userId === undefined) return all; // Admin or internal use
    if (userId === null) return []; // Guest: strict privacy, show nothing from storage
    return all.filter(a => String(a.userId) === String(userId));
  } catch {
    return [];
  }
}

export function addOrder(
  items: AccountCartItem[],
  total: number,
  meta?: { addressId?: number; shippingMethod?: string; paymentMethod?: 'cod' | 'online'; discount?: number }
) {
  const list = getOrders();
  const user = getUser();
  const order: Order = {
    id: Date.now(),
    items,
    total,
    createdAt: Date.now(),
    status: 'processing',
    addressId: meta?.addressId,
    shippingMethod: meta?.shippingMethod,
    paymentMethod: meta?.paymentMethod,
    discount: meta?.discount,
    userId: user?.id,
  };
  list.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  return order;
}

export function getAddresses(userId?: string | number | null): Address[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(ADDRESSES_KEY);
  if (!raw) return [];
  try {
    const all = JSON.parse(raw) as Address[];
    if (userId === undefined) return all; // Admin or internal use
    if (userId === null) return []; // Guest: strict privacy, show nothing from storage
    return all.filter(a => String(a.userId) === String(userId));
  } catch {
    return [];
  }
}

export function addAddress(addr: Omit<Address, 'id'>) {
  const list = getAddresses();
  const newAddr: Address = { id: Date.now(), ...addr };
  list.push(newAddr);
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify(list));
  return newAddr;
}

export function deleteAddress(id: number | string) {
  const list = getAddresses().filter(a => String(a.id) !== String(id));
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify(list));
}

export function getWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(WISHLIST_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WishlistItem[];
  } catch {
    return [];
  }
}

export function addToWishlist(item: WishlistItem) {
  const list = getWishlist();
  const exists = list.find(w => String(w.productId) === String(item.productId));
  if (!exists) {
    list.push(item);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  }
}

export function removeFromWishlist(productId: string | number) {
  const list = getWishlist().filter(w => String(w.productId) !== String(productId));
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

export function isWishlisted(productId: string | number) {
  return !!getWishlist().find(w => String(w.productId) === String(productId));
}

export function getOrderById(id: number | string): Order | undefined {
  return getOrders().find(o => String(o.id) === String(id));
}

export async function updateOrder(id: number | string, patch: Partial<Order>, userId?: string) {
  if (userId) {
    const prismaPatch: Record<string, unknown> = {};
    for (const key in patch) {
      if (key === 'createdAt' || key === 'estimatedDelivery') {
        prismaPatch[key] = patch[key] ? new Date(patch[key] as number) : undefined;
      } else if (key === 'items') {
        // Handle items update if needed, for now, we assume items are not updated via patch
      } else if (key === 'returns') {
        // Handle returns update if needed, for now, we assume returns are handled by addReturnRequest
      } else {
        prismaPatch[key] = (patch as Record<string, unknown>)[key] as unknown;
      }
    }

    const result = await updateOrderAction(String(id), prismaPatch);
    if (result.success && result.data) {
      type PrismaOrderItem = {
        id: string | number;
        productId: string | number;
        name?: string;
        price?: number | string;
        quantity?: number | string;
        image?: string;
        color?: string;
        size?: string;
      };
      type PrismaReturnItem = { productId: string | number; quantity: number | string };
      type PrismaReturn = {
        id: string | number;
        items?: PrismaReturnItem[];
        reason?: string | null;
        requestedAt: Date | string;
        status?: string;
        refundAmount?: number | null;
        decisionAt?: Date | string | null;
        note?: string | null;
      };
      type PrismaOrder = {
        id: string | number;
        items?: PrismaOrderItem[];
        total?: number | string;
        createdAt: Date | string | number;
        status: string;
        addressId?: string | number | null;
        shippingMethod?: string | null;
        paymentMethod?: string | null;
        discount?: number | null;
        trackingNumber?: string | null;
        estimatedDelivery?: Date | string | null;
        userId?: string | number | null;
        returns?: PrismaReturn[];
        isViewed?: boolean;
      };
      const r = result.data as unknown as PrismaOrder;
      const prismaItems = Array.isArray(r.items) ? r.items : [];
      const prismaReturns = Array.isArray(r.returns) ? r.returns : [];
      const mapped: Order = {
        id: typeof r.id === 'string' ? parseInt(r.id) : r.id,
        items: prismaItems.map((item) => ({
          id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
          productId: typeof item.productId === 'string' ? parseInt(item.productId) : item.productId,
          name: item.name,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 0,
          image: item.image,
          color: item.color,
          size: item.size,
        })) as AccountCartItem[],
        total: Number(r.total) || 0,
        createdAt: r.createdAt instanceof Date ? r.createdAt.getTime() : new Date(r.createdAt).getTime(),
        status: r.status as Order['status'],
        addressId: r.addressId ? (typeof r.addressId === 'string' ? parseInt(r.addressId) : r.addressId) : undefined,
        shippingMethod: r.shippingMethod || undefined,
        paymentMethod: r.paymentMethod === 'cod' || r.paymentMethod === 'online' ? r.paymentMethod : undefined,
        discount: typeof r.discount === 'number' ? r.discount : undefined,
        trackingNumber: r.trackingNumber ?? undefined,
        estimatedDelivery: r.estimatedDelivery ? (r.estimatedDelivery instanceof Date ? r.estimatedDelivery.getTime() : new Date(r.estimatedDelivery).getTime()) : undefined,
        userId: r.userId ? (typeof r.userId === 'string' ? parseInt(r.userId) : r.userId) : undefined,
        returns: prismaReturns.map((ret) => ({
          id: typeof ret.id === 'string' ? parseInt(ret.id) : ret.id,
          items: Array.isArray(ret.items)
            ? ret.items.map((ri) => ({ id: typeof ri.productId === 'string' ? parseInt(ri.productId) : ri.productId, quantity: Number(ri.quantity) || 0 }))
            : [],
          reason: ret.reason ?? '',
          requestedAt: ret.requestedAt instanceof Date ? ret.requestedAt.getTime() : new Date(ret.requestedAt).getTime(),
          status: (ret.status as ReturnRequest['status']) ?? 'requested',
          refundAmount: typeof ret.refundAmount === 'number' ? ret.refundAmount : undefined,
          decisionAt: ret.decisionAt ? (ret.decisionAt instanceof Date ? ret.decisionAt.getTime() : new Date(ret.decisionAt).getTime()) : undefined,
          note: ret.note ?? undefined,
        })),
        isViewed: typeof r.isViewed === 'boolean' ? r.isViewed : undefined,
      };
      return mapped;
    }
  }

  const list = getOrders();
  const idx = list.findIndex(o => String(o.id) === String(id));
  if (idx === -1) return;
  const updated: Order = { ...list[idx], ...patch };
  list[idx] = updated;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  return updated;
}

export async function addReturnRequest(
  orderId: number | string,
  payload: { items: ReturnItem[]; reason: string; note?: string },
  userId?: string,
) {
  if (userId) {
    const prismaReturn = await addReturnRequestAction(String(orderId), payload, userId);
    if (prismaReturn) {
      return {
        id: parseInt(prismaReturn.id),
        items: prismaReturn.items.map(item => ({ id: item.productId, quantity: item.quantity })),
        reason: prismaReturn.reason,
        requestedAt: prismaReturn.requestedAt.getTime(),
        status: prismaReturn.status,
        refundAmount: prismaReturn.refundAmount,
        decisionAt: prismaReturn.decisionAt?.getTime(),
        note: prismaReturn.note,
      } as ReturnRequest;
    }
  }

  const list = getOrders();
  const idx = list.findIndex(o => String(o.id) === String(orderId));
  if (idx === -1) return;
  const order = list[idx];
  const newReq: ReturnRequest = {
    id: Date.now(),
    items: payload.items,
    reason: payload.reason,
    requestedAt: Date.now(),
    status: 'requested',
    note: payload.note,
  };
  const updated: Order = { ...order, returns: [...(order.returns || []), newReq] };
  list[idx] = updated;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  return newReq;
}

export async function updateReturnRequest(
  orderId: number | string,
  returnId: number | string,
  patch: Partial<ReturnRequest>
) {
  // Try Prisma server action first (when a logged-in user context exists)
  try {
    const result = await updateReturnRequestAction(String(returnId), {
      status: patch.status,
      refundAmount: patch.refundAmount,
      note: patch.note,
    });
    if (result.success && result.data) {
      const req = result.data as {
        id: string;
        requestedAt: Date | string;
        decisionAt?: Date | string | null;
        status: string;
        reason?: string | null;
        refundAmount?: number | null;
        note?: string | null;
      };
      const requestedAt =
        req.requestedAt instanceof Date ? req.requestedAt.getTime() : new Date(req.requestedAt).getTime();
      const decisionAt =
        req.decisionAt ? (req.decisionAt instanceof Date ? req.decisionAt.getTime() : new Date(req.decisionAt).getTime()) : undefined;
      const mapped: ReturnRequest = {
        id: Number(req.id),
        items: [], // Items relation is not included by update; keep empty for client-side display
        reason: req.reason ?? '',
        requestedAt,
        status: (req.status === 'requested' || req.status === 'approved' || req.status === 'rejected' || req.status === 'refunded') ? req.status : 'requested',
        refundAmount: req.refundAmount ?? undefined,
        decisionAt,
        note: req.note ?? undefined,
      };
      return mapped;
    }
  } catch (err) {
    // Fall back to local storage below
    console.error('Failed to update return request via Prisma, falling back to local:', err);
  }

  // LocalStorage fallback
  const list = getOrders();
  const idx = list.findIndex(o => String(o.id) === String(orderId));
  if (idx === -1) return;
  const order = list[idx];
  const returns = [...(order.returns || [])];
  const rIdx = returns.findIndex(r => String(r.id) === String(returnId));
  if (rIdx === -1) return;
  const updatedReq: ReturnRequest = {
    ...returns[rIdx],
    ...patch,
    decisionAt: patch.status && patch.status !== 'requested' ? Date.now() : returns[rIdx].decisionAt,
  };
  returns[rIdx] = updatedReq;
  const updatedOrder: Order = { ...order, returns };
  list[idx] = updatedOrder;
  localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  return updatedReq;
}

export function generateMockData() {
  if (typeof window === 'undefined') return [];

  // Mock Addresses if none exist (or just ensure these exist)
  const mockAddresses: Address[] = [
    { id: 101, fullName: 'علی محمدی', phone: '09123456789', province: 'تهران', city: 'تهران', addressLine: 'خیابان ولیعصر، کوچه مهر، پلاک ۱', postalCode: '1234567890' },
    { id: 102, fullName: 'سارا احمدی', phone: '09351234567', province: 'اصفهان', city: 'اصفهان', addressLine: 'خیابان چهارباغ، مجتمع نیلوفر، واحد ۴', postalCode: '8173645281' },
    { id: 103, fullName: 'رضا کمالی', phone: '09109876543', province: 'فارس', city: 'شیراز', addressLine: 'بلوار زند، خیابان رودکی', postalCode: '7194837265' }
  ];
  
  const currentAddresses = getAddresses();
  // Add or update addresses
  const updatedAddresses = [...currentAddresses];
  mockAddresses.forEach(addr => {
      const index = updatedAddresses.findIndex(a => a.id === addr.id);
      if (index !== -1) {
          updatedAddresses[index] = addr; // Update existing
      } else {
          updatedAddresses.push(addr); // Add new
      }
  });
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify(updatedAddresses));

  // Mock Orders
  const mockOrders: Order[] = [
    {
      id: Date.now() - 1000000,
      items: [{ id: 1, name: 'تی‌شرت مردانه', price: 250000, quantity: 2, image: '', color: 'مشکی', size: 'L' }],
      total: 500000,
      createdAt: Date.now() - 86400000 * 2,
      status: 'delivered',
      addressId: 101,
      shippingMethod: 'post',
      paymentMethod: 'online',
      trackingNumber: '29837492837',
      userId: 101
    },
    {
      id: Date.now() - 500000,
      items: [{ id: 2, name: 'شلوار جین', price: 780000, quantity: 1, image: '', color: 'آبی', size: '32' }],
      total: 780000,
      createdAt: Date.now() - 86400000,
      status: 'processing',
      addressId: 102,
      shippingMethod: 'express',
      paymentMethod: 'cod',
      userId: 102
    },
    {
      id: Date.now(),
      items: [{ id: 3, name: 'کفش ورزشی', price: 1200000, quantity: 1, image: '', color: 'سفید', size: '42' }],
      total: 1200000,
      createdAt: Date.now() - 3600000,
      status: 'shipped',
      addressId: 103,
      shippingMethod: 'post',
      paymentMethod: 'online',
      trackingNumber: '912837465',
      userId: 103
    }
  ];

  const currentOrders = getOrders();
  const combined = [...currentOrders, ...mockOrders];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(combined));
  
  return combined;
}
