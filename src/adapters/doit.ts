import { Hono } from 'hono';
import { db } from '../../db/db.ts';
import { invoices, merchants } from '../../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { createInvoiceCore } from '../services/invoice.ts';
import { verifyApiKeyAndScope } from '../services/api-keys.ts';
import { resolveBaseUrl } from '../utils/url.ts';
import { generateDynamicQRIS, DEFAULT_MOCK_STATIC_QRIS } from '../utils/qris.ts';

export const doitAdapter = new Hono();

function formatDoitPayment(inv: any, dynamicQrisString: string | null, baseUrl: string) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  let metadata = null;
  if (inv.clientMetadata) {
    try {
      metadata = typeof inv.clientMetadata === 'string' ? JSON.parse(inv.clientMetadata) : inv.clientMetadata;
    } catch (_) {
      metadata = inv.clientMetadata;
    }
  }

  const cleanId = inv.id.startsWith('inv_') ? 'pay_' + inv.id.slice(4) : inv.id;

  return {
    id: cleanId,
    status: inv.status.toLowerCase(), // 'pending', 'paid', 'expired'
    amount: inv.baseAmount,
    rail: 'qris',
    reference: inv.orderId,
    qr_content: dynamicQrisString || null,
    va_number: null,
    va_bank: null,
    hosted_url: `${cleanBase}/pay/${inv.id}`,
    return_url: inv.redirectUrl || null,
    provider: 'qbiz',
    provider_ref: inv.id,
    fee_amount: inv.adminFee || 0,
    fee_payer: 'merchant',
    total_amount: inv.totalAmount,
    expires_at: inv.expiredAt ? new Date(inv.expiredAt).toISOString() : null,
    paid_at: inv.paidAt ? new Date(inv.paidAt).toISOString() : null,
    metadata,
    created_at: inv.createdAt ? new Date(inv.createdAt).toISOString() : new Date().toISOString()
  };
}

async function authenticateDoitRequest(c: any, requiredScope: string = 'invoices:create') {
  const auth = c.req.header('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return {
      success: false as const,
      authResult: undefined,
      response: c.json({
        error: {
          code: 'missing_api_key',
          message: 'Header Authorization: Bearer <api_key> is required.',
          doc_url: 'https://doit.id/docs/#errors'
        }
      }, 401)
    };
  }

  const authResult = await verifyApiKeyAndScope(token, requiredScope);
  if (!authResult.isValid) {
    return {
      success: false as const,
      authResult: undefined,
      response: c.json({
        error: {
          code: 'invalid_api_key',
          message: authResult.error || 'Invalid or revoked API key.',
          doc_url: 'https://doit.id/docs/#errors'
        }
      }, 401)
    };
  }

  return {
    success: true as const,
    authResult,
    response: undefined
  };
}

/**
 * GET /v1/methods
 * Returns active payment channels (QRIS with 0% fee)
 */
doitAdapter.get('/v1/methods', async (c) => {
  const auth = await authenticateDoitRequest(c, 'invoices:read');
  if (!auth.success || !auth.authResult) return auth.response!;

  const rawAmount = c.req.query('amount');
  const amount = rawAmount ? Math.max(1000, parseInt(rawAmount, 10) || 150000) : 150000;

  return c.json({
    environment: 'live',
    amount: amount,
    data: [
      {
        code: 'qris',
        label: 'QRIS (Semua Bank & e-Wallet)',
        rail: 'qris',
        bank: null,
        fee_flat: 0,
        fee_pct: 0,
        fee_payer: 'merchant',
        min_amount: 1000,
        max_amount: 10000000,
        fee_amount: 0,
        total_amount: amount,
        within_limits: true,
        limit: null
      }
    ]
  });
});

/**
 * POST /v1/payments
 * Creates a payment charge compatible with doit.id API
 */
doitAdapter.post('/v1/payments', async (c) => {
  const auth = await authenticateDoitRequest(c, 'invoices:create');
  if (!auth.success || !auth.authResult) return auth.response!;

  let body: any = {};
  try {
    body = await c.req.json();
  } catch (_) {
    return c.json({
      error: {
        code: 'invalid_request',
        message: 'Invalid JSON request body.',
        doc_url: 'https://doit.id/docs/#errors'
      }
    }, 400);
  }

  const amount = Number(body.amount);
  if (isNaN(amount) || amount <= 0) {
    return c.json({
      error: {
        code: 'invalid_request',
        message: 'Field amount is required and must be a positive integer in Rupiah.',
        doc_url: 'https://doit.id/docs/#errors'
      }
    }, 400);
  }

  const reference = (body.reference || '').toString().trim();
  if (!reference) {
    return c.json({
      error: {
        code: 'invalid_request',
        message: 'Field reference is required (e.g. order ID in your system).',
        doc_url: 'https://doit.id/docs/#errors'
      }
    }, 400);
  }

  // Idempotency: Check if request with same reference/orderId already pending
  const existingInvoices = await db.select().from(invoices)
    .where(and(eq(invoices.orderId, reference), eq(invoices.status, 'PENDING')));
  if (existingInvoices.length > 0) {
    const existing = existingInvoices[0];
    const baseUrl = resolveBaseUrl(c);
    
    // Fetch merchant for QRIS payload
    let qrisPayload = '';
    if (existing.merchantId) {
      const mList = await db.select().from(merchants).where(eq(merchants.id, existing.merchantId));
      if (mList.length > 0) {
        qrisPayload = generateDynamicQRIS(mList[0].qrisPayload || DEFAULT_MOCK_STATIC_QRIS, existing.totalAmount, existing.id);
      }
    }
    return c.json(formatDoitPayment(existing, qrisPayload, baseUrl), 200);
  }

  // Resolve target merchant ID
  let targetMerchantId = auth.authResult.merchantId || body.merchant_id;
  if (!targetMerchantId) {
    const allMerchants = await db.select().from(merchants);
    if (allMerchants.length > 0) {
      targetMerchantId = allMerchants[0].id;
    } else {
      return c.json({
        error: {
          code: 'invalid_request',
          message: 'No active merchant store registered in QBiz.',
          doc_url: 'https://doit.id/docs/#errors'
        }
      }, 400);
    }
  }

  const baseUrl = resolveBaseUrl(c);
  const expiresInSeconds = body.expires_in ? Number(body.expires_in) : 3600;
  const expiryMinutes = Math.max(1, Math.round(expiresInSeconds / 60));

  const result = await createInvoiceCore({
    merchantId: targetMerchantId,
    orderId: reference,
    amount,
    callbackUrl: body.callback_url || null,
    redirectUrl: body.return_url || null,
    customerName: body.customer?.name || null,
    customerPhone: body.customer?.phone || null,
    expiryMinutes,
    userId: auth.authResult.userId,
    clientDialect: 'DOIT',
    clientMetadata: body.metadata || null,
    baseUrl
  });

  return c.json(formatDoitPayment(result.invoice, result.dynamicQrisString, baseUrl), 201);
});

/**
 * GET /v1/payments/:id
 * Fetch single payment by ID (pay_... or inv_...)
 */
doitAdapter.get('/v1/payments/:id', async (c) => {
  const auth = await authenticateDoitRequest(c, 'invoices:read');
  if (!auth.success || !auth.authResult) return auth.response!;

  const rawId = c.req.param('id');
  const targetId = rawId.startsWith('pay_') ? 'inv_' + rawId.slice(4) : rawId;

  const matched = await db.select().from(invoices).where(eq(invoices.id, targetId));
  if (matched.length === 0) {
    return c.json({
      error: {
        code: 'payment_not_found',
        message: `Payment with id '${rawId}' was not found.`,
        doc_url: 'https://doit.id/docs/#errors'
      }
    }, 404);
  }

  const inv = matched[0];
  const baseUrl = resolveBaseUrl(c);
  let qrisPayload = '';
  if (inv.merchantId) {
    const mList = await db.select().from(merchants).where(eq(merchants.id, inv.merchantId));
    if (mList.length > 0) {
      qrisPayload = generateDynamicQRIS(mList[0].qrisPayload || DEFAULT_MOCK_STATIC_QRIS, inv.totalAmount, inv.id);
    }
  }

  return c.json(formatDoitPayment(inv, qrisPayload, baseUrl), 200);
});

/**
 * GET /v1/payments
 * Query payments with filters: reference, status, limit
 */
doitAdapter.get('/v1/payments', async (c) => {
  const auth = await authenticateDoitRequest(c, 'invoices:read');
  if (!auth.success || !auth.authResult) return auth.response!;

  const reference = c.req.query('reference');
  const statusParam = c.req.query('status');
  const limitParam = parseInt(c.req.query('limit') || '25', 10);
  const limit = Math.min(Math.max(1, limitParam), 100);

  let query = db.select().from(invoices);
  if (reference) {
    query = query.where(eq(invoices.orderId, reference)) as any;
  }
  if (statusParam) {
    query = query.where(eq(invoices.status, statusParam.toUpperCase() as any)) as any;
  }

  const results = await query.orderBy(desc(invoices.createdAt)).limit(limit);
  const baseUrl = resolveBaseUrl(c);

  const data = results.map(inv => formatDoitPayment(inv, null, baseUrl));
  return c.json({ data }, 200);
});
