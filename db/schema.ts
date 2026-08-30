import { pgTable, text, integer, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core';

// 1. Merchant Accounts Table
export const merchants = pgTable('merchants', {
  id: text('id').primaryKey(), // e.g. 'mrc_toko_cabang_1'
  name: text('name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  qrisImageUrl: text('qris_image_url').notNull(),
  qrisPayload: text('qris_payload').default('').notNull(), // Raw static EMVCo QRIS string
  sessionFilePath: text('session_file_path').notNull(), // 'sessions/mrc_1.json'
  sessionToken: text('session_token'), // GoBiz Bearer access token (extracted after OTP login)
  status: text('status').$type<'ACTIVE' | 'NEEDS_OTP' | 'DISCONNECTED'>().default('NEEDS_OTP').notNull(),
  logoUrl: text('logo_url'), // Custom merchant branding logo URL
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Users Table for RBAC Authentication
export const users = pgTable('users', {
  id: text('id').primaryKey(), // e.g. 'usr_102938'
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(), // Hashed password
  role: text('role').$type<'SUPER_ADMIN' | 'ADMIN' | 'REGIONAL_ADMIN' | 'MERCHANT' | 'MERCHANT_EMPLOYEE'>().notNull(),
  merchantId: text('merchant_id').references(() => merchants.id, { onDelete: 'set null' }), // Set if user is Merchant or Employee
  apiKey: text('api_key').unique(),
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Regional Admin to Merchants mapping (Junction Table)
export const regionalAdminMerchants = pgTable('regional_admin_merchants', {
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  merchantId: text('merchant_id').references(() => merchants.id, { onDelete: 'cascade' }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.merchantId] }),
}));

// 4. Invoices / Charges Table
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(), // e.g., 'inv_10923840'
  merchantId: text('merchant_id').references(() => merchants.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // Associated user creator
  orderId: text('order_id').notNull(), // Client's POS Order ID
  baseAmount: integer('base_amount').notNull(), // e.g. 50000
  uniqueCode: integer('unique_code').notNull(), // e.g. 123
  totalAmount: integer('total_amount').notNull(), // e.g. 50123
  status: text('status').$type<'PENDING' | 'PAID' | 'EXPIRED'>().default('PENDING').notNull(),
  callbackUrl: text('callback_url'),
  redirectUrl: text('redirect_url'), // Customer browser redirection target on payment success
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  items: text('items'), // JSON string representing purchase item details
  expiredAt: timestamp('expired_at', { withTimezone: true }).notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  isSandbox: boolean('is_sandbox').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Incoming Mutations Log
export const mutations = pgTable('mutations', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id').references(() => merchants.id, { onDelete: 'set null' }),
  rawAmount: integer('raw_amount').notNull(),
  transactionTime: text('transaction_time').notNull(),
  isMatched: boolean('is_matched').default(false).notNull(),
  invoiceId: text('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Multi-Channel Merchant Notifications (Telegram, Discord, WhatsApp GOWA)
export const merchantNotifications = pgTable('merchant_notifications', {
  id: text('id').primaryKey(), // e.g. 'notif_mrc_xxx'
  merchantId: text('merchant_id').references(() => merchants.id, { onDelete: 'cascade' }).unique().notNull(),
  
  // Telegram Bot Settings
  telegramEnabled: boolean('telegram_enabled').default(false).notNull(),
  telegramBotToken: text('telegram_bot_token'),
  telegramChatId: text('telegram_chat_id'),
  telegramTemplate: text('telegram_template'),

  // Discord Webhook Settings
  discordEnabled: boolean('discord_enabled').default(false).notNull(),
  discordWebhookUrl: text('discord_webhook_url'),
  discordTemplate: text('discord_template'),

  // WhatsApp (GOWA by Aldinokemal) Settings
  whatsappEnabled: boolean('whatsapp_enabled').default(false).notNull(),
  whatsappApiUrl: text('whatsapp_api_url'), // e.g. http://localhost:3000
  whatsappAuthType: text('whatsapp_auth_type').$type<'NONE' | 'BEARER' | 'BASIC'>().default('NONE').notNull(),
  whatsappAuthKey: text('whatsapp_auth_key'), // API Key or Basic Auth
  whatsappRecipient: text('whatsapp_recipient'), // Target phone: 628123456789 or Group JID
  whatsappTemplate: text('whatsapp_template'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. Dynamic Global System Settings Table (Key-Value configuration for Super Admin)
export const systemSettings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 8. Enterprise Multi-API Keys Table (Scoped to Merchant & Granular Permissions)
export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(), // e.g. 'key_1785928374'
  name: text('name').notNull(), // e.g. 'POS Kasir Cabang 1'
  key: text('key').unique().notNull(), // Full secret token 'qbiz_live_xxxxxxxx'
  keyPrefix: text('key_prefix').notNull(), // 'qbiz_live_...4a9f' for masked preview
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  merchantId: text('merchant_id').references(() => merchants.id, { onDelete: 'cascade' }), // Null = ALL stores (Admin only)
  scopes: text('scopes').notNull(), // Comma-separated list e.g. 'invoices:create,invoices:read'
  status: text('status').$type<'ACTIVE' | 'REVOKED'>().default('ACTIVE').notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 9. Enterprise Multi-Webhooks Table (Scoped to Merchant & Granular Events)
export const webhooks = pgTable('webhooks', {
  id: text('id').primaryKey(), // e.g. 'whk_1785928374'
  name: text('name').notNull(), // e.g. 'POS Server Cabang 1'
  url: text('url').notNull(), // Webhook destination URL
  secret: text('secret').notNull(), // HMAC-SHA256 signing secret key
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  merchantId: text('merchant_id').references(() => merchants.id, { onDelete: 'cascade' }), // Null = ALL stores
  events: text('events').notNull(), // Comma-separated list e.g. 'payment.success,invoice.created,invoice.expired'
  status: text('status').$type<'ACTIVE' | 'PAUSED'>().default('ACTIVE').notNull(),
  lastTriggeredAt: timestamp('last_triggered_at', { withTimezone: true }),
  lastStatusCode: integer('last_status_code'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});


