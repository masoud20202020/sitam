'use server';

import { prisma } from '@/lib/prisma';
import { emitInventoryUpdate } from '@/lib/chatEvents';

export async function getInventoryLogsAction() {
  try {
    const logs = await prisma.inventoryLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
    return { success: true, data: logs };
  } catch (error) {
    console.error('Error fetching inventory logs:', error);
    return { success: false, error: String(error) };
  }
}

export async function clearInventoryLogsAction() {
  try {
    await prisma.inventoryLog.deleteMany({});
    emitInventoryUpdate();
    return { success: true };
  } catch (error) {
    console.error('Error clearing inventory logs:', error);
    return { success: false, error: String(error) };
  }
}

export async function addInventoryLogAction(log: {
  productId: string;
  productName: string;
  adminName: string;
  changeType: string;
  oldStock: number;
  newStock: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const created = await prisma.inventoryLog.create({
      data: {
        productId: log.productId,
        productName: log.productName,
        adminName: log.adminName,
        changeType: log.changeType,
        oldStock: log.oldStock,
        newStock: log.newStock,
      }
    });
    emitInventoryUpdate(created.id);
    return { success: true };
  } catch (error) {
    console.error('Error creating inventory log:', error);
    return { success: false, error: String(error) };
  }
}
