import { assertEquals } from "jsr:@std/assert";
import { DEFAULT_SYSTEM_SETTINGS, getSystemSettings, updateSystemSettings } from "./settings.ts";

Deno.test("Settings Service - should have valid default system settings", () => {
  assertEquals(DEFAULT_SYSTEM_SETTINGS.appName, "QBiz Gateway");
  assertEquals(DEFAULT_SYSTEM_SETTINGS.invoiceExpiryMinutes, 15);
  assertEquals(DEFAULT_SYSTEM_SETTINGS.allowDemoLogin, false);
  assertEquals(DEFAULT_SYSTEM_SETTINGS.sessionTimeoutHours, 168);
  assertEquals(DEFAULT_SYSTEM_SETTINGS.defaultWebhookRetryLimit, 3);
});

Deno.test("Settings Service - getSystemSettings should return default config when DB empty/fallback", async () => {
  const settings = await getSystemSettings();
  assertEquals(typeof settings.appName, "string");
  assertEquals(typeof settings.invoiceExpiryMinutes, "number");
  assertEquals(typeof settings.allowDemoLogin, "boolean");
});

Deno.test("Settings Service - updateSystemSettings should update and return new themeColor and branding", async () => {
  const updated = await updateSystemSettings({
    appName: "QBiz Enterprise",
    themeColor: "#ff00bb"
  });
  assertEquals(updated.appName, "QBiz Enterprise");
  assertEquals(updated.themeColor, "#ff00bb");
});

