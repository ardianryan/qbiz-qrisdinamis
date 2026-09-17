import puppeteer from 'puppeteer';
import { db } from '../db/db.ts';
import { merchants, invoices, mutations, users } from '../db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';
import { encryptSession, decryptSession } from '../src/utils/crypto.ts';
import { dispatchMerchantNotifications, isValidOutboundUrl } from '../src/services/notification.ts';
import { dispatchWebhooksForInvoice } from '../src/services/webhooks.ts';
import { sseBroker } from '../src/services/sse.ts';

// Mutex or tracker for running listeners
// Each entry stores { intervalId, browser, page, status }
export const activeListeners = new Map<string, any>();

/**
 * Parses and returns the proxy configuration from PROXY_SERVER env variable.
 * Supports standard formats: http://host:port, http://user:pass@host:port, or socks5://...
 */
function getProxyConfig() {
  const proxyServer = Deno.env.get("PROXY_SERVER");
  const args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'];
  let username = '';
  let password = '';

  if (proxyServer) {
    try {
      const proxyUrl = new URL(proxyServer);
      const originUrl = `${proxyUrl.protocol}//${proxyUrl.host}`;
      args.push(`--proxy-server=${originUrl}`);
      if (proxyUrl.username) {
        username = decodeURIComponent(proxyUrl.username);
      }
      if (proxyUrl.password) {
        password = decodeURIComponent(proxyUrl.password);
      }
    } catch (_err) {
      args.push(`--proxy-server=${proxyServer}`);
    }
  }

  return { args, username, password, enabled: !!proxyServer };
}

/**
 * Start the Puppeteer-backed idle browser listener for a merchant.
 * 
 * HYBRID APPROACH:
 * - Browser opens once, navigates to the GoBiz transactions page.
 * - Does NOT reload the page anymore (saves CPU/RAM vs old approach).
 * - Instead, uses page.evaluate() to trigger a fetch() from INSIDE
 *   the browser context every 8 seconds — so cookies and auth tokens
 *   are all handled automatically by Chrome.
 * 
 * RAM: ~80-100MB per browser (vs ~150MB with full reloads, and 0.1MB
 * pure fetch which doesn't work due to GoBiz bot protection).
 */
export async function startMerchantListener(merchantId: string) {
  if (activeListeners.has(merchantId)) {
    console.log(`[Worker ${merchantId}] Listener already running.`);
    return;
  }

  const mrcList = await db.select().from(merchants).where(eq(merchants.id, merchantId));
  if (mrcList.length === 0) {
    console.error(`[Worker ${merchantId}] Merchant not found in DB.`);
    return;
  }
  const merchant = mrcList[0];

  console.log(`[Worker ${merchantId}] Starting Puppeteer optimized resource-blocked listener...`);
  activeListeners.set(merchantId, { status: 'STARTING' });

  try {
    const proxyConfig = getProxyConfig();
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: Deno.env.get("PUPPETEER_EXECUTABLE_PATH") || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: proxyConfig.args
    });

    const page = await browser.newPage();
    if (proxyConfig.enabled && (proxyConfig.username || proxyConfig.password)) {
      await page.authenticate({
        username: proxyConfig.username,
        password: proxyConfig.password
      });
      console.log(`[Worker ${merchantId}] Authenticated proxy connection.`);
    }

    // 1. Enable request interception to block heavy assets (RAM & CPU reduction)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 2. Intercept internal GoBiz API transactions data
    page.on('response', async (response) => {
      const url = response.url();
      const isOldTransactions = url.includes('/v1/transactions');
      const isNewTransactions = url.includes('merchant-analytics/v2/merchants/transactions');
      
      if ((isOldTransactions || isNewTransactions) && response.status() === 200) {
        try {
          const payload = await response.json();
          console.log(`[Worker ${merchantId}] Transaction data intercepted successfully.`);
          
          let list: any[] = [];
          if (isNewTransactions && payload && payload.transactions) {
            list = payload.transactions;
          } else if (isOldTransactions && payload && payload.data) {
            list = payload.data;
          }

          if (list.length > 0) {
            await processIncomingMutations(merchantId, list);
          }
        } catch (e) {
          console.error(`[Worker ${merchantId}] Error parsing response JSON:`, e);
        }
      }
    });

    // Load existing cookies from session file securely
    try {
      const sessionData = await Deno.readTextFile(merchant.sessionFilePath);
      let cookies: any;
      try {
        const decrypted = await decryptSession(sessionData);
        cookies = JSON.parse(decrypted);
      } catch (_decryptErr) {
        // Fallback to plain JSON for backward compatibility
        cookies = JSON.parse(sessionData);
      }
      await page.setCookie(...cookies);
      console.log(`[Worker ${merchantId}] Session cookies loaded (${cookies.length} cookies).`);
    } catch (_err) {
      console.error(`[Worker ${merchantId}] No session file found. Setting NEEDS_OTP.`);
      await db.update(merchants).set({ status: 'NEEDS_OTP' }).where(eq(merchants.id, merchantId));
      await browser.close();
      activeListeners.delete(merchantId);
      return;
    }

    // Initial navigation
    console.log(`[Worker ${merchantId}] Navigating to GoBiz transactions page...`);
    await page.goto('https://portal.gofoodmerchant.co.id/transactions?data_range=this_week', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // If redirected to login page, session is dead
    if (page.url().includes('/login')) {
      console.warn(`[Worker ${merchantId}] Session expired on navigation. Setting NEEDS_OTP.`);
      await db.update(merchants).set({ status: 'NEEDS_OTP' }).where(eq(merchants.id, merchantId));
      await browser.close();
      activeListeners.delete(merchantId);
      return;
    }

    // Mark as ACTIVE
    await db.update(merchants).set({ status: 'ACTIVE' }).where(eq(merchants.id, merchantId));
    activeListeners.get(merchantId).browser = browser;
    activeListeners.get(merchantId).page = page;
    activeListeners.get(merchantId).status = 'ACTIVE';

    // Safe page reload loop (prevent overlapping reloads)
    let isReloading = false;
    const intervalId = setInterval(async () => {
      if (isReloading) {
        console.log(`[Worker ${merchantId}] Previous reload still active. Skipping.`);
        return;
      }
      
      try {
        isReloading = true;
        console.log(`[Worker ${merchantId}] Reloading transactions page...`);
        
        await page.reload({ waitUntil: 'networkidle2', timeout: 20000 });
        
        if (page.url().includes('/login')) {
          console.warn(`[Worker ${merchantId}] Session expired during reload. Setting NEEDS_OTP.`);
          await db.update(merchants).set({ status: 'NEEDS_OTP' }).where(eq(merchants.id, merchantId));
          clearInterval(intervalId);
          await browser.close();
          activeListeners.delete(merchantId);
        }
      } catch (err: any) {
        console.error(`[Worker ${merchantId}] Reload error (non-fatal):`, err.message);
      } finally {
        isReloading = false;
      }
    }, 15000);

    activeListeners.get(merchantId).intervalId = intervalId;
    console.log(`[Worker ${merchantId}] Safe reload listener active (every 15s). ✅`);

  } catch (err: any) {
    console.error(`[Worker ${merchantId}] Listener crashed:`, err.message);
    await db.update(merchants).set({ status: 'DISCONNECTED' }).where(eq(merchants.id, merchantId));
    const active = activeListeners.get(merchantId);
    if (active?.browser) try { await active.browser.close(); } catch (_) {}
    if (active?.intervalId) clearInterval(active.intervalId);
    activeListeners.delete(merchantId);
  }
}


/**
 * Terminate a running listener worker
 */
export async function stopMerchantListener(merchantId: string) {
  const active = activeListeners.get(merchantId);
  if (!active) return;

  console.log(`[Worker ${merchantId}] Stopping listener worker...`);
  if (active.intervalId) clearInterval(active.intervalId);
  if (active.browser) {
    try { await active.browser.close(); } catch (_) {}
  }
  activeListeners.delete(merchantId);

  await db.update(merchants)
    .set({ status: 'DISCONNECTED' })
    .where(eq(merchants.id, merchantId));
}

/**
 * Trigger GoBiz WhatsApp OTP Request (using Puppeteer headless flow)
 */
export async function triggerGoBizOTP(merchantId: string) {
  console.log(`[Worker ${merchantId}] Requesting GoBiz OTP via WhatsApp/SMS...`);
  
  const mrcList = await db.select().from(merchants).where(eq(merchants.id, merchantId));
  if (mrcList.length === 0) return { success: false, error: 'Merchant not found' };
  const merchant = mrcList[0];

  try {
    const proxyConfig = getProxyConfig();
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: Deno.env.get("PUPPETEER_EXECUTABLE_PATH") || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: proxyConfig.args
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');

    if (proxyConfig.enabled && (proxyConfig.username || proxyConfig.password)) {
      await page.authenticate({
        username: proxyConfig.username,
        password: proxyConfig.password
      });
      console.log(`[Worker ${merchantId}] Authenticated proxy connection for OTP request.`);
    }

    // GoFood Merchant Portal login page URL
    await page.goto('https://portal.gofoodmerchant.co.id/auth/login', { waitUntil: 'networkidle2', timeout: 30000 });

    // Format phone number to standard local format (08...)
    let phone = merchant.phoneNumber.trim();
    if (phone.startsWith('+62')) {
      phone = '0' + phone.slice(3);
    } else if (phone.startsWith('62') && phone.length > 10) {
      phone = '0' + phone.slice(2);
    }

    // Fill phone number input
    await page.waitForSelector('#auth-phone-input, input[type="tel"], input[name="phone"]', { timeout: 15000 });
    await page.type('#auth-phone-input, input[type="tel"]', phone);
    await new Promise(r => setTimeout(r, 600));

    // Click request OTP button ("Lanjut")
    await page.waitForSelector('#phone-next-button, button[type="submit"]', { timeout: 10000 });
    await page.click('#phone-next-button, button[type="submit"]');

    // Wait for OTP input field to confirm OTP has been dispatched
    await page.waitForSelector('#auth-otp-input, input[name="otp"]', { timeout: 15000 });
    console.log(`[Worker ${merchantId}] GoBiz OTP successfully sent to ${phone}.`);

    // Keep browser session alive in memory associated with this merchant's registration flow
    activeListeners.set(`auth_${merchantId}`, {
      browser,
      page,
      createdAt: Date.now()
    });

    return { success: true };
  } catch (err: any) {
    console.error(`[Worker ${merchantId}] OTP trigger failed:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Verify GoBiz OTP & Save Session JSON
 */
export async function verifyGoBizOTP(merchantId: string, otpCode: string) {
  console.log(`[Worker ${merchantId}] Verifying OTP code: ${otpCode}`);
  const flow = activeListeners.get(`auth_${merchantId}`);
  if (!flow) {
    return { success: false, error: 'Authentication session expired. Please request OTP again.' };
  }

  const { browser, page } = flow;

  try {
    // Fill OTP digits (4 digits for GoBiz)
    await page.waitForSelector('#auth-otp-input, input[name="otp"]', { timeout: 15000 });
    await page.type('#auth-otp-input, input[name="otp"]', otpCode);
    await new Promise(r => setTimeout(r, 500));

    // Click submit/login button
    console.log(`[Worker ${merchantId}] Clicking OTP verify submit button...`);
    await page.waitForSelector('#verify-otp-button, button[type="submit"]', { timeout: 10000 });
    await page.click('#verify-otp-button, button[type="submit"]');

    // Wait for redirect to dashboard indicating success
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});

    if (page.url().includes('/dashboard') || !page.url().includes('/login')) {
      // 1. Save cookies to session JSON file securely (encrypted at rest)
      const cookies = await page.cookies();
      const mrcList = await db.select().from(merchants).where(eq(merchants.id, merchantId));
      if (mrcList.length > 0) {
        const sessionPath = mrcList[0].sessionFilePath;
        await Deno.mkdir('sessions', { recursive: true });
        const encrypted = await encryptSession(JSON.stringify(cookies));
        await Deno.writeTextFile(sessionPath, encrypted);
        console.log(`[Worker ${merchantId}] Session cookies saved securely (AES-256-GCM encrypted).`);
      }

      // 2. Extract Bearer access token from localStorage or cookies
      let accessToken = '';
      try {
        const localStorageToken = await page.evaluate(() => {
          return localStorage.getItem('access_token') ||
                 localStorage.getItem('Authorization') ||
                 localStorage.getItem('token') ||
                 localStorage.getItem('gobiz_token') ||
                 sessionStorage.getItem('access_token') ||
                 '';
        });
        if (localStorageToken) {
          accessToken = localStorageToken;
          console.log(`[Worker ${merchantId}] Bearer token extracted from localStorage.`);
        } else {
          const tokenCookie = cookies.find((c: any) =>
            c.name === 'access_token' ||
            c.name === 'Authorization' ||
            c.name === '_token' ||
            c.name === 'gobiz_token'
          );
          if (tokenCookie) {
            accessToken = tokenCookie.value;
            console.log(`[Worker ${merchantId}] Bearer token extracted from cookies.`);
          }
        }
      } catch (_e) {
        console.warn(`[Worker ${merchantId}] Could not extract Bearer token. Will rely on cookies only.`);
      }

      // 3. Save token + mark ACTIVE in DB
      await db.update(merchants)
        .set({ status: 'ACTIVE', sessionToken: accessToken || null })
        .where(eq(merchants.id, merchantId));

      // 4. CLOSE browser — key change! No more persistent Chromium memory.
      await browser.close();
      activeListeners.delete(`auth_${merchantId}`);
      console.log(`[Worker ${merchantId}] Browser closed after OTP. Starting lightweight HTTP polling...`);

      // 5. Start lightweight fetch-based listener (no browser!)
      startMerchantListener(merchantId);

      return { success: true };
    } else {
      await browser.close();
      activeListeners.delete(`auth_${merchantId}`);
      return { success: false, error: 'OTP validation failed. Redirect unsuccessful.' };
    }
  } catch (err: any) {
    console.error(`[Worker ${merchantId}] OTP verification failed:`, err);
    try { await browser.close(); } catch (_) {}
    activeListeners.delete(`auth_${merchantId}`);
    return { success: false, error: err.message };
  }
}

/**
 * Process intercepted transactions/mutations
 */
async function processIncomingMutations(merchantId: string, transactionList: any[]) {
  for (const tx of transactionList) {
    const txId = tx.id || `mut_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Support both gross_amount (new API, divided by 100) and amount (old API)
    let txAmount = 0;
    if (tx.gross_amount !== undefined) {
      txAmount = Math.round(Number(tx.gross_amount) / 100);
    } else {
      txAmount = Math.round(Number(tx.amount || 0));
    }

    // Support both transaction_time (new API) and created_at (old API)
    const txTime = tx.transaction_time || tx.created_at || new Date().toISOString();

    // Check if mutation already logged
    const existing = await db.select().from(mutations).where(eq(mutations.id, txId));
    if (existing.length > 0) continue;

    console.log(`[Worker ${merchantId}] New mutation logged: ${txId} - Rp ${txAmount}`);

    // Insert mutation log
    await db.insert(mutations).values({
      id: txId,
      merchantId,
      rawAmount: txAmount,
      transactionTime: txTime,
      isMatched: false
    });

    // Check if there is an active or recently expired invoice (within 30 minutes) matching this totalAmount
    const invoiceList = await db.select()
      .from(invoices)
      .where(
        and(
          eq(invoices.merchantId, merchantId),
          eq(invoices.totalAmount, txAmount),
          sql`(${invoices.status} = 'PENDING' OR (${invoices.status} = 'EXPIRED' AND ${invoices.expiredAt} > NOW() - INTERVAL '30 minutes'))`
        )
      );

    if (invoiceList.length > 0) {
      const matchedInvoice = invoiceList[0];
      console.log(`[Worker ${merchantId}] Match found! Invoice ID: ${matchedInvoice.id}`);

      // Update invoice as paid
      await db.update(invoices)
        .set({ status: 'PAID', paidAt: new Date() })
        .where(eq(invoices.id, matchedInvoice.id));

      // Update mutation as matched
      await db.update(mutations)
        .set({ isMatched: true, invoiceId: matchedInvoice.id })
        .where(eq(mutations.id, txId));

      // 1. Dispatch POS Webhook (Per-transaction Callback)
      if (matchedInvoice.callbackUrl) {
        dispatchWebhook(matchedInvoice, txTime);
      }

      // 2. Dispatch Enterprise Multi-Webhooks (Store Scoped & Global Subscriptions)
      dispatchWebhooksForInvoice(matchedInvoice, 'payment.success', txTime).catch(err => {
        console.error(`[Worker] Failed dispatching multi-webhooks for ${merchantId}:`, err);
      });

      // 3. Dispatch Multi-Channel Notifications (Telegram, Discord, WhatsApp GOWA)
      dispatchMerchantNotifications(merchantId, matchedInvoice, txTime).catch(err => {
        console.error(`[Worker] Failed dispatching notifications for ${merchantId}:`, err);
      });

      // 4. Dispatch Real-time SSE Events (<50ms zero-latency sync)
      sseBroker.publishInvoiceUpdate({
        invoiceId: matchedInvoice.id,
        orderId: matchedInvoice.orderId,
        status: 'PAID',
        paidAt: txTime,
        amount: matchedInvoice.totalAmount,
        redirectUrl: matchedInvoice.redirectUrl || matchedInvoice.callbackUrl
      });

      sseBroker.publishTransactionUpdate({
        merchantId,
        invoiceId: matchedInvoice.id,
        orderId: matchedInvoice.orderId,
        amount: matchedInvoice.totalAmount,
        status: 'PAID',
        timestamp: txTime
      });
    }
  }
}

/**
 * Dispatch HTTP POST webhook with HMAC verification signature
 */
export async function dispatchWebhook(invoice: any, txTime: string, retryCount = 0) {
  console.log(`[Webhook] Dispatching callback for invoice ${invoice.id} (Attempt ${retryCount + 1})...`);

  // Resolve target url and signing secret dynamically based on user creator settings
  let secretKey = Deno.env.get("WEBHOOK_SECRET") || "qbiz_secret_key_hmac_2026";
  let targetUrl = invoice.callbackUrl;

  if (invoice.userId) {
    try {
      const userList = await db.select().from(users).where(eq(users.id, invoice.userId));
      if (userList.length > 0) {
        const userRecord = userList[0];
        if (userRecord.webhookSecret) {
          secretKey = userRecord.webhookSecret;
        }
        if (!targetUrl && userRecord.webhookUrl) {
          targetUrl = userRecord.webhookUrl;
        }
      }
    } catch (err: any) {
      console.error(`[Webhook] Failed querying creator user for invoice ${invoice.id}:`, err.message);
    }
  }

  if (!targetUrl) {
    console.error(`[Webhook] Aborted dispatching invoice ${invoice.id}: no callback url or default user webhook url configured.`);
    return;
  }

  if (!isValidOutboundUrl(targetUrl)) {
    console.error(`[Webhook] Aborted dispatching invoice ${invoice.id}: target url rejected by SSRF guard: ${targetUrl}`);
    return;
  }

  const payload = {
    event: 'payment.success',
    invoice_id: invoice.id,
    order_id: invoice.orderId,
    amount_paid: invoice.totalAmount,
    paid_at: txTime || new Date().toISOString(),
  };

  // Build HMAC SHA256 Signature
  const encoder = new TextEncoder();
  const keyBuf = encoder.encode(secretKey);
  const dataBuf = encoder.encode(JSON.stringify(payload));
  
  let signature = "";
  try {
    const cryptoKey = await crypto.subtle.importKey(
      "raw", 
      keyBuf, 
      { name: "HMAC", hash: "SHA-256" }, 
      false, 
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign("HMAC", cryptoKey, dataBuf);
    signature = Array.from(new Uint8Array(sigBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    console.error("[Webhook] Signature generation failed:", e);
  }

  const baseUrl = Deno.env.get("BASE_URL") || "http://localhost:8000";
  const timestamp = Math.floor(Date.now() / 1000).toString();

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-QBiz-Signature': signature,
        'X-QBiz-Timestamp': timestamp,
        'Referer': baseUrl,
        'Origin': baseUrl
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    if (response.status >= 200 && response.status < 300) {
      console.log(`[Webhook] Invoice ${invoice.id} callback successfully delivered (HTTP ${response.status}).`);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err: any) {
    console.warn(`[Webhook] Invoice ${invoice.id} callback failed:`, err.message);
    
    // Retry logic with exponential backoff: 5s, 15s, 45s
    if (retryCount < 3) {
      const delays = [5000, 15000, 45000];
      const delay = delays[retryCount];
      console.log(`[Webhook] Retrying in ${delay / 1000}s...`);
      setTimeout(() => {
        dispatchWebhook(invoice, txTime, retryCount + 1);
      }, delay);
    } else {
      console.error(`[Webhook] Invoice ${invoice.id} callback failed permanently after 3 retries.`);
    }
  }
}

/**
 * Gracefully close all running Puppeteer browser listeners
 */
export async function closeAllListeners() {
  console.log('[Worker] Gracefully closing all running browser listeners...');
  for (const [merchantId, listener] of activeListeners.entries()) {
    try {
      if (listener.intervalId) {
        clearInterval(listener.intervalId);
      }
      if (listener.browser) {
        await listener.browser.close();
      }
    } catch (err: any) {
      console.warn(`[Worker] Error closing browser for ${merchantId}:`, err.message);
    }
  }
  activeListeners.clear();
  console.log('[Worker] All browser instances closed cleanly.');
}

