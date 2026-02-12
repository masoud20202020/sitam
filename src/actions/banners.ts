'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  link?: string | null;
  active: boolean;
  order: number;
  position: string;
  backgroundColor?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getBannersAction() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: {
        order: 'asc',
      },
    });
    return { success: true, data: banners };
  } catch (error) {
    console.error('Error fetching banners:', error);
    return { success: false, error: String(error) };
  }
}

export async function createBannerAction(data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        image: data.image,
        link: data.link,
        active: data.active,
        order: data.order,
        position: data.position,
        backgroundColor: data.backgroundColor,
      },
    });
    revalidatePath('/admin/banners');
    revalidatePath('/'); // Revalidate home page as banners are used there
    return { success: true, data: banner };
  } catch (error) {
    console.error('Error creating banner:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateBannerAction(id: string, data: Partial<Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>>) {
  try {
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        image: data.image,
        link: data.link,
        active: data.active,
        order: data.order,
        position: data.position,
        backgroundColor: data.backgroundColor,
      },
    });
    revalidatePath('/admin/banners');
    revalidatePath('/');
    return { success: true, data: banner };
  } catch (error) {
    console.error('Error updating banner:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteBannerAction(id: string) {
  try {
    await prisma.banner.delete({
      where: { id },
    });
    revalidatePath('/admin/banners');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting banner:', error);
    return { success: false, error: String(error) };
  }
}
