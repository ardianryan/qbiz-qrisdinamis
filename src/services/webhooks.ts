import { db } from '../../db/db.ts';
import { webhooks, regionalAdminMerchants, users } from '../../db/schema.ts';
import { eq, and, inArray, isNull, or } from 'drizzle-orm';
import { isValidOutboundUrl } from './notification.ts';

export const AVAILABLE_WEBHOOK_EVENTS = [
  'payment.success',
  'invoice.created',
  'invoice.expired'
] as const;

export type WebhookEvent = (typeof AVAILABLE_WEBHOOK_EVENTS)[number];

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  userId: string;
  merchantId: string | null;
  events: string[];
  status: 'ACTIVE' | 'PAUSED';
  lastTriggeredAt: Date | null;
  lastStatusCode: number | null;
  createdAt: Date;
}

/**
 * Generate a cryptographically secure HMAC secret
 */
export function generateWebhookSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return 'whsec_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if a user role can manage a given webhook
 */
async function canManageWebhook(
  webhook: typeof webhooks.$inferSelect,
  userId: string,
  userRole: string,
  userMerchantId?: string | null
): Promise<boolean> {
  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
    return true;
  }

  if (userRole === 'MERCHANT' || userRole === 'MERCHANT_EMPLOYEE') {
    if (!userMerchantId) return false;
    return webhook.merchantId === userMerchantId;
  }

  if (userRole === 'REGIONAL_ADMIN') {
    if (webhook.userId === userId) return true;
    if (!webhook.merchantId) return false; // Regional admin cannot manage global webhooks

    const assigned = await db
      .select({ merchantId: regionalAdminMerchants.merchantId })
      .from(regionalAdminMerchants)
      .where(
        and(
          eq(regionalAdminMerchants.userId, userId),
          eq(regionalAdminMerchants.merchantId, webhook.merchantId)
        )
      );
    return assigned.length > 0;
  }

  return false;
}

/**
 * Create a new webhook endpoint with validation & RBAC guards
 */
export async function createWebhookEndpoint(params: {
  name: string;
  url: string;
  secret?: string;
  userId: string;
  userRole: string;
  userMerchantId?: string | null;
  merchantId?: string | null;
  events: string[];
}): Promise<WebhookEndpoint> {
  const name = (params.name || '').trim();
  if (name.length < 2) {
    throw new Error('Webhook name must be at least 2 characters long.');
  }

  const url = (params.url || '').trim();
  if (!url || !isValidOutboundUrl(url)) {
    throw new Error('Invalid webhook target URL. Must be a valid public HTTP or HTTPS URL.');
  }

  if (!params.events || params.events.length === 0) {
    throw new Error('At least one event must be selected.');
  }

  const invalidEvent = params.events.find(e => !AVAILABLE_WEBHOOK_EVENTS.includes(e as any));
  if (invalidEvent) {
    throw new Error(`Invalid event: "${invalidEvent}". Allowed events: ${AVAILABLE_WEBHOOK_EVENTS.join(', ')}`);
  }

  // Multi-Tenant RBAC Boundary Check
  let targetMerchantId = params.merchantId || null;
  if (params.userRole === 'MERCHANT' || params.userRole === 'MERCHANT_EMPLOYEE') {
    if (!params.userMerchantId) {
      throw new Error('Merchant account has no active store assigned.');
    }
    targetMerchantId = params.userMerchantId;
  } else if (params.userRole === 'REGIONAL_ADMIN') {
    if (!targetMerchantId) {
      throw new Error('Regional Admins cannot create global (ALL stores) webhooks. Please select an assigned store.');
    }
    const assigned = await db
      .select({ merchantId: regionalAdminMerchants.merchantId })
      .from(regionalAdminMerchants)
      .where(
        and(
          eq(regionalAdminMerchants.userId, params.userId),
          eq(regionalAdminMerchants.merchantId, targetMerchantId)
        )
      );
    if (assigned.length === 0) {
      throw new Error('Unauthorized: You can only create webhooks for stores assigned to your regional jurisdiction.');
    }
  }

  const newId = `whk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const secret = (params.secret || '').trim() || generateWebhookSecret();

  await db.insert(webhooks).values({
    id: newId,
    name,
    url,
    secret,
    userId: params.userId,
    merchantId: targetMerchantId,
    events: params.events.join(','),
    status: 'ACTIVE',
  });

  return {
    id: newId,
    name,
    url,
    secret,
    userId: params.userId,
    merchantId: targetMerchantId,
    events: params.events,
    status: 'ACTIVE',
    lastTriggeredAt: null,
    lastStatusCode: null,
    createdAt: new Date(),
  };
}

/**
 * List webhooks scoped by user role & store boundaries
 */
export async function listWebhookEndpoints(
  userId: string,
  userRole: string,
  userMerchantId?: string | null,
  filterMerchantId?: string | null
): Promise<WebhookEndpoint[]> {
  let rows: (typeof webhooks.$inferSelect)[] = [];

  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
    if (filterMerchantId) {
      rows = await db
        .select()
        .from(webhooks)
        .where(
          or(
            eq(webhooks.merchantId, filterMerchantId),
            isNull(webhooks.merchantId)
          )
        );
    } else {
      rows = await db.select().from(webhooks);
    }
  } else if (userRole === 'MERCHANT' || userRole === 'MERCHANT_EMPLOYEE') {
    if (!userMerchantId) return [];
    rows = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.merchantId, userMerchantId));
  } else if (userRole === 'REGIONAL_ADMIN') {
    const assignedStores = await db
      .select({ merchantId: regionalAdminMerchants.merchantId })
      .from(regionalAdminMerchants)
      .where(eq(regionalAdminMerchants.userId, userId));
    const storeIds = assignedStores.map(s => s.merchantId);

    if (storeIds.length === 0) return [];

    if (filterMerchantId && storeIds.includes(filterMerchantId)) {
      rows = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.merchantId, filterMerchantId));
    } else {
      rows = await db
        .select()
        .from(webhooks)
        .where(inArray(webhooks.merchantId, storeIds));
    }
  }

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    url: r.url,
    secret: r.secret,
    userId: r.userId,
    merchantId: r.merchantId,
    events: r.events.split(',').map(e => e.trim()).filter(Boolean),
    status: r.status as 'ACTIVE' | 'PAUSED',
    lastTriggeredAt: r.lastTriggeredAt,
    lastStatusCode: r.lastStatusCode,
    createdAt: r.createdAt,
  }));
}

/**
 * Delete a webhook endpoint
 */
export async function deleteWebhookEndpoint(
  webhookId: string,
  userId: string,
  userRole: string,
  userMerchantId?: string | null
): Promise<boolean> {
  const found = await db.select().from(webhooks).where(eq(webhooks.id, webhookId));
  if (found.length === 0) {
    throw new Error('Webhook endpoint not found.');
  }

  const canManage = await canManageWebhook(found[0], userId, userRole, userMerchantId);
  if (!canManage) {
    throw new Error('Unauthorized to delete this webhook endpoint.');
  }

  await db.delete(webhooks).where(eq(webhooks.id, webhookId));
  return true;
}

/**
 * Toggle a webhook status (ACTIVE / PAUSED)
 */
export async function toggleWebhookStatus(
  webhookId: string,
  status: 'ACTIVE' | 'PAUSED',
  userId: string,
  userRole: string,
  userMerchantId?: string | null
): Promise<WebhookEndpoint> {
  const found = await db.select().from(webhooks).where(eq(webhooks.id, webhookId));
  if (found.length === 0) {
    throw new Error('Webhook endpoint not found.');
  }

  const canManage = await canManageWebhook(found[0], userId, userRole, userMerchantId);
  if (!canManage) {
    throw new Error('Unauthorized to update this webhook endpoint.');
  }

  await db.update(webhooks).set({ status }).where(eq(webhooks.id, webhookId));

  return {
    id: found[0].id,
    name: found[0].name,
    url: found[0].url,
    secret: found[0].secret,
    userId: found[0].userId,
    merchantId: found[0].merchantId,
    events: found[0].events.split(',').map(e => e.trim()).filter(Boolean),
    status,
    lastTriggeredAt: found[0].lastTriggeredAt,
    lastStatusCode: found[0].lastStatusCode,
    createdAt: found[0].createdAt,
  };
}

/**
 * Sign payload using HMAC-SHA256
 */
export async function signWebhookPayload(payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBuf = encoder.encode(secret);
  const dataBuf = encoder.encode(typeof payload === 'string' ? payload : JSON.stringify(payload));

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuf,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, dataBuf);
  return Array.from(new Uint8Array(sigBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Send simulated test event to a specific webhook endpoint
 */
export async function testWebhookEndpoint(
  webhookId: string,
  userId: string,
  userRole: string,
  userMerchantId?: string | null
): Promise<{ success: boolean; statusCode: number; durationMs: number; error?: string }> {
  const found = await db.select().from(webhooks).where(eq(webhooks.id, webhookId));
  if (found.length === 0) {
    throw new Error('Webhook endpoint not found.');
  }

  const wh = found[0];
  const canManage = await canManageWebhook(wh, userId, userRole, userMerchantId);
  if (!canManage) {
    throw new Error('Unauthorized to test this webhook endpoint.');
  }

  if (!isValidOutboundUrl(wh.url)) {
    throw new Error('Webhook URL rejected by SSRF guard.');
  }

  const testPayload = {
    event: 'payment.success',
    id: `evt_test_${Date.now()}`,
    timestamp: Math.floor(Date.now() / 1000),
    data: {
      invoice_id: `inv_test_${Date.now().toString(36)}`,
      order_id: `ORDER-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      merchant_id: wh.merchantId || 'mrc_global_all',
      amount_paid: 50000,
      paid_at: new Date().toISOString(),
      is_test: true,
    }
  };

  const signature = await signWebhookPayload(testPayload, wh.secret);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(wh.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'QBiz-Webhook-Dispatcher/1.1.0',
        'X-QBiz-Signature': signature,
        'X-QBiz-Timestamp': Math.floor(Date.now() / 1000).toString(),
        'X-QBiz-Event': 'payment.success',
        'X-QBiz-Delivery': `dlv_${Date.now()}`,
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const durationMs = Date.now() - startTime;
    const statusCode = res.status;

    // Update last status
    await db.update(webhooks).set({
      lastTriggeredAt: new Date(),
      lastStatusCode: statusCode,
    }).where(eq(webhooks.id, wh.id));

    return {
      success: statusCode >= 200 && statusCode < 300,
      statusCode,
      durationMs,
      error: statusCode >= 400 ? `Endpoint returned HTTP ${statusCode}` : undefined,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    await db.update(webhooks).set({
      lastTriggeredAt: new Date(),
      lastStatusCode: 500,
    }).where(eq(webhooks.id, wh.id));

    return {
      success: false,
      statusCode: 500,
      durationMs,
      error: err.name === 'AbortError' ? 'Connection timed out (6s exceeded)' : err.message,
    };
  }
}

/**
 * Dispatch webhooks to all matching store & global endpoints for a transaction event
 */
export async function dispatchWebhooksForInvoice(
  invoice: any,
  eventType: WebhookEvent,
  txTime?: string
) {
  try {
    // 1. Fetch matching active webhooks:
    // - Scoped to invoice.merchantId OR global (merchantId is null)
    // - Status is ACTIVE
    let matchingWebhooks: (typeof webhooks.$inferSelect)[] = [];

    if (invoice.merchantId) {
      matchingWebhooks = await db
        .select()
        .from(webhooks)
        .where(
          and(
            eq(webhooks.status, 'ACTIVE'),
            or(
              eq(webhooks.merchantId, invoice.merchantId),
              isNull(webhooks.merchantId)
            )
          )
        );
    } else {
      matchingWebhooks = await db
        .select()
        .from(webhooks)
        .where(and(eq(webhooks.status, 'ACTIVE'), isNull(webhooks.merchantId)));
    }

    // Filter by subscribed event
    const activeTargets = matchingWebhooks.filter(w => {
      const evList = w.events.split(',').map(e => e.trim());
      return evList.includes(eventType) || evList.includes('*');
    });

    const payload = {
      event: eventType,
      id: `evt_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000),
      data: {
        invoice_id: invoice.id,
        order_id: invoice.orderId,
        merchant_id: invoice.merchantId,
        amount_paid: invoice.totalAmount,
        paid_at: txTime || new Date().toISOString(),
      }
    };

    // Dispatch in parallel via Promise.allSettled
    const dispatchPromises = activeTargets.map(async (target) => {
      if (!isValidOutboundUrl(target.url)) {
        console.warn(`[Webhook Dispatch] Skipped target ${target.id} due to SSRF guard: ${target.url}`);
        return;
      }

      try {
        const signature = await signWebhookPayload(payload, target.secret);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(target.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'QBiz-Webhook-Dispatcher/1.1.0',
            'X-QBiz-Signature': signature,
            'X-QBiz-Timestamp': Math.floor(Date.now() / 1000).toString(),
            'X-QBiz-Event': eventType,
            'X-QBiz-Delivery': `dlv_${Date.now()}_${target.id.slice(-4)}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        await db.update(webhooks).set({
          lastTriggeredAt: new Date(),
          lastStatusCode: res.status,
        }).where(eq(webhooks.id, target.id));

        console.log(`[Webhook Dispatch] Delivered event ${eventType} to ${target.name} (${target.url}) -> HTTP ${res.status}`);
      } catch (err: any) {
        console.error(`[Webhook Dispatch] Failed delivering to ${target.name} (${target.url}):`, err.message);
        await db.update(webhooks).set({
          lastTriggeredAt: new Date(),
          lastStatusCode: 500,
        }).where(eq(webhooks.id, target.id));
      }
    });

    await Promise.allSettled(dispatchPromises);
  } catch (err: any) {
    console.error(`[Webhook Dispatch] Error resolving webhooks for invoice ${invoice.id}:`, err.message);
  }
}
