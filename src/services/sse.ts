/**
 * Server-Sent Events (SSE) Event Broker for QBiz Gateway Hub
 * Provides zero-latency real-time event broadcasting for payments and mutations
 */

export interface InvoiceStatusEvent {
  invoiceId: string;
  orderId: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  paidAt?: string | null;
  amount?: number;
  redirectUrl?: string | null;
}

export interface TransactionUpdateEvent {
  merchantId: string;
  invoiceId: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  timestamp: string;
}

type InvoiceListener = (event: InvoiceStatusEvent) => void;
type TransactionListener = (event: TransactionUpdateEvent) => void;

class PaymentEventBroker {
  private invoiceListeners = new Map<string, Set<InvoiceListener>>();
  private transactionListeners = new Map<string, Set<TransactionListener>>();

  /**
   * Subscribe to status updates for a specific invoice ID
   */
  public subscribeInvoice(invoiceId: string, listener: InvoiceListener): () => void {
    if (!this.invoiceListeners.has(invoiceId)) {
      this.invoiceListeners.set(invoiceId, new Set());
    }
    this.invoiceListeners.get(invoiceId)!.add(listener);

    return () => {
      const listeners = this.invoiceListeners.get(invoiceId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.invoiceListeners.delete(invoiceId);
        }
      }
    };
  }

  /**
   * Broadcast an invoice status change (e.g. PAID or EXPIRED)
   */
  public publishInvoiceUpdate(event: InvoiceStatusEvent): void {
    const listeners = this.invoiceListeners.get(event.invoiceId);
    if (listeners && listeners.size > 0) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.error(`[SSE Broker] Error in invoice listener for ${event.invoiceId}:`, err);
        }
      });
    }
  }

  /**
   * Subscribe to transaction stream for a specific merchant or all merchants ('*')
   */
  public subscribeTransactions(merchantId: string, listener: TransactionListener): () => void {
    const key = merchantId || '*';
    if (!this.transactionListeners.has(key)) {
      this.transactionListeners.set(key, new Set());
    }
    this.transactionListeners.get(key)!.add(listener);

    return () => {
      const listeners = this.transactionListeners.get(key);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.transactionListeners.delete(key);
        }
      }
    };
  }

  /**
   * Broadcast a transaction event to merchant listeners and global listeners
   */
  public publishTransactionUpdate(event: TransactionUpdateEvent): void {
    // Notify merchant-specific listeners
    const merchantListeners = this.transactionListeners.get(event.merchantId);
    if (merchantListeners) {
      merchantListeners.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.error(`[SSE Broker] Error in transaction listener:`, err);
        }
      });
    }

    // Notify global listeners
    const globalListeners = this.transactionListeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(listener => {
        try {
          listener(event);
        } catch (err) {
          console.error(`[SSE Broker] Error in global transaction listener:`, err);
        }
      });
    }
  }

  /**
   * Helper to count active listeners (useful for diagnostics and tests)
   */
  public getStats(): { activeInvoices: number; activeMerchants: number } {
    return {
      activeInvoices: this.invoiceListeners.size,
      activeMerchants: this.transactionListeners.size,
    };
  }
}

export const sseBroker = new PaymentEventBroker();
