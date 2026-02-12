
import { FooterClient } from './FooterClient';
import { getSiteSettings } from '@/app/actions/settings';
import { getCategoriesAction } from '@/actions/categories';

export const Footer = async () => {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getCategoriesAction()
  ]);

  const activeCategories = categories.filter(c => c.isActive).slice(0, 5);

  return <FooterClient settings={settings} categories={activeCategories} />;
};
