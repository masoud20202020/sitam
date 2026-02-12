'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { emitOrdersUpdate } from '@/lib/chatEvents';

export async function getOrdersAction() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        address: true,
        user: true,
        returns: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return { success: true, data: orders };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, error: String(error) };
  }
}

export async function getUserOrdersAction(userId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        address: true,
        returns: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return { success: true, data: orders };
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return { success: false, error: String(error) };
  }
}

export async function createOrderAction(data: {
  userId?: string;
  total: number;
  discount?: number;
  paymentMethod: string;
  shippingMethod: string;
  addressId?: string;
  address?: {
    fullName: string;
    phone: string;
    province: string;
    city: string;
    addressLine: string;
    postalCode: string;
  };
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    color?: string;
    size?: string;
    variantId?: string;
  }>;
  note?: string;
}) {
  try {
    let finalAddressId = data.addressId;

    // Create address if object provided
    if (data.address && !finalAddressId) {
      const address = await prisma.address.create({
        data: {
          userId: data.userId,
          fullName: data.address.fullName,
          phone: data.address.phone,
          province: data.address.province,
          city: data.address.city,
          addressLine: data.address.addressLine,
          postalCode: data.address.postalCode,
        }
      });
      finalAddressId = address.id;
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: data.userId,
        total: data.total,
        discount: data.discount,
        paymentMethod: data.paymentMethod,
        shippingMethod: data.shippingMethod,
        addressId: finalAddressId,
        note: data.note,
        status: 'processing',
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            color: item.color,
            size: item.size,
            variantId: item.variantId
          }))
        }
      },
      include: {
        items: true,
        address: true
      }
    });

    revalidatePath('/admin/orders');
    return { success: true, data: order };
  } catch (error: unknown) {
    console.error('Error creating order:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function updateOrderAction(id: string, data: Prisma.OrderUpdateInput) {
  try {
    const order = await prisma.order.update({
      where: { id },
      data,
    });
    revalidatePath('/admin/orders');
    emitOrdersUpdate(id);
    return { success: true, data: order };
  } catch (error) {
    console.error('Error updating order:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateReturnRequestAction(
  returnId: string,
  data: { status?: string; refundAmount?: number; note?: string }
) {
  try {
    const request = await prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        ...data,
        decisionAt: data.status && data.status !== 'requested' ? new Date() : undefined,
      },
    });
    revalidatePath('/admin/orders');
    emitOrdersUpdate();
    return { success: true, data: request };
  } catch (error) {
    console.error('Error updating return request:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteOrderAction(id: string) {
  try {
    await prisma.order.delete({
      where: { id },
    });
    revalidatePath('/admin/orders');
    emitOrdersUpdate();
    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false, error: String(error) };
  }
}

export async function generateMockOrdersAction() {
  // This function is for seeding some data if needed via UI, 
  // but we prefer using the seed script. 
  // For now, we can leave it empty or implement basic seeding if requested.
  return { success: true, message: 'Not implemented via server action. Use seed script.' };
}
