import { db } from '../db/db.ts';
import { merchants } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import {
  activeListeners,
  startMerchantListener as startPuppeteerListener,
  stopMerchantListener as stopPuppeteerListener,
  syncMerchantMutations as syncPuppeteerMutations,
  triggerGoBizOTP as triggerPuppeteerOTP,
  verifyGoBizOTP as verifyPuppeteerOTP,
  closeAllListeners as closeAllPuppeteerListeners,
} from './puppeteer-listener.ts';
import {
  activeDirectListeners,
  startDirectApiListener,
  stopDirectApiListener,
  syncDirectApiMutations,
  triggerDirectGoBizOTP,
  verifyDirectGoBizOTP,
  closeAllDirectListeners,
} from './direct-api-listener.ts';
import { dispatchWebhook } from './mutation-processor.ts';

export { dispatchWebhook };

export type MerchantSyncMode = 'STANDARD' | 'EXPRESS';

async function getMerchantSyncMode(merchantId: string): Promise<MerchantSyncMode> {
  const rows = await db
    .select({ syncMode: merchants.syncMode })
    .from(merchants)
    .where(eq(merchants.id, merchantId));
  return rows[0]?.syncMode === 'EXPRESS' ? 'EXPRESS' : 'STANDARD';
}

export function getActiveWorkerCount(): number {
  return activeListeners.size + activeDirectListeners.size;
}

export async function startMerchantListener(merchantId: string): Promise<void> {
  const mode = await getMerchantSyncMode(merchantId);
  if (mode === 'EXPRESS') {
    await stopPuppeteerListener(merchantId);
    await startDirectApiListener(merchantId);
  } else {
    await stopDirectApiListener(merchantId);
    await startPuppeteerListener(merchantId);
  }
}

export async function stopMerchantListener(merchantId: string): Promise<void> {
  await Promise.all([
    stopPuppeteerListener(merchantId),
    stopDirectApiListener(merchantId),
  ]);
}

export async function syncMerchantMutations(merchantId: string): Promise<number> {
  const mode = await getMerchantSyncMode(merchantId);
  if (mode === 'EXPRESS') {
    return await syncDirectApiMutations(merchantId);
  }
  return await syncPuppeteerMutations(merchantId);
}

export async function triggerGoBizOTP(merchantId: string): Promise<{ success: boolean; error?: string }> {
  const mode = await getMerchantSyncMode(merchantId);
  if (mode === 'EXPRESS') {
    return await triggerDirectGoBizOTP(merchantId);
  }
  return await triggerPuppeteerOTP(merchantId);
}

export async function verifyGoBizOTP(merchantId: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
  const mode = await getMerchantSyncMode(merchantId);
  if (mode === 'EXPRESS') {
    return await verifyDirectGoBizOTP(merchantId, otpCode);
  }
  return await verifyPuppeteerOTP(merchantId, otpCode);
}

export async function closeAllListeners(): Promise<void> {
  await Promise.all([
    closeAllPuppeteerListeners(),
    closeAllDirectListeners(),
  ]);
}
