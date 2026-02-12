'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCustomersAction() {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'user' },
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true,
            status: true,
          }
        },
        addresses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to match frontend needs if necessary, or return as is
    // The frontend expects: Customer interface + metrics
    // We can return the raw users and let frontend compute or compute here.
    // Let's compute metrics here to simplify frontend.

    const customers = users.map(user => {
      const totalOrders = user.orders.length;
      const totalSpend = user.orders.reduce((sum, order) => sum + (order.status !== 'cancelled' ? order.total : 0), 0);
      const lastOrderDate = user.orders.length > 0 
        ? user.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt 
        : null;

      return {
        ...user,
        totalOrders,
        totalSpend,
        lastOrderDate,
      };
    });

    return { success: true, data: customers };
  } catch (error) {
    console.error('Error fetching customers:', error);
    return { success: false, error: String(error) };
  }
}

export async function createCustomerAction(data: { name: string; email?: string; phone?: string }) {
  try {
    // Check if email or phone exists
    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) return { success: false, error: 'این ایمیل قبلا ثبت شده است.' };
    }
    if (data.phone) {
      const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing) return { success: false, error: 'این شماره تماس قبلا ثبت شده است.' };
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        role: 'user',
      },
    });
    
    revalidatePath('/admin/customers');
    return { success: true, data: user };
  } catch (error) {
    console.error('Error creating customer:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateCustomerAction(id: string, data: { name?: string; email?: string; phone?: string }) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
      },
    });
    
    revalidatePath('/admin/customers');
    return { success: true, data: user };
  } catch (error) {
    console.error('Error updating customer:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    await prisma.user.delete({
      where: { id },
    });
    revalidatePath('/admin/customers');
    return { success: true };
  } catch (error) {
    console.error('Error deleting customer:', error);
    return { success: false, error: String(error) };
  }
}

export async function createAddressAction(data: {
  userId: string;
  fullName: string;
  phone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
}) {
  try {
    const address = await prisma.address.create({
      data
    });
    revalidatePath('/account');
    return { success: true, data: address };
  } catch (error: unknown) {
    console.error('Error creating address:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function loginOrSignupAction(phone: string, name?: string) {
  try {
    let user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: name || 'کاربر جدید',
          role: 'user'
        }
      });
    }

    return { success: true, data: user };
  } catch (error: unknown) {
    console.error('Error in loginOrSignupAction:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function deleteAddressAction(id: string) {
  try {
    await prisma.address.delete({
      where: { id }
    });
    revalidatePath('/account');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting address:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

export async function getCustomerDetailsAction(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
            include: {
                items: true,
            },
            orderBy: { createdAt: 'desc' }
        },
        addresses: true,
        wishlist: {
            include: {
                product: true
            }
        },
        // reviews? tickets?
      },
    });
    
    if (!user) return { success: false, error: 'Customer not found' };

    return { success: true, data: user };
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return { success: false, error: String(error) };
  }
}
