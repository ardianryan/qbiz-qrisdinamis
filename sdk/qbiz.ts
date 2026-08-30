/**
 * QBiz Dynamic QRIS Gateway - TypeScript / Modern ESM SDK
 * Fully typed client for Next.js, Nuxt, SvelteKit, NestJS, Node.js, Bun, and Deno.
 */

export interface QBizConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface PurchaseItem {
  name: string;
  quantity: number;
  price: number;
}

export interface CreateInvoiceOptions {
  orderId: string;
  amount: number;
  callbackUrl?: string;
  redirectUrl?: string;
  merchantId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items?: PurchaseItem[];
}

export interface Invoice {
  id: string;
  merchantId: string | null;
  orderId: string;
  baseAmount: number;
  uniqueCode: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  qrisPayload: string;
  checkoutUrl: string;
  redirectUrl?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items?: PurchaseItem[] | null;
  expiredAt: string;
  paidAt?: string | null;
  createdAt: string;
}

export interface InvoiceStatus {
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  totalAmount: number;
  paidAt?: string | null;
}

export interface WebhookPayload {
  event: 'payment.success';
  invoice_id: string;
  order_id: string;
  amount_paid: number;
  paid_at: string;
}

export class QBizClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: QBizConfig) {
    if (!config.apiKey) {
      throw new Error('API Key is required to initialize QBizClient');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || 'http://localhost:8000').replace(/\/+$/, '');
  }

  /**
   * Create a new dynamic QRIS payment invoice
   */
  async createInvoice(options: CreateInvoiceOptions): Promise<Invoice> {
    if (!options.orderId) throw new Error('orderId is required');
    if (!options.amount || options.amount <= 0) throw new Error('amount must be greater than 0');

    const url = `${this.baseUrl}/api/v1/invoices`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        order_id: options.orderId,
        amount: Math.round(options.amount),
        callback_url: options.callbackUrl,
        redirect_url: options.redirectUrl,
        merchant_id: options.merchantId,
        customer_name: options.customerName,
        customer_email: options.customerEmail,
        customer_phone: options.customerPhone,
        items: options.items
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP ${res.status}: Failed to create invoice`);
    }

    return {
      id: data.invoice.id,
      merchantId: data.invoice.merchant_id || null,
      orderId: data.invoice.order_id,
      baseAmount: data.invoice.base_amount,
      uniqueCode: data.invoice.unique_code,
      totalAmount: data.invoice.total_amount,
      status: data.invoice.status,
      qrisPayload: data.invoice.qris_payload,
      checkoutUrl: data.invoice.checkout_url,
      redirectUrl: data.invoice.redirect_url,
      customerName: data.invoice.customer_name,
      customerEmail: data.invoice.customer_email,
      customerPhone: data.invoice.customer_phone,
      items: data.invoice.items ? (typeof data.invoice.items === 'string' ? JSON.parse(data.invoice.items) : data.invoice.items) : undefined,
      expiredAt: data.invoice.expired_at || '',
      createdAt: data.invoice.created_at || new Date().toISOString()
    };
  }

  /**
   * Check settlement status of an invoice
   */
  async getInvoiceStatus(invoiceId: string): Promise<InvoiceStatus> {
    if (!invoiceId) throw new Error('invoiceId is required');

    const url = `${this.baseUrl}/api/v1/invoices/${encodeURIComponent(invoiceId)}/status`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return {
      status: data.status,
      totalAmount: data.totalAmount || data.total_amount,
      paidAt: data.paidAt || data.paid_at
    };
  }

  /**
   * Cryptographically verify an incoming HMAC-SHA256 webhook signature with anti-replay protection.
   */
  static async verifyWebhookSignature(
    rawBody: string | Uint8Array,
    signature: string,
    secretKey: string,
    timestamp?: number | string,
    toleranceSeconds = 300
  ): Promise<boolean> {
    if (!rawBody || !signature || !secretKey) return false;

    // 1. Anti-replay timestamp verification
    if (timestamp) {
      const tsNum = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
      if (!isNaN(tsNum)) {
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - tsNum) > toleranceSeconds) {
          return false; // Request too old or from future
        }
      }
    }

    // 2. Compute HMAC-SHA256 using standard Web Crypto API
    try {
      const encoder = new TextEncoder();
      const keyBuf = encoder.encode(secretKey);
      const dataBuf = typeof rawBody === 'string' ? encoder.encode(rawBody) : rawBody;

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuf,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, dataBuf as BufferSource);
      const expectedSig = Array.from(new Uint8Array(sigBuf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return signature.toLowerCase() === expectedSig.toLowerCase();
    } catch {
      return false;
    }
  }
}
