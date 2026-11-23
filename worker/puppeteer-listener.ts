import puppeteer from 'puppeteer';
import { db } from '../db/db.ts';
import { merchants } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { encryptSession, decryptSession } from '../src/utils/crypto.ts';
import { notifySessionExpired } from '../src/services/notification.ts';
import { processIncomingMutations, dispatchWebhook } from './mutation-processor.ts';

export { dispatchWebhook };

// Mutex or tracker for running listeners
// Each entry stores { intervalId, browser, page, status }
export const activeListeners = new Map<string, any>();

// Debouncer for proactive session expired notifications (max 1 alert per 30 minutes)
const lastSessionAlert = new Map<string, number>();

async function triggerSessionExpiredAlert(merchantId: string) {
  const now = Date.now();
  const last = lastSessionAlert.get(merchantId) || 0;
  if (now - last > 30 * 60 * 1000) {
    lastSessionAlert.set(merchantId, now);
    notifySessionExpired(merchantId).catch(err => {
      console.warn(`[Worker ${merchantId}] Failed to dispatch session expiry alert:`, err.message);
    });
  }
}

/**
 * Auto-dismiss OneTrust Cookie Consent banner if rendered on GoFood portal
 */
async function dismissOneTrustBanner(page: any) {
  try {
    await page.evaluate(() => {
      const doc = (globalThis as any).document;
      const btn = doc?.querySelector('#onetrust-accept-btn-handler');
      if (btn) btn.click();
      doc?.getElementById('onetrust-consent-sdk')?.remove();
      doc?.querySelector('.onetrust-pc-dark-filter')?.remove();
    });
    await new Promise(r => setTimeout(r, 300));
  } catch (_) {}
}

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
    await page.setCacheEnabled(false);
    if (proxyConfig.enabled && (proxyConfig.username || proxyConfig.password)) {
      await page.authenticate({
        username: proxyConfig.username,
        password: proxyConfig.password
      });
      console.log(`[Worker ${merchantId}] Authenticated proxy connection.`);
    }

    // Block heavy static assets to minimize worker memory footprint
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Intercept GoBiz transaction API responses
    page.on('response', async (response) => {
      const url = response.url();
      const isTransactions = 
        url.includes('/transactions') || 
        url.includes('merchant-analytics') || 
        url.includes('/merchants/transactions');
      
      const contentType = response.headers()['content-type'] || '';
      
      if (isTransactions && response.status() === 200 && contentType.includes('application/json')) {
        try {
          const payload = await response.json();
          let list: any[] = [];
          if (Array.isArray(payload)) {
            list = payload;
          } else if (Array.isArray(payload?.transactions)) {
            list = payload.transactions;
          } else if (Array.isArray(payload?.data?.transactions)) {
            list = payload.data.transactions;
          } else if (Array.isArray(payload?.data)) {
            list = payload.data;
          } else if (Array.isArray(payload?.items)) {
            list = payload.items;
          }

          if (list.length > 0) {
            console.log(`[Worker ${merchantId}] Intercepted ${list.length} transactions from API.`);
            await processIncomingMutations(merchantId, list);
          }
        } catch (e: any) {
          console.error(`[Worker ${merchantId}] Error parsing transaction response JSON:`, e.message);
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
    console.log(`[Worker ${merchantId}] Navigating to GoBiz transactions page (today)...`);
    await page.goto('https://portal.gofoodmerchant.co.id/transactions?date_range=today', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Auto-dismiss OneTrust Cookie banner if displayed
    await dismissOneTrustBanner(page);

    // If redirected to login page, session is dead
    if (page.url().includes('/login')) {
      console.warn(`[Worker ${merchantId}] Session expired on navigation. Setting NEEDS_OTP.`);
      await db.update(merchants).set({ status: 'NEEDS_OTP' }).where(eq(merchants.id, merchantId));
      await triggerSessionExpiredAlert(merchantId);
      await browser.close();
      activeListeners.delete(merchantId);
      return;
    }

    // Mark as ACTIVE
    await db.update(merchants).set({ status: 'ACTIVE' }).where(eq(merchants.id, merchantId));
    activeListeners.get(merchantId).browser = browser;
    activeListeners.get(merchantId).page = page;
    activeListeners.get(merchantId).status = 'ACTIVE';

    // Wait 2s for React SPA to initialize table
    await new Promise(r => setTimeout(r, 2000));

    // Initial DOM scrape right after page load
    await syncMerchantMutations(merchantId);

    // In-page reload poll loop (every 12s) - guarantees fresh mutations from GoFood portal
    let isPolling = false;
    const intervalId = setInterval(async () => {
      if (isPolling) return;
      
      try {
        isPolling = true;

        // Perform clean in-page reload to fetch latest mutations from GoFood Portal
        console.log(`[Worker ${merchantId}] Refreshing GoFood transactions...`);
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));

        // Auto-dismiss OneTrust banner on reload if it re-appears
        await dismissOneTrustBanner(page);

        if (page.url().includes('/login')) {
          console.warn(`[Worker ${merchantId}] Session expired. Setting NEEDS_OTP.`);
          await db.update(merchants).set({ status: 'NEEDS_OTP' }).where(eq(merchants.id, merchantId));
          await triggerSessionExpiredAlert(merchantId);
          clearInterval(intervalId);
          await browser.close();
          activeListeners.delete(merchantId);
          return;
        }

        await syncMerchantMutations(merchantId).catch(() => {});
      } catch (err: any) {
        console.error(`[Worker ${merchantId}] Poll error (non-fatal):`, err.message);
      } finally {
        isPolling = false;
      }
    }, 12000);

    activeListeners.get(merchantId).intervalId = intervalId;
    console.log(`[Worker ${merchantId}] GoFood mutation listener active (refreshing every 12s). ✅`);

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
 * On-demand manual sync for an active merchant listener.
 * Directly scrapes the current page DOM table and in-page API.
 */
export async function syncMerchantMutations(merchantId: string): Promise<number> {
  const active = activeListeners.get(merchantId);
  if (!active || !active.page) {
    // If listener is not currently active in memory, attempt background start if merchant status is ACTIVE
    try {
      const mrc = await db.select().from(merchants).where(eq(merchants.id, merchantId));
      if (mrc.length > 0 && (mrc[0].status === 'ACTIVE' || mrc[0].status === 'DISCONNECTED')) {
        console.log(`[Sync ${merchantId}] Listener not active in memory, attempting auto-restart...`);
        startMerchantListener(merchantId).catch(() => {});
      }
    } catch (_) {}
    return 0;
  }
  const page = active.page;
  try {
    const pageState = await page.evaluate(() => {
      const doc = (globalThis as any).document;
      const rows = Array.from(doc?.querySelectorAll('table tr, [role="row"]') || []);
      const sampleTexts = rows.slice(0, 5).map((r: any) => (r.innerText || '').replace(/\s+/g, ' ').substring(0, 80));
      return {
        url: window.location.href,
        rowsCount: rows.length,
        sampleTexts
      };
    }).catch((err: any) => ({ url: '', rowsCount: 0, sampleTexts: [], error: err.message }));
    
    console.log(`[Sync ${merchantId}] Page: ${pageState.url} (${pageState.rowsCount} rows) -> ${JSON.stringify(pageState.sampleTexts)}`);

    // 1. Scrape rendered DOM table (from portal.gofoodmerchant.co.id/transactions?date_range=today)
    const domList = await page.evaluate(() => {
      const doc = (globalThis as any).document;
      if (!doc) return [];
      const items: any[] = [];
      let rows = Array.from(doc.querySelectorAll('table tbody tr, table tr, [role="row"]'));
      
      if (rows.length === 0) {
        const candidates = Array.from(doc.querySelectorAll('tr, div[class*="row"], div[class*="item"], li'));
        rows = candidates.filter((el: any) => {
          const t = el.innerText || '';
          return t.includes('Rp') && /settlement|sukses|berhasil/i.test(t) && t.length < 500;
        });
      }

      for (const row of rows) {
        const text = (row as any).innerText || '';
        if (!text.includes('Rp')) continue;
        if (!/settlement|sukses|berhasil/i.test(text)) continue;

        const amountMatch = text.match(/Rp\s*([\d\.,]+)/i);
        if (!amountMatch) continue;

        const cleanNum = amountMatch[1].replace(/\./g, '').replace(/,/g, '.');
        const amount = Math.round(parseFloat(cleanNum));
        if (!amount || isNaN(amount)) continue;

        const link = (row as any).querySelector('a');
        let orderId = link ? ((link as any).innerText || '').trim() : '';
        if (!orderId) {
          const idMatch = text.match(/(QRIS-[\w]+|[\w-]{8,})/i);
          orderId = idMatch ? idMatch[1] : '';
        }
        const txId = orderId || `dom_${amount}`;

        items.push({
          id: txId,
          order_id: txId,
          gross_amount: amount,
          is_dom: true,
          transaction_status: 'SETTLEMENT',
          created_at: new Date().toISOString()
        });
      }
      return items;
    });

    let count = 0;
    if (domList && domList.length > 0) {
      console.log(`[Sync ${merchantId}] Extracted ${domList.length} mutations from DOM table.`);
      await processIncomingMutations(merchantId, domList);
      count += domList.length;
    }

    // 2. Also try in-page fetch fallback to API (no payment_types filter to ensure GoPay Instore included)
    try {
      const inPageData = await page.evaluate(async () => {
        try {
          const now = new Date();
          const startTime = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
          const res = await fetch(`https://api.gojekapi.com/merchant-analytics/v2/merchants/transactions?from=0&size=50&statuses=SETTLEMENT,CAPTURE&start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(now.toISOString())}`, {
            credentials: 'include'
          });
          if (res.ok) return await res.json();
        } catch (_) {}
        return null;
      });

      if (inPageData) {
        const list = inPageData.transactions || inPageData.data?.transactions || (Array.isArray(inPageData.data) ? inPageData.data : []);
        if (list.length > 0) {
          console.log(`[Sync ${merchantId}] Fetched ${list.length} mutations from in-page API.`);
          await processIncomingMutations(merchantId, list);
          count += list.length;
        }
      }
    } catch (_) {}

    return count;
  } catch (err: any) {
    console.warn(`[Sync ${merchantId}] Error during mutation sync:`, err.message);
    return 0;
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

const inFlightOtpMerchants = new Set<string>();

/**
 * Trigger GoBiz WhatsApp OTP Request (using Puppeteer headless flow)
 */
export async function triggerGoBizOTP(merchantId: string) {
  if (inFlightOtpMerchants.has(merchantId)) {
    return { success: false, error: 'Permintaan OTP sedang diproses. Mohon tunggu sejenak.' };
  }
  inFlightOtpMerchants.add(merchantId);

  console.log(`[Worker ${merchantId}] Requesting GoBiz OTP via WhatsApp/SMS...`);
  
  // Close any existing pending auth browser session for this merchant
  const existing = activeListeners.get(`auth_${merchantId}`);
  if (existing?.browser) {
    try { await existing.browser.close(); } catch (_) {}
    activeListeners.delete(`auth_${merchantId}`);
  }

  const mrcList = await db.select().from(merchants).where(eq(merchants.id, merchantId));
  if (mrcList.length === 0) {
    inFlightOtpMerchants.delete(merchantId);
    return { success: false, error: 'Merchant not found' };
  }
  const merchant = mrcList[0];
  let browser: any = null;

  try {
    const proxyConfig = getProxyConfig();
    browser = await puppeteer.launch({
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

    // Auto-dismiss OneTrust Cookie banner if displayed
    await dismissOneTrustBanner(page);

    // Format phone number: strip non-digits and leading 62 or 0 for GoFood web portal
    const digits = merchant.phoneNumber.replace(/\D/g, '');
    let localDigits = digits;
    if (localDigits.startsWith('62')) {
      localDigits = localDigits.slice(2);
    } else if (localDigits.startsWith('0')) {
      localDigits = localDigits.slice(1);
    }

    await page.waitForSelector('#auth-phone-input, input[type="tel"], input[name="phone"]', { timeout: 15000 });
    
    // Ensure input is focused and cleared, then set value using React native prototype setter
    await page.focus('#auth-phone-input, input[type="tel"], input[name="phone"]');
    await page.evaluate((val: string) => {
      const doc = (globalThis as any).document;
      const win = (globalThis as any).window || (globalThis as any);
      const input = doc?.querySelector('#auth-phone-input, input[type="tel"], input[name="phone"]');
      if (input) {
        input.value = '';
        const nativeSetter = Object.getOwnPropertyDescriptor(win.HTMLInputElement?.prototype || {}, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(input, val);
        } else {
          input.value = val;
        }
        input.dispatchEvent(new (win.Event || (globalThis as any).Event)('input', { bubbles: true }));
        input.dispatchEvent(new (win.Event || (globalThis as any).Event)('change', { bubbles: true }));
      }
    }, localDigits);

    await new Promise(r => setTimeout(r, 600));

    // Clear any re-rendered OneTrust overlay right before clicking submit
    await dismissOneTrustBanner(page);

    await page.waitForSelector('#phone-next-button, button[type="submit"]', { timeout: 10000 });
    
    // Trigger submission reliably via DOM click to prevent overlay interception or coordinate misses
    await page.evaluate(() => {
      const doc = (globalThis as any).document;
      const btn = doc?.getElementById('phone-next-button') || doc?.querySelector('#phone-next-button, button[type="submit"]');
      if (btn) {
        btn.click();
      }
    });
    try {
      await page.click('#phone-next-button, button[type="submit"]');
    } catch (_) {}

    // Wait for OTP field appearance confirming SMS dispatch with multiple fallback selectors
    const otpSelector = '#auth-otp-input, input[name="otp"], input[autocomplete="one-time-code"], input[placeholder*="OTP" i], input[data-testid*="otp" i]';
    try {
      await page.waitForSelector(otpSelector, { timeout: 15000 });
    } catch (waitErr: any) {
      // Check if GoFood portal displayed a validation or rate limit error on screen
      const pageErr = await page.evaluate(() => {
        const doc = (globalThis as any).document;
        const errEl = doc?.querySelector('[role="alert"], [class*="error" i], [class*="Error" i]');
        return errEl ? ((errEl as any).innerText || errEl.textContent || '').trim() : '';
      }).catch(() => '');
      if (pageErr) {
        throw new Error(pageErr);
      }
      throw waitErr;
    }
    console.log(`[Worker ${merchantId}] GoBiz OTP successfully sent to ${localDigits}.`);

    // Keep browser session alive in memory associated with this merchant's registration flow
    activeListeners.set(`auth_${merchantId}`, {
      browser,
      page,
      createdAt: Date.now()
    });

    return { success: true };
  } catch (err: any) {
    console.error(`[Worker ${merchantId}] OTP trigger failed:`, err);
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    activeListeners.delete(`auth_${merchantId}`);
    return { success: false, error: err.message };
  } finally {
    inFlightOtpMerchants.delete(merchantId);
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
    // Auto-dismiss OneTrust Cookie banner if displayed
    await dismissOneTrustBanner(page);

    await page.waitForSelector('#auth-otp-input, input[name="otp"]', { timeout: 15000 });
    
    // Set OTP using React native prototype setter for guaranteed state update
    await page.evaluate((val: string) => {
      const doc = (globalThis as any).document;
      const win = (globalThis as any).window || (globalThis as any);
      const input = doc?.querySelector('#auth-otp-input, input[name="otp"]');
      if (input) {
        input.value = '';
        const nativeSetter = Object.getOwnPropertyDescriptor(win.HTMLInputElement?.prototype || {}, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(input, val);
        } else {
          input.value = val;
        }
        input.dispatchEvent(new (win.Event || (globalThis as any).Event)('input', { bubbles: true }));
        input.dispatchEvent(new (win.Event || (globalThis as any).Event)('change', { bubbles: true }));
      }
    }, otpCode);
    await new Promise(r => setTimeout(r, 500));

    await dismissOneTrustBanner(page);
    console.log(`[Worker ${merchantId}] Clicking OTP verify submit button...`);
    await page.waitForSelector('#verify-otp-button, button[type="submit"]', { timeout: 10000 });
    
    // Trigger submission reliably via DOM click
    await page.evaluate(() => {
      const doc = (globalThis as any).document;
      const btn = doc?.getElementById('verify-otp-button') || doc?.querySelector('#verify-otp-button, button[type="submit"]');
      if (btn) {
        btn.click();
      }
    });
    try {
      await page.click('#verify-otp-button, button[type="submit"]');
    } catch (_) {}

    // Wait for redirect to dashboard indicating success
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});

    if (page.url().includes('/dashboard') || !page.url().includes('/login')) {
      // Persist session cookies encrypted with AES-256-GCM
      const cookies = await page.cookies();
      const mrcList = await db.select().from(merchants).where(eq(merchants.id, merchantId));
      if (mrcList.length > 0) {
        const sessionPath = mrcList[0].sessionFilePath;
        await Deno.mkdir('sessions', { recursive: true });
        const encrypted = await encryptSession(JSON.stringify(cookies));
        await Deno.writeTextFile(sessionPath, encrypted);
        console.log(`[Worker ${merchantId}] Session cookies saved securely (AES-256-GCM encrypted).`);
      }

      // Extract Bearer access token from browser storage or session cookies
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
      const pageErr = await page.evaluate(() => {
        const doc = (globalThis as any).document;
        const errEl = doc?.querySelector('[role="alert"], [class*="error" i], [class*="Error" i]');
        return errEl ? ((errEl as any).innerText || errEl.textContent || '').trim() : '';
      }).catch(() => '');
      await browser.close();
      activeListeners.delete(`auth_${merchantId}`);
      return { success: false, error: pageErr || 'OTP validation failed. Redirect unsuccessful.' };
    }
  } catch (err: any) {
    console.error(`[Worker ${merchantId}] OTP verification failed:`, err);
    try { await browser.close(); } catch (_) {}
    activeListeners.delete(`auth_${merchantId}`);
    return { success: false, error: err.message };
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

