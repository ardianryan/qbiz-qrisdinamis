import nodeCrypto from 'node:crypto';
import { db } from '../db/db.ts';
import { invoices, mutations, users } from '../db/schema.ts';
import { eq, and, or, sql } from 'drizzle-orm';
import { dispatchMerchantNotifications, isValidOutboundUrl } from '../src/services/notification.ts';
import { dispatchWebhooksForInvoice } from '../src/services/webhooks.ts';
import { sseBroker } from '../src/services/sse.ts';

/**
 * Process intercepted or polled transactions/mutations for a merchant,
 * log them to PostgreSQL, match against pending invoices, and dispatch webhooks/notifications/SSE.
 */
export async function processIncomingMutations(merchantId: string, transactionList: any[]) {
  for (const tx of transactionList) {
    const txId = String(tx.id || tx.order_id || tx.wallstreet_transaction_id || tx.transaction_id || `mut_${Date.now()}_${Math.floor(Math.random() * 1000)}`);

    // Status check: only process settlement or captured transactions
    const status = (tx.transaction_status || tx.status || 'SETTLEMENT').toUpperCase();
    if (!['SETTLEMENT', 'CAPTURE', 'SUCCESS'].includes(status)) {
      continue;
    }

    // Support gross_amount, real_gross_amount, amount.value, or amount.
    // In GoBiz merchant analytics API, gross_amount is in sen (multiplied by 100), e.g. Rp 2.001 is returned as 200100.
    const rawAmount = tx.gross_amount ?? tx.real_gross_amount ?? tx.amount?.value ?? tx.amount ?? 0;
    let txAmount = 0;
    if (typeof rawAmount === 'string') {
      let cleaned = rawAmount.trim();
      if (cleaned.includes(',') && !cleaned.includes('.')) {
        cleaned = cleaned.replace(',', '.');
      } else if (cleaned.includes('.') && cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      }
      txAmount = Math.round(parseFloat(cleaned));
    } else {
      txAmount = Math.round(Number(rawAmount));
    }

    if (txAmount <= 0) continue;

    // Normalize: If amount is from DOM, it's ALREADY in IDR Rupiah! Never divide.
    // If amount is from GoBiz API in sen (e.g. 100100 for Rp 1.001 or 200100 for Rp 2.001):
    let normalizedAmount = txAmount;
    if (!tx.is_dom && txAmount >= 100000 && (tx.gross_amount !== undefined || tx.real_gross_amount !== undefined)) {
      normalizedAmount = Math.round(txAmount / 100);
    }

    const txTime = tx.transaction_time || tx.settlement_time || tx.created_at || new Date().toISOString();

    const existing = await db.select().from(mutations).where(eq(mutations.id, txId));
    if (existing.length > 0) {
      const existingRecord = existing[0];
      if (existingRecord.isMatched) {
        continue;
      }
      if (existingRecord.rawAmount !== normalizedAmount) {
        console.log(`[Worker ${merchantId}] Correcting rawAmount for unmatched mutation ${txId} from ${existingRecord.rawAmount} to ${normalizedAmount}`);
        await db.update(mutations).set({ rawAmount: normalizedAmount }).where(eq(mutations.id, txId));
      }
    } else {
      console.log(`[Worker ${merchantId}] New mutation logged: ${txId} - Rp ${normalizedAmount} (${status})`);
      await db.insert(mutations).values({
        id: txId,
        merchantId,
        rawAmount: normalizedAmount,
        transactionTime: txTime,
        isMatched: false
      });
    }

    const invoiceList = await db.select()
      .from(invoices)
      .where(
        and(
          eq(invoices.merchantId, merchantId),
          or(
            eq(invoices.totalAmount, normalizedAmount),
            eq(invoices.totalAmount, txAmount),
            eq(invoices.totalAmount, Math.round(txAmount / 100)),
            eq(invoices.totalAmount, txAmount * 100)
          ),
          sql`(${invoices.status} = 'PENDING' OR (${invoices.status} = 'EXPIRED' AND ${invoices.expiredAt} > NOW() - INTERVAL '30 minutes'))`
        )
      );

    if (invoiceList.length > 0) {
      const matchedInvoice = invoiceList[0];
      console.log(`[Worker ${merchantId}] Match found! Invoice ID: ${matchedInvoice.id}`);

      await db.update(invoices)
        .set({ status: 'PAID', paidAt: new Date(), gofoodTransactionId: txId })
        .where(eq(invoices.id, matchedInvoice.id));

      const updatedInvoice = { ...matchedInvoice, status: 'PAID' as const, gofoodTransactionId: txId };

      await db.update(mutations)
        .set({ isMatched: true, invoiceId: matchedInvoice.id })
        .where(eq(mutations.id, txId));

      if (matchedInvoice.callbackUrl) {
        dispatchWebhook(updatedInvoice, txTime);
      }

      dispatchWebhooksForInvoice(updatedInvoice, 'payment.success', txTime).catch(err => {
        console.error(`[Worker] Failed dispatching multi-webhooks for ${merchantId}:`, err);
      });

      dispatchMerchantNotifications(merchantId, updatedInvoice, txTime).catch(err => {
        console.error(`[Worker] Failed dispatching notifications for ${merchantId}:`, err);
      });

      sseBroker.publishInvoiceUpdate({
        invoiceId: matchedInvoice.id,
        orderId: matchedInvoice.orderId,
        status: 'PAID',
        paidAt: txTime,
        amount: matchedInvoice.totalAmount,
        redirectUrl: matchedInvoice.redirectUrl || matchedInvoice.callbackUrl
      });

      sseBroker.publishTransactionUpdate({
        merchantId,
        invoiceId: matchedInvoice.id,
        orderId: matchedInvoice.orderId,
        amount: matchedInvoice.totalAmount,
        status: 'PAID',
        timestamp: txTime
      });
    }
  }
}

/**
 * Dispatch HTTP POST webhook with dialect-aware signature verification
 */
export async function dispatchWebhook(invoice: any, txTime: string, retryCount = 0) {
  console.log(`[Webhook] Dispatching callback for invoice ${invoice.id} (Attempt ${retryCount + 1})...`);

  let secretKey = Deno.env.get("WEBHOOK_SECRET") || "qbiz_secret_key_hmac_2026";
  let targetUrl = invoice.callbackUrl;

  if (invoice.userId) {
    try {
      const userList = await db.select().from(users).where(eq(users.id, invoice.userId));
      if (userList.length > 0) {
        const userRecord = userList[0];
        if (userRecord.webhookSecret) {
          secretKey = userRecord.webhookSecret;
        }
        if (!targetUrl && userRecord.webhookUrl) {
          targetUrl = userRecord.webhookUrl;
        }
      }
    } catch (err: any) {
      console.error(`[Webhook] Failed querying creator user for invoice ${invoice.id}:`, err.message);
    }
  }

  if (!targetUrl) {
    console.error(`[Webhook] Aborted dispatching invoice ${invoice.id}: no callback url or default user webhook url configured.`);
    return;
  }

  if (!isValidOutboundUrl(targetUrl)) {
    console.error(`[Webhook] Aborted dispatching invoice ${invoice.id}: target url rejected by SSRF guard: ${targetUrl}`);
    return;
  }

  const dialect = invoice.clientDialect || 'QBIZ';
  let metadata: any = {};
  if (invoice.clientMetadata) {
    try {
      metadata = typeof invoice.clientMetadata === 'string' ? JSON.parse(invoice.clientMetadata) : invoice.clientMetadata;
    } catch (_) {
      metadata = {};
    }
  }

  const baseUrl = Deno.env.get("BASE_URL") || "http://localhost:8000";
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const outgoingHeaders: Record<string, string> = {
    'Referer': baseUrl,
    'Origin': baseUrl
  };
  let outgoingBody = '';

  if (dialect === 'DOIT') {
    const doitPayload = {
      id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'payment.paid',
      created_at: txTime || new Date().toISOString(),
      data: {
        id: invoice.id.startsWith('inv_') ? 'pay_' + invoice.id.slice(4) : invoice.id,
        status: 'paid',
        amount: invoice.baseAmount,
        rail: 'qris',
        reference: invoice.orderId,
        total_amount: invoice.totalAmount,
        paid_at: txTime || new Date().toISOString(),
        metadata: metadata || null
      }
    };
    outgoingBody = JSON.stringify(doitPayload);
    const hmacSig = nodeCrypto.createHmac('sha256', secretKey).update(`${timestamp}.${outgoingBody}`).digest('hex');
    outgoingHeaders['Content-Type'] = 'application/json';
    outgoingHeaders['PayBridge-Signature'] = `t=${timestamp},v1=${hmacSig}`;
  } else if (dialect === 'XENDIT') {
    const xenditPayload = {
      id: invoice.id,
      external_id: invoice.orderId,
      user_id: invoice.userId || 'qbiz_user',
      is_high: false,
      status: 'PAID',
      merchant_name: invoice.merchantId || 'QBiz Merchant',
      amount: invoice.baseAmount,
      paid_amount: invoice.totalAmount,
      payment_method: 'QR_CODE',
      payment_channel: 'QRIS',
      paid_at: txTime || new Date().toISOString(),
      created: invoice.createdAt ? new Date(invoice.createdAt).toISOString() : new Date().toISOString(),
      updated: txTime || new Date().toISOString(),
      description: metadata?.description || `Invoice ${invoice.orderId}`
    };
    outgoingBody = JSON.stringify(xenditPayload);
    outgoingHeaders['Content-Type'] = 'application/json';
    outgoingHeaders['x-callback-token'] = secretKey;
  } else if (dialect === 'DUITKU') {
    const merchantCode = metadata?.merchantCode || 'QBIZ';
    const amountStr = invoice.baseAmount.toString();
    const apiKeyForSig = metadata?.apiKey || secretKey;
    const duitkuSignature = nodeCrypto.createHash('md5')
      .update(`${merchantCode}${amountStr}${invoice.orderId}${apiKeyForSig}`)
      .digest('hex');

    const formParams = new URLSearchParams({
      merchantCode: merchantCode,
      amount: amountStr,
      merchantOrderId: invoice.orderId,
      productDetail: metadata?.productDetails || '',
      additionalParam: metadata?.additionalParam || '',
      paymentCode: metadata?.paymentMethod || 'QRIS',
      resultCode: '00',
      merchantUserId: metadata?.merchantUserId || '',
      reference: invoice.id,
      signature: duitkuSignature
    });
    outgoingBody = formParams.toString();
    outgoingHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
  } else {
    const payload = {
      event: 'payment.success',
      invoice_id: invoice.id,
      order_id: invoice.orderId,
      gofood_transaction_id: invoice.gofoodTransactionId || undefined,
      amount_paid: invoice.totalAmount,
      paid_at: txTime || new Date().toISOString(),
    };
    outgoingBody = JSON.stringify(payload);
    const signature = nodeCrypto.createHmac('sha256', secretKey).update(outgoingBody).digest('hex');
    outgoingHeaders['Content-Type'] = 'application/json';
    outgoingHeaders['X-QBiz-Signature'] = signature;
    outgoingHeaders['X-QBiz-Timestamp'] = timestamp;
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: outgoingHeaders,
      body: outgoingBody,
      signal: AbortSignal.timeout(10000)
    });

    if (response.status >= 200 && response.status < 300) {
      console.log(`[Webhook] Invoice ${invoice.id} callback successfully delivered (HTTP ${response.status}).`);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err: any) {
    console.warn(`[Webhook] Invoice ${invoice.id} callback failed:`, err.message);

    if (retryCount < 3) {
      const delays = [5000, 15000, 45000];
      const delay = delays[retryCount];
      console.log(`[Webhook] Retrying in ${delay / 1000}s...`);
      setTimeout(() => {
        dispatchWebhook(invoice, txTime, retryCount + 1);
      }, delay);
    } else {
      console.error(`[Webhook] Invoice ${invoice.id} callback failed permanently after 3 retries.`);
    }
  }
}
