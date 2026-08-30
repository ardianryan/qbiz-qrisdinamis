import { db } from '../../db/db.ts';
import { apiKeys, users, merchants, regionalAdminMerchants } from '../../db/schema.ts';
import { eq, and, desc, or, inArray } from 'drizzle-orm';
import { UserSession } from '../middleware/auth.ts';

export interface ApiScopeDefinition {
  id: string;
  label: string;
  category: 'READ' | 'WRITE';
  description: string;
}

export const AVAILABLE_SCOPES: ApiScopeDefinition[] = [
  {
    id: 'invoices:create',
    label: 'Create Invoices',
    category: 'WRITE',
    description: 'Generate dynamic QRIS payment charges and custom checkout URLs.'
  },
  {
    id: 'invoices:read',
    label: 'Read Invoices',
    category: 'READ',
    description: 'Query real-time payment verification status and invoice details.'
  },
  {
    id: 'transactions:read',
    label: 'Read Transactions',
    category: 'READ',
    description: 'Access bank mutation logs and reconciled settlement histories.'
  },
  {
    id: 'merchants:read',
    label: 'Read Store Profile',
    category: 'READ',
    description: 'Access store information, status, and static QRIS payloads.'
  },
  {
    id: 'webhooks:manage',
    label: 'Manage Webhooks',
    category: 'WRITE',
    description: 'Manually trigger test events and resend callback payloads.'
  }
];

export interface ApiKeyRecord {
  id: string;
  name: string;
  key?: string; // Only present upon creation
  keyPrefix: string;
  userId: string;
  userName?: string;
  merchantId: string | null;
  merchantName?: string | null;
  scopes: string[];
  status: 'ACTIVE' | 'REVOKED';
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface ApiKeyVerificationResult {
  isValid: boolean;
  isLegacyKey?: boolean;
  userId?: string;
  userRole?: string;
  merchantId?: string | null; // Bound merchant ID (null = all merchants)
  scopes?: string[];
  error?: string;
}

/**
 * Generate cryptographically secure high-entropy API key
 */
function createSecretKey(): { fullKey: string; prefix: string } {
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const fullKey = `qbiz_live_${hex}`;
  const prefix = `qbiz_live_...${hex.slice(-6)}`;
  return { fullKey, prefix };
}

/**
 * Create a new Enterprise API Key
 */
export async function createApiKey(params: {
  name: string;
  userId: string;
  merchantId?: string | null;
  scopes: string[];
}): Promise<{ success: boolean; apiKey?: ApiKeyRecord; fullSecretKey?: string; error?: string }> {
  try {
    const trimmedName = params.name ? params.name.trim() : '';
    if (!trimmedName || trimmedName.length < 3 || trimmedName.length > 100) {
      return { success: false, error: 'Key name must be between 3 and 100 characters long.' };
    }

    if (!params.scopes || params.scopes.length === 0) {
      return { success: false, error: 'At least one permission scope must be selected.' };
    }

    // Strict Scope Whitelist Validation
    const validScopeIds = new Set(AVAILABLE_SCOPES.map(s => s.id));
    for (const sc of params.scopes) {
      if (!validScopeIds.has(sc)) {
        return { success: false, error: `Invalid permission scope requested: '${sc}'.` };
      }
    }

    const { fullKey, prefix } = createSecretKey();
    const id = `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const scopesStr = params.scopes.join(',');

    await db.insert(apiKeys).values({
      id,
      name: trimmedName,
      key: fullKey,
      keyPrefix: prefix,
      userId: params.userId,
      merchantId: params.merchantId || null,
      scopes: scopesStr,
      status: 'ACTIVE',
      createdAt: new Date()
    });

    const record: ApiKeyRecord = {
      id,
      name: trimmedName,
      keyPrefix: prefix,
      userId: params.userId,
      merchantId: params.merchantId || null,
      scopes: params.scopes,
      status: 'ACTIVE',
      lastUsedAt: null,
      createdAt: new Date()
    };

    return {
      success: true,
      apiKey: record,
      fullSecretKey: fullKey
    };
  } catch (err: any) {
    console.error('[ApiKeysService] createApiKey error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * List API Keys accessible to current user / store context
 */
export async function listApiKeys(
  user: UserSession,
  activeMerchantId?: string | null
): Promise<ApiKeyRecord[]> {
  try {
    const allUsers = await db.select().from(users);
    const allMerchants = await db.select().from(merchants);

    let query: any[] = [];
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      if (activeMerchantId) {
        query = await db.select().from(apiKeys).where(
          or(
            eq(apiKeys.merchantId, activeMerchantId),
            eq(apiKeys.userId, user.id)
          )
        ).orderBy(desc(apiKeys.createdAt));
      } else {
        query = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
      }
    } else if (user.role === 'REGIONAL_ADMIN') {
      const regMerchants = await db.select().from(regionalAdminMerchants).where(eq(regionalAdminMerchants.userId, user.id));
      const mrcIds = regMerchants.map(r => r.merchantId);
      
      if (mrcIds.length > 0) {
        query = await db.select().from(apiKeys).where(
          or(
            eq(apiKeys.userId, user.id),
            inArray(apiKeys.merchantId, mrcIds)
          )
        ).orderBy(desc(apiKeys.createdAt));
      } else {
        query = await db.select().from(apiKeys).where(eq(apiKeys.userId, user.id)).orderBy(desc(apiKeys.createdAt));
      }
    } else {
      query = await db.select().from(apiKeys).where(eq(apiKeys.userId, user.id)).orderBy(desc(apiKeys.createdAt));
    }

    return query.map(k => {
      const u = allUsers.find(userObj => userObj.id === k.userId);
      const m = k.merchantId ? allMerchants.find(mrc => mrc.id === k.merchantId) : null;

      return {
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        userId: k.userId,
        userName: u ? u.name : 'Unknown User',
        merchantId: k.merchantId,
        merchantName: m ? m.name : 'All Merchants (Global)',
        scopes: k.scopes.split(',').filter(Boolean),
        status: k.status as 'ACTIVE' | 'REVOKED',
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt
      };
    });
  } catch (err: any) {
    console.error('[ApiKeysService] listApiKeys error:', err.message);
    return [];
  }
}

/**
 * Check if user is authorized to manage (revoke/delete) an API key
 */
async function canManageKey(key: { userId: string; merchantId: string | null }, user: UserSession): Promise<boolean> {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;
  if (key.userId === user.id) return true;
  
  if (user.role === 'REGIONAL_ADMIN' && key.merchantId) {
    const mapping = await db.select().from(regionalAdminMerchants).where(
      and(
        eq(regionalAdminMerchants.userId, user.id),
        eq(regionalAdminMerchants.merchantId, key.merchantId)
      )
    );
    return mapping.length > 0;
  }
  
  return false;
}

/**
 * Revoke an API key immediately
 */
export async function revokeApiKey(
  keyId: string,
  user: UserSession
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId));
    if (existing.length === 0) {
      return { success: false, error: 'API key not found.' };
    }

    const key = existing[0];
    const authorized = await canManageKey(key, user);
    if (!authorized) {
      return { success: false, error: 'Unauthorized to revoke this API key.' };
    }

    await db.update(apiKeys)
      .set({ status: 'REVOKED' })
      .where(eq(apiKeys.id, keyId));

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete an API key record
 */
export async function deleteApiKey(
  keyId: string,
  user: UserSession
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId));
    if (existing.length === 0) {
      return { success: false, error: 'API key not found.' };
    }

    const key = existing[0];
    const authorized = await canManageKey(key, user);
    if (!authorized) {
      return { success: false, error: 'Unauthorized to delete this API key.' };
    }

    await db.delete(apiKeys).where(eq(apiKeys.id, keyId));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Verify incoming Bearer token against enterprise api_keys (primary) and users.api_key (backward compat)
 */
export async function verifyApiKeyAndScope(
  bearerToken: string,
  requiredScope?: string,
  targetMerchantId?: string | null
): Promise<ApiKeyVerificationResult> {
  const token = bearerToken.trim();
  if (!token) {
    return { isValid: false, error: 'Bearer authentication token is missing.' };
  }

  // 1. Primary: Enterprise api_keys table check
  try {
    const matchedKeys = await db.select().from(apiKeys).where(eq(apiKeys.key, token));
    if (matchedKeys.length > 0) {
      const keyObj = matchedKeys[0];

      if (keyObj.status === 'REVOKED') {
        return { isValid: false, error: 'API key has been revoked and cannot be used.' };
      }

      const scopes = keyObj.scopes.split(',').filter(Boolean);

      // Check required scope
      if (requiredScope && !scopes.includes(requiredScope) && !scopes.includes('*')) {
        return {
          isValid: false,
          error: `Forbidden: API key lacks the required permission scope '${requiredScope}'.`
        };
      }

      // Check merchant scope
      if (keyObj.merchantId && targetMerchantId && keyObj.merchantId !== targetMerchantId) {
        return {
          isValid: false,
          error: `Forbidden: API key is strictly scoped to merchant '${keyObj.merchantId}' and cannot access '${targetMerchantId}'.`
        };
      }

      // Query user role
      let userRole = 'MERCHANT';
      try {
        const userList = await db.select().from(users).where(eq(users.id, keyObj.userId));
        if (userList.length > 0) userRole = userList[0].role;
      } catch (_e) {}

      // Update last_used_at timestamp asynchronously
      db.update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, keyObj.id))
        .catch(() => {});

      return {
        isValid: true,
        isLegacyKey: false,
        userId: keyObj.userId,
        userRole: userRole,
        merchantId: keyObj.merchantId,
        scopes: scopes
      };
    }
  } catch (_err) {
    // If api_keys table is not yet created, proceed to legacy user check
  }

  // 2. Fallback: Legacy users.api_key table check (Backward Compatibility)
  try {
    const matchedUsers = await db.select().from(users).where(eq(users.apiKey, token));
    if (matchedUsers.length > 0) {
      const userObj = matchedUsers[0];

      // Check merchant scope if user is a single merchant
      if ((userObj.role === 'MERCHANT' || userObj.role === 'MERCHANT_EMPLOYEE') && userObj.merchantId && targetMerchantId) {
        if (userObj.merchantId !== targetMerchantId) {
          return {
            isValid: false,
            error: `Forbidden: Merchant account cannot access merchant '${targetMerchantId}'.`
          };
        }
      }

      return {
        isValid: true,
        isLegacyKey: true,
        userId: userObj.id,
        userRole: userObj.role,
        merchantId: userObj.merchantId,
        scopes: ['*'] // Legacy keys receive full permissions
      };
    }
  } catch (_err) {}

  return { isValid: false, error: 'Invalid API Bearer Key.' };
}
