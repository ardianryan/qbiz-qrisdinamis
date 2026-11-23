import { db } from '../db/db.ts';
import { merchants, invoices } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { encryptSession, decryptSession } from '../src/utils/crypto.ts';
import { notifySessionExpired } from '../src/services/notification.ts';
import { processIncomingMutations } from './mutation-processor.ts';

const GOBIZ_AUTH_BASE = 'https://api.gobiz.co.id';
const GOJEK_TRANSACTIONS_URL = 'https://api.gojekapi.com/merchant-analytics/v2/merchants/transactions';
const GOBIZ_CLIENT_ID = 'go-biz-web-new';
const TOKEN_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const EXPRESS_ACTIVE_POLL_MS = 65 * 1000; // ~1 minute when pending invoices exist
const EXPRESS_IDLE_POLL_MS = 5 * 60 * 1000; // 5 minutes when idle

export interface DirectApiTokenSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  obtainedAt: number;
  phoneNumber: string;
  merchantGojekId?: string;
  cookie?: string;
  deviceId?: string;
}

export const activeDirectListeners = new Map<string, {
  pollTimer?: number;
  refreshTimer?: number;
  lastSyncAt?: number;
}>();

const pendingOtpRequests = new Map<string, {
  otpToken: string;
  phoneNumber: string;
  deviceId: string;
  createdAt: number;
}>();

const merchantDeviceIds = new Map<string, string>();

export async function getOrCreateMerchantDeviceId(merchantId: string): Promise<string> {
  const cached = merchantDeviceIds.get(merchantId);
  if (cached) return cached;

  const existing = await loadDirectTokenSession(merchantId);
  if (existing?.deviceId) {
    merchantDeviceIds.set(merchantId, existing.deviceId);
    return existing.deviceId;
  }

  const generated = crypto.randomUUID();
  merchantDeviceIds.set(merchantId, generated);
  return generated;
}

function getTokenFilePath(merchantId: string): string {
  return `sessions/${merchantId}.token.json`;
}

function normalizePhoneForGoBiz(phone: string): { raw: string; localWithoutZero: string; e164: string } {
  const digits = phone.replace(/[^0-9]/g, '');
  let localWithoutZero = digits;
  if (localWithoutZero.startsWith('62')) {
    localWithoutZero = localWithoutZero.slice(2);
  } else if (localWithoutZero.startsWith('0')) {
    localWithoutZero = localWithoutZero.slice(1);
  }
  return {
    raw: phone,
    localWithoutZero,
    e164: `+62${localWithoutZero}`,
  };
}

function buildGoBizAuthHeaders(deviceId?: string): Record<string, string> {
  return {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'accept-language': 'id',
    'authentication-type': 'go-id',
    'gojek-country-code': 'ID',
    'gojek-timezone': 'Asia/Jakarta',
    'origin': 'https://portal.gofoodmerchant.co.id',
    'referer': 'https://portal.gofoodmerchant.co.id/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
    'x-appid': 'go-biz-web-dashboard',
    'x-appversion': 'platform-v3.111.0-1708bc9a',
    'x-deviceos': 'Web',
    'x-phonemake': 'Windows 10 64-bit',
    'x-phonemodel': 'Chrome 150.0.0.0 on Windows 10 64-bit',
    'x-platform': 'Web',
    'x-uniqueid': deviceId || crypto.randomUUID(),
    'x-user-locale': 'en-GB',
    'x-user-type': 'merchant',
  };
}

function buildGoBizTransactionHeaders(accessToken: string, refreshToken?: string, customCookie?: string): Record<string, string> {
  const cookie = customCookie || (refreshToken
    ? `access_token=${accessToken}; refresh_token=${refreshToken}; auth_method=goid`
    : `access_token=${accessToken}; auth_method=goid`);

  return {
    'Accept': 'application/json, text/plain, */*',
    'Authorization': `Bearer ${accessToken}`,
    'Cookie': cookie,
    'authentication-type': 'go-id',
    'Origin': 'https://portal.gofoodmerchant.co.id',
    'Referer': 'https://portal.gofoodmerchant.co.id/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
  };
}

function buildGoBizHeaders(accessToken?: string): Record<string, string> {
  if (accessToken) {
    return buildGoBizTransactionHeaders(accessToken);
  }
  return buildGoBizAuthHeaders();
}

export async function saveDirectTokenSession(merchantId: string, session: DirectApiTokenSession): Promise<void> {
  await Deno.mkdir('sessions', { recursive: true }).catch(() => {});
  const encrypted = await encryptSession(JSON.stringify(session));
  await Deno.writeTextFile(getTokenFilePath(merchantId), encrypted);
}

export async function loadDirectTokenSession(merchantId: string): Promise<DirectApiTokenSession | null> {
  try {
    const encrypted = await Deno.readTextFile(getTokenFilePath(merchantId));
    const decrypted = await decryptSession(encrypted);
    const parsed = JSON.parse(decrypted) as DirectApiTokenSession;
    if (parsed && parsed.accessToken) {
      return parsed;
    }
  } catch (_) {
    return null;
  }
  return null;
}

export async function triggerDirectGoBizOTP(merchantId: string): Promise<{ success: boolean; error?: string; channel?: string; message?: string }> {
  // Check if an active OTP request is already pending within 60s cooldown to prevent double dispatch
  const existingPending = pendingOtpRequests.get(merchantId);
  if (existingPending && Date.now() - existingPending.createdAt < 60_000) {
    console.log(`[Express ${merchantId}] Reusing active OTP token (requested ${Math.round((Date.now() - existingPending.createdAt) / 1000)}s ago) to prevent duplicate OTP.`);
    return {
      success: true,
      channel: 'SMS',
      message: `Kode OTP sebelumnya masih aktif. Silakan masukkan 4 digit kode OTP yang telah dikirim ke nomor HP Anda (${existingPending.phoneNumber}).`
    };
  }

  const mrc = await db.select().from(merchants).where(eq(merchants.id, merchantId));
  if (mrc.length === 0) {
    return { success: false, error: 'Merchant not found' };
  }

  const deviceId = await getOrCreateMerchantDeviceId(merchantId);
  const phone = normalizePhoneForGoBiz(mrc[0].phoneNumber);
  try {
    const res = await fetch(`${GOBIZ_AUTH_BASE}/goid/login/request`, {
      method: 'POST',
      headers: buildGoBizAuthHeaders(deviceId),
      body: JSON.stringify({
        client_id: GOBIZ_CLIENT_ID,
        phone_number: phone.localWithoutZero,
        country_code: '62',
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[Express ${merchantId}] GoBiz Direct API login/request failed (HTTP ${res.status}):`, JSON.stringify(data));
      const msg = data?.errors?.[0]?.message_title || data?.errors?.[0]?.message || data?.message || `HTTP ${res.status}`;
      return { success: false, error: `GoBiz Direct API OTP request failed: ${msg}` };
    }

    const otpToken = data?.data?.otp_token || data?.otp_token || '';
    if (!otpToken) {
      return { success: false, error: 'GoBiz Direct API did not return an otp_token.' };
    }

    pendingOtpRequests.set(merchantId, {
      otpToken,
      phoneNumber: phone.e164,
      deviceId,
      createdAt: Date.now(),
    });

    const channel = (data?.data?.next_state?.state || 'sms').toUpperCase();
    console.log(`[Express ${merchantId}] OTP requested via Direct GoBiz API for ${phone.e164} (channel: ${channel}, deviceId: ${deviceId}).`);
    return {
      success: true,
      channel,
      message: `Kode OTP 4 digit telah dikirim oleh GoBiz melalui ${channel} ke ${phone.e164}. Mohon periksa SMS / Pesan Masuk di HP Anda.`
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to request Direct API OTP' };
  }
}

export async function verifyDirectGoBizOTP(merchantId: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
  const pending = pendingOtpRequests.get(merchantId);
  if (!pending) {
    return { success: false, error: 'No active Direct API OTP session. Please request OTP again.' };
  }

  const cleanOtp = otpCode.replace(/\D/g, '').trim();
  if (cleanOtp.length !== 4) {
    return { success: false, error: 'Kode OTP harus berupa 4 digit angka.' };
  }

  try {
    const res = await fetch(`${GOBIZ_AUTH_BASE}/goid/token`, {
      method: 'POST',
      headers: buildGoBizAuthHeaders(pending.deviceId),
      body: JSON.stringify({
        client_id: GOBIZ_CLIENT_ID,
        grant_type: 'otp',
        data: {
          otp: cleanOtp,
          otp_token: pending.otpToken,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[Express ${merchantId}] GoBiz Direct API token verify failed (HTTP ${res.status}):`, JSON.stringify(data));
      const msg = data?.errors?.[0]?.message_title || data?.errors?.[0]?.message || data?.message || `HTTP ${res.status}`;
      return { success: false, error: `OTP verification failed: ${msg}` };
    }

    const accessToken = data?.access_token || data?.data?.access_token;
    const refreshToken = data?.refresh_token || data?.data?.refresh_token || '';
    const expiresIn = Number(data?.expires_in || data?.data?.expires_in || 86400);

    if (!accessToken) {
      return { success: false, error: 'GoBiz Direct API did not return an access_token.' };
    }

    let merchantGojekId: string | undefined;
    try {
      const configRes = await fetch(`${GOBIZ_AUTH_BASE}/goresto/v5/public/users/config`, {
        method: 'GET',
        headers: buildGoBizTransactionHeaders(accessToken, refreshToken),
        signal: AbortSignal.timeout(10000),
      });
      if (configRes.ok) {
        const configData = await configRes.json().catch(() => null);
        merchantGojekId = configData?.data?.merchant?.id || configData?.merchant?.id || undefined;
      }
    } catch (_) {}

    const session: DirectApiTokenSession = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      obtainedAt: Date.now(),
      phoneNumber: pending.phoneNumber,
      merchantGojekId,
      deviceId: pending.deviceId,
      cookie: `access_token=${accessToken}; refresh_token=${refreshToken}; auth_method=goid`,
    };

    await saveDirectTokenSession(merchantId, session);
    pendingOtpRequests.delete(merchantId);

    await db.update(merchants)
      .set({ status: 'ACTIVE', sessionToken: accessToken })
      .where(eq(merchants.id, merchantId));

    startDirectApiListener(merchantId).catch(() => {});
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Direct API OTP verification failed' };
  }
}

export async function refreshDirectApiToken(merchantId: string): Promise<DirectApiTokenSession | null> {
  const current = await loadDirectTokenSession(merchantId);
  if (!current || !current.refreshToken) {
    return null;
  }

  const deviceId = current.deviceId || await getOrCreateMerchantDeviceId(merchantId);
  const phone = normalizePhoneForGoBiz(current.phoneNumber || '');

  try {
    const res = await fetch(`${GOBIZ_AUTH_BASE}/goid/token`, {
      method: 'POST',
      headers: buildGoBizAuthHeaders(deviceId),
      body: JSON.stringify({
        client_id: GOBIZ_CLIENT_ID,
        grant_type: 'refresh_token',
        data: {
          refresh_token: current.refreshToken,
          phone_number: phone.localWithoutZero,
          country_code: '62',
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn(`[Express ${merchantId}] Refresh token rejected (HTTP ${res.status}). Marking NEEDS_OTP.`);
      await db.update(merchants).set({ status: 'NEEDS_OTP' }).where(eq(merchants.id, merchantId));
      notifySessionExpired(merchantId).catch(() => {});
      await stopDirectApiListener(merchantId);
      return null;
    }

    const data = await res.json().catch(() => ({}));
    const accessToken = data?.access_token || data?.data?.access_token;
    const refreshToken = data?.refresh_token || data?.data?.refresh_token || current.refreshToken;
    const expiresIn = Number(data?.expires_in || data?.data?.expires_in || 86400);

    if (!accessToken) return null;

    const updated: DirectApiTokenSession = {
      ...current,
      accessToken,
      refreshToken,
      deviceId,
      expiresAt: Date.now() + expiresIn * 1000,
      obtainedAt: Date.now(),
      cookie: `access_token=${accessToken}; refresh_token=${refreshToken}; auth_method=goid`,
    };

    await saveDirectTokenSession(merchantId, updated);
    await db.update(merchants).set({ sessionToken: accessToken, status: 'ACTIVE' }).where(eq(merchants.id, merchantId));
    console.log(`[Express ${merchantId}] Direct API token refreshed cleanly.`);
    return updated;
  } catch (err: any) {
    console.warn(`[Express ${merchantId}] Error refreshing token:`, err.message);
    return null;
  }
}

export async function syncDirectApiMutations(merchantId: string): Promise<number> {
  let session = await loadDirectTokenSession(merchantId);

  if (!session) {
    await db.update(merchants).set({ status: 'NEEDS_OTP' }).where(eq(merchants.id, merchantId));
    return 0;
  }

  // Refresh proactively if within 1 hour of expiry
  if (session.refreshToken && Date.now() > session.expiresAt - 60 * 60 * 1000) {
    const refreshed = await refreshDirectApiToken(merchantId);
    if (refreshed) session = refreshed;
  }

  try {
    const now = new Date();
    const startTime = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const queryParams = new URLSearchParams({
      from: '0',
      size: '50',
      statuses: 'SETTLEMENT,CAPTURE,REFUND,PARTIAL_REFUND',
      payment_types: 'QRIS,GOPAY,OFFLINE_CREDIT_CARD,OFFLINE_DEBIT_CARD,CREDIT_CARD',
      start_time: startTime,
      end_time: now.toISOString(),
    });
    if (session.merchantGojekId) {
      queryParams.set('merchant_ids', session.merchantGojekId);
    }
    const url = `${GOJEK_TRANSACTIONS_URL}?${queryParams.toString()}`;

    let res = await fetch(url, {
      method: 'GET',
      headers: buildGoBizTransactionHeaders(session.accessToken, session.refreshToken, session.cookie),
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 401 && session.refreshToken) {
      const refreshed = await refreshDirectApiToken(merchantId);
      if (refreshed) {
        session = refreshed;
        res = await fetch(url, {
          method: 'GET',
          headers: buildGoBizTransactionHeaders(session.accessToken, session.refreshToken, session.cookie),
          signal: AbortSignal.timeout(15000),
        });
      }
    }

    if (res.status === 401 || res.status === 403) {
      console.warn(`[Express ${merchantId}] Direct API returned ${res.status}. Marking NEEDS_OTP.`);
      await db.update(merchants).set({ status: 'NEEDS_OTP' }).where(eq(merchants.id, merchantId));
      notifySessionExpired(merchantId).catch(() => {});
      await stopDirectApiListener(merchantId);
      return 0;
    }

    if (!res.ok) {
      console.warn(`[Express ${merchantId}] Direct API poll failed with HTTP ${res.status}`);
      return 0;
    }

    const body = await res.json().catch(() => null);
    const list = body?.transactions || body?.data?.transactions || (Array.isArray(body?.data) ? body.data : []);
    if (Array.isArray(list) && list.length > 0) {
      await processIncomingMutations(merchantId, list);
      return list.length;
    }
    return 0;
  } catch (err: any) {
    console.warn(`[Express ${merchantId}] Direct API sync error:`, err.message);
    return 0;
  }
}

export async function startDirectApiListener(merchantId: string): Promise<void> {
  if (activeDirectListeners.has(merchantId)) {
    return;
  }

  const session = await loadDirectTokenSession(merchantId);
  const mrc = await db.select().from(merchants).where(eq(merchants.id, merchantId));
  if (mrc.length === 0) return;

  if (!session && !mrc[0].sessionToken) {
    console.log(`[Express ${merchantId}] No token session found. Setting NEEDS_OTP.`);
    await db.update(merchants).set({ status: 'NEEDS_OTP' }).where(eq(merchants.id, merchantId));
    return;
  }

  console.log(`[Express ${merchantId}] Starting Direct GoPay API listener (1-2 min polling)...`);

  const runAdaptivePoll = async () => {
    const entry = activeDirectListeners.get(merchantId);
    if (!entry) return;

    const pending = await db.select({ id: invoices.id })
      .from(invoices)
      .where(and(eq(invoices.merchantId, merchantId), eq(invoices.status, 'PENDING')))
      .limit(1);

    const now = Date.now();
    const lastSync = entry.lastSyncAt || 0;
    const interval = pending.length > 0 ? EXPRESS_ACTIVE_POLL_MS : EXPRESS_IDLE_POLL_MS;

    if (now - lastSync >= interval) {
      entry.lastSyncAt = now;
      await syncDirectApiMutations(merchantId);
    }
  };

  // Run initial sync immediately, then check every 30s whether active/idle interval elapsed
  const pollTimer = setInterval(() => {
    runAdaptivePoll().catch(() => {});
  }, 30 * 1000) as unknown as number;

  const refreshTimer = setInterval(() => {
    refreshDirectApiToken(merchantId).catch(() => {});
  }, TOKEN_REFRESH_INTERVAL_MS) as unknown as number;

  activeDirectListeners.set(merchantId, {
    pollTimer,
    refreshTimer,
    lastSyncAt: 0,
  });

  runAdaptivePoll().catch(() => {});
}

export async function stopDirectApiListener(merchantId: string): Promise<void> {
  const active = activeDirectListeners.get(merchantId);
  if (!active) return;

  if (active.pollTimer) clearInterval(active.pollTimer);
  if (active.refreshTimer) clearInterval(active.refreshTimer);
  activeDirectListeners.delete(merchantId);
  console.log(`[Express ${merchantId}] Direct API listener stopped.`);
}

export async function closeAllDirectListeners(): Promise<void> {
  for (const merchantId of Array.from(activeDirectListeners.keys())) {
    await stopDirectApiListener(merchantId);
  }
}
