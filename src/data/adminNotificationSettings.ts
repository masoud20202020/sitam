
export type AdminTelegramSettings = {
  enabled: boolean;
  botToken: string;
  chatId: string;
};

export type AdminWhatsAppSettings = {
  enabled: boolean;
  apiKey: string;
  phoneNumber: string; // The admin's phone number to receive messages
};

export type AdminSMSSettings = {
  enabled: boolean;
  phoneNumber: string; // The admin's phone number
  // We can reuse the main SMS provider settings (API Key) from the main SMS settings, 
  // or add specific ones here if needed. For simplicity, we'll assume it uses the main SMS service.
};

export type AdminNotificationSettings = {
  telegram: AdminTelegramSettings;
  whatsapp: AdminWhatsAppSettings;
  sms: AdminSMSSettings;
};

const ADMIN_NOTIF_SETTINGS_KEY = 'admin_notification_settings';

export const defaultAdminNotificationSettings: AdminNotificationSettings = {
  telegram: {
    enabled: false,
    botToken: '',
    chatId: '',
  },
  whatsapp: {
    enabled: false,
    apiKey: '',
    phoneNumber: '',
  },
  sms: {
    enabled: false,
    phoneNumber: '',
  },
};

export function getAdminNotificationSettings(): AdminNotificationSettings {
  if (typeof window === 'undefined') return defaultAdminNotificationSettings;
  const raw = localStorage.getItem(ADMIN_NOTIF_SETTINGS_KEY);
  if (!raw) {
    localStorage.setItem(ADMIN_NOTIF_SETTINGS_KEY, JSON.stringify(defaultAdminNotificationSettings));
    return defaultAdminNotificationSettings;
  }
  try {
    const parsed = JSON.parse(raw);
    // Deep merge to ensure structure
    return {
      telegram: { ...defaultAdminNotificationSettings.telegram, ...parsed.telegram },
      whatsapp: { ...defaultAdminNotificationSettings.whatsapp, ...parsed.whatsapp },
      sms: { ...defaultAdminNotificationSettings.sms, ...parsed.sms },
    };
  } catch {
    return defaultAdminNotificationSettings;
  }
}

export function saveAdminNotificationSettings(settings: AdminNotificationSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_NOTIF_SETTINGS_KEY, JSON.stringify(settings));
}
