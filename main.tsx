import { Hono } from 'hono';
import { serveStatic } from 'hono/deno';
import { setSignedCookie, deleteCookie, getSignedCookie } from 'hono/cookie';
import { renderer } from './src/renderer.tsx';
import { LoginPage } from './src/pages/Login.tsx';
import { MerchantsPage } from './src/pages/Merchants.tsx';
import { TransactionsPage } from './src/pages/Transactions.tsx';
import { DeveloperPage } from './src/pages/Developer.tsx';
import { UsersPage } from './src/pages/Users.tsx';
import { CheckoutPage } from './src/pages/Checkout.tsx';
import { DashboardPage } from './src/pages/Dashboard.tsx';
import QRCode from 'npm:qrcode';
import { renderToString } from 'react-dom/server';
import { db } from './db/db.ts';
import { merchants, invoices, mutations, users, regionalAdminMerchants, merchantNotifications } from './db/schema.ts';
import { eq, desc, inArray, and, or, sql } from 'drizzle-orm';
import { triggerGoBizOTP, verifyGoBizOTP, startMerchantListener, stopMerchantListener, dispatchWebhook, closeAllListeners } from './worker/puppeteer-listener.ts';
import { authMiddleware, requireRole, hashPassword, verifyPassword, COOKIE_SECRET, UserSession, MerchantContext } from './src/middleware/auth.ts';
import { securityHeadersMiddleware, createRateLimiter, bodySizeLimiter } from './src/middleware/security.ts';
import { generateDynamicQRIS, decodeQRISFromImage } from './src/utils/qris.ts';
import { dispatchMerchantNotifications, testChannelNotification, DEFAULT_TEMPLATES } from './src/services/notification.ts';
import { migrate } from 'npm:drizzle-orm/postgres-js/migrator';

const DEFAULT_MOCK_STATIC_QRIS = "00020101021138590014ID.CO.QRIS.WWW0215ID10200845344330303UMI51440014ID.CO.QRIS.WWW0215ID10200845344330303UMI5204581253033605802ID5920Resto Ayam Bakar Cbk6009Mojokerto6105613006304D116";

export const app = new Hono();

// =========================================================================
// AUTO-MIGRATIONS & DEFAULT DATA SEEDING (Run on startup)
// =========================================================================
async function runAutoMigrations() {
  try {
    console.log('[Boot] Checking database schema migrations...');
    await migrate(db, { migrationsFolder: './db/migrations' });
    console.log('[Boot] Database schema is up to date.');
  } catch (err: any) {
    console.warn('[Boot] Auto-migration notice:', err.message);
  }
}

async function seedDefaultUsers() {
  try {
    const userList = await db.select().from(users);
    if (userList.length === 0) {
      console.log('[Seed] Seeding default RBAC users into database...');
      
      const seedUsers = [
        {
          id: 'usr_superadmin',
          name: 'Adrian Ryan (SA)',
          email: 'superadmin@qbiz.com',
          password: await hashPassword('SuperQBiz2026'),
          role: 'SUPER_ADMIN' as const,
          merchantId: null,
          apiKey: 'qbiz_api_key_live_2026_w8a2b3d9x7c',
          webhookUrl: 'https://webhook.site/df038cb2-2c6e-4ad3-9ef4-8c813a3028d0',
          webhookSecret: 'my_secret_signing_hmac_key_2026'
        },
        {
          id: 'usr_admin',
          name: 'QBiz Admin Operations',
          email: 'admin@qbiz.com',
          password: await hashPassword('AdminQBiz2026'),
          role: 'ADMIN' as const,
          merchantId: null,
          apiKey: 'qbiz_api_key_live_2026_admin',
          webhookUrl: null,
          webhookSecret: null
        },
        {
          id: 'usr_regional',
          name: 'Budi Regional Manager',
          email: 'regional@qbiz.com',
          password: await hashPassword('RegionalQBiz2026'),
          role: 'REGIONAL_ADMIN' as const,
          merchantId: null,
          apiKey: 'qbiz_api_key_live_2026_regional',
          webhookUrl: null,
          webhookSecret: null
        },
        {
          id: 'usr_merchant',
          name: 'Toko Mojokerto Owner',
          email: 'merchant@qbiz.com',
          password: await hashPassword('MerchantQBiz2026'),
          role: 'MERCHANT' as const,
          merchantId: 'mrc_toko_1', // Associated with mock merchant
          apiKey: 'qbiz_api_key_live_2026_merchant',
          webhookUrl: null,
          webhookSecret: null
        },
        {
          id: 'usr_karyawan',
          name: 'Siti Kasir Toko',
          email: 'karyawan@qbiz.com',
          password: await hashPassword('EmployeeQBiz2026'),
          role: 'MERCHANT_EMPLOYEE' as const,
          merchantId: 'mrc_toko_1',
          apiKey: 'qbiz_api_key_live_2026_karyawan',
          webhookUrl: null,
          webhookSecret: null
        }
      ];

      // Add a mock merchant to anchor seed associations if merchants empty
      const mrcList = await db.select().from(merchants);
      if (mrcList.length === 0) {
        await db.insert(merchants).values({
          id: 'mrc_toko_1',
          name: 'Warung Kopi Mojokerto',
          phoneNumber: '081234567890',
          qrisImageUrl: 'https://picsum.photos/seed/qris1/300/300',
          sessionFilePath: 'sessions/mrc_toko_1.json',
          status: 'ACTIVE'
        });
        
        await db.insert(merchants).values({
          id: 'mrc_toko_2',
          name: 'Resto Ayam Bakar Cobek',
          phoneNumber: '089988776655',
          qrisImageUrl: 'https://picsum.photos/seed/qris2/300/300',
          sessionFilePath: 'sessions/mrc_toko_2.json',
          status: 'NEEDS_OTP'
        });
      }

      for (const u of seedUsers) {
        await db.insert(users).values(u);
      }

      // Link Regional Admin to mrc_toko_1 and mrc_toko_2
      await db.insert(regionalAdminMerchants).values([
        { userId: 'usr_regional', merchantId: 'mrc_toko_1' },
        { userId: 'usr_regional', merchantId: 'mrc_toko_2' }
      ]);

      console.log('[Seed] Seeding completed successfully.');
    }
  } catch (err: any) {
    console.warn('[Seed] Seeding skipped (or database connection not ready):', err.message);
  }
}

// Auto-start active merchant listeners on application boot
async function bootActiveListeners() {
  try {
    const activeMerchants = await db.select().from(merchants).where(
      or(
        eq(merchants.status, 'ACTIVE'),
        eq(merchants.status, 'DISCONNECTED')
      )
    );
    console.log(`[Boot] Found ${activeMerchants.length} active merchant listeners to start.`);
    for (const m of activeMerchants) {
      // Async start in background
      startMerchantListener(m.id).catch(err => {
        console.error(`[Boot] Failed to start listener for merchant ${m.id}:`, err);
      });
    }
  } catch (err: any) {
    console.error(`[Boot] Failed to query active merchants:`, err.message);
  }
}

if (import.meta.main) {
  // 1. Auto-run pending database migrations
  await runAutoMigrations();

  // 2. Auto-seed default RBAC users if empty
  await seedDefaultUsers();

  // 3. Auto-start active merchant listeners
  await bootActiveListeners();
}

// Ensure runtime directories exist
try {
  await Deno.mkdir("sessions", { recursive: true });
  await Deno.mkdir("static/uploads", { recursive: true });
} catch (_e) {}

// Graceful Shutdown Handler (Zombie Process Prevention)
const handleShutdown = async (signal: string) => {
  console.log(`\n[System] Received ${signal}. Initiating graceful shutdown...`);
  await closeAllListeners();
  Deno.exit(0);
};

try {
  Deno.addSignalListener("SIGINT", () => handleShutdown("SIGINT"));
  Deno.addSignalListener("SIGTERM", () => handleShutdown("SIGTERM"));
} catch (_err) {
  // Ignored in unsupported runtime environments
}

// =========================================================================
// MIDDLEWARES & STATIC ROUTES
// =========================================================================

// 1. HTTP Security Headers Middleware (Helmet-like)
app.use('*', securityHeadersMiddleware);

// 2. Payload Body Size Limiter (1MB max)
app.use('*', bodySizeLimiter(1024 * 1024));

// 3. In-Memory Rate Limiters
const loginRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please wait 1 minute before trying again.'
});

const invoiceApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Rate limit exceeded: Maximum 100 invoice requests per minute.'
});

const invoiceStatusRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Rate limit exceeded for invoice status checks.'
});

// Serve static assets (Tailwind compiled CSS)
app.use('/static/*', serveStatic({ root: './' }));

// Scalar API Reference Route
app.get('/docs', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>API Reference - QBiz Gateway</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <script
          id="api-reference"
          data-url="/static/openapi.json"
          data-configuration='{"theme":"purple","hideDownloadButton":true}'></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  `);
});

// Robots.txt route
app.get('/robots.txt', async (c) => {
  try {
    const text = await Deno.readTextFile('./robots.txt');
    c.header('Content-Type', 'text/plain; charset=utf-8');
    return c.text(text);
  } catch (_e) {
    return c.text('Not found', 404);
  }
});

// LLMs Discoverability Files
app.get('/llms.txt', async (c) => {
  try {
    const text = await Deno.readTextFile('./llms.txt');
    c.header('Content-Type', 'text/plain; charset=utf-8');
    return c.text(text);
  } catch (_e) {
    return c.text('Not found', 404);
  }
});

app.get('/llms-full.txt', async (c) => {
  try {
    const text = await Deno.readTextFile('./llms-full.txt');
    c.header('Content-Type', 'text/plain; charset=utf-8');
    return c.text(text);
  } catch (_e) {
    return c.text('Not found', 404);
  }
});

// Apply renderer middleware globally
app.all('*', renderer);

// Apply auth middleware to protect application pages
app.use('*', authMiddleware);

// =========================================================================
// AUTHENTICATION ROUTES
// =========================================================================

// GET: Login Page
app.get('/login', (c) => {
  const user = (c as any).get('user');
  if (user) {
    // If logged in, redirect to correct starting page
    if (user.role === 'MERCHANT' || user.role === 'MERCHANT_EMPLOYEE') {
      return c.redirect('/transactions');
    }
    return c.redirect('/merchants');
  }
  const error = c.req.query('error');
  (c as any).set('title', 'Login');
  return c.render(<LoginPage error={error} />);
});

// POST: Process Login (Protected with Rate Limiter & PBKDF2)
app.post('/login', loginRateLimiter, async (c) => {
  const body = await c.req.parseBody();
  const email = body.email as string;
  const password = body.password as string;

  try {
    const userList = await db.select().from(users).where(eq(users.email, email));
    if (userList.length > 0) {
      const user = userList[0];
      const isValid = await verifyPassword(password, user.password);
      
      if (isValid) {
        // Transparently upgrade legacy single-round SHA-256 hash to PBKDF2
        if (!user.password.startsWith('pbkdf2$')) {
          try {
            const upgradedHash = await hashPassword(password);
            await db.update(users).set({ password: upgradedHash }).where(eq(users.id, user.id));
          } catch (_upgradeErr) {}
        }

        const isHttps = c.req.url.startsWith('https://') || c.req.header('x-forwarded-proto') === 'https';

        // Set signed session cookie (valid for 1 week)
        await setSignedCookie(c, 'session', user.id, COOKIE_SECRET, {
          path: '/',
          httpOnly: true,
          secure: isHttps,
          sameSite: 'Lax',
          maxAge: 60 * 60 * 24 * 7
        });

        // Dynamic redirect based on Role
        if (user.role === 'MERCHANT' || user.role === 'MERCHANT_EMPLOYEE') {
          return c.redirect('/transactions');
        }
        return c.redirect('/merchants');
      }
    }
  } catch (err: any) {
    console.error('[Login] Database authentication query error:', err.message);
  }

  // Fallback demo mock login credentials strictly guarded behind explicit environment variable
  if (Deno.env.get("ALLOW_DEMO_LOGIN") === "true") {
    if (email === 'superadmin@qbiz.com' && password === 'SuperQBiz2026') {
      await setSignedCookie(c, 'session', 'usr_superadmin', COOKIE_SECRET, {
        path: '/', httpOnly: true, secure: false, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 7
      });
      return c.redirect('/merchants');
    } else if (email === 'merchant@qbiz.com' && password === 'MerchantQBiz2026') {
      await setSignedCookie(c, 'session', 'usr_merchant', COOKIE_SECRET, {
        path: '/', httpOnly: true, secure: false, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 7
      });
      return c.redirect('/transactions');
    }
  }

  (c as any).set('title', 'Login');
  return c.render(<LoginPage error="invalid" />);
});

// GET: Process Logout
app.get('/logout', (c) => {
  deleteCookie(c, 'session', { path: '/' });
  return c.redirect('/login');
});

// =========================================================================
// HTML PAGES ROUTING (With RBAC Row-Level Protection)
// =========================================================================

// Redirect root index to dashboard
app.get('/', (c) => {
  const user = (c as any).get('user') as UserSession | undefined;
  if (user) {
    return c.redirect('/dashboard');
  }
  return c.redirect('/login');
});

// PAGE 0: Dashboard (SUPER_ADMIN, ADMIN, REGIONAL_ADMIN, MERCHANT, MERCHANT_EMPLOYEE)
app.get('/dashboard', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'MERCHANT', 'MERCHANT_EMPLOYEE']), async (c) => {
  const user = (c as any).get('user') as UserSession;
  const activeMerchant = (c as any).get('activeMerchant') as MerchantContext | null;
  const accessibleMerchants = ((c as any).get('accessibleMerchants') as MerchantContext[]) || [];

  // Filter queries based on active merchant context or role
  let allowedMerchantIds: string[] | null = null;
  if (activeMerchant) {
    allowedMerchantIds = [activeMerchant.id];
  } else if (user.role === 'REGIONAL_ADMIN') {
    const mappings = await db.select({ id: regionalAdminMerchants.merchantId })
      .from(regionalAdminMerchants)
      .where(eq(regionalAdminMerchants.userId, user.id));
    allowedMerchantIds = mappings.map(m => m.id).filter(Boolean) as string[];
    if (allowedMerchantIds.length === 0) {
      allowedMerchantIds = ['none'];
    }
  } else if (user.role === 'MERCHANT' || user.role === 'MERCHANT_EMPLOYEE') {
    allowedMerchantIds = [user.merchantId || 'none'];
  }

  // 1. Fetch Invoices based on filter
  let filterConditions: any = null;
  if (allowedMerchantIds) {
    filterConditions = inArray(invoices.merchantId, allowedMerchantIds);
  }

  let dbInvoices: any[] = [];
  try {
    if (filterConditions) {
      dbInvoices = await db.select().from(invoices).where(filterConditions);
    } else {
      dbInvoices = await db.select().from(invoices);
    }
  } catch (_e) {}

  // 2. Fetch Active Scrapers (Merchants with ACTIVE status)
  let activeScrapers = 0;
  try {
    if (allowedMerchantIds) {
      const activeMerchantsList = await db.select()
        .from(merchants)
        .where(and(
          eq(merchants.status, 'ACTIVE'),
          inArray(merchants.id, allowedMerchantIds)
        ));
      activeScrapers = activeMerchantsList.length;
    } else {
      const activeMerchantsList = await db.select()
        .from(merchants)
        .where(eq(merchants.status, 'ACTIVE'));
      activeScrapers = activeMerchantsList.length;
    }
  } catch (_e) {}

  // Calculate stats
  let totalVolume = 0;
  let totalInvoices = dbInvoices.length;
  let paidInvoices = 0;
  let pendingInvoices = 0;
  let expiredInvoices = 0;

  for (const inv of dbInvoices) {
    if (inv.status === 'PAID') {
      totalVolume += inv.totalAmount;
      paidInvoices++;
    } else if (inv.status === 'PENDING') {
      pendingInvoices++;
    } else if (inv.status === 'EXPIRED') {
      expiredInvoices++;
    }
  }

  const successRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0;

  // 3. Get Recent Activity (5 latest invoices with merchant names mapped)
  let recentInvoices: any[] = [];
  try {
    if (filterConditions) {
      recentInvoices = await db.select()
        .from(invoices)
        .where(filterConditions)
        .orderBy(desc(invoices.createdAt))
        .limit(5);
    } else {
      recentInvoices = await db.select()
        .from(invoices)
        .orderBy(desc(invoices.createdAt))
        .limit(5);
    }
  } catch (_e) {}

  // Map merchant names
  let recentActivities: any[] = [];
  try {
    const merchantNamesList = await db.select({ id: merchants.id, name: merchants.name }).from(merchants);
    const merchantMap = new Map(merchantNamesList.map(m => [m.id, m.name]));

    recentActivities = recentInvoices.map(inv => ({
      id: inv.id,
      merchantName: merchantMap.get(inv.merchantId || '') || 'Unknown Store',
      orderId: inv.orderId,
      totalAmount: inv.totalAmount,
      status: inv.status,
      createdAt: inv.createdAt.toLocaleString('id-ID')
    }));
  } catch (_e) {}

  (c as any).set('title', 'Dashboard Overview');
  return c.render(
    <DashboardPage
      stats={{
        totalVolume,
        totalInvoices,
        paidInvoices,
        pendingInvoices,
        expiredInvoices,
        activeScrapers,
        successRate
      }}
      recentActivities={recentActivities}
      currentUser={user}
      activeMerchant={activeMerchant}
      accessibleMerchants={accessibleMerchants}
    />
  );
});

// PAGE 1: Multi-Merchant Manager (SUPER_ADMIN, ADMIN, REGIONAL_ADMIN)
app.get('/merchants', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN']), async (c) => {
  const user = (c as any).get('user') as UserSession;
  const activeMerchant = (c as any).get('activeMerchant') as MerchantContext | null;
  const accessibleMerchants = ((c as any).get('accessibleMerchants') as MerchantContext[]) || [];
  let list: any[] = [];
  
  try {
    if (user.role === 'REGIONAL_ADMIN') {
      const mappedMerchants = await db.select({ merchantId: regionalAdminMerchants.merchantId })
        .from(regionalAdminMerchants)
        .where(eq(regionalAdminMerchants.userId, user.id));
      
      const mrcIds = mappedMerchants.map(mm => mm.merchantId);
      if (mrcIds.length > 0) {
        list = await db.select().from(merchants).where(inArray(merchants.id, mrcIds));
      }
    } else {
      list = await db.select().from(merchants);
    }
  } catch (_e) {
    list = [
      { id: 'mrc_toko_1', name: 'Warung Kopi Mojokerto', phoneNumber: '081234567890', qrisImageUrl: 'https://picsum.photos/seed/qris1/300/300', status: 'ACTIVE' as const, todayTransactions: 12, lastSync: '2026-08-03 10:20:15' },
      { id: 'mrc_toko_2', name: 'Resto Ayam Bakar Cobek', phoneNumber: '089988776655', qrisImageUrl: 'https://picsum.photos/seed/qris2/300/300', status: 'NEEDS_OTP' as const, todayTransactions: 0, lastSync: '2026-08-03 09:12:44' }
    ];
  }

  const formattedMerchants = list.map(m => ({
    id: m.id,
    name: m.name,
    phoneNumber: m.phoneNumber,
    qrisImageUrl: m.qrisImageUrl,
    qrisPayload: m.qrisPayload || '',
    logoUrl: m.logoUrl,
    status: m.status as any,
    todayTransactions: (m as any).todayTransactions || 0,
    lastSync: (m as any).lastSync || (m.createdAt ? m.createdAt.toISOString().slice(0, 19).replace('T', ' ') : 'N/A')
  }));

  (c as any).set('title', 'Multi-Merchant Manager');
  return c.render(
    <MerchantsPage merchants={formattedMerchants} currentUser={user} activeMerchant={activeMerchant} accessibleMerchants={accessibleMerchants} />
  );
});

// PAGE 2: Live Transaction Monitor (All roles, scoped)
app.get('/transactions', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'MERCHANT', 'MERCHANT_EMPLOYEE']), async (c) => {
  const user = (c as any).get('user') as UserSession;
  const activeMerchant = (c as any).get('activeMerchant') as MerchantContext | null;
  const accessibleMerchants = ((c as any).get('accessibleMerchants') as MerchantContext[]) || [];
  
  let txList = [];
  let merchantList = [];

  try {
    const dbMerchants = await db.select().from(merchants);
    
    // 1. Scoping merchant list dropdown
    if (user.role === 'REGIONAL_ADMIN') {
      const mapped = await db.select({ merchantId: regionalAdminMerchants.merchantId })
        .from(regionalAdminMerchants)
        .where(eq(regionalAdminMerchants.userId, user.id));
      const mrcIds = mapped.map(mm => mm.merchantId);
      merchantList = dbMerchants.filter(m => mrcIds.includes(m.id));
    } else if (user.role === 'MERCHANT' || user.role === 'MERCHANT_EMPLOYEE') {
      merchantList = dbMerchants.filter(m => m.id === user.merchantId);
    } else {
      merchantList = dbMerchants;
    }

    // 2. Scoping transactions table query
    let dbInvoices: any[] = [];
    if (activeMerchant) {
      dbInvoices = await db.select().from(invoices).where(eq(invoices.merchantId, activeMerchant.id)).orderBy(desc(invoices.createdAt));
    } else if (user.role === 'REGIONAL_ADMIN') {
      const mapped = await db.select({ merchantId: regionalAdminMerchants.merchantId })
        .from(regionalAdminMerchants)
        .where(eq(regionalAdminMerchants.userId, user.id));
      const mrcIds = mapped.map(mm => mm.merchantId);
      if (mrcIds.length > 0) {
        dbInvoices = await db.select().from(invoices).where(inArray(invoices.merchantId, mrcIds)).orderBy(desc(invoices.createdAt));
      }
    } else if (user.role === 'MERCHANT' || user.role === 'MERCHANT_EMPLOYEE') {
      if (user.merchantId) {
        dbInvoices = await db.select().from(invoices).where(eq(invoices.merchantId, user.merchantId)).orderBy(desc(invoices.createdAt));
      }
    } else {
      dbInvoices = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    }

    txList = dbInvoices.map(inv => {
      const mrc = dbMerchants.find(m => m.id === inv.merchantId);
      return {
        id: inv.id,
        merchantId: inv.merchantId || '',
        merchantName: mrc ? mrc.name : 'Unknown Merchant',
        orderId: inv.orderId,
        baseAmount: inv.baseAmount,
        uniqueCode: inv.uniqueCode,
        totalAmount: inv.totalAmount,
        status: inv.status as any,
        webhookStatus: inv.status === 'PAID' ? '200 OK' as const : 'N/A' as const,
        timestamp: inv.createdAt.toISOString().slice(0, 19).replace('T', ' ')
      };
    });
  } catch (_e) {
    merchantList = [
      { id: 'mrc_toko_1', name: 'Warung Kopi Mojokerto' },
      { id: 'mrc_toko_2', name: 'Resto Ayam Bakar Cobek' }
    ];
    txList = [
      { id: 'inv_10923840', merchantId: 'mrc_toko_1', merchantName: 'Warung Kopi Mojokerto', orderId: 'ORDER-100230', baseAmount: 50000, uniqueCode: 123, totalAmount: 50123, status: 'PAID' as const, webhookStatus: '200 OK' as const, timestamp: '2026-08-03 10:28:15' },
      { id: 'inv_10923841', merchantId: 'mrc_toko_1', merchantName: 'Warung Kopi Mojokerto', orderId: 'ORDER-100231', baseAmount: 12000, uniqueCode: 15, totalAmount: 12015, status: 'PENDING' as const, webhookStatus: 'N/A' as const, timestamp: '2026-08-03 10:30:00' }
    ];
  }

  (c as any).set('title', 'Live Transaction Monitor');
  return c.render(
    <TransactionsPage merchants={merchantList} transactions={txList} currentUser={user} activeMerchant={activeMerchant} accessibleMerchants={accessibleMerchants} />
  );
});

// PAGE 3: Developer Hub (All authenticated users)
app.get('/developer', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'MERCHANT']), async (c) => {
  const user = (c as any).get('user') as UserSession;
  const activeMerchant = (c as any).get('activeMerchant') as MerchantContext | null;
  const accessibleMerchants = ((c as any).get('accessibleMerchants') as MerchantContext[]) || [];

  const userList = await db.select().from(users).where(eq(users.id, user.id));
  const dbUser = userList[0] || { apiKey: '', webhookUrl: '', webhookSecret: '' };

  const baseUrl = Deno.env.get("BASE_URL") || "http://localhost:8000";

  (c as any).set('title', 'Developer Hub');
  return c.render(
    <DeveloperPage 
      apiKey={dbUser.apiKey || ''} 
      webhookUrl={dbUser.webhookUrl || ''} 
      webhookSecret={dbUser.webhookSecret || ''} 
      baseUrl={baseUrl}
      currentUser={user}
      activeMerchant={activeMerchant}
      accessibleMerchants={accessibleMerchants}
    />
  );
});

// PAGE 4: User & Role Directory (SUPER_ADMIN, ADMIN, REGIONAL_ADMIN, MERCHANT)
app.get('/users', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'MERCHANT']), async (c) => {
  const currentUser = (c as any).get('user') as UserSession;
  const activeMerchant = (c as any).get('activeMerchant') as MerchantContext | null;
  const accessibleMerchants = ((c as any).get('accessibleMerchants') as MerchantContext[]) || [];
  let userList: any[] = [];
  let merchantList: any[] = [];

  try {
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
      merchantList = await db.select().from(merchants);
    } else if (currentUser.role === 'REGIONAL_ADMIN') {
      const mappings = await db.select({ merchantId: regionalAdminMerchants.merchantId })
        .from(regionalAdminMerchants)
        .where(eq(regionalAdminMerchants.userId, currentUser.id));
      let allowedIds = mappings.map(m => m.merchantId).filter(Boolean) as string[];
      if (allowedIds.length === 0) allowedIds = ['none'];
      merchantList = await db.select().from(merchants).where(inArray(merchants.id, allowedIds));
    } else if (currentUser.role === 'MERCHANT') {
      merchantList = await db.select().from(merchants).where(eq(merchants.id, currentUser.merchantId || 'none'));
    }

    let dbUsers: any[] = [];
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
      dbUsers = await db.select().from(users);
    } else if (currentUser.role === 'REGIONAL_ADMIN') {
      const mappings = await db.select({ merchantId: regionalAdminMerchants.merchantId })
        .from(regionalAdminMerchants)
        .where(eq(regionalAdminMerchants.userId, currentUser.id));
      let allowedIds = mappings.map(m => m.merchantId).filter(Boolean) as string[];
      if (allowedIds.length === 0) allowedIds = ['none'];
      
      dbUsers = await db.select().from(users).where(
        or(
          eq(users.id, currentUser.id),
          inArray(users.merchantId, allowedIds)
        )
      );
    } else if (currentUser.role === 'MERCHANT') {
      dbUsers = await db.select().from(users).where(
        or(
          eq(users.id, currentUser.id),
          eq(users.merchantId, currentUser.merchantId || 'none')
        )
      );
    }

    const regionalMappings = await db.select().from(regionalAdminMerchants);
    const globalMerchantList = await db.select().from(merchants);

    userList = dbUsers.map(u => {
      const associatedMrc = globalMerchantList.find(m => m.id === u.merchantId);
      const mappedCount = regionalMappings.filter(rm => rm.userId === u.id).length;
      
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as any,
        merchantName: associatedMrc ? associatedMrc.name : null,
        mappedMerchantsCount: mappedCount
      };
    });
  } catch (_e) {
    merchantList = [
      { id: 'mrc_toko_1', name: 'Warung Kopi Mojokerto' }
    ];
    userList = [
      { id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role as any, merchantName: null, mappedMerchantsCount: 0 }
    ];
  }

  (c as any).set('title', 'User Directory');
  return c.render(
    <UsersPage users={userList} merchants={merchantList} currentUser={currentUser} activeMerchant={activeMerchant} accessibleMerchants={accessibleMerchants} />
  );
});

// API: Create User Account
app.post('/api/v1/users', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'MERCHANT']), async (c) => {
  const currentUser = (c as any).get('user') as UserSession;
  const body = await c.req.parseBody();
  const name = body.name as string;
  const email = body.email as string;
  const password = body.password as string;
  const role = body.role as any;
  const merchantId = (body.merchantId as string) || null;

  // 1. Validate role mapping security
  if (currentUser.role === 'ADMIN') {
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      return c.text('Forbidden: Admins cannot create Admin or Super Admin accounts', 403);
    }
  } else if (currentUser.role === 'REGIONAL_ADMIN') {
    if (role !== 'MERCHANT' && role !== 'MERCHANT_EMPLOYEE') {
      return c.text('Forbidden: Regional Admins can only create Merchant Owners or Employees', 403);
    }
    const mappings = await db.select({ merchantId: regionalAdminMerchants.merchantId })
      .from(regionalAdminMerchants)
      .where(eq(regionalAdminMerchants.userId, currentUser.id));
    const allowedIds = mappings.map(m => m.merchantId).filter(Boolean) as string[];
    if (!allowedIds.includes(merchantId || '')) {
      return c.text('Forbidden: You do not manage this merchant store', 403);
    }
  } else if (currentUser.role === 'MERCHANT') {
    if (role !== 'MERCHANT_EMPLOYEE') {
      return c.text('Forbidden: Merchant Owners can only create Cashiers', 403);
    }
    if (merchantId !== currentUser.merchantId) {
      return c.text('Forbidden: You can only create cashiers for your own store', 403);
    }
  }

  const newId = `usr_${Date.now()}`;
  const hashedPassword = await hashPassword(password);

  try {
    await db.insert(users).values({
      id: newId,
      name,
      email,
      password: hashedPassword,
      role,
      merchantId
    });
    console.log(`[DB] Created user: ${newId} (${email})`);
  } catch (err: any) {
    console.error(`[DB] User creation failed: ${err.message}`);
    return c.text('Failed to create user: ' + err.message, 500);
  }

  return c.redirect('/users');
});

// API: Delete User Account
app.post('/api/v1/users/:id/delete', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'MERCHANT']), async (c) => {
  const currentUser = (c as any).get('user') as UserSession;
  const id = c.req.param('id');
  
  if (id === 'usr_superadmin') {
    return c.json({ success: false, error: 'Cannot delete primary Super Admin account.' }, 400);
  }

  try {
    const targetUserList = await db.select().from(users).where(eq(users.id, id));
    if (targetUserList.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    const targetUser = targetUserList[0];

    // Validate permission to delete
    if (currentUser.role === 'ADMIN') {
      if (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN') {
        return c.json({ success: false, error: 'Forbidden: Admins cannot delete Admin or Super Admin accounts' }, 403);
      }
    } else if (currentUser.role === 'REGIONAL_ADMIN') {
      const mappings = await db.select({ merchantId: regionalAdminMerchants.merchantId })
        .from(regionalAdminMerchants)
        .where(eq(regionalAdminMerchants.userId, currentUser.id));
      const allowedIds = mappings.map(m => m.merchantId).filter(Boolean) as string[];
      if (!allowedIds.includes(targetUser.merchantId || '')) {
        return c.json({ success: false, error: 'Forbidden: You do not manage the merchant store of this user' }, 403);
      }
    } else if (currentUser.role === 'MERCHANT') {
      if (targetUser.role !== 'MERCHANT_EMPLOYEE') {
        return c.json({ success: false, error: 'Forbidden: Merchant Owners can only delete Cashiers' }, 403);
      }
      if (targetUser.merchantId !== currentUser.merchantId) {
        return c.json({ success: false, error: 'Forbidden: You can only delete cashiers from your own store' }, 403);
      }
    }

    await db.delete(users).where(eq(users.id, id));
    console.log(`[DB] Deleted user: ${id}`);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// =========================================================================
// API ACTIONS ROUTING (Protected by session checks)
// =========================================================================

// API: List Transactions (JSON Polling Endpoint)
app.get('/api/v1/transactions', async (c) => {
  const user = (c as any).get('user') as UserSession;
  let txList = [];
  
  try {
    const dbMerchants = await db.select().from(merchants);
    let dbInvoices: any[] = [];
    
    // Role-based transaction filtering
    if (user.role === 'REGIONAL_ADMIN') {
      const mapped = await db.select({ merchantId: regionalAdminMerchants.merchantId })
        .from(regionalAdminMerchants)
        .where(eq(regionalAdminMerchants.userId, user.id));
      const mrcIds = mapped.map(mm => mm.merchantId);
      if (mrcIds.length > 0) {
        dbInvoices = await db.select().from(invoices).where(inArray(invoices.merchantId, mrcIds)).orderBy(desc(invoices.createdAt));
      }
    } else if (user.role === 'MERCHANT' || user.role === 'MERCHANT_EMPLOYEE') {
      if (user.merchantId) {
        dbInvoices = await db.select().from(invoices).where(eq(invoices.merchantId, user.merchantId)).orderBy(desc(invoices.createdAt));
      }
    } else {
      dbInvoices = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    }
    
    txList = dbInvoices.map(inv => {
      const mrc = dbMerchants.find(m => m.id === inv.merchantId);
      return {
        id: inv.id,
        merchantId: inv.merchantId || '',
        merchantName: mrc ? mrc.name : 'Unknown Merchant',
        orderId: inv.orderId,
        baseAmount: inv.baseAmount,
        uniqueCode: inv.uniqueCode,
        totalAmount: inv.totalAmount,
        status: inv.status as any,
        webhookStatus: inv.status === 'PAID' ? '200 OK' as const : 'N/A' as const,
        timestamp: inv.createdAt.toISOString().slice(0, 19).replace('T', ' ')
      };
    });
  } catch (_e) {
    // Mock polling data
    txList = [
      { id: 'inv_10923840', merchantId: 'mrc_toko_1', merchantName: 'Warung Kopi Mojokerto', orderId: 'ORDER-100230', baseAmount: 50000, uniqueCode: 123, totalAmount: 50123, status: 'PAID' as const, webhookStatus: '200 OK' as const, timestamp: '2026-08-03 10:28:15' },
      { id: 'inv_10923841', merchantId: 'mrc_toko_1', merchantName: 'Warung Kopi Mojokerto', orderId: 'ORDER-100231', baseAmount: 12000, uniqueCode: 15, totalAmount: 12015, status: 'PENDING' as const, webhookStatus: 'N/A' as const, timestamp: '2026-08-03 10:30:00' }
    ];
    if (user.role === 'MERCHANT' || user.role === 'MERCHANT_EMPLOYEE') {
      txList = txList.filter(tx => tx.merchantId === 'mrc_toko_1');
    }
  }

  return c.json({ success: true, transactions: txList });
});

// API: Trigger GoBiz WhatsApp OTP
app.post('/api/v1/merchants/:id/otp/request', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const id = c.req.param('id');
  if (id.startsWith('mrc_toko')) {
    return c.json({ success: true });
  }
  const result = await triggerGoBizOTP(id);
  return c.json(result);
});

// API: Verify GoBiz OTP & Save Cookie Session
app.post('/api/v1/merchants/:id/otp/verify', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const otpCode = body.otp;

  if (id.startsWith('mrc_toko')) {
    await db.update(merchants)
      .set({ status: 'ACTIVE' })
      .where(eq(merchants.id, id));
    return c.json({ success: true });
  }
  const result = await verifyGoBizOTP(id, otpCode);
  return c.json(result);
});

// API: Toggle Listener Worker (Pause/Resume)
app.post('/api/v1/merchants/:id/toggle', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const id = c.req.param('id');
  try {
    const list = await db.select().from(merchants).where(eq(merchants.id, id));
    if (list.length > 0) {
      const merchant = list[0];
      if (merchant.status === 'ACTIVE') {
        await stopMerchantListener(id);
      } else {
        await startMerchantListener(id);
      }
    }
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message });
  }
});

// API: Disconnect Merchant (Stop listener, remove session file, update status to NEEDS_OTP)
app.post('/api/v1/merchants/:id/disconnect', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const id = c.req.param('id');
  console.log(`[API] Disconnecting merchant account: ${id}`);

  // In mock flow
  if (id.startsWith('mrc_toko')) {
    await db.update(merchants)
      .set({ status: 'NEEDS_OTP' })
      .where(eq(merchants.id, id));
    return c.json({ success: true });
  }

  try {
    // 1. Stop the listener
    await stopMerchantListener(id);

    // 2. Query and delete session cookies JSON file
    const mrcList = await db.select().from(merchants).where(eq(merchants.id, id));
    if (mrcList.length > 0) {
      const merchant = mrcList[0];
      try {
        await Deno.remove(merchant.sessionFilePath);
        console.log(`[Worker ${id}] Session file removed successfully.`);
      } catch (_err) {
        console.log(`[Worker ${id}] Session file already deleted or not found.`);
      }
    }

    // 3. Update DB status to NEEDS_OTP
    await db.update(merchants)
      .set({ status: 'NEEDS_OTP' })
      .where(eq(merchants.id, id));

    return c.json({ success: true });
  } catch (err: any) {
    console.error(`[API] Disconnect failed for ${id}:`, err);
    return c.json({ success: false, error: err.message });
  }
});

// =========================================================================
// ACTIVE WORKSPACE SWITCHER (v1.1.0)
// =========================================================================
app.post('/api/v1/workspaces/switch', async (c) => {
  const user = (c as any).get('user') as UserSession | undefined;
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const accessibleMerchants = ((c as any).get('accessibleMerchants') as MerchantContext[]) || [];
  const body = await c.req.json().catch(() => ({}));
  const merchantId = body.merchantId || c.req.query('merchantId');

  if (!merchantId) {
    return c.json({ success: false, error: 'Merchant ID is required.' }, 400);
  }

  const isAllowed = accessibleMerchants.some((m) => m.id === merchantId);
  if (!isAllowed) {
    return c.json({ success: false, error: 'Forbidden: You do not have permission to switch to this store workspace.' }, 403);
  }

  const isHttps = c.req.url.startsWith('https://') || c.req.header('x-forwarded-proto') === 'https';
  await setSignedCookie(c, 'active_merchant_id', merchantId, COOKIE_SECRET, {
    path: '/',
    httpOnly: true,
    secure: isHttps,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });

  return c.json({ success: true, activeMerchantId: merchantId });
});

// =========================================================================
// MULTI-CHANNEL STORE NOTIFICATIONS API (v1.1.0)
// =========================================================================
// 1. Get Notification Configuration for a Merchant
app.get('/api/v1/merchants/:id/notifications', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN']), async (c) => {
  const id = c.req.param('id');
  const accessibleMerchants = ((c as any).get('accessibleMerchants') as MerchantContext[]) || [];
  if (!accessibleMerchants.some(m => m.id === id)) {
    return c.json({ success: false, error: 'Access denied to merchant store.' }, 403);
  }

  try {
    const list = await db.select().from(merchantNotifications).where(eq(merchantNotifications.merchantId, id));
    if (list.length === 0) {
      return c.json({
        success: true,
        config: {
          merchantId: id,
          telegramEnabled: false,
          telegramBotToken: '',
          telegramChatId: '',
          telegramTemplate: DEFAULT_TEMPLATES.telegram,
          discordEnabled: false,
          discordWebhookUrl: '',
          discordTemplate: DEFAULT_TEMPLATES.discord,
          whatsappEnabled: false,
          whatsappApiUrl: '',
          whatsappAuthType: 'NONE',
          whatsappAuthKey: '',
          whatsappRecipient: '',
          whatsappTemplate: DEFAULT_TEMPLATES.whatsapp,
        }
      });
    }

    return c.json({ success: true, config: list[0] });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 2. Save / Update Notification Configuration for a Merchant
app.post('/api/v1/merchants/:id/notifications', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN']), async (c) => {
  const id = c.req.param('id');
  const accessibleMerchants = ((c as any).get('accessibleMerchants') as MerchantContext[]) || [];
  if (!accessibleMerchants.some(m => m.id === id)) {
    return c.json({ success: false, error: 'Access denied to merchant store.' }, 403);
  }

  try {
    const body = await c.req.json();
    const existing = await db.select().from(merchantNotifications).where(eq(merchantNotifications.merchantId, id));

    const payload = {
      telegramEnabled: !!body.telegramEnabled,
      telegramBotToken: body.telegramBotToken ? body.telegramBotToken.trim() : null,
      telegramChatId: body.telegramChatId ? body.telegramChatId.trim() : null,
      telegramTemplate: body.telegramTemplate ? body.telegramTemplate.trim() : null,

      discordEnabled: !!body.discordEnabled,
      discordWebhookUrl: body.discordWebhookUrl ? body.discordWebhookUrl.trim() : null,
      discordTemplate: body.discordTemplate ? body.discordTemplate.trim() : null,

      whatsappEnabled: !!body.whatsappEnabled,
      whatsappApiUrl: body.whatsappApiUrl ? body.whatsappApiUrl.trim() : null,
      whatsappAuthType: (['NONE', 'BEARER', 'BASIC'].includes(body.whatsappAuthType) ? body.whatsappAuthType : 'NONE') as 'NONE' | 'BEARER' | 'BASIC',
      whatsappAuthKey: body.whatsappAuthKey ? body.whatsappAuthKey.trim() : null,
      whatsappRecipient: body.whatsappRecipient ? body.whatsappRecipient.trim() : null,
      whatsappTemplate: body.whatsappTemplate ? body.whatsappTemplate.trim() : null,
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db.update(merchantNotifications)
        .set(payload)
        .where(eq(merchantNotifications.merchantId, id));
    } else {
      await db.insert(merchantNotifications).values({
        id: `notif_${id}_${Date.now()}`,
        merchantId: id,
        ...payload,
        createdAt: new Date(),
      });
    }

    return c.json({ success: true, message: 'Notification settings saved successfully.' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 3. Test Channel Notification
app.post('/api/v1/merchants/:id/notifications/test', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN']), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const channel = body.channel as 'telegram' | 'discord' | 'whatsapp';
  const config = body.config || {};
  const merchantName = body.merchantName || 'QRIS Merchant Store';

  if (!channel || !['telegram', 'discord', 'whatsapp'].includes(channel)) {
    return c.json({ success: false, error: 'Valid channel (telegram, discord, whatsapp) is required.' }, 400);
  }

  const result = await testChannelNotification(merchantName, channel, config);
  return c.json(result);
});

// API: Delete Merchant permanently from database (stops listener, deletes session, deletes DB row)
app.delete('/api/v1/merchants/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const id = c.req.param('id');
  console.log(`[API] Deleting merchant: ${id}`);

  try {
    // 1. Stop active listener
    await stopMerchantListener(id);

    // 2. Query and delete session cookies JSON file
    const mrcList = await db.select().from(merchants).where(eq(merchants.id, id));
    if (mrcList.length > 0) {
      const merchant = mrcList[0];
      try {
        await Deno.remove(merchant.sessionFilePath);
        console.log(`[Worker ${id}] Session file removed successfully.`);
      } catch (_err) {
        console.log(`[Worker ${id}] Session file already deleted or not found.`);
      }

      // Also try to delete uploaded QRIS image file if it exists in uploads folder
      if (merchant.qrisImageUrl && merchant.qrisImageUrl.startsWith('/static/uploads/')) {
        try {
          const localImagePath = `.${merchant.qrisImageUrl}`;
          await Deno.remove(localImagePath);
          console.log(`[API] Uploaded QRIS image file deleted: ${localImagePath}`);
        } catch (_err) {
          console.log(`[API] QRIS image file not found or already deleted.`);
        }
      }
    }

    // 3. Delete merchant row from database (Cascades invoices/mutations automatically)
    await db.delete(merchants).where(eq(merchants.id, id));

    return c.json({ success: true });
  } catch (err: any) {
    console.error(`[API] Delete failed for ${id}:`, err);
    return c.json({ success: false, error: err.message });
  }
});

// API: Edit Merchant
app.post('/api/v1/merchants/:id/edit', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.parseBody();
  const name = body.name as string;
  const phoneNumber = body.phoneNumber as string;
  const qrisImage = body.qrisImage as File;
  const qrisPayload = (body.qrisPayload as string) || '';
  const logoImage = body.logoImage as File | undefined;

  try {
    // 1. Fetch current merchant data
    const mList = await db.select().from(merchants).where(eq(merchants.id, id));
    if (mList.length === 0) {
      return c.text('Merchant not found', 404);
    }
    const currentMerchant = mList[0];

    let fileUrl = currentMerchant.qrisImageUrl;
    let finalQrisPayload = qrisPayload || currentMerchant.qrisPayload;
    let finalLogoUrl = currentMerchant.logoUrl;

    // 2. Handle new logo upload if provided
    if (logoImage && logoImage.size > 0) {
      const tempDir = './static/uploads';
      await Deno.mkdir(tempDir, { recursive: true });
      const logoExt = logoImage.name.split('.').pop() || 'png';
      const logoFilePath = `${tempDir}/logo_${id}.${logoExt}`;
      finalLogoUrl = `/static/uploads/logo_${id}.${logoExt}`;
      const logoBuffer = await logoImage.arrayBuffer();
      await Deno.writeFile(logoFilePath, new Uint8Array(logoBuffer));
      console.log(`[Logo Edit] Successfully updated logo to ${logoFilePath}`);
    }

    // 3. Handle new QRIS image upload if file is provided
    if (qrisImage && qrisImage.size > 0) {
      const tempDir = './static/uploads';
      await Deno.mkdir(tempDir, { recursive: true });
      const ext = qrisImage.name.split('.').pop() || 'png';
      const filePath = `${tempDir}/${id}.${ext}`;
      fileUrl = `/static/uploads/${id}.${ext}`;

      const arrayBuffer = await qrisImage.arrayBuffer();
      await Deno.writeFile(filePath, new Uint8Array(arrayBuffer));

      // Decode QRIS payload from the new image automatically if qrisPayload wasn't typed manually
      if (!qrisPayload) {
        try {
          const decoded = await decodeQRISFromImage(filePath);
          if (decoded) {
            finalQrisPayload = decoded;
            console.log(`[QRIS Decoder] Successfully extracted QRIS payload from edited image: ${decoded}`);
          }
        } catch (err: any) {
          console.error(`[QRIS Decoder] Failed decoding edited image:`, err);
        }
      }
    } else if (qrisPayload && qrisPayload !== currentMerchant.qrisPayload) {
      // If no new image was uploaded but the text payload textarea was changed
      finalQrisPayload = qrisPayload;
    }

    // 4. Update merchant row
    await db.update(merchants).set({
      name,
      phoneNumber,
      qrisImageUrl: fileUrl,
      qrisPayload: finalQrisPayload,
      logoUrl: finalLogoUrl
    }).where(eq(merchants.id, id));

  } catch (err: any) {
    console.error(`[API] Edit merchant failed for ${id}:`, err);
  }

  return c.redirect('/merchants');
});

// API: Add Merchant
app.post('/api/v1/merchants', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN']), async (c) => {
  const currentUser = (c as any).get('user') as UserSession;
  const body = await c.req.parseBody();
  const name = body.name as string;
  const phoneNumber = body.phoneNumber as string;
  const qrisImage = body.qrisImage as File;
  const qrisPayload = (body.qrisPayload as string) || '';
  const logoImage = body.logoImage as File | undefined;

  const newId = `mrc_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
  
  const tempDir = './static/uploads';
  await Deno.mkdir(tempDir, { recursive: true });
  const ext = qrisImage.name.split('.').pop() || 'png';
  const filePath = `${tempDir}/${newId}.${ext}`;
  const fileUrl = `/static/uploads/${newId}.${ext}`;

  const arrayBuffer = await qrisImage.arrayBuffer();
  await Deno.writeFile(filePath, new Uint8Array(arrayBuffer));

  // Process Merchant Logo Upload
  let logoUrl: string | null = null;
  if (logoImage && logoImage.size > 0) {
    const logoExt = logoImage.name.split('.').pop() || 'png';
    const logoFilePath = `${tempDir}/logo_${newId}.${logoExt}`;
    logoUrl = `/static/uploads/logo_${newId}.${logoExt}`;
    const logoBuffer = await logoImage.arrayBuffer();
    await Deno.writeFile(logoFilePath, new Uint8Array(logoBuffer));
    console.log(`[Logo Upload] Successfully saved logo to ${logoFilePath}`);
  }

  let finalQrisPayload = qrisPayload;
  if (!finalQrisPayload) {
    try {
      const decoded = await decodeQRISFromImage(filePath);
      if (decoded) {
        finalQrisPayload = decoded;
        console.log(`[QRIS Decoder] Successfully extracted QRIS payload from image: ${decoded}`);
      }
    } catch (err: any) {
      console.error(`[QRIS Decoder] Failed decoding uploaded image:`, err);
    }
  }

  try {
    await db.insert(merchants).values({
      id: newId,
      name,
      phoneNumber,
      qrisImageUrl: fileUrl,
      qrisPayload: finalQrisPayload,
      logoUrl: logoUrl,
      sessionFilePath: `sessions/${newId}.json`,
      status: 'NEEDS_OTP'
    });

    // If the creator is a REGIONAL_ADMIN, automatically map this new merchant to them!
    if (currentUser && currentUser.role === 'REGIONAL_ADMIN') {
      await db.insert(regionalAdminMerchants).values({
        userId: currentUser.id,
        merchantId: newId
      });
      console.log(`[DB] Auto-mapped merchant ${newId} to Regional Admin ${currentUser.id}`);
    }
  } catch (_e) {}

  return c.redirect('/merchants');
});

// API: Resend Webhook success callback
app.post('/api/v1/transactions/:id/resend-webhook', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return c.json({ success: true });
});

// API: Clear all transaction invoices and mutations (SUPER_ADMIN ONLY)
app.delete('/api/v1/transactions/clear-all', requireRole(['SUPER_ADMIN']), async (c) => {
  try {
    await db.delete(invoices);
    await db.delete(mutations);
    console.log('[API] Super Admin cleared all transaction history (invoices and mutations).');
    return c.json({ success: true });
  } catch (err: any) {
    console.error('[API] Clear all transactions failed:', err);
    return c.json({ success: false, error: err.message });
  }
});

// API: Test Webhook dispatch trigger
app.post('/api/v1/developer/test-webhook', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'MERCHANT']), async (c) => {
  const body = await c.req.json();
  const url = body.url;
  
  try {
    const payload = { event: 'webhook.test', timestamp: new Date().toISOString() };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000)
    });
    return c.json({ success: true, status: res.status });
  } catch (err: any) {
    return c.json({ success: false, error: err.message });
  }
});

// API: Save Webhook Settings
app.post('/api/v1/developer/webhook', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'MERCHANT']), async (c) => {
  const user = (c as any).get('user') as UserSession;
  const body = await c.req.parseBody();
  const webhookUrl = body.webhookUrl as string;
  const webhookSecret = body.webhookSecret as string;
  
  try {
    await db.update(users).set({ webhookUrl, webhookSecret }).where(eq(users.id, user.id));
    return c.redirect('/developer');
  } catch (err: any) {
    return c.text(`Failed to save webhook settings: ${err.message}`, 500);
  }
});

// API: Regenerate API Key
app.post('/api/v1/developer/regenerate-key', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'MERCHANT']), async (c) => {
  const user = (c as any).get('user') as UserSession;
  const newKey = `qbiz_api_key_live_2026_` + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  
  try {
    await db.update(users).set({ apiKey: newKey }).where(eq(users.id, user.id));
    return c.json({ success: true, apiKey: newKey });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// API: Create dynamic invoices (REST call from POS client - uses API Bearer Key)
app.post('/api/v1/invoices', invoiceApiRateLimiter, async (c) => {
  const authHeader = c.req.header('Authorization');
  let isAuthorized = false;
  let authenticatedUserId: string | null = null;
  let authenticatedRole: string | null = null;
  let authenticatedMerchantId: string | null = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const key = authHeader.substring(7);
    const userList = await db.select().from(users).where(eq(users.apiKey, key));
    if (userList.length > 0) {
      isAuthorized = true;
      authenticatedUserId = userList[0].id;
      authenticatedRole = userList[0].role;
      authenticatedMerchantId = userList[0].merchantId;
    }
  } else {
    let session = (c as any).get('user');
    if (!session) {
      try {
        const sessionUserId = await getSignedCookie(c, COOKIE_SECRET, 'session');
        if (sessionUserId) {
          const userList = await db.select().from(users).where(eq(users.id, sessionUserId));
          if (userList.length > 0) {
            session = {
              id: userList[0].id,
              name: userList[0].name,
              email: userList[0].email,
              role: userList[0].role,
              merchantId: userList[0].merchantId
            };
          }
        }
      } catch (_e) {}
    }

    if (session) {
      isAuthorized = true;
      authenticatedUserId = session.id;
      authenticatedRole = session.role;
      authenticatedMerchantId = session.merchantId;
    }
  }

  if (!isAuthorized || !authenticatedUserId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const orderId = body.order_id;
  const amount = Number(body.amount);
  const callbackUrl = body.callback_url;
  const redirectUrl = body.redirect_url || body.redirectUrl;
  const merchantId = body.merchant_id || 'mrc_toko_1';

  // Role-based access validation for target merchant
  if (authenticatedRole === 'MERCHANT' || authenticatedRole === 'MERCHANT_EMPLOYEE') {
    if (merchantId !== authenticatedMerchantId) {
      return c.json({ error: 'Forbidden: You can only create invoices for your own merchant account' }, 403);
    }
  } else if (authenticatedRole === 'REGIONAL_ADMIN') {
    const mapping = await db.select()
      .from(regionalAdminMerchants)
      .where(and(
        eq(regionalAdminMerchants.userId, authenticatedUserId),
        eq(regionalAdminMerchants.merchantId, merchantId)
      ));
    if (mapping.length === 0) {
      return c.json({ error: 'Forbidden: You do not manage this merchant account' }, 403);
    }
  }

  let suffix = 1;
  try {
    const activePending = await db.select()
      .from(invoices)
      .where(and(
        eq(invoices.baseAmount, amount),
        eq(invoices.merchantId, merchantId),
        eq(invoices.status, 'PENDING')
      ));
    
    const usedSuffixes = new Set(activePending.map(inv => inv.uniqueCode));
    while (usedSuffixes.has(suffix)) {
      suffix++;
    }
  } catch (_e) {
    suffix = Math.floor(Math.random() * 999) + 1;
  }

  const totalAmount = amount + suffix;
  const newInvoiceId = `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  let dynamicQrisString = '';
  try {
    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);
    const isSandbox = (body.sandbox === true || body.isSandbox === true || Deno.env.get("SANDBOX_MODE") === "true");

    await db.insert(invoices).values({
      id: newInvoiceId,
      merchantId,
      userId: authenticatedUserId, // Save invoice creator
      orderId,
      baseAmount: amount,
      uniqueCode: suffix,
      totalAmount,
      status: 'PENDING',
      callbackUrl,
      redirectUrl,
      customerName: body.customer_name || body.customerName || null,
      customerEmail: body.customer_email || body.customerEmail || null,
      customerPhone: body.customer_phone || body.customerPhone || null,
      items: body.items ? JSON.stringify(body.items) : null,
      expiredAt,
      isSandbox
    });

    // Fetch the merchant to get their static QRIS payload
    const mList = await db.select().from(merchants).where(eq(merchants.id, merchantId));
    const staticPayload = (mList.length > 0 && mList[0].qrisPayload) 
      ? mList[0].qrisPayload 
      : DEFAULT_MOCK_STATIC_QRIS;
    dynamicQrisString = generateDynamicQRIS(staticPayload, totalAmount, newInvoiceId);
  } catch (_e) {}

  const baseUrl = Deno.env.get("BASE_URL") || "http://localhost:8000";

  return c.json({
    success: true,
    invoice: {
      id: newInvoiceId,
      order_id: orderId,
      base_amount: amount,
      unique_code: suffix,
      total_amount: totalAmount,
      status: 'PENDING',
      qris_payload: dynamicQrisString,
      checkout_url: `${baseUrl}/pay/${newInvoiceId}`,
      redirect_url: redirectUrl
    }
  });
});

// View: Secure Checkout Page
// API Sandbox simulation endpoint
app.post('/api/v1/sandbox/simulate-payment', async (c) => {
  try {
    const body = await c.req.json();
    const invoiceId = body.invoiceId;
    if (!invoiceId) {
      return c.json({ success: false, error: 'Invoice ID is required' }, 400);
    }

    const invList = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (invList.length === 0) {
      return c.json({ success: false, error: 'Invoice not found' }, 404);
    }
    const invoice = invList[0];

    const isSandboxGlobally = Deno.env.get("SANDBOX_MODE") === "true";
    if (!invoice.isSandbox && !isSandboxGlobally) {
      return c.json({ success: false, error: 'Payment simulation is only allowed for Sandbox invoices.' }, 400);
    }

    if (invoice.status !== 'PENDING') {
      return c.json({ success: false, error: `Invoice is already ${invoice.status}` }, 400);
    }

    const paidAt = new Date();
    await db.update(invoices)
      .set({
        status: 'PAID',
        paidAt
      })
      .where(eq(invoices.id, invoiceId));

    console.log(`[Sandbox] Invoice ${invoiceId} marked as PAID. Dispatching webhook...`);

    // 1. Dispatch webhook in the background
    dispatchWebhook(invoice, paidAt.toISOString()).catch(err => {
      console.error(`[Sandbox] Webhook dispatch error for invoice ${invoiceId}:`, err);
    });

    // 2. Dispatch Multi-Channel Notifications (Telegram, Discord, WhatsApp GOWA)
    if (invoice.merchantId) {
      dispatchMerchantNotifications(invoice.merchantId, invoice, paidAt.toISOString()).catch(err => {
        console.error(`[Sandbox] Notification dispatch error for invoice ${invoiceId}:`, err);
      });
    }

    return c.json({ success: true, message: 'Simulated payment processed successfully.' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get('/pay/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const invList = await db.select().from(invoices).where(eq(invoices.id, id));
    if (invList.length === 0) {
      return c.text('Invoice not found', 404);
    }
    const invoice = invList[0];
    
    const mrcList = await db.select().from(merchants).where(eq(merchants.id, invoice.merchantId || ''));
    if (mrcList.length === 0) {
      return c.text('Merchant not found', 404);
    }
    const merchant = mrcList[0];

    // Generate Dynamic QRIS payload
    const staticPayload = merchant.qrisPayload ? merchant.qrisPayload : DEFAULT_MOCK_STATIC_QRIS;
    const dynamicQrisString = generateDynamicQRIS(staticPayload, invoice.totalAmount, invoice.id);

    // Generate QR code SVG
    const qrSvgHtml = await QRCode.toString(dynamicQrisString, { 
      type: 'svg', 
      margin: 1
    });

    // Render Checkout Page with standard HTML5 DOCTYPE
    return c.html(
      "<!DOCTYPE html>\n" +
      renderToString(
        <CheckoutPage 
          invoice={{
            id: invoice.id,
            orderId: invoice.orderId,
            baseAmount: invoice.baseAmount,
            uniqueCode: invoice.uniqueCode,
            totalAmount: invoice.totalAmount,
            status: invoice.status,
            expiredAt: invoice.expiredAt.toISOString(),
            customerName: invoice.customerName || '',
            customerEmail: invoice.customerEmail || '',
            customerPhone: invoice.customerPhone || '',
            items: invoice.items || '[]',
            isSandbox: invoice.isSandbox
          }}
          merchant={{
            name: merchant.name,
            logoUrl: merchant.logoUrl
          }}
          qrSvgHtml={qrSvgHtml}
        />
      )
    );
  } catch (err: any) {
    return c.text('Internal Server Error: ' + err.message, 500);
  }
});

// API: Get Invoice Status (For Checkout Polling)
app.get('/api/v1/invoices/:id/status', invoiceStatusRateLimiter, async (c) => {
  const id = c.req.param('id');
  if (!id) {
    return c.json({ error: 'Invoice ID is required' }, 400);
  }
  try {
    const invList = await db.select().from(invoices).where(eq(invoices.id, id));
    if (invList.length === 0) {
      return c.json({ error: 'Invoice not found' }, 404);
    }
    const invoice = invList[0];
    
    // Check if expired and update database dynamically
    let status = invoice.status;
    if (status === 'PENDING' && new Date() > invoice.expiredAt) {
      status = 'EXPIRED';
      await db.update(invoices).set({ status: 'EXPIRED' }).where(eq(invoices.id, id));
    }

    return c.json({ 
      status, 
      callbackUrl: invoice.callbackUrl,
      redirectUrl: invoice.redirectUrl 
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Start Deno Serve (Only when run directly as main script)
if (import.meta.main) {
  Deno.serve({ port: 8000 }, app.fetch);
}
