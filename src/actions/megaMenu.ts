'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath, unstable_cache } from 'next/cache';

export type MegaMenuLink = {
  id: string;
  title: string;
  href: string;
};

export type MegaMenuSubCategory = {
  id: string;
  title: string;
  links: MegaMenuLink[];
};

export type MegaMenuItem = {
  id: string;
  title: string;
  href: string;
  active: boolean;
  order: number;
  icon?: string;
  subCategories: MegaMenuSubCategory[];
};

const DATA_FILE_PATH = path.join(process.cwd(), 'src/data/megaMenu.json');

async function getMegaMenuData(): Promise<MegaMenuItem[]> {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading mega menu data:', error);
    return [];
  }
}

export const getMegaMenu = unstable_cache(
  async () => {
    return await getMegaMenuData();
  },
  ['mega-menu-data'],
  {
    tags: ['mega-menu'],
    revalidate: 3600 // Fallback revalidation every hour
  }
);

export async function updateMegaMenuServer(items: MegaMenuItem[]) {
  try {
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(items, null, 2), 'utf-8');
    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error saving mega menu data:', error);
    return { success: false, error: 'Failed to save data' };
  }
}
