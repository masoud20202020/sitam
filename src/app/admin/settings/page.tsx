
import { Metadata } from 'next';
import SettingsClient from './SettingsClient';
import { getSettingsAction, getSMSSettingsAction, getAdminNotificationSettingsAction, getPaymentGatewaysAction } from '@/actions/settings';
import { defaultSettings } from '@/data/settings';
import { defaultSMSSettings } from '@/data/smsSettings';
import { defaultAdminNotificationSettings } from '@/data/adminNotificationSettings';

export const metadata: Metadata = {
  title: 'تنظیمات سایت | پنل مدیریت',
};

export default async function SettingsPage() {
  const [
    settings,
    smsSettings,
    adminNotifSettings,
    paymentGateways
  ] = await Promise.all([
    getSettingsAction(),
    getSMSSettingsAction(),
    getAdminNotificationSettingsAction(),
    getPaymentGatewaysAction()
  ]);

  return (
    <SettingsClient
      initialSettings={settings.success && settings.data ? settings.data : defaultSettings}
      initialSmsSettings={smsSettings.success && smsSettings.data ? smsSettings.data : defaultSMSSettings}
      initialAdminNotifSettings={adminNotifSettings.success && adminNotifSettings.data ? adminNotifSettings.data : defaultAdminNotificationSettings}
      initialPaymentGateways={paymentGateways.success && paymentGateways.data ? paymentGateways.data : []}
    />
  );
}
