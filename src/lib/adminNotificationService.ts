
import { AdminNotificationSettings } from '@/data/adminNotificationSettings';
import { SMSSettings } from '@/data/smsSettings';
import { sendSMS } from '@/lib/smsService';
import { Order } from '@/data/account'; 
import { Ticket } from '@/data/tickets';

export async function sendAdminNotification(order: Order, settings: AdminNotificationSettings, smsGlobalSettings: SMSSettings) {
  const message = `🛍️ سفارش جدید ثبت شد!
شماره سفارش: ${order.id}
مبلغ: ${order.total.toLocaleString('fa-IR')} تومان
وضعیت: ${order.status === 'processing' ? 'در حال پردازش' : order.status}
تعداد اقلام: ${order.items.length}`;

  await sendNotification(message, settings, smsGlobalSettings);
}

export async function sendAdminTicketNotification(ticket: Ticket, settings: AdminNotificationSettings, smsGlobalSettings: SMSSettings) {
  const message = `🎫 تیکت جدید ثبت شد!
شماره تیکت: ${ticket.id}
موضوع: ${ticket.subject}
کاربر: ${ticket.name}
اولویت: ${ticket.priority === 'high' ? 'زیاد' : ticket.priority === 'medium' ? 'متوسط' : 'کم'}
وضعیت: باز`;

  await sendNotification(message, settings, smsGlobalSettings);
}

async function sendNotification(message: string, settings: AdminNotificationSettings, smsGlobalSettings: SMSSettings) {
  const promises = [];

  // 1. Telegram
  if (settings.telegram.enabled && settings.telegram.botToken && settings.telegram.chatId) {
    promises.push(sendTelegram(settings.telegram.botToken, settings.telegram.chatId, message));
  }

  // 2. WhatsApp
  if (settings.whatsapp.enabled && settings.whatsapp.apiKey && settings.whatsapp.phoneNumber) {
    promises.push(sendWhatsApp(settings.whatsapp.apiKey, settings.whatsapp.phoneNumber, message));
  }

  // 3. SMS
  // We need the global SMS settings to be enabled and have an API key
  if (settings.sms.enabled && settings.sms.phoneNumber && smsGlobalSettings.enabled && smsGlobalSettings.apiKey) {
    promises.push(sendSMS(smsGlobalSettings.apiKey, settings.sms.phoneNumber, message));
  }

  await Promise.allSettled(promises);
}

async function sendTelegram(token: string, chatId: string, text: string) {
  // Mock implementation
  console.log(`[Notification] Sending Telegram to ${chatId}: ${text}`);
  // In a real app:
  // await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
  //   method: 'POST',
  //   body: JSON.stringify({ chat_id: chatId, text }),
  //   headers: { 'Content-Type': 'application/json' }
  // });
  return Promise.resolve(true);
}

async function sendWhatsApp(apiKey: string, phone: string, text: string) {
  // Mock implementation
  console.log(`[Notification] Sending WhatsApp to ${phone}: ${text}`);
  // In a real app, integrate with a provider like Twilio or a WhatsApp Business API
  return Promise.resolve(true);
}
