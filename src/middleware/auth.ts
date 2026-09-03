import { getSignedCookie } from 'hono/cookie';
import { db } from '../../db/db.ts';
import { users, merchants, regionalAdminMerchants } from '../../db/schema.ts';
import { eq, inArray } from 'drizzle-orm';

// Secret key for cookie signing
export const COOKIE_SECRET = Deno.env.get("COOKIE_SECRET") || "qbiz_cookie_signing_secret_key_2026";

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'REGIONAL_ADMIN' | 'MERCHANT' | 'MERCHANT_EMPLOYEE';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  merchantId: string | null;
}

export interface MerchantContext {
  id: string;
  name: string;
  phoneNumber: string;
  logoUrl?: string | null;
  status: 'ACTIVE' | 'NEEDS_OTP' | 'DISCONNECTED';
  qrisImageUrl: string;
  qrisPayload?: string | null;
}

/**
 * Resolve all merchant stores accessible by the given user based on their RBAC role
 */
export async function resolveAccessibleMerchants(user: UserSession): Promise<MerchantContext[]> {
  try {
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      const list = await db.select().from(merchants);
      return list.map(m => ({
        id: m.id,
        name: m.name,
        phoneNumber: m.phoneNumber,
        logoUrl: m.logoUrl,
        status: m.status as any,
        qrisImageUrl: m.qrisImageUrl,
        qrisPayload: m.qrisPayload
      }));
    }

    if (user.role === 'REGIONAL_ADMIN') {
      const mappings = await db.select().from(regionalAdminMerchants).where(eq(regionalAdminMerchants.userId, user.id));
      const mIds = mappings.map(m => m.merchantId);
      if (mIds.length === 0) return [];
      const list = await db.select().from(merchants).where(inArray(merchants.id, mIds));
      return list.map(m => ({
        id: m.id,
        name: m.name,
        phoneNumber: m.phoneNumber,
        logoUrl: m.logoUrl,
        status: m.status as any,
        qrisImageUrl: m.qrisImageUrl,
        qrisPayload: m.qrisPayload
      }));
    }

    if (user.merchantId) {
      const list = await db.select().from(merchants).where(eq(merchants.id, user.merchantId));
      if (list.length > 0) {
        const m = list[0];
        return [{
          id: m.id,
          name: m.name,
          phoneNumber: m.phoneNumber,
          logoUrl: m.logoUrl,
          status: m.status as any,
          qrisImageUrl: m.qrisImageUrl,
          qrisPayload: m.qrisPayload
        }];
      }
    }
  } catch (err: any) {
    console.error('[AuthMiddleware] resolveAccessibleMerchants query error:', err.message);
  }
  return [];
}

/**
 * Cryptographically secure PBKDF2 Password Hashing with dynamic salt (100,000 iterations)
 */
export async function hashPassword(password: string, customSalt?: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const salt = customSalt || crypto.getRandomValues(new Uint8Array(16));
  const iterations = 100000;

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    256 // 32 bytes
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `pbkdf2$${iterations}$${saltHex}$${hashHex}`;
}

/**
 * Constant-time string comparison to defend against timing side-channel attacks
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify plaintext password against stored hash (supporting both modern PBKDF2 and legacy SHA-256)
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;

  // Modern PBKDF2 format: pbkdf2$<iterations>$<saltHex>$<hashHex>
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const saltHex = parts[2];
    const expectedHashHex = parts[3];

    const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBytes as any,
        iterations: iterations,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );

    const computedHashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return timingSafeEqualString(computedHashHex, expectedHashHex);
  }

  // Legacy single-round SHA-256 fallback
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "qbiz_password_salt_2026");
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  const legacyHash = Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqualString(legacyHash, storedHash);
}

/**
 * Authentication Middleware: Extract and verify signed cookie session
 */
export async function authMiddleware(c: any, next: any) {
  const url = new URL(c.req.url);
  
  // Skip auth for login, static assets, public pay page, API public endpoints, and LLM indexing files
  if (
    url.pathname === '/login' || 
    url.pathname === '/docs' ||
    url.pathname === '/robots.txt' ||
    url.pathname === '/llms.txt' ||
    url.pathname === '/llms-full.txt' ||
    url.pathname.startsWith('/static/') || 
    url.pathname.startsWith('/pay/') || // Public secure pay page
    url.pathname.startsWith('/api/v1/invoices') || // API invoices are auth'd via Bearer key or public status check
    url.pathname.startsWith('/api/v1/developer/test-webhook') // Test webhook handles own auth
  ) {
    return await next();
  }

  try {
    const sessionUserId = await getSignedCookie(c, COOKIE_SECRET, 'session');
    
    if (sessionUserId) {
      // Query user in DB
      const userList = await db.select().from(users).where(eq(users.id, sessionUserId));
      
      if (userList.length > 0) {
        const user = userList[0];
        const sessionUser: UserSession = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          merchantId: user.merchantId
        };
        
        c.set('user', sessionUser);

        // Resolve accessible merchants and active merchant workspace context
        const accessibleMerchants = await resolveAccessibleMerchants(sessionUser);
        c.set('accessibleMerchants', accessibleMerchants);

        let activeMerchant: MerchantContext | null = null;
        const requestedActiveId = await getSignedCookie(c, COOKIE_SECRET, 'active_merchant_id');

        if (requestedActiveId) {
          activeMerchant = accessibleMerchants.find(m => m.id === requestedActiveId) || null;
        }

        if (!activeMerchant && accessibleMerchants.length > 0) {
          activeMerchant = accessibleMerchants[0];
        }

        c.set('activeMerchant', activeMerchant);
        return await next();
      }
    }
  } catch (err) {
    console.error('[AuthMiddleware] Verification error:', err);
  }

  // Redirect to login if unauthenticated
  if (url.pathname.startsWith('/api/')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return c.redirect('/login');
}

/**
 * RBAC Rule Middleware: Restrict access based on allowed user roles
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (c: any, next: any) => {
    const user = c.get('user') as UserSession | undefined;
    
    if (!user || !allowedRoles.includes(user.role)) {
      const url = new URL(c.req.url);
      if (url.pathname.startsWith('/api/')) {
        return c.json({ error: 'Forbidden' }, 403);
      }
      // Access denied redirection: Super Admins go to /merchants, Merchants to /transactions
      if (user) {
        if (user.role === 'MERCHANT' || user.role === 'MERCHANT_EMPLOYEE') {
          return c.redirect('/transactions');
        }
      }
      return c.redirect('/login?error=forbidden');
    }
    
    await next();
  };
}
