import { getSignedCookie } from 'hono/cookie';
import { db } from '../../db/db.ts';
import { users } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';

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

/**
 * Hash password helper using native SHA-256 Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "qbiz_password_salt_2026");
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Authentication Middleware: Extract and verify signed cookie session
 */
export async function authMiddleware(c: any, next: any) {
  const url = new URL(c.req.url);
  
  // Skip auth for login, static assets, and test endpoints
  if (
    url.pathname === '/login' || 
    url.pathname.startsWith('/static/') || 
    url.pathname.startsWith('/api/v1/invoices') || // API invoices are auth'd via Bearer key
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
