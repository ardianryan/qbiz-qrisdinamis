import { Hono } from 'hono';
import { db } from '../../db/db.ts';
import { invoices, merchants } from '../../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { createInvoiceCore } from '../services/invoice.ts';
import { verifyApiKeyAndScope } from '../services/api-keys.ts';
import { resolveBaseUrl } from '../utils/url.ts';

export const xenditAdapter = new Hono();

function extractXenditApiKey(c: any): string {
  const auth = c.req.header('authorization') || '';
  if (auth.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      return decoded.split(':')[0].trim();
    } catch (_) {
      return '';
    }
  }
  return auth.replace(/^Bearer\s+/i, '').trim();
}

async function authenticateXenditRequest(c: any, requiredScope: string = 'invoices:create') {
  const apiKey = extractXenditApiKey(c);
  if (!apiKey) {
    return {
      success: false as const,
      authResult: undefined,
      response: c.json({
        error_code: 'UNAUTHORIZED_ACCESS',
        message: 'Valid API key must be provided in Basic Auth (username) or Bearer header.'
      }, 401)
    };
  }

  const authResult = await verifyApiKeyAndScope(apiKey, requiredScope);
  if (!authResult.isValid) {
    return {
      success: false as const,
      authResult: undefined,
      response: c.json({
        error_code: 'INVALID_API_KEY',
        message: authResult.error || 'Invalid secret key.'
      }, 401)
    };
  }

  return {
    success: true as const,
    authResult,
    response: undefined
  };
}

function formatXenditInvoice(inv: any, merchantName: string, merchantLogo: string | null, baseUrl: string) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  let metadata: any = {};
  if (inv.clientMetadata) {
    try {
      metadata = typeof inv.clientMetadata === 'string' ? JSON.parse(inv.clientMetadata) : inv.clientMetadata;
    } catch (_) {
      metadata = {};
    }
  }

  let items = [];
  if (inv.items) {
    try {
      items = JSON.parse(inv.items);
    } catch (_) {
      items = [];
    }
  }

  return {
    id: inv.id,
    external_id: inv.orderId,
    user_id: inv.userId || 'qbiz_user',
    status: inv.status, // 'PENDING' | 'PAID' | 'EXPIRED'
    merchant_name: merchantName || 'QBiz Merchant',
    merchant_profile_picture_url: merchantLogo || null,
    amount: inv.baseAmount,
    payer_email: inv.customerEmail || null,
    description: metadata?.description || `Invoice ${inv.orderId}`,
    expiry_date: inv.expiredAt ? new Date(inv.expiredAt).toISOString() : null,
    invoice_url: `${cleanBase}/pay/${inv.id}`,
    available_banks: [],
    available_retail_outlets: [],
    available_paylaters: [],
    should_exclude_raw_error: false,
    should_send_email: false,
    created: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString(),
    updated: inv.paidAt ? new Date(inv.paidAt).toISOString() : (inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString()),
    currency: 'IDR',
    paid_at: inv.paidAt ? new Date(inv.paidAt).toISOString() : undefined,
    paid_amount: inv.status === 'PAID' ? inv.totalAmount : undefined,
    payment_method: inv.status === 'PAID' ? 'QR_CODE' : undefined,
    payment_channel: inv.status === 'PAID' ? 'QRIS' : undefined,
    items
  };
}

/**
 * POST /v2/invoices
 * Xendit Invoice v2 Creation
 */
xenditAdapter.post('/v2/invoices', async (c) => {
  const auth = await authenticateXenditRequest(c, 'invoices:create');
  if (!auth.success || !auth.authResult) return auth.response!;

  let body: any = {};
  try {
    body = await c.req.json();
  } catch (_) {
    return c.json({
      error_code: 'INVALID_JSON_PAYLOAD',
      message: 'Body must be valid JSON.'
    }, 400);
  }

  const externalId = (body.external_id || '').toString().trim();
  if (!externalId) {
    return c.json({
      error_code: 'API_VALIDATION_ERROR',
      message: 'external_id is required.'
    }, 400);
  }

  const amount = Number(body.amount);
  if (isNaN(amount) || amount <= 0) {
    return c.json({
      error_code: 'API_VALIDATION_ERROR',
      message: 'amount must be a valid number greater than 0.'
    }, 400);
  }

  // Resolve target merchant
  let targetMerchantId = auth.authResult.merchantId || body.merchant_id;
  let targetMerchant: any = null;

  if (targetMerchantId) {
    const mList = await db.select().from(merchants).where(eq(merchants.id, targetMerchantId));
    if (mList.length > 0) targetMerchant = mList[0];
  }

  if (!targetMerchant) {
    const all = await db.select().from(merchants);
    if (all.length > 0) {
      targetMerchant = all[0];
      targetMerchantId = all[0].id;
    } else {
      return c.json({
        error_code: 'MERCHANT_NOT_FOUND',
        message: 'No active merchant store registered in QBiz.'
      }, 400);
    }
  }

  const baseUrl = resolveBaseUrl(c);
  const durationSeconds = body.invoice_duration ? Number(body.invoice_duration) : 86400;
  const expiryMinutes = Math.max(1, Math.round(durationSeconds / 60));

  const customerName = body.customer?.given_names
    ? `${body.customer.given_names} ${body.customer.surname || ''}`.trim()
    : body.payer_name || null;
  const customerEmail = body.customer?.email || body.payer_email || null;
  const customerPhone = body.customer?.mobile_number || body.customer_phone || null;

  const metadata = {
    description: body.description || null,
    customer_notification_preference: body.customer_notification_preference || null,
    success_redirect_url: body.success_redirect_url || null,
    failure_redirect_url: body.failure_redirect_url || null
  };

  const result = await createInvoiceCore({
    merchantId: targetMerchantId,
    orderId: externalId,
    amount,
    callbackUrl: body.callback_virtual_account_url || body.callback_url || null,
    redirectUrl: body.success_redirect_url || null,
    customerName,
    customerEmail,
    customerPhone,
    items: body.items,
    expiryMinutes,
    userId: auth.authResult.userId,
    clientDialect: 'XENDIT',
    clientMetadata: metadata,
    baseUrl
  });

  return c.json(formatXenditInvoice(result.invoice, targetMerchant.name, targetMerchant.logoUrl, baseUrl), 200);
});

/**
 * GET /v2/invoices/:id
 * Retrieve Xendit invoice by ID
 */
xenditAdapter.get('/v2/invoices/:id', async (c) => {
  const auth = await authenticateXenditRequest(c, 'invoices:read');
  if (!auth.success || !auth.authResult) return auth.response!;

  const id = c.req.param('id');
  const matched = await db.select().from(invoices).where(eq(invoices.id, id));
  if (matched.length === 0) {
    return c.json({
      error_code: 'INVOICE_NOT_FOUND',
      message: `Invoice with id '${id}' not found.`
    }, 404);
  }

  const inv = matched[0];
  let merchantName = 'QBiz Merchant';
  let merchantLogo: string | null = null;
  if (inv.merchantId) {
    const mList = await db.select().from(merchants).where(eq(merchants.id, inv.merchantId));
    if (mList.length > 0) {
      merchantName = mList[0].name;
      merchantLogo = mList[0].logoUrl;
    }
  }

  const baseUrl = resolveBaseUrl(c);
  return c.json(formatXenditInvoice(inv, merchantName, merchantLogo, baseUrl), 200);
});

/**
 * GET /v2/invoices
 * Query invoices by external_id
 */
xenditAdapter.get('/v2/invoices', async (c) => {
  const auth = await authenticateXenditRequest(c, 'invoices:read');
  if (!auth.success || !auth.authResult) return auth.response!;

  const externalId = c.req.query('external_id');
  const limit = Math.min(parseInt(c.req.query('limit') || '10', 10), 100);

  let query = db.select().from(invoices);
  if (externalId) {
    query = query.where(eq(invoices.orderId, externalId)) as any;
  }

  const results = await query.orderBy(desc(invoices.createdAt)).limit(limit);
  const baseUrl = resolveBaseUrl(c);

  const merchantsList = await db.select().from(merchants);
  const merchantMap = new Map(merchantsList.map(m => [m.id, m]));

  const data = results.map(inv => {
    const m = inv.merchantId ? merchantMap.get(inv.merchantId) : null;
    return formatXenditInvoice(inv, m?.name || 'QBiz Merchant', m?.logoUrl || null, baseUrl);
  });

  return c.json(data, 200);
});

/**
 * POST /v2/invoices/:id/expire and /invoices/:id/expire
 * Expire an invoice
 */
const expireInvoiceHandler = async (c: any) => {
  const auth = await authenticateXenditRequest(c, 'invoices:create');
  if (!auth.success || !auth.authResult) return auth.response!;

  const id = c.req.param('id');
  const matched = await db.select().from(invoices).where(eq(invoices.id, id));
  if (matched.length === 0) {
    return c.json({
      error_code: 'INVOICE_NOT_FOUND',
      message: `Invoice with id '${id}' not found.`
    }, 404);
  }

  const inv = matched[0];
  if (inv.status === 'PAID') {
    return c.json({
      error_code: 'INVOICE_ALREADY_PAID',
      message: 'Invoice has already been paid and cannot be expired.'
    }, 400);
  }

  await db.update(invoices).set({ status: 'EXPIRED' }).where(eq(invoices.id, id));

  let merchantName = 'QBiz Merchant';
  let merchantLogo: string | null = null;
  if (inv.merchantId) {
    const mList = await db.select().from(merchants).where(eq(merchants.id, inv.merchantId));
    if (mList.length > 0) {
      merchantName = mList[0].name;
      merchantLogo = mList[0].logoUrl;
    }
  }

  const baseUrl = resolveBaseUrl(c);
  return c.json(formatXenditInvoice({ ...inv, status: 'EXPIRED' }, merchantName, merchantLogo, baseUrl), 200);
};

xenditAdapter.post('/v2/invoices/:id/expire', expireInvoiceHandler);
xenditAdapter.post('/invoices/:id/expire', expireInvoiceHandler);
