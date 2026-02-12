
'use server';

import { prisma } from '@/lib/prisma';
import { SiteSettings, defaultSettings } from '@/data/settings';
import { SMSSettings, defaultSMSSettings } from '@/data/smsSettings';
import { AdminNotificationSettings, defaultAdminNotificationSettings } from '@/data/adminNotificationSettings';
import { PaymentGateway, defaultGateways } from '@/data/paymentGateways';

const SITE_SETTINGS_KEY = 'site_settings';
const SMS_SETTINGS_KEY = 'sms_settings';
const ADMIN_NOTIF_SETTINGS_KEY = 'admin_notification_settings';
const PAYMENT_GATEWAYS_KEY = 'payment_gateways';

// --- Site Settings ---

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SITE_SETTINGS_KEY },
    });

    if (!setting) {
      return defaultSettings;
    }

    const parsed = JSON.parse(setting.value);
    // Deep merge with defaults to ensure structure
    return {
      ...defaultSettings,
      ...parsed,
      about: { ...defaultSettings.about, ...(parsed.about || {}) },
      contact: { ...defaultSettings.contact, ...(parsed.contact || {}) },
      privacy: { ...defaultSettings.privacy, ...(parsed.privacy || {}) },
    };
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return defaultSettings;
  }
}

export async function updateSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
  try {
    const updated = await prisma.systemSetting.upsert({
      where: { key: SITE_SETTINGS_KEY },
      update: { value: JSON.stringify(settings) },
      create: { key: SITE_SETTINGS_KEY, value: JSON.stringify(settings) },
    });
    return JSON.parse(updated.value);
  } catch (error) {
    console.error('Error updating site settings:', error);
    throw new Error('Failed to update site settings');
  }
}

// --- SMS Settings ---

export async function getSMSSettingsAction(): Promise<SMSSettings> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SMS_SETTINGS_KEY },
    });

    if (!setting) {
      return defaultSMSSettings;
    }

    const parsed = JSON.parse(setting.value);
    return {
      ...defaultSMSSettings,
      ...parsed,
      templates: { ...defaultSMSSettings.templates, ...parsed.templates }
    };
  } catch (error) {
    console.error('Error fetching SMS settings:', error);
    return defaultSMSSettings;
  }
}

export async function updateSMSSettings(settings: SMSSettings): Promise<SMSSettings> {
  try {
    const updated = await prisma.systemSetting.upsert({
      where: { key: SMS_SETTINGS_KEY },
      update: { value: JSON.stringify(settings) },
      create: { key: SMS_SETTINGS_KEY, value: JSON.stringify(settings) },
    });
    return JSON.parse(updated.value);
  } catch (error) {
    console.error('Error updating SMS settings:', error);
    throw new Error('Failed to update SMS settings');
  }
}

// --- Admin Notification Settings ---

export async function getAdminNotificationSettingsAction(): Promise<AdminNotificationSettings> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: ADMIN_NOTIF_SETTINGS_KEY },
    });

    if (!setting) {
      return defaultAdminNotificationSettings;
    }

    const parsed = JSON.parse(setting.value);
    return {
      telegram: { ...defaultAdminNotificationSettings.telegram, ...parsed.telegram },
      whatsapp: { ...defaultAdminNotificationSettings.whatsapp, ...parsed.whatsapp },
      sms: { ...defaultAdminNotificationSettings.sms, ...parsed.sms },
    };
  } catch (error) {
    console.error('Error fetching admin notification settings:', error);
    return defaultAdminNotificationSettings;
  }
}

export async function updateAdminNotificationSettings(settings: AdminNotificationSettings): Promise<AdminNotificationSettings> {
  try {
    const updated = await prisma.systemSetting.upsert({
      where: { key: ADMIN_NOTIF_SETTINGS_KEY },
      update: { value: JSON.stringify(settings) },
      create: { key: ADMIN_NOTIF_SETTINGS_KEY, value: JSON.stringify(settings) },
    });
    return JSON.parse(updated.value);
  } catch (error) {
    console.error('Error updating admin notification settings:', error);
    throw new Error('Failed to update admin notification settings');
  }
}

// --- Payment Gateways ---

export async function getPaymentGatewaysAction(): Promise<PaymentGateway[]> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: PAYMENT_GATEWAYS_KEY },
    });

    if (!setting) {
      return defaultGateways;
    }

    const parsed = JSON.parse(setting.value);
    
    // 1. Update system gateways with stored config
    const systemGateways = defaultGateways.map(def => {
      const existing = parsed.find((p: PaymentGateway) => p.slug === def.slug);
      return existing ? { ...def, ...existing, config: { ...def.config, ...existing.config }, isSystem: true } : { ...def, isSystem: true };
    });

    // 2. Add custom gateways (those not in defaultGateways)
    const customGateways = parsed.filter((p: PaymentGateway) => 
      !defaultGateways.some(def => def.slug === p.slug) && p.slug !== 'cod'
    ).map((p: PaymentGateway) => ({ ...p, isSystem: false }));

    return [...systemGateways, ...customGateways];
  } catch (error) {
    console.error('Error fetching payment gateways:', error);
    return defaultGateways;
  }
}

export async function updatePaymentGateways(gateways: PaymentGateway[]): Promise<PaymentGateway[]> {
  try {
    const updated = await prisma.systemSetting.upsert({
      where: { key: PAYMENT_GATEWAYS_KEY },
      update: { value: JSON.stringify(gateways) },
      create: { key: PAYMENT_GATEWAYS_KEY, value: JSON.stringify(gateways) },
    });
    return JSON.parse(updated.value);
  } catch (error) {
    console.error('Error updating payment gateways:', error);
    throw new Error('Failed to update payment gateways');
  }
}
