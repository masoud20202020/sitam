
import { HeaderClient } from './HeaderClient';
import { getSiteSettings } from '@/app/actions/settings';

export const Header = async () => {
  const settings = await getSiteSettings();
  return <HeaderClient settings={settings} />;
};
