export type SMSSettings = {
  enabled: boolean;
  apiKey: string;
  senderNumber: string;
  templates: {
    processing: string;
    shipped: string;
    delivered: string;
    cancelled: string;
  };
};

const SMS_SETTINGS_KEY = 'sms_settings';

export const defaultSMSSettings: SMSSettings = {
  enabled: false,
  apiKey: '',
  senderNumber: '',
  templates: {
    processing: 'سفارش شما با شماره {orderId} ثبت شد و در حال پردازش است.',
    shipped: 'سفارش {orderId} تحویل پست داده شد. کد رهگیری: {trackingNumber}',
    delivered: 'سفارش {orderId} به شما تحویل داده شد. از خرید شما متشکریم.',
    cancelled: 'سفارش {orderId} لغو شد.',
  },
};

export function getSMSSettings(): SMSSettings {
  if (typeof window === 'undefined') return defaultSMSSettings;
  const raw = localStorage.getItem(SMS_SETTINGS_KEY);
  if (!raw) {
    localStorage.setItem(SMS_SETTINGS_KEY, JSON.stringify(defaultSMSSettings));
    return defaultSMSSettings;
  }
  try {
    const parsed = JSON.parse(raw);
    // Deep merge templates to ensure all keys exist
    return {
      ...defaultSMSSettings,
      ...parsed,
      templates: { ...defaultSMSSettings.templates, ...parsed.templates }
    };
  } catch {
    return defaultSMSSettings;
  }
}

export function saveSMSSettings(settings: SMSSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SMS_SETTINGS_KEY, JSON.stringify(settings));
}
