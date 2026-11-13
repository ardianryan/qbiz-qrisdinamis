import { Hono } from 'hono';
import crypto from 'node:crypto';
import { db } from '../../db/db.ts';
import { invoices, merchants, apiKeys, users } from '../../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { createInvoiceCore } from '../services/invoice.ts';
import { resolveBaseUrl } from '../utils/url.ts';

export const duitkuAdapter = new Hono();

function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex').toLowerCase();
}

/**
 * Parses both JSON and URL-encoded body
 */
async function parseDuitkuBody(c: any): Promise<Record<string, any>> {
  const contentType = c.req.header('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await c.req.json();
    } catch (_) {
      return {};
    }
  }
  try {
    return await c.req.parseBody();
  } catch (_) {
    return {};
  }
}

/**
 * Validates Duitku signature by testing against registered active API keys
 */
async function resolveDuitkuKeyAndMerchant(
  merchantCode: string,
  merchantOrderId: string,
  amount: string | number,
  incomingSignature: string
): Promise<{ isValid: boolean; matchedKey?: string; merchantId?: string; userId?: string; error?: string }> {
  const sig = (incomingSignature || '').trim().toLowerCase();
  if (!sig) {
    return { isValid: false, error: 'Signature is missing' };
  }

  // Get active API keys from database
  const activeKeys = await db.select().from(apiKeys).where(eq(apiKeys.status, 'ACTIVE'));
  const userList = await db.select().from(users);

  // 1. Test against api_keys table
  for (const k of activeKeys) {
    // If the key is hashed in DB, we check keyPrefix or original plaintext if known,
    // or test against all user api keys.
    const calculatedSig = md5(`${merchantCode}${merchantOrderId}${amount}${k.key}`);
    if (calculatedSig === sig) {
      return { isValid: true, matchedKey: k.key, merchantId: k.merchantId || undefined, userId: k.userId };
    }
  }

  // 2. Test against users.apiKey and users.webhookSecret
  for (const u of userList) {
    if (u.apiKey) {
      const calculatedSig = md5(`${merchantCode}${merchantOrderId}${amount}${u.apiKey}`);
      if (calculatedSig === sig) {
        return { isValid: true, matchedKey: u.apiKey, merchantId: u.merchantId || undefined, userId: u.id };
      }
    }
    if (u.webhookSecret) {
      const calculatedSig = md5(`${merchantCode}${merchantOrderId}${amount}${u.webhookSecret}`);
      if (calculatedSig === sig) {
        return { isValid: true, matchedKey: u.webhookSecret, merchantId: u.merchantId || undefined, userId: u.id };
      }
    }
  }

  // 3. Fallback: check environment secret
  const envSecret = Deno.env.get('DUITKU_API_KEY') || Deno.env.get('API_KEY') || 'qbiz_duitku_key_2026';
  if (md5(`${merchantCode}${merchantOrderId}${amount}${envSecret}`) === sig) {
    return { isValid: true, matchedKey: envSecret };
  }

  return { isValid: false, error: 'Signature mismatch' };
}

/**
 * POST /webapi/api/merchant/v2/inquiry
 * Duitku v2 Payment Inquiry Endpoint
 */
duitkuAdapter.post('/webapi/api/merchant/v2/inquiry', async (c) => {
  const body = await parseDuitkuBody(c);

  const merchantCode = (body.merchantCode || body.merchant_code || '').toString().trim();
  const paymentAmount = body.paymentAmount || body.amount;
  const merchantOrderId = (body.merchantOrderId || body.merchant_order_id || '').toString().trim();
  const signature = (body.signature || '').toString().trim();

  if (!merchantCode || !paymentAmount || !merchantOrderId || !signature) {
    return c.json({
      statusCode: '01',
      statusMessage: 'Incomplete parameters (merchantCode, paymentAmount, merchantOrderId, signature are required)'
    }, 400);
  }

  const amountNum = Number(paymentAmount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return c.json({
      statusCode: '01',
      statusMessage: 'Invalid paymentAmount'
    }, 400);
  }

  // Validate MD5 signature
  const auth = await resolveDuitkuKeyAndMerchant(merchantCode, merchantOrderId, paymentAmount, signature);
  if (!auth.isValid) {
    return c.json({
      statusCode: '01',
      statusMessage: 'Bad Signature: ' + (auth.error || 'Authentication failed')
    }, 400);
  }

  // Resolve target merchant
  let targetMerchantId = auth.merchantId || body.merchant_id;
  if (!targetMerchantId) {
    const all = await db.select().from(merchants);
    if (all.length > 0) {
      targetMerchantId = all[0].id;
    } else {
      return c.json({
        statusCode: '01',
        statusMessage: 'No active merchant store registered in QBiz'
      }, 400);
    }
  }

  const baseUrl = resolveBaseUrl(c);
  const expiryPeriod = body.expiryPeriod ? parseInt(body.expiryPeriod, 10) : 60; // minutes

  const clientMetadata = {
    merchantCode,
    merchantOrderId,
    additionalParam: body.additionalParam || null,
    merchantUserId: body.merchantUserId || null,
    productDetails: body.productDetails || null,
    paymentMethod: body.paymentMethod || 'QRIS',
    apiKey: auth.matchedKey
  };

  const result = await createInvoiceCore({
    merchantId: targetMerchantId,
    orderId: merchantOrderId,
    amount: amountNum,
    callbackUrl: body.callbackUrl || null,
    redirectUrl: body.returnUrl || null,
    customerName: body.customerVaName || body.email || null,
    customerEmail: body.email || null,
    customerPhone: body.phoneNumber || null,
    expiryMinutes: expiryPeriod,
    userId: auth.userId,
    clientDialect: 'DUITKU',
    clientMetadata,
    baseUrl
  });

  return c.json({
    statusCode: '00',
    statusMessage: 'SUCCESS',
    merchantCode,
    reference: result.invoice.id,
    paymentUrl: result.checkoutUrl,
    vaNumber: null,
    qrString: result.dynamicQrisString,
    amount: result.invoice.baseAmount.toString()
  }, 200);
});

/**
 * POST /webapi/api/merchant/transactionStatus
 * Duitku Status Inquiry Endpoint
 */
duitkuAdapter.post('/webapi/api/merchant/transactionStatus', async (c) => {
  const body = await parseDuitkuBody(c);

  const merchantCode = (body.merchantCode || body.merchant_code || '').toString().trim();
  const merchantOrderId = (body.merchantOrderId || body.merchant_order_id || '').toString().trim();
  const signature = (body.signature || '').toString().trim();

  if (!merchantCode || !merchantOrderId) {
    return c.json({
      statusCode: '01',
      statusMessage: 'merchantCode and merchantOrderId are required'
    }, 400);
  }

  // Find invoice by merchantOrderId
  const matched = await db.select().from(invoices).where(eq(invoices.orderId, merchantOrderId));
  if (matched.length === 0) {
    return c.json({
      statusCode: '01',
      statusMessage: `Transaction with merchantOrderId '${merchantOrderId}' not found`
    }, 404);
  }

  const inv = matched[0];

  // Map QBiz status to Duitku statusCode:
  // "00" = SUCCESS, "01" = PENDING, "02" = EXPIRED / FAILED
  let statusCode = '01';
  let statusMessage = 'PENDING';
  if (inv.status === 'PAID') {
    statusCode = '00';
    statusMessage = 'SUCCESS';
  } else if (inv.status === 'EXPIRED') {
    statusCode = '02';
    statusMessage = 'EXPIRED';
  }

  return c.json({
    merchantOrderId: inv.orderId,
    reference: inv.id,
    amount: inv.baseAmount.toString(),
    fee: inv.adminFee.toString(),
    statusCode,
    statusMessage
  }, 200);
});
