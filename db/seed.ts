import { db } from "./db.ts";
import { users, merchants, regionalAdminMerchants, merchantNotifications } from "./schema.ts";
import { hashPassword } from "../src/middleware/auth.ts";
import { DEFAULT_TEMPLATES } from "../src/services/notification.ts";
import { eq } from "drizzle-orm";

console.log("[Seed] Re-seeding database from scratch...");

// 1. Seed / Upsert Merchants
const demoMerchants = [
  {
    id: "mrc_toko_1",
    name: "Warung Kopi Mojokerto",
    phoneNumber: "081234567890",
    qrisImageUrl: "https://picsum.photos/seed/qris1/300/300",
    qrisPayload: "00020101021151240016ID.CO.QRIS.WWW020412346304ABCD",
    logoUrl: null,
    sessionFilePath: "sessions/mrc_toko_1.json",
    status: "ACTIVE" as const,
  },
  {
    id: "mrc_toko_2",
    name: "Resto Ayam Bakar Cobek",
    phoneNumber: "089988776655",
    qrisImageUrl: "https://picsum.photos/seed/qris2/300/300",
    qrisPayload: "00020101021151240016ID.CO.QRIS.WWW020456786304EF01",
    logoUrl: null,
    sessionFilePath: "sessions/mrc_toko_2.json",
    status: "NEEDS_OTP" as const,
  },
  {
    id: "mrc_toko_3",
    name: "Kopi Kenangan Senopati",
    phoneNumber: "085566778899",
    qrisImageUrl: "https://picsum.photos/seed/qris3/300/300",
    qrisPayload: "00020101021151240016ID.CO.QRIS.WWW02049988630477AA",
    logoUrl: null,
    sessionFilePath: "sessions/mrc_toko_3.json",
    status: "ACTIVE" as const,
  }
];

for (const m of demoMerchants) {
  const existing = await db.select().from(merchants).where(eq(merchants.id, m.id));
  if (existing.length === 0) {
    await db.insert(merchants).values(m);
    console.log(`[Seed] Created merchant: ${m.name} (${m.id})`);
  } else {
    await db.update(merchants).set(m).where(eq(merchants.id, m.id));
    console.log(`[Seed] Updated merchant: ${m.name} (${m.id})`);
  }

  // Seed default notification settings
  const notifExists = await db.select().from(merchantNotifications).where(eq(merchantNotifications.merchantId, m.id));
  if (notifExists.length === 0) {
    await db.insert(merchantNotifications).values({
      id: `notif_${m.id}`,
      merchantId: m.id,
      telegramEnabled: false,
      telegramBotToken: null,
      telegramChatId: null,
      telegramTemplate: DEFAULT_TEMPLATES.telegram,
      discordEnabled: false,
      discordWebhookUrl: null,
      discordTemplate: DEFAULT_TEMPLATES.discord,
      whatsappEnabled: false,
      whatsappApiUrl: "http://localhost:3000",
      whatsappAuthType: "NONE",
      whatsappAuthKey: null,
      whatsappRecipient: null,
      whatsappTemplate: DEFAULT_TEMPLATES.whatsapp,
    });
  }
}

// 2. Seed / Upsert Users with standard passwords
const demoUsers = [
  {
    id: "usr_superadmin",
    name: "Super Admin",
    email: "superadmin@qbiz.com",
    password: await hashPassword("SuperQBiz2026"),
    role: "SUPER_ADMIN" as const,
    merchantId: null,
    apiKey: "qbiz_api_key_live_2026_w8a2b3d9x7c",
    webhookUrl: "https://webhook.site/df038cb2-2c6e-4ad3-9ef4-8c813a3028d0",
    webhookSecret: "my_secret_signing_hmac_key_2026"
  },
  {
    id: "usr_admin",
    name: "Admin Operations",
    email: "admin@qbiz.com",
    password: await hashPassword("admin123"), // admin123
    role: "ADMIN" as const,
    merchantId: null,
    apiKey: "qbiz_api_key_live_2026_admin",
    webhookUrl: null,
    webhookSecret: null
  },
  {
    id: "usr_regional",
    name: "Regional Manager",
    email: "regional@qbiz.com",
    password: await hashPassword("admin123"),
    role: "REGIONAL_ADMIN" as const,
    merchantId: null,
    apiKey: "qbiz_api_key_live_2026_regional",
    webhookUrl: null,
    webhookSecret: null
  },
  {
    id: "usr_merchant",
    name: "Toko Mojokerto Owner",
    email: "merchant@qbiz.com",
    password: await hashPassword("admin123"),
    role: "MERCHANT" as const,
    merchantId: "mrc_toko_1",
    apiKey: "qbiz_api_key_live_2026_merchant",
    webhookUrl: null,
    webhookSecret: null
  },
  {
    id: "usr_cashier",
    name: "Kasir Kopi 1",
    email: "cashier@qbiz.com",
    password: await hashPassword("admin123"),
    role: "MERCHANT_EMPLOYEE" as const,
    merchantId: "mrc_toko_1",
    apiKey: "qbiz_api_key_live_2026_cashier",
    webhookUrl: null,
    webhookSecret: null
  }
];

for (const u of demoUsers) {
  const existing = await db.select().from(users).where(eq(users.id, u.id));
  if (existing.length === 0) {
    await db.insert(users).values(u);
    console.log(`[Seed] Created user: ${u.email}`);
  } else {
    await db.update(users).set(u).where(eq(users.id, u.id));
    console.log(`[Seed] Reset user: ${u.email}`);
  }
}

// 3. Link Regional Admin to Merchants
const regMappings = [
  { userId: "usr_regional", merchantId: "mrc_toko_1" },
  { userId: "usr_regional", merchantId: "mrc_toko_2" }
];
for (const rm of regMappings) {
  try {
    await db.insert(regionalAdminMerchants).values(rm);
    console.log(`[Seed] Mapped regional admin to merchant: ${rm.merchantId}`);
  } catch (_e) {
    // Already mapped
  }
}

console.log("[Seed] Seeding completed successfully!");
Deno.exit(0);
