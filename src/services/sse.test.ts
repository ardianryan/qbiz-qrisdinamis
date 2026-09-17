import { assertEquals } from "@std/assert";
import { sseBroker, InvoiceStatusEvent, TransactionUpdateEvent } from "./sse.ts";

Deno.test("SSE Broker - should publish and receive invoice status updates", () => {
  const invoiceId = "inv_test_sse_123";
  let receivedEvent: InvoiceStatusEvent | null = null;

  const unsubscribe = sseBroker.subscribeInvoice(invoiceId, (event) => {
    receivedEvent = event;
  });

  const payload: InvoiceStatusEvent = {
    invoiceId,
    orderId: "ORD-9991",
    status: "PAID",
    paidAt: "2026-09-17T11:00:00.000Z",
    amount: 75000,
    redirectUrl: "https://myshop.com/success"
  };

  sseBroker.publishInvoiceUpdate(payload);

  assertEquals(receivedEvent as any, payload);
  assertEquals((receivedEvent as any)?.status, "PAID");

  // Unsubscribe and verify no further messages received
  unsubscribe();
  sseBroker.publishInvoiceUpdate({
    ...payload,
    status: "EXPIRED"
  });

  assertEquals((receivedEvent as any)?.status, "PAID"); // unchanged
});

Deno.test("SSE Broker - should publish and receive store transaction updates", () => {
  const merchantId = "mrc_toko_kopi_1";
  let receivedMerchantEvent: TransactionUpdateEvent | null = null;
  let receivedGlobalEvent: TransactionUpdateEvent | null = null;

  const unsubMerchant = sseBroker.subscribeTransactions(merchantId, (event) => {
    receivedMerchantEvent = event;
  });

  const unsubGlobal = sseBroker.subscribeTransactions("*", (event) => {
    receivedGlobalEvent = event;
  });

  const payload: TransactionUpdateEvent = {
    merchantId,
    invoiceId: "inv_trx_555",
    orderId: "ORDER-555",
    amount: 35000,
    status: "PAID",
    timestamp: "2026-09-17T11:05:00.000Z"
  };

  sseBroker.publishTransactionUpdate(payload);

  assertEquals(receivedMerchantEvent as any, payload);
  assertEquals(receivedGlobalEvent as any, payload);

  unsubMerchant();
  unsubGlobal();
});
