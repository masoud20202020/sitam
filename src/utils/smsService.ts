import { SMSSettings } from '@/data/smsSettings';
import type { Order } from '@/data/account';

type OrderLike = Pick<Order, 'id' | 'trackingNumber'> & {
  address?: { phone?: string };
  user?: { phone?: string };
};

export async function sendOrderSMS(order: OrderLike, newStatus: string, settings: SMSSettings) {
  if (!settings.enabled) return;

  // Try to find phone number from address or user (Prisma structure or legacy)
  // order.address is now an object, not just an ID lookup if using Prisma include
  const phone = order.address?.phone || order.user?.phone;

  if (!phone) {
    console.warn(`[SMS] No phone number found for order #${order.id}`);
    return;
  }

  const template = settings.templates[newStatus as keyof typeof settings.templates];
  if (!template) return;

  // Replace placeholders
  const message = template
    .replace('{orderId}', order.id.toString())
    .replace('{trackingNumber}', order.trackingNumber || '---');

  // Simulate sending API call
  console.log(`[SMS Service] Sending to ${phone}: ${message}`);
  
  // In a real implementation, you would use fetch here:
  /*
  try {
    await fetch('https://api.sms-provider.com/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${settings.apiKey}` },
      body: JSON.stringify({ to: phone, message, from: settings.senderNumber })
    });
  } catch (err) {
    console.error('[SMS] Failed to send', err);
  }
  */
}

export async function sendTestSMS(to: string, settings: SMSSettings) {
  if (!settings.enabled) throw new Error('سیستم پیامک غیرفعال است. لطفا ابتدا آن را فعال کنید.');
  
  // Simulate sending
  console.log(`[SMS Test] Sending test message to ${to} using API Key: ${settings.apiKey?.slice(0, 4)}...`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return true;
}
