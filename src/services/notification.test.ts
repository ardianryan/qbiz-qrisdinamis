import { assertEquals, assertStringIncludes } from "@std/assert";
import { formatNotificationMessage, formatRupiah, DEFAULT_TEMPLATES, NotificationPayloadData } from "./notification.ts";

const mockData: NotificationPayloadData = {
  merchantName: "Resto Padang Sederhana",
  orderId: "ORD-9988",
  invoiceId: "inv_12345",
  baseAmount: 50000,
  uniqueCode: 123,
  totalAmount: 50123,
  amountFormatted: formatRupiah(50123),
  customerName: "Rudi Hartono",
  customerPhone: "081234567890",
  customerEmail: "rudi@example.com",
  paidAt: "30/08/2026 14:00:00",
  status: "PAID"
};

Deno.test("Notification Service - formatRupiah should format currency correctly", () => {
  const formatted = formatRupiah(50123);
  assertStringIncludes(formatted, "50.123");
});

Deno.test("Notification Service - formatNotificationMessage should interpolate all variables", () => {
  const customTemplate = "Toko: {merchant_name}, Order: {order_id}, Bayar: {amount_formatted}, Pelanggan: {customer_name}";
  const result = formatNotificationMessage(customTemplate, mockData, DEFAULT_TEMPLATES.telegram);

  assertStringIncludes(result, "Toko: Resto Padang Sederhana");
  assertStringIncludes(result, "Order: ORD-9988");
  assertStringIncludes(result, "Bayar: ");
  assertStringIncludes(result, "50.123");
  assertStringIncludes(result, "Pelanggan: Rudi Hartono");
});

Deno.test("Notification Service - formatNotificationMessage should fallback to default template when empty", () => {
  const result = formatNotificationMessage("", mockData, DEFAULT_TEMPLATES.telegram);
  assertStringIncludes(result, "Pembayaran QRIS Berhasil!");
  assertStringIncludes(result, "Resto Padang Sederhana");
  assertStringIncludes(result, "ORD-9988");
});

Deno.test("Security & SSRF Guard - isValidOutboundUrl should block dangerous protocols and metadata IP", async () => {
  const { isValidOutboundUrl } = await import("./notification.ts");
  // Allowed URLs
  assertEquals(isValidOutboundUrl("https://discord.com/api/webhooks/123/abc"), true);
  assertEquals(isValidOutboundUrl("http://localhost:3000"), true);
  assertEquals(isValidOutboundUrl("https://my-gowa-server.com"), true);

  // Prohibited / SSRF targets
  assertEquals(isValidOutboundUrl("http://169.254.169.254/latest/meta-data"), false);
  assertEquals(isValidOutboundUrl("http://metadata.google.internal/computeMetadata/v1/"), false);
  assertEquals(isValidOutboundUrl("javascript:alert(1)"), false);
  assertEquals(isValidOutboundUrl("file:///etc/passwd"), false);
  assertEquals(isValidOutboundUrl("ftp://my-server.com"), false);
  assertEquals(isValidOutboundUrl("not-a-valid-url"), false);
});

