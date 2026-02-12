'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { AdminUser } from '@/data/admins';
import { revalidatePath } from 'next/cache';

export async function getAdminsAction() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['admin', 'super_admin']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const admins: AdminUser[] = users.map((u) => ({
      id: u.id,
      name: u.name || '',
      username: u.username || u.email || '', // Fallback to email if username is missing
      role: u.role as 'admin' | 'super_admin',
      permissions: u.permissions ? JSON.parse(u.permissions) : [],
      isActive: u.isActive,
      // password is not returned for security
    }));

    return { success: true, data: admins };
  } catch (error) {
    console.error('Error fetching admins:', error);
    return { success: false, error: 'Failed to fetch admins' };
  }
}

export async function createAdminAction(data: Omit<AdminUser, 'id'> & { password?: string }) {
  try {
    // Check if username exists
    const existing = await prisma.user.findUnique({
      where: { username: data.username }
    });

    if (existing) {
      return { success: false, error: 'این نام کاربری قبلا استفاده شده است.' };
    }

    // In a real app, hash the password here.
    // const hashedPassword = await hash(data.password);
    const password = data.password || 'admin'; // Default or plain text for now

    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.username.includes('@') ? data.username : undefined, // Optional: infer email
        password: password,
        role: data.role,
        permissions: JSON.stringify(data.permissions),
        isActive: data.isActive,
      }
    });

    revalidatePath('/admin/admins');
    return { success: true, data: user };
  } catch (error) {
    console.error('Error creating admin:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateAdminAction(id: string, data: Partial<AdminUser> & { password?: string }) {
  try {
    // Check if username is taken by another user
    if (data.username) {
      const existing = await prisma.user.findUnique({
        where: { username: data.username }
      });
      if (existing && existing.id !== id) {
        return { success: false, error: 'این نام کاربری توسط مدیر دیگری استفاده شده است.' };
      }
    }

    const updateData: Prisma.UserUpdateInput = {
      ...(data.name && { name: data.name }),
      ...(data.username && { username: data.username }),
      ...(data.role && { role: data.role }),
      ...(data.permissions && { permissions: JSON.stringify(data.permissions) }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    };

    if (data.password) {
      (updateData as Prisma.UserUpdateInput).password = data.password;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/admin/admins');
    return { success: true, data: user };
  } catch (error) {
    console.error('Error updating admin:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteAdminAction(id: string) {
  try {
    // Prevent deleting the last super_admin or self?
    // For now just delete
    await prisma.user.delete({
      where: { id }
    });

    revalidatePath('/admin/admins');
    return { success: true };
  } catch (error) {
    console.error('Error deleting admin:', error);
    return { success: false, error: String(error) };
  }
}
