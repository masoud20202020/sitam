'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getCouponsAction() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    // Parse JSON fields
    const parsedCoupons = coupons.map(c => ({
      ...c,
      allowedProductIds: c.allowedProductIds ? JSON.parse(c.allowedProductIds) : [],
      allowedCategoryIds: c.allowedCategoryIds ? JSON.parse(c.allowedCategoryIds) : [],
    }));

    return { success: true, data: parsedCoupons };
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return { success: false, error: String(error) };
  }
}

type CouponInput = {
  code: string;
  type: 'percent' | 'fixed' | string;
  value: number;
  active?: boolean;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  maxUses?: number | null;
  maxUsesPerUser?: number | null;
  minOrderAmount?: number | null;
  allowedProductIds?: (string | number)[] | null;
  allowedCategoryIds?: (string | number)[] | null;
};

export async function createCouponAction(data: CouponInput) {
  try {
    const { allowedProductIds, allowedCategoryIds, ...rest } = data;
    
    const coupon = await prisma.coupon.create({
      data: {
        ...rest,
        startDate: rest.startDate ? new Date(rest.startDate as string | Date) : null,
        endDate: rest.endDate ? new Date(rest.endDate as string | Date) : null,
        allowedProductIds: allowedProductIds ? JSON.stringify(allowedProductIds) : null,
        allowedCategoryIds: allowedCategoryIds ? JSON.stringify(allowedCategoryIds) : null,
      },
    });
    
    revalidatePath('/admin/coupons');
    return { success: true, data: coupon };
  } catch (error) {
    console.error('Error creating coupon:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateCouponAction(id: string, data: Partial<CouponInput>) {
  try {
    const { allowedProductIds, allowedCategoryIds, ...rest } = data;
    
    // Filter out fields that shouldn't be updated or transform dates
    const updateData: Prisma.CouponUpdateInput = { ...(rest as Prisma.CouponUpdateInput) };
    if (rest.startDate !== undefined) updateData.startDate = rest.startDate ? new Date(rest.startDate as string | Date) : null;
    if (rest.endDate !== undefined) updateData.endDate = rest.endDate ? new Date(rest.endDate as string | Date) : null;
    if (allowedProductIds !== undefined) updateData.allowedProductIds = allowedProductIds ? JSON.stringify(allowedProductIds) : null;
    if (allowedCategoryIds !== undefined) updateData.allowedCategoryIds = allowedCategoryIds ? JSON.stringify(allowedCategoryIds) : null;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });
    
    revalidatePath('/admin/coupons');
    return { success: true, data: coupon };
  } catch (error) {
    console.error('Error updating coupon:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteCouponAction(id: string) {
  try {
    await prisma.coupon.delete({
      where: { id },
    });
    revalidatePath('/admin/coupons');
    return { success: true };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { success: false, error: String(error) };
  }
}

export async function validateCouponAction(code: string, orderTotal: number = 0, userId?: string, cartItems?: { id: string; categoryId?: string }[]) {
  try {
    const coupon = await prisma.coupon.findFirst({
      where: { code: code.trim() },
    });
    if (!coupon) return { success: false, error: 'کد تخفیف معتبر نیست.' };
    if (!coupon.active) return { success: false, error: 'این کد تخفیف غیرفعال شده است.' };
    const now = new Date();
    if (coupon.startDate && coupon.startDate > now) return { success: false, error: 'زمان استفاده از این کد فرا نرسیده است.' };
    if (coupon.endDate && coupon.endDate < now) return { success: false, error: 'مهلت استفاده از این کد تمام شده است.' };
    if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) return { success: false, error: 'ظرفیت استفاده از این کد تکمیل شده است.' };
    if (userId && coupon.maxUsesPerUser !== null && coupon.maxUsesPerUser !== undefined) {
      // Without per-user usage storage, we cannot enforce strictly. Assume allowed.
    }
    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) return { success: false, error: 'حداقل مبلغ سفارش برای این کد رعایت نشده است.' };
    const allowedProductIds = coupon.allowedProductIds ? JSON.parse(coupon.allowedProductIds) as string[] : [];
    const allowedCategoryIds = coupon.allowedCategoryIds ? JSON.parse(coupon.allowedCategoryIds) as string[] : [];
    if (allowedProductIds.length > 0 || allowedCategoryIds.length > 0) {
      const eligible = (cartItems || []).some(it => (allowedProductIds.includes(String(it.id))) || (it.categoryId && allowedCategoryIds.includes(String(it.categoryId))));
      if (!eligible) return { success: false, error: 'این کد برای آیتم‌های سبد شما مجاز نیست.' };
    }
    return { success: true, data: coupon };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { success: false, error: String(error) };
  }
}

export async function incrementCouponUsageAction(code: string) {
  try {
    const coupon = await prisma.coupon.findFirst({ where: { code } });
    if (!coupon) return { success: false, error: 'کد تخفیف یافت نشد.' };
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        usedCount: (coupon.usedCount || 0) + 1,
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Error incrementing coupon usage:', error);
    return { success: false, error: String(error) };
  }
}
