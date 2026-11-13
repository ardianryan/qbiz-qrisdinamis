import { db } from '../../db/db.ts';
import { invoices, merchants } from '../../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { generateDynamicQRIS, DEFAULT_MOCK_STATIC_QRIS } from '../utils/qris.ts';
import { sseBroker } from './sse.ts';
import { getSystemSettings } from './settings.ts';

export interface CreateInvoiceParams {
  merchantId: string;
  orderId: string;
  amount: number;
  callbackUrl?: string | null;
  redirectUrl?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items?: any;
  adminFee?: number;
  expiryMinutes?: number;
  isSandbox?: boolean;
  userId?: string | null;
  clientDialect?: 'QBIZ' | 'DOIT' | 'XENDIT' | 'DUITKU';
  clientMetadata?: Record<string, any> | null;
  baseUrl: string;
}

export interface CreateInvoiceResult {
  invoice: typeof invoices.$inferSelect;
  dynamicQrisString: string;
  checkoutUrl: string;
}

/**
 * Universal Core Invoice Creator for all dialects (QBiz, doit.id, Xendit, Duitku)
 */
export async function createInvoiceCore(params: CreateInvoiceParams): Promise<CreateInvoiceResult> {
  const {
    merchantId,
    orderId,
    amount,
    callbackUrl,
    redirectUrl,
    customerName,
    customerEmail,
    customerPhone,
    items,
    adminFee: customAdminFee,
    expiryMinutes: customExpiryMinutes,
    isSandbox = false,
    userId = null,
    clientDialect = 'QBIZ',
    clientMetadata = null,
    baseUrl
  } = params;

  const sysSettings = await getSystemSettings();

  // 1. Calculate collision-free unique suffix (Rp 1 - Rp 999)
  let suffix = 1;
  try {
    const activePending = await db.select()
      .from(invoices)
      .where(and(
        eq(invoices.baseAmount, amount),
        eq(invoices.merchantId, merchantId),
        eq(invoices.status, 'PENDING')
      ));
    
    const usedSuffixes = new Set(activePending.map(inv => inv.uniqueCode));
    while (usedSuffixes.has(suffix)) {
      suffix++;
    }
  } catch (_e) {
    suffix = Math.floor(Math.random() * 999) + 1;
  }

  // 2. Admin fee calculation
  let adminFee = 0;
  if (customAdminFee !== undefined && !isNaN(Number(customAdminFee))) {
    adminFee = Math.max(0, Math.round(Number(customAdminFee)));
  } else if (sysSettings.adminFeeType === 'FIXED') {
    adminFee = Math.max(0, Math.round(Number(sysSettings.adminFeeAmount) || 0));
  } else if (sysSettings.adminFeeType === 'PERCENTAGE') {
    adminFee = Math.max(0, Math.round((amount * (Number(sysSettings.adminFeeAmount) || 0)) / 100));
  }

  const totalAmount = amount + adminFee + suffix;
  const randomSuffix = Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const newInvoiceId = `inv_${Date.now()}_${randomSuffix}`;

  const expiryMinutes = customExpiryMinutes || sysSettings.invoiceExpiryMinutes || 15;
  const expiredAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // 3. Insert invoice row into database
  const [createdInvoice] = await db.insert(invoices).values({
    id: newInvoiceId,
    merchantId,
    userId,
    orderId,
    baseAmount: amount,
    uniqueCode: suffix,
    adminFee,
    totalAmount,
    status: 'PENDING',
    callbackUrl: callbackUrl || null,
    redirectUrl: redirectUrl || null,
    customerName: customerName || null,
    customerEmail: customerEmail || null,
    customerPhone: customerPhone || null,
    items: items ? JSON.stringify(items) : null,
    expiredAt,
    isSandbox,
    clientDialect,
    clientMetadata: clientMetadata ? JSON.stringify(clientMetadata) : null
  }).returning();

  // 4. Generate dynamic QRIS string
  let dynamicQrisString = '';
  try {
    const mList = await db.select().from(merchants).where(eq(merchants.id, merchantId));
    const staticPayload = (mList.length > 0 && mList[0].qrisPayload)
      ? mList[0].qrisPayload
      : DEFAULT_MOCK_STATIC_QRIS;
    dynamicQrisString = generateDynamicQRIS(staticPayload, totalAmount, newInvoiceId);
  } catch (_e) {
    dynamicQrisString = '';
  }

  // 5. Publish to live dashboard & SSE broker
  if (dynamicQrisString) {
    sseBroker.publishTransactionUpdate({
      merchantId,
      invoiceId: newInvoiceId,
      orderId,
      amount: totalAmount,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    });
  }

  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const checkoutUrl = `${cleanBaseUrl}/pay/${newInvoiceId}`;

  return {
    invoice: createdInvoice,
    dynamicQrisString,
    checkoutUrl
  };
}
