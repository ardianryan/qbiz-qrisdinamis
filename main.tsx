import { Hono } from 'hono';
import { serveStatic } from 'hono/deno';
import { setSignedCookie, deleteCookie } from 'hono/cookie';
import { renderer } from './src/renderer.tsx';
import { LoginPage } from './src/pages/Login.tsx';
import { MerchantsPage } from './src/pages/Merchants.tsx';
import { TransactionsPage } from './src/pages/Transactions.tsx';
import { DeveloperPage } from './src/pages/Developer.tsx';
import { UsersPage } from './src/pages/Users.tsx';
import { CheckoutPage } from './src/pages/Checkout.tsx';
import QRCode from 'npm:qrcode';
import { renderToString } from 'react-dom/server';
import { db } from './db/db.ts';
import { merchants, invoices, mutations, users, regionalAdminMerchants } from './db/schema.ts';
import { eq, desc, inArray, and, sql } from 'drizzle-orm';
import { triggerGoBizOTP, verifyGoBizOTP, startMerchantListener, stopMerchantListener } from './worker/puppeteer-listener.ts';
import { authMiddleware, requireRole, hashPassword, COOKIE_SECRET, UserSession } from './src/middleware/auth.ts';
import { generateDynamicQRIS } from './src/utils/qris.ts';

const app = new Hono();

// =========================================================================
// DEFAULT DATA SEEDING (Run on startup)
// =========================================================================
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
          merchantId: null
        },
        {
          id: 'usr_admin',
          name: 'QBiz Admin Operations',
          email: 'admin@qbiz.com',
          password: await hashPassword('AdminQBiz2026'),
          role: 'ADMIN' as const,
          merchantId: null
        },
        {
          id: 'usr_regional',
          name: 'Budi Regional Manager',
          email: 'regional@qbiz.com',
          password: await hashPassword('RegionalQBiz2026'),
          role: 'REGIONAL_ADMIN' as const,
          merchantId: null
        },
        {
          id: 'usr_merchant',
          name: 'Toko Mojokerto Owner',
          email: 'merchant@qbiz.com',
          password: await hashPassword('MerchantQBiz2026'),
          role: 'MERCHANT' as const,
          merchantId: 'mrc_toko_1' // Associated with mock merchant
        },
        {
          id: 'usr_karyawan',
          name: 'Siti Kasir Toko',
          email: 'karyawan@qbiz.com',
          password: await hashPassword('EmployeeQBiz2026'),
          role: 'MERCHANT_EMPLOYEE' as const,
          merchantId: 'mrc_toko_1'
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
await seedDefaultUsers();

// =========================================================================
// MIDDLEWARES & STATIC ROUTES
// =========================================================================

// Serve static assets (Tailwind compiled CSS)
app.use('/static/*', serveStatic({ root: './' }));

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

// POST: Process Login
app.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const email = body.email as string;
  const password = body.password as string;

  try {
    const userList = await db.select().from(users).where(eq(users.email, email));
    if (userList.length > 0) {
      const user = userList[0];
      const inputHash = await hashPassword(password);
      
      if (inputHash === user.password) {
        // Set signed session cookie (valid for 1 week)
        await setSignedCookie(c, 'session', user.id, COOKIE_SECRET, {
          path: '/',
          httpOnly: true,
          secure: false, // Set true in production over HTTPS
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

  // Fallback check for demo mock login credentials in case database is offline
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

// Redirect root index based on role
app.get('/', (c) => {
  const user = (c as any).get('user') as UserSession | undefined;
  if (user) {
    if (user.role === 'MERCHANT' || user.role === 'MERCHANT_EMPLOYEE') {
      return c.redirect('/transactions');
    }
    return c.redirect('/merchants');
  }
  return c.redirect('/login');
});

// PAGE 1: Multi-Merchant Manager (SUPER_ADMIN, ADMIN, REGIONAL_ADMIN)
app.get('/merchants', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN']), async (c) => {
  const user = (c as any).get('user') as UserSession;
  let list: any[] = [];
  
  try {
    if (user.role === 'REGIONAL_ADMIN') {
      // REGIONAL_ADMIN: Only select merchants mapped to this specific user
      const mappedMerchants = await db.select({ merchantId: regionalAdminMerchants.merchantId })
        .from(regionalAdminMerchants)
        .where(eq(regionalAdminMerchants.userId, user.id));
      
      const mrcIds = mappedMerchants.map(mm => mm.merchantId);
      if (mrcIds.length > 0) {
        list = await db.select().from(merchants).where(inArray(merchants.id, mrcIds));
      }
    } else {
      // SUPER_ADMIN / ADMIN: Access to all merchants
      list = await db.select().from(merchants);
    }
  } catch (_e) {
    // Fallback Mock data in case DB offline
    list = [
      { id: 'mrc_toko_1', name: 'Warung Kopi Mojokerto', phoneNumber: '081234567890', qrisImageUrl: 'https://picsum.photos/seed/qris1/300/300', status: 'ACTIVE' as const, todayTransactions: 12, lastSync: '2026-08-03 10:20:15' },
      { id: 'mrc_toko_2', name: 'Resto Ayam Bakar Cobek', phoneNumber: '089988776655', qrisImageUrl: 'https://picsum.photos/seed/qris2/300/300', status: 'NEEDS_OTP' as const, todayTransactions: 0, lastSync: '2026-08-03 09:12:44' }
    ];
  }

  // Format list for renderer
  const formattedMerchants = list.map(m => ({
    id: m.id,
    name: m.name,
    phoneNumber: m.phoneNumber,
    qrisImageUrl: m.qrisImageUrl,
    status: m.status as any,
    todayTransactions: (m as any).todayTransactions || 0,
    lastSync: (m as any).lastSync || (m.createdAt ? m.createdAt.toISOString().slice(0, 19).replace('T', ' ') : 'N/A')
  }));

  (c as any).set('title', 'Multi-Merchant Manager');
  return c.render(
    <MerchantsPage merchants={formattedMerchants} currentUser={user} />
  );
});

// PAGE 2: Live Transaction Monitor (All roles, scoped)
app.get('/transactions', requireRole(['SUPER_ADMIN', 'ADMIN', 'REGIONAL_ADMIN', 'MERCHANT', 'MERCHANT_EMPLOYEE']), async (c) => {
  const user = (c as any).get('user') as UserSession;
  
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
    // Fallback Mock Transactions
    merchantList = [
      { id: 'mrc_toko_1', name: 'Warung Kopi Mojokerto' },
      { id: 'mrc_toko_2', name: 'Resto Ayam Bakar Cobek' }
    ];
    txList = [
      { id: 'inv_10923840', merchantId: 'mrc_toko_1', merchantName: 'Warung Kopi Mojokerto', orderId: 'ORDER-100230', baseAmount: 50000, uniqueCode: 123, totalAmount: 50123, status: 'PAID' as const, webhookStatus: '200 OK' as const, timestamp: '2026-08-03 10:28:15' },
      { id: 'inv_10923841', merchantId: 'mrc_toko_1', merchantName: 'Warung Kopi Mojokerto', orderId: 'ORDER-100231', baseAmount: 12000, uniqueCode: 15, totalAmount: 12015, status: 'PENDING' as const, webhookStatus: 'N/A' as const, timestamp: '2026-08-03 10:30:00' }
    ];

    // Filter mock data manually based on role in dev mode
    if (user.role === 'MERCHANT' || user.role === 'MERCHANT_EMPLOYEE') {
      merchantList = merchantList.filter(m => m.id === 'mrc_toko_1');
      txList = txList.filter(tx => tx.merchantId === 'mrc_toko_1');
    }
  }

  (c as any).set('title', 'Live Transaction Monitor');
  return c.render(
    <TransactionsPage merchants={merchantList} transactions={txList} currentUser={user} />
  );
});

// PAGE 3: Developer Hub (SUPER_ADMIN, ADMIN)
app.get('/developer', requireRole(['SUPER_ADMIN', 'ADMIN']), (c) => {
  const user = (c as any).get('user') as UserSession;
  (c as any).set('title', 'Developer Hub');
  return c.render(
    <DeveloperPage 
      apiKey="qbiz_api_key_live_2026_w8a2b3d9x7c" 
      webhookUrl="https://webhook.site/df038cb2-2c6e-4ad3-9ef4-8c813a3028d0" 
      webhookSecret="my_secret_signing_hmac_key_2026" 
      currentUser={user}
    />
  );
});

// PAGE 4: User & Role Directory (SUPER_ADMIN, ADMIN)
app.get('/users', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const currentUser = (c as any).get('user') as UserSession;
  let userList: any[] = [];
  let merchantList: any[] = [];

  try {
    merchantList = await db.select().from(merchants);
    const dbUsers = await db.select().from(users);
    
    // Fetch counts of mapped regional merchants
    const regionalMappings = await db.select().from(regionalAdminMerchants);
    
    userList = dbUsers.map(u => {
      const associatedMrc = merchantList.find(m => m.id === u.merchantId);
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
    // Fallback Mock Users list in case DB is offline
    merchantList = [
      { id: 'mrc_toko_1', name: 'Warung Kopi Mojokerto' },
      { id: 'mrc_toko_2', name: 'Resto Ayam Bakar Cobek' }
    ];
    userList = [
      { id: 'usr_superadmin', name: 'Adrian Ryan (SA)', email: 'superadmin@qbiz.com', role: 'SUPER_ADMIN' as const, merchantName: null, mappedMerchantsCount: 0 },
      { id: 'usr_admin', name: 'QBiz Admin Operations', email: 'admin@qbiz.com', role: 'ADMIN' as const, merchantName: null, mappedMerchantsCount: 0 },
      { id: 'usr_regional', name: 'Budi Regional Manager', email: 'regional@qbiz.com', role: 'REGIONAL_ADMIN' as const, merchantName: null, mappedMerchantsCount: 2 },
      { id: 'usr_merchant', name: 'Toko Mojokerto Owner', email: 'merchant@qbiz.com', role: 'MERCHANT' as const, merchantName: 'Warung Kopi Mojokerto', mappedMerchantsCount: 0 },
      { id: 'usr_karyawan', name: 'Siti Kasir Toko', email: 'karyawan@qbiz.com', role: 'MERCHANT_EMPLOYEE' as const, merchantName: 'Warung Kopi Mojokerto', mappedMerchantsCount: 0 }
    ];
  }

  (c as any).set('title', 'User Directory');
  return c.render(
    <UsersPage users={userList} merchants={merchantList} currentUser={currentUser} />
  );
});

// API: Create User Account
app.post('/api/v1/users', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const body = await c.req.parseBody();
  const name = body.name as string;
  const email = body.email as string;
  const password = body.password as string;
  const role = body.role as any;
  const merchantId = (body.merchantId as string) || null;

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
  }

  return c.redirect('/users');
});

// API: Delete User Account
app.post('/api/v1/users/:id/delete', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const id = c.req.param('id');
  
  if (id === 'usr_superadmin') {
    return c.json({ success: false, error: 'Cannot delete primary Super Admin account.' }, 400);
  }

  try {
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

// API: Add Merchant
app.post('/api/v1/merchants', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  const body = await c.req.parseBody();
  const name = body.name as string;
  const phoneNumber = body.phoneNumber as string;
  const qrisImage = body.qrisImage as File;
  const qrisPayload = (body.qrisPayload as string) || '';

  const newId = `mrc_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
  
  const tempDir = './static/uploads';
  await Deno.mkdir(tempDir, { recursive: true });
  const ext = qrisImage.name.split('.').pop() || 'png';
  const filePath = `${tempDir}/${newId}.${ext}`;
  const fileUrl = `/static/uploads/${newId}.${ext}`;

  const arrayBuffer = await qrisImage.arrayBuffer();
  await Deno.writeFile(filePath, new Uint8Array(arrayBuffer));

  try {
    await db.insert(merchants).values({
      id: newId,
      name,
      phoneNumber,
      qrisImageUrl: fileUrl,
      qrisPayload: qrisPayload,
      sessionFilePath: `sessions/${newId}.json`,
      status: 'NEEDS_OTP'
    });
  } catch (_e) {}

  return c.redirect('/merchants');
});

// API: Resend Webhook success callback
app.post('/api/v1/transactions/:id/resend-webhook', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return c.json({ success: true });
});

// API: Test Webhook dispatch trigger
app.post('/api/v1/developer/test-webhook', requireRole(['SUPER_ADMIN', 'ADMIN']), async (c) => {
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

// API: Regenerate API Key
app.post('/api/v1/developer/regenerate-key', requireRole(['SUPER_ADMIN', 'ADMIN']), (c) => {
  const newKey = `qbiz_api_key_live_2026_` + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return c.json({ success: true, apiKey: newKey });
});

// API: Create dynamic invoices (REST call from POS client - uses API Bearer Key)
app.post('/api/v1/invoices', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
  const orderId = body.order_id;
  const amount = Number(body.amount);
  const callbackUrl = body.callback_url;
  const merchantId = body.merchant_id || 'mrc_toko_1';

  let suffix = 1;
  try {
    const activePending = await db.select()
      .from(invoices)
      .where(eq(invoices.baseAmount, amount));
    
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
    const expiredAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.insert(invoices).values({
      id: newInvoiceId,
      merchantId,
      orderId,
      baseAmount: amount,
      uniqueCode: suffix,
      totalAmount,
      status: 'PENDING',
      callbackUrl,
      expiredAt
    });

    // Fetch the merchant to get their static QRIS payload
    const mList = await db.select().from(merchants).where(eq(merchants.id, merchantId));
    if (mList.length > 0 && mList[0].qrisPayload) {
      dynamicQrisString = generateDynamicQRIS(mList[0].qrisPayload, totalAmount, newInvoiceId);
    }
  } catch (_e) {}

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
      checkout_url: `http://localhost:8000/pay/${newInvoiceId}`
    }
  });
});

// View: Secure Checkout Page
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
    const dynamicQrisString = merchant.qrisPayload 
      ? generateDynamicQRIS(merchant.qrisPayload, invoice.totalAmount, invoice.id)
      : '000201010211...'; // Fallback raw string indicator

    // Generate QR code SVG
    const qrSvgHtml = await QRCode.toString(dynamicQrisString, { 
      type: 'svg', 
      margin: 1, 
      width: 250 
    });

    // Render Checkout Page
    return c.html(
      renderToString(
        <CheckoutPage 
          invoice={{
            id: invoice.id,
            orderId: invoice.orderId,
            baseAmount: invoice.baseAmount,
            uniqueCode: invoice.uniqueCode,
            totalAmount: invoice.totalAmount,
            status: invoice.status,
            expiredAt: invoice.expiredAt.toISOString()
          }}
          merchant={{
            name: merchant.name
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
app.get('/api/v1/invoices/:id/status', async (c) => {
  const id = c.req.param('id');
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
      callbackUrl: invoice.callbackUrl 
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// Start Deno Serve
Deno.serve({ port: 8000 }, app.fetch);
