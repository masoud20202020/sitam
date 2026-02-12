export type CommentItem = {
  id: string | number;
  productId: string | number;
  author: string;
  rating: number;
  ratingQuality?: number;
  ratingValue?: number;
  ratingPackaging?: number;
  content: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected';
  helpfulUp?: number;
  helpfulDown?: number;
  reply?: string;
  replyAt?: number;
};

const STORAGE_KEY = 'comments';

const seedComments: CommentItem[] = [
  {
    id: 101,
    productId: 1,
    author: 'علی محمدی',
    rating: 5,
    ratingQuality: 5,
    ratingValue: 5,
    ratingPackaging: 5,
    content: 'محصول بسیار باکیفیتی بود، دقیقاً همونی که توی عکس بود. ارسال هم سریع انجام شد.',
    createdAt: Date.now() - 86400000, // 1 day ago
    status: 'approved',
    helpfulUp: 12,
    helpfulDown: 1
  },
  {
    id: 102,
    productId: 2,
    author: 'سارا احمدی',
    rating: 3,
    ratingQuality: 4,
    ratingValue: 2,
    ratingPackaging: 4,
    content: 'کیفیت ساخت خوبه اما قیمتش نسبت به بازار کمی بالاست. اگر تخفیف بخوره ارزش خرید داره.',
    createdAt: Date.now() - 172800000, // 2 days ago
    status: 'pending',
    helpfulUp: 5,
    helpfulDown: 0
  }
];

function read(): CommentItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedComments));
    return seedComments;
  }
  try {
    const list: CommentItem[] = JSON.parse(raw);
    // If list is empty but we have seeds, populate them (for dev convenience)
    if (Array.isArray(list) && list.length === 0 && seedComments.length > 0) {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(seedComments));
       return seedComments;
    }
    return Array.isArray(list) ? list : [];
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedComments));
    return seedComments;
  }
}

function write(list: CommentItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getComments(): CommentItem[] {
  return read();
}

export function getCommentsByProduct(productId: string | number): CommentItem[] {
  return read().filter(c => String(c.productId) === String(productId));
}

export function addComment(input: Omit<CommentItem, 'id' | 'createdAt' | 'status'> & { status?: CommentItem['status'] }) {
  const list = read();
  const avg =
    Math.round(
      (((input.ratingQuality ?? input.rating) + (input.ratingValue ?? input.rating) + (input.ratingPackaging ?? input.rating)) / 3) * 10
    ) / 10;
  const newItem: CommentItem = {
    id: Date.now(),
    productId: input.productId,
    author: input.author,
    rating: Math.max(1, Math.min(5, Number(avg) || 5)),
    ratingQuality: Math.max(1, Math.min(5, Number(input.ratingQuality ?? input.rating) || 5)),
    ratingValue: Math.max(1, Math.min(5, Number(input.ratingValue ?? input.rating) || 5)),
    ratingPackaging: Math.max(1, Math.min(5, Number(input.ratingPackaging ?? input.rating) || 5)),
    content: input.content,
    createdAt: Date.now(),
    status: input.status ?? 'pending',
    helpfulUp: 0,
    helpfulDown: 0,
  };
  list.push(newItem);
  write(list);
  return newItem;
}

export function updateComment(id: string | number, patch: Partial<CommentItem>) {
  const list = read();
  const idx = list.findIndex(c => String(c.id) === String(id));
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  write(list);
  return list[idx];
}

export function deleteComment(id: string | number) {
  const list = read().filter(c => String(c.id) !== String(id));
  write(list);
}

export function getAverageRating(productId: string | number): number {
  const approved = getCommentsByProduct(productId).filter(c => c.status === 'approved');
  if (approved.length === 0) return 0;
  const sum = approved.reduce((acc, c) => acc + (typeof c.rating === 'number' ? c.rating : 0), 0);
  return Math.round((sum / approved.length) * 10) / 10;
}

export function getApprovedCount(productId: string | number): number {
  return getCommentsByProduct(productId).filter(c => c.status === 'approved').length;
}

export function voteHelpful(id: string | number, up: boolean) {
  const list = read();
  const idx = list.findIndex(c => String(c.id) === String(id));
  if (idx === -1) return;
  const curr = list[idx];
  list[idx] = {
    ...curr,
    helpfulUp: (curr.helpfulUp ?? 0) + (up ? 1 : 0),
    helpfulDown: (curr.helpfulDown ?? 0) + (!up ? 1 : 0),
  };
  write(list);
  return list[idx];
}

export function getHelpfulScore(c: CommentItem): number {
  return (c.helpfulUp ?? 0) - (c.helpfulDown ?? 0);
}

import { getOrders, getUser } from '@/data/account';
import { addNotification } from '@/data/notifications';
export function canCurrentUserReview(productId: string | number): boolean {
  const user = getUser();
  if (!user) return false;
  const orders = getOrders().filter(o => o.userId === user.id);
  return orders.some(o => o.items.some(it => String(it.id) === String(productId)));
}

// Hook notifications on new comment
export function notifyNewComment(c: CommentItem) {
  addNotification('review_new', 'نظر جدید ثبت شد', { productId: c.productId, author: c.author, id: c.id });
}
