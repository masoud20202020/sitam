'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { SiteSettings, defaultSettings } from '@/data/settings';
import { SMSSettings, defaultSMSSettings } from '@/data/smsSettings';
import { AdminNotificationSettings, defaultAdminNotificationSettings } from '@/data/adminNotificationSettings';
import { PaymentGateway } from '@/data/paymentGateways';

// --- General Site Settings ---

export async function getSettingsAction() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'site_settings' },
    });

    if (setting) {
      return { success: true, data: JSON.parse(setting.value) as SiteSettings };
    }
    return { success: true, data: defaultSettings };
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateSettingsAction(settings: SiteSettings) {
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'site_settings' },
      update: { value: JSON.stringify(settings) },
      create: { key: 'site_settings', value: JSON.stringify(settings) },
    });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating site settings:', error);
    return { success: false, error: String(error) };
  }
}

// --- SMS Settings ---

export async function getSMSSettingsAction() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'sms_settings' },
    });

    if (setting) {
      return { success: true, data: JSON.parse(setting.value) as SMSSettings };
    }
    return { success: true, data: defaultSMSSettings };
  } catch (error) {
    console.error('Error fetching SMS settings:', error);
    return { success: false, error: String(error) };
  }
}

export async function saveSMSSettingsAction(settings: SMSSettings) {
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'sms_settings' },
      update: { value: JSON.stringify(settings) },
      create: { key: 'sms_settings', value: JSON.stringify(settings) },
    });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error saving SMS settings:', error);
    return { success: false, error: String(error) };
  }
}

// --- Admin Notification Settings ---

export async function getAdminNotificationSettingsAction() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'admin_notification_settings' },
    });

    if (setting) {
      return { success: true, data: JSON.parse(setting.value) as AdminNotificationSettings };
    }
    return { success: true, data: defaultAdminNotificationSettings };
  } catch (error) {
    console.error('Error fetching admin notification settings:', error);
    return { success: false, error: String(error) };
  }
}

export async function saveAdminNotificationSettingsAction(settings: AdminNotificationSettings) {
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'admin_notification_settings' },
      update: { value: JSON.stringify(settings) },
      create: { key: 'admin_notification_settings', value: JSON.stringify(settings) },
    });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error saving admin notification settings:', error);
    return { success: false, error: String(error) };
  }
}

// --- Payment Gateways ---

export async function getPaymentGatewaysAction() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'payment_gateways' },
    });

    if (setting) {
      return { success: true, data: JSON.parse(setting.value) as PaymentGateway[] };
    }
    return { success: true, data: [] };
  } catch (error) {
    console.error('Error fetching payment gateways:', error);
    return { success: false, error: String(error) };
  }
}

export async function savePaymentGatewaysAction(gateways: PaymentGateway[]) {
  try {
    await prisma.systemSetting.upsert({
      where: { key: 'payment_gateways' },
      update: { value: JSON.stringify(gateways) },
      create: { key: 'payment_gateways', value: JSON.stringify(gateways) },
    });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error saving payment gateways:', error);
    return { success: false, error: String(error) };
  }
}
