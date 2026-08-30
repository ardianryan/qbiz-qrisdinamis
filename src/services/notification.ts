import { db } from '../../db/db.ts';
import { merchants, merchantNotifications } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface NotificationPayloadData {
  merchantName: string;
  orderId: string;
  invoiceId: string;
  baseAmount: number;
  uniqueCode: number;
  totalAmount: number;
  amountFormatted: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paidAt: string;
  status: string;
}

/**
 * Format raw number to Indonesian Rupiah currency string (e.g. Rp 50.123)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Default notification message templates
 */
export const DEFAULT_TEMPLATES = {
  telegram: `🔔 <b>Pembayaran QRIS Berhasil!</b>\n\n🏪 <b>Merchant:</b> {merchant_name}\n🧾 <b>Order ID:</b> {order_id}\n💰 <b>Total Bayar:</b> {amount_formatted}\n👤 <b>Pelanggan:</b> {customer_name}\n⏰ <b>Waktu:</b> {paid_at}\n\n<i>QBiz Gateway Hub Notification</i>`,
  
  discord: `🔔 **Pembayaran QRIS Berhasil!**\nStore: **{merchant_name}** | Order: **{order_id}**\nTotal: **{amount_formatted}**\nWaktu: {paid_at}`,
  
  whatsapp: `🔔 *NOTIFIKASI PEMBAYARAN QRIS*\n\n*Merchant:* {merchant_name}\n*Order ID:* {order_id}\n*Total Bayar:* {amount_formatted}\n*Pelanggan:* {customer_name}\n*Waktu:* {paid_at}\n\n_Terima kasih telah menggunakan QBiz Gateway._`
};

/**
 * Replace template variables with dynamic transaction data
 */
export function formatNotificationMessage(template: string | null | undefined, data: NotificationPayloadData, fallbackDefault: string): string {
  const text = (template && template.trim().length > 0) ? template : fallbackDefault;
  
  return text
    .replaceAll('{merchant_name}', data.merchantName || 'QRIS Merchant')
    .replaceAll('{order_id}', data.orderId || '-')
    .replaceAll('{invoice_id}', data.invoiceId || '-')
    .replaceAll('{base_amount}', String(data.baseAmount || 0))
    .replaceAll('{unique_code}', String(data.uniqueCode || 0))
    .replaceAll('{total_amount}', String(data.totalAmount || 0))
    .replaceAll('{amount_formatted}', data.amountFormatted || formatRupiah(data.totalAmount))
    .replaceAll('{customer_name}', data.customerName || 'Umum')
    .replaceAll('{customer_phone}', data.customerPhone || '-')
    .replaceAll('{customer_email}', data.customerEmail || '-')
    .replaceAll('{paid_at}', data.paidAt || new Date().toLocaleString('id-ID'))
    .replaceAll('{time}', data.paidAt || new Date().toLocaleString('id-ID'))
    .replaceAll('{status}', data.status || 'PAID');
}

/**
 * Validate outbound notification destination to prevent SSRF and protocol smuggling
 */
export function isValidOutboundUrl(urlString: string, allowedProtocols = ['http:', 'https:']): boolean {
  try {
    const parsed = new URL(urlString.trim());
    if (!allowedProtocols.includes(parsed.protocol)) {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    
    // Block Cloud metadata service IPs (AWS, GCP, Azure, Alibaba, OpenStack)
    const blockedHostnames = [
      '169.254.169.254',
      '100.100.100.200',
      '168.63.129.16',
      'metadata.google.internal',
      'metadata.internal',
      'instance-data'
    ];

    if (blockedHostnames.includes(hostname)) {
      return false;
    }

    // Block link-local IPv4 range (169.254.0.0/16)
    if (/^169\.254\./.test(hostname)) {
      return false;
    }

    // Block IPv6 link-local (fe80::)
    if (hostname.startsWith('fe80:') || hostname.startsWith('[fe80:')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 1. Send Telegram Bot Notification
 */
export async function sendTelegramNotification(
  config: { botToken?: string | null; chatId?: string | null; template?: string | null },
  data: NotificationPayloadData
): Promise<{ success: boolean; error?: string }> {
  if (!config.botToken || !config.chatId) {
    return { success: false, error: 'Telegram Bot Token and Chat ID are required.' };
  }

  const token = config.botToken.trim();
  // Validate token syntax
  if (!/^[0-9]+:[a-zA-Z0-9_\-]+$/.test(token)) {
    return { success: false, error: 'Invalid Telegram Bot Token format.' };
  }

  const message = formatNotificationMessage(config.template, data, DEFAULT_TEMPLATES.telegram);
  const endpoint = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId.trim(),
        text: message,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(10000),
    });

    const result = await res.json();
    if (!res.ok || !result.ok) {
      const errMsg = result.description || `HTTP ${res.status}`;
      return { success: false, error: `Telegram API Error: ${errMsg}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Telegram Network Error: ${err.message}` };
  }
}

/**
 * 2. Send Discord Webhook Notification (Rich Embed)
 */
export async function sendDiscordNotification(
  config: { webhookUrl?: string | null; template?: string | null },
  data: NotificationPayloadData
): Promise<{ success: boolean; error?: string }> {
  if (!config.webhookUrl) {
    return { success: false, error: 'Discord Webhook URL is required.' };
  }

  const webhookUrl = config.webhookUrl.trim();
  if (!isValidOutboundUrl(webhookUrl)) {
    return { success: false, error: 'Invalid or prohibited Discord Webhook URL.' };
  }

  const message = formatNotificationMessage(config.template, data, DEFAULT_TEMPLATES.discord);

  const payload = {
    username: 'QBiz Gateway',
    content: message,
    embeds: [
      {
        title: '🔔 Pembayaran QRIS Diterima!',
        color: 0x10B981, // Emerald Green
        fields: [
          { name: '🏪 Merchant', value: data.merchantName, inline: true },
          { name: '🧾 Order ID', value: data.orderId, inline: true },
          { name: '💰 Total Bayar', value: data.amountFormatted, inline: true },
          { name: '👤 Pelanggan', value: data.customerName, inline: true },
          { name: '🆔 Invoice ID', value: data.invoiceId, inline: true },
          { name: '⏰ Waktu', value: data.paidAt, inline: true }
        ],
        footer: { text: 'QBiz Dynamic QRIS Hub • v1.1.0' },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (res.status >= 200 && res.status < 300) {
      return { success: true };
    }

    const errText = await res.text();
    return { success: false, error: `Discord Webhook Error (HTTP ${res.status}): ${errText}` };
  } catch (err: any) {
    return { success: false, error: `Discord Network Error: ${err.message}` };
  }
}

/**
 * 3. Send WhatsApp Notification via GOWA (Aldinokemal) API
 */
export async function sendWhatsAppGowaNotification(
  config: {
    apiUrl?: string | null;
    authType?: 'NONE' | 'BEARER' | 'BASIC' | string | null;
    authKey?: string | null;
    recipient?: string | null;
    template?: string | null;
  },
  data: NotificationPayloadData
): Promise<{ success: boolean; error?: string }> {
  if (!config.apiUrl || !config.recipient) {
    return { success: false, error: 'GOWA API URL and target recipient phone are required.' };
  }

  const rawUrl = config.apiUrl.trim();
  if (!isValidOutboundUrl(rawUrl)) {
    return { success: false, error: 'Invalid or prohibited GOWA WhatsApp API URL.' };
  }

  const message = formatNotificationMessage(config.template, data, DEFAULT_TEMPLATES.whatsapp);
  
  // Normalize base API URL
  const baseUrl = rawUrl.replace(/\/+$/, '');
  const endpoint = `${baseUrl}/send/message`;

  // Build Headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.authKey && config.authKey.trim().length > 0) {
    const key = config.authKey.trim();
    if (config.authType === 'BEARER') {
      headers['Authorization'] = `Bearer ${key}`;
    } else if (config.authType === 'BASIC') {
      // If basic auth string doesn't contain colon, format as key:
      const authHeader = key.includes(':') ? btoa(key) : key;
      headers['Authorization'] = `Basic ${authHeader}`;
    }
    // Also pass x-api-key for GOWA compatibility
    headers['x-api-key'] = key;
  }

  // Clean phone number (e.g. 08123456789 -> 628123456789)
  let cleanPhone = config.recipient.trim();
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.substring(1);
  }

  const payload = {
    phone: cleanPhone,
    recipient: cleanPhone,
    message: message,
  };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (res.status >= 200 && res.status < 300) {
      return { success: true };
    }

    const errText = await res.text();
    return { success: false, error: `GOWA API Error (HTTP ${res.status}): ${errText}` };
  } catch (err: any) {
    return { success: false, error: `GOWA Network Error: ${err.message}` };
  }
}

/**
 * 4. Dispatch All Enabled Notifications for a Merchant (Triggered on Payment Success)
 */
export async function dispatchMerchantNotifications(merchantId: string, invoice: any, txTime?: string) {
  if (!merchantId) return;

  try {
    // 1. Fetch merchant details
    const mrcList = await db.select().from(merchants).where(eq(merchants.id, merchantId));
    if (mrcList.length === 0) return;
    const merchant = mrcList[0];

    // 2. Fetch merchant notification settings
    const notifList = await db.select().from(merchantNotifications).where(eq(merchantNotifications.merchantId, merchantId));
    if (notifList.length === 0) return;
    const config = notifList[0];

    // 3. Prepare common payload data
    const totalAmount = invoice.totalAmount || (invoice.baseAmount + (invoice.uniqueCode || 0));
    const paidAt = txTime || (invoice.paidAt ? new Date(invoice.paidAt).toLocaleString('id-ID') : new Date().toLocaleString('id-ID'));

    const data: NotificationPayloadData = {
      merchantName: merchant.name,
      orderId: invoice.orderId || '-',
      invoiceId: invoice.id || '-',
      baseAmount: invoice.baseAmount || totalAmount,
      uniqueCode: invoice.uniqueCode || 0,
      totalAmount: totalAmount,
      amountFormatted: formatRupiah(totalAmount),
      customerName: invoice.customerName || 'Pelanggan Umum',
      customerPhone: invoice.customerPhone || '-',
      customerEmail: invoice.customerEmail || '-',
      paidAt: paidAt,
      status: 'PAID'
    };

    const tasks: Promise<any>[] = [];

    // Telegram
    if (config.telegramEnabled && config.telegramBotToken && config.telegramChatId) {
      tasks.push(
        sendTelegramNotification({
          botToken: config.telegramBotToken,
          chatId: config.telegramChatId,
          template: config.telegramTemplate
        }, data).then(res => {
          if (!res.success) console.warn(`[Notification] Telegram alert failed for ${merchantId}:`, res.error);
          else console.log(`[Notification] Telegram alert sent for ${merchantId}`);
        })
      );
    }

    // Discord
    if (config.discordEnabled && config.discordWebhookUrl) {
      tasks.push(
        sendDiscordNotification({
          webhookUrl: config.discordWebhookUrl,
          template: config.discordTemplate
        }, data).then(res => {
          if (!res.success) console.warn(`[Notification] Discord alert failed for ${merchantId}:`, res.error);
          else console.log(`[Notification] Discord alert sent for ${merchantId}`);
        })
      );
    }

    // WhatsApp (GOWA)
    if (config.whatsappEnabled && config.whatsappApiUrl && config.whatsappRecipient) {
      tasks.push(
        sendWhatsAppGowaNotification({
          apiUrl: config.whatsappApiUrl,
          authType: config.whatsappAuthType,
          authKey: config.whatsappAuthKey,
          recipient: config.whatsappRecipient,
          template: config.whatsappTemplate
        }, data).then(res => {
          if (!res.success) console.warn(`[Notification] WhatsApp GOWA alert failed for ${merchantId}:`, res.error);
          else console.log(`[Notification] WhatsApp GOWA alert sent for ${merchantId}`);
        })
      );
    }

    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }
  } catch (err: any) {
    console.error(`[Notification] Error dispatching alerts for merchant ${merchantId}:`, err.message);
  }
}

/**
 * 5. Test specific channel notification with sample data
 */
export async function testChannelNotification(
  merchantName: string,
  channel: 'telegram' | 'discord' | 'whatsapp',
  config: any
): Promise<{ success: boolean; message: string; error?: string }> {
  const sampleData: NotificationPayloadData = {
    merchantName: merchantName || 'Store Demo Cabang 1',
    orderId: `TEST-ORD-${Math.floor(Math.random() * 90000) + 10000}`,
    invoiceId: `inv_test_${Date.now()}`,
    baseAmount: 75000,
    uniqueCode: 123,
    totalAmount: 75123,
    amountFormatted: formatRupiah(75123),
    customerName: 'Budi Santoso (Tester)',
    customerPhone: '081298765432',
    customerEmail: 'tester@qbiz.com',
    paidAt: new Date().toLocaleString('id-ID'),
    status: 'PAID (TEST SAMPLE)'
  };

  if (channel === 'telegram') {
    const res = await sendTelegramNotification({
      botToken: config.botToken || config.telegramBotToken,
      chatId: config.chatId || config.telegramChatId,
      template: config.template || config.telegramTemplate,
    }, sampleData);
    if (!res.success) return { success: false, message: res.error || 'Failed to send Telegram test message', error: res.error };
    return { success: true, message: 'Telegram test notification delivered successfully!' };
  }

  if (channel === 'discord') {
    const res = await sendDiscordNotification({
      webhookUrl: config.webhookUrl || config.discordWebhookUrl,
      template: config.template || config.discordTemplate,
    }, sampleData);
    if (!res.success) return { success: false, message: res.error || 'Failed to send Discord test message', error: res.error };
    return { success: true, message: 'Discord test notification delivered successfully!' };
  }

  if (channel === 'whatsapp') {
    const res = await sendWhatsAppGowaNotification({
      apiUrl: config.apiUrl || config.whatsappApiUrl,
      authType: config.authType || config.whatsappAuthType,
      authKey: config.authKey || config.whatsappAuthKey,
      recipient: config.recipient || config.whatsappRecipient,
      template: config.template || config.whatsappTemplate,
    }, sampleData);
    if (!res.success) return { success: false, message: res.error || 'Failed to send WhatsApp GOWA test message', error: res.error };
    return { success: true, message: 'WhatsApp GOWA test notification delivered successfully!' };
  }

  return { success: false, message: 'Invalid notification channel.' };
}
