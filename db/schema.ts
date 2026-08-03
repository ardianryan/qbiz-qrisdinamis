import { pgTable, text, integer, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core';

// 1. Merchant Accounts Table
export const merchants = pgTable('merchants', {
  id: text('id').primaryKey(), // e.g. 'mrc_toko_cabang_1'
  name: text('name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  qrisImageUrl: text('qris_image_url').notNull(),
  qrisPayload: text('qris_payload').default('').notNull(), // Raw static EMVCo QRIS string
  sessionFilePath: text('session_file_path').notNull(), // 'sessions/mrc_1.json'
  status: text('status').$type<'ACTIVE' | 'NEEDS_OTP' | 'DISCONNECTED'>().default('NEEDS_OTP').notNull(),
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
  expiredAt: timestamp('expired_at', { withTimezone: true }).notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
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
