import puppeteer from 'puppeteer';
import { db } from '../db/db.ts';
import { merchants, invoices, mutations, users } from '../db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';

// Mutex or tracker for running listeners
export const activeListeners = new Map<string, any>();

/**
 * Start the Puppeteer scraping listener for a merchant
 */
export async function startMerchantListener(merchantId: string) {
  if (activeListeners.has(merchantId)) {
    console.log(`[Worker ${merchantId}] Listener already running.`);
    return;
  }

  // Get merchant details from DB
  const mrcList = await db.select().from(merchants).where(eq(merchants.id, merchantId));
  if (mrcList.length === 0) {
    console.error(`[Worker ${merchantId}] Merchant not found in DB.`);
    return;
  }
  const merchant = mrcList[0];

  console.log(`[Worker ${merchantId}] Starting Puppeteer listener...`);
  
  // Save status as tracking
  activeListeners.set(merchantId, { status: 'STARTING' });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    activeListeners.get(merchantId).browser = browser;
    activeListeners.get(merchantId).page = page;

    // Load existing cookies/session if file exists
    try {
      const sessionData = await Deno.readTextFile(merchant.sessionFilePath);
      const cookies = JSON.parse(sessionData);
      await page.setCookie(...cookies);
      console.log(`[Worker ${merchantId}] Session cookies loaded successfully.`);
    } catch (_err) {
      console.log(`[Worker ${merchantId}] No session cookies found. Starting unauthenticated.`);
    }

    // Intercept internal XHR requests
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      request.continue();
    });

    page.on('response', async (response) => {
      const url = response.url();
      const isOldTransactions = url.includes('/v1/transactions');
      const isNewTransactions = url.includes('merchant-analytics/v2/merchants/transactions');
      
      if ((isOldTransactions || isNewTransactions) && response.status() === 200) {
        try {
          const payload = await response.json();
          console.log(`[Worker ${merchantId}] Transaction data intercepted from ${isNewTransactions ? "new" : "old"} API.`);
          
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

    // Go to GoBiz portal
    await page.goto('https://portal.gofoodmerchant.co.id/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Check if we are redirected to login (indicating session is expired or dead)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log(`[Worker ${merchantId}] Session dead or expired. Updating status to NEEDS_OTP.`);
      await db.update(merchants)
        .set({ status: 'NEEDS_OTP' })
        .where(eq(merchants.id, merchantId));
      
      activeListeners.get(merchantId).status = 'NEEDS_OTP';
      await browser.close();
      activeListeners.delete(merchantId);
      return;
    }

    // Navigating straight to the transactions list page
    console.log(`[Worker ${merchantId}] Navigating to transactions list page...`);
    await page.goto('https://portal.gofoodmerchant.co.id/transactions?data_range=this_week', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Update status to ACTIVE in database
    await db.update(merchants)
      .set({ status: 'ACTIVE' })
      .where(eq(merchants.id, merchantId));
    activeListeners.get(merchantId).status = 'ACTIVE';

    // Set polling interval (refresh page every 12 seconds to trigger XHR requests)
    const intervalId = setInterval(async () => {
      try {
        console.log(`[Worker ${merchantId}] Polling mutation feed...`);
        await page.reload({ waitUntil: 'networkidle2' });
      } catch (err) {
        console.error(`[Worker ${merchantId}] Page reload failed:`, err);
      }
    }, 12000);

    activeListeners.get(merchantId).intervalId = intervalId;

  } catch (err) {
    console.error(`[Worker ${merchantId}] Listener crashed:`, err);
    await db.update(merchants)
      .set({ status: 'DISCONNECTED' })
      .where(eq(merchants.id, merchantId));
    
    // Clean up
    const active = activeListeners.get(merchantId);
    if (active) {
      if (active.browser) {
        try { await active.browser.close(); } catch (_) {}
      }
      if (active.intervalId) {
        clearInterval(active.intervalId);
      }
      activeListeners.delete(merchantId);
    }
  }
}

/**
 * Terminate a running listener worker
 */
export async function stopMerchantListener(merchantId: string) {
  const active = activeListeners.get(merchantId);
  if (!active) return;

  console.log(`[Worker ${merchantId}] Stopping listener worker...`);
  if (active.intervalId) {
    clearInterval(active.intervalId);
  }
  if (active.browser) {
    try {
      await active.browser.close();
    } catch (_) {}
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
  console.log(`[Worker ${merchantId}] Requesting GoBiz OTP via WhatsApp...`);
  
  const mrcList = await db.select().from(merchants).where(eq(merchants.id, merchantId));
  if (mrcList.length === 0) return { success: false, error: 'Merchant not found' };
  const merchant = mrcList[0];

  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.goto('https://portal.gofoodmerchant.co.id/login', { waitUntil: 'networkidle2' });

    // Fill phone number input
    // Assuming target input selector: input[type="tel"] or input[name="phone"]
    await page.waitForSelector('input[type="tel"]', { timeout: 10000 });
    await page.type('input[type="tel"]', merchant.phoneNumber);

    // Click request OTP
    // Selector based on GoBiz login button structure
    await page.click('button[type="submit"]');

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
    // Fill OTP digits
    // Selector for 6 digit OTP input fields (or a single input)
    await page.waitForSelector('input[name="otp"]', { timeout: 10000 });
    await page.type('input[name="otp"]', otpCode);

    // Click submit/login button
    console.log(`[Worker ${merchantId}] Clicking OTP verify submit button...`);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard indicating success
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });

    if (page.url().includes('/dashboard') || !page.url().includes('/login')) {
      // Save cookies to session JSON path
      const cookies = await page.cookies();
      const mrcList = await db.select().from(merchants).where(eq(merchants.id, merchantId));
      if (mrcList.length > 0) {
        const sessionPath = mrcList[0].sessionFilePath;
        // Make sure parent directories exist
        await Deno.mkdir('sessions', { recursive: true });
        await Deno.writeTextFile(sessionPath, JSON.stringify(cookies, null, 2));

        // Update DB status
        await db.update(merchants)
          .set({ status: 'ACTIVE' })
          .where(eq(merchants.id, merchantId));
      }

      await browser.close();
      activeListeners.delete(`auth_${merchantId}`);
      
      // Instantly start the listener worker
      startMerchantListener(merchantId);
      
      return { success: true };
    } else {
      return { success: false, error: 'OTP validation failed. Redirect unsuccessful.' };
    }
  } catch (err: any) {
    console.error(`[Worker ${merchantId}] OTP verification failed:`, err);
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

    // Check if there is an active invoice matching this totalAmount
    // Matching logic: status === 'PENDING', totalAmount === txAmount, expiredAt > NOW()
    const invoiceList = await db.select()
      .from(invoices)
      .where(
        and(
          eq(invoices.merchantId, merchantId),
          eq(invoices.status, 'PENDING'),
          eq(invoices.totalAmount, txAmount),
          sql`${invoices.expiredAt} > NOW()`
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

      // Dispatch Webhook
      if (matchedInvoice.callbackUrl) {
        dispatchWebhook(matchedInvoice, txTime);
      }
    }
  }
}

/**
 * Dispatch HTTP POST webhook with HMAC verification signature
 */
async function dispatchWebhook(invoice: any, txTime: string, retryCount = 0) {
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

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-QBiz-Signature': signature,
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
