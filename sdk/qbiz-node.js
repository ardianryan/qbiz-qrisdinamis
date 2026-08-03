const crypto = require('crypto');

class QBizClient {
  /**
   * @param {Object} config
   * @param {string} config.apiKey - Secret API Bearer Key
   * @param {string} [config.baseUrl] - API Base URL (defaults to http://localhost:8000)
   */
  constructor({ apiKey, baseUrl = 'http://localhost:8000' }) {
    if (!apiKey) {
      throw new Error('API Key is required to initialize QBizClient');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  /**
   * Create a new dynamic QRIS invoice
   * @param {Object} params
   * @param {string} params.orderId - Unique order ID from client system
   * @param {number} params.amount - Base billing amount in Rupiah
   * @param {string} [params.callbackUrl] - Webhook callback URL for payment success notification
   * @param {string} [params.redirectUrl] - Browser redirect page URL on payment success
   * @param {string} [params.merchantId] - Target merchant ID (optional)
   * @param {string} [params.customerName] - Full customer name (optional)
   * @param {string} [params.customerEmail] - Customer email address (optional)
   * @param {string} [params.customerPhone] - Customer phone number (optional)
   * @param {Array} [params.items] - List of purchase items (optional)
   * @returns {Promise<Object>} The created invoice details
   */
  async createInvoice({ orderId, amount, callbackUrl, redirectUrl, merchantId, customerName, customerEmail, customerPhone, items }) {
    const url = `${this.baseUrl}/api/v1/invoices`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_id: orderId,
        amount: Number(amount),
        callback_url: callbackUrl,
        redirect_url: redirectUrl,
        merchant_id: merchantId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        items: items
      })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP Error ${response.status} creating invoice`);
    }
    return data.invoice;
  }

  /**
   * Fetch payment status of an invoice
   * @param {string} invoiceId - QBiz invoice ID (e.g. inv_...)
   * @returns {Promise<Object>} Payment status payload
   */
  async getInvoiceStatus(invoiceId) {
    const url = `${this.baseUrl}/api/v1/invoices/${invoiceId}/status`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status} fetching status`);
    }
    return data;
  }

  /**
   * Verify HMAC signature received in webhook headers
   * @param {Object|string} payload - JSON string or object body received in POST
   * @param {string} signatureHeader - Value of X-QBiz-Signature header
   * @param {string} webhookSecret - Your webhook verification secret key
   * @returns {boolean} True if signature is valid, false otherwise
   */
  verifyWebhook(payload, signatureHeader, webhookSecret) {
    try {
      const dataStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const computedHash = crypto
        .createHmac('sha256', webhookSecret)
        .update(dataStr)
        .digest('hex');
      return computedHash === signatureHeader;
    } catch (_err) {
      return false;
    }
  }
}

module.exports = QBizClient;
