'use server';

import { prisma } from '@/lib/prisma';
// No local account types needed here

export type PrismaReturnItem = {
  productId: string;
  quantity: number;
};

export type PrismaReturnRequest = {
  id: string;
  orderId: string;
  items: PrismaReturnItem[];
  reason: string;
  requestedAt: Date;
  status: 'requested' | 'approved' | 'rejected' | 'refunded';
  refundAmount?: number;
  decisionAt?: Date;
  note?: string;
};

export async function addReturnRequestAction(
  orderId: string,
  payload: { items: { id: string | number; quantity: number }[]; reason: string; note?: string },
  _userId: string, // kept for future use (e.g., audit), not stored in Prisma model
): Promise<PrismaReturnRequest | null> {
  void _userId;
  try {
    const itemsPayload: PrismaReturnItem[] = payload.items.map(item => ({
      productId: String(item.id),
      quantity: item.quantity,
    }));

    const newReturnRequest = await prisma.returnRequest.create({
      data: {
        orderId: orderId,
        reason: payload.reason,
        note: payload.note,
        status: 'requested',
        requestedAt: new Date(),
        items: JSON.stringify(itemsPayload),
      }
    });

    const mapped: PrismaReturnRequest = {
      id: newReturnRequest.id,
      orderId: newReturnRequest.orderId,
      items: itemsPayload,
      reason: newReturnRequest.reason,
      requestedAt: newReturnRequest.requestedAt,
      status: newReturnRequest.status as PrismaReturnRequest['status'],
      refundAmount: newReturnRequest.refundAmount ?? undefined,
      decisionAt: newReturnRequest.decisionAt ?? undefined,
      note: newReturnRequest.note ?? undefined,
    };
    return mapped;
  } catch (error) {
    console.error('Failed to add return request via Prisma:', error);
    return null;
  }
}
