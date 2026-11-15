import { Context, Next } from 'hono';

const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;

/**
 * Validates whether a string is a syntactically valid IPv4 or IPv6 address.
 */
export function isValidIp(ip: string | null | undefined): ip is string {
  if (!ip) return false;
  const trimmed = ip.trim();
  if (trimmed.length === 0 || trimmed.length > 45) return false;
  if (IPV4_REGEX.test(trimmed)) return true;
  return trimmed.includes(':') && IPV6_REGEX.test(trimmed);
}

/**
 * Returns true if the direct socket peer IP is a local/private reverse-proxy address
 * (loopback, RFC1918, or Docker bridge).
 */
export function isPrivateOrLoopbackIp(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const normalized = ip.trim().toLowerCase().replace(/^::ffff:/, '');
  if (normalized === '::1' || normalized === 'localhost') return true;
  if (normalized.startsWith('127.')) return true;
  if (normalized.startsWith('10.')) return true;
  if (normalized.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:')) return true;
  return false;
}

/**
 * Resolves the real end-user IP address safely behind Cloudflare + Reverse Proxy.
 *
 * Trust rules:
 * - Forwarded headers are trusted when `TRUSTED_PROXY=true`, `CLOUDFLARE_PROXY=true`,
 *   OR when the direct TCP peer (`c.env?.remoteAddr`) is a local/private reverse proxy.
 * - Priority: `CF-Connecting-IP` -> `True-Client-IP` -> leftmost public `X-Forwarded-For`
 *   -> `X-Real-IP` -> `X-Forwarded-For[0]` -> direct socket `remoteAddr`.
 */
export function getClientIp(c: Context): string {
  const socketIp: string | undefined =
    (c.env as any)?.remoteAddr?.hostname ||
    (c.req.raw as any)?.conn?.remoteAddr?.hostname;

  const explicitTrust =
    Deno.env.get('TRUSTED_PROXY') === 'true' ||
    Deno.env.get('CLOUDFLARE_PROXY') === 'true';

  const isBehindTrustedProxy = explicitTrust || isPrivateOrLoopbackIp(socketIp);

  if (isBehindTrustedProxy) {
    const cfIp = c.req.header('cf-connecting-ip')?.trim();
    if (isValidIp(cfIp)) return cfIp;

    const trueClientIp = c.req.header('true-client-ip')?.trim();
    if (isValidIp(trueClientIp)) return trueClientIp;

    const xffRaw = c.req.header('x-forwarded-for');
    if (xffRaw) {
      const hops = xffRaw.split(',').map((h) => h.trim()).filter(isValidIp);
      const firstPublic = hops.find((h) => !isPrivateOrLoopbackIp(h));
      if (firstPublic) return firstPublic;
      if (hops.length > 0) return hops[0];
    }

    const xRealIp = c.req.header('x-real-ip')?.trim();
    if (isValidIp(xRealIp)) return xRealIp;
  }

  if (isValidIp(socketIp)) return socketIp;
  return 'client-ip';
}

/**
 * Attaches resolved real client IP to Hono context (`c.get('clientIp')`).
 */
export async function clientIpMiddleware(c: Context, next: Next) {
  c.set('clientIp', getClientIp(c));
  await next();
}

/**
 * 1. HTTP Security Headers Middleware (Helmet-like)
 */
export async function securityHeadersMiddleware(c: Context, next: Next) {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'SAMEORIGIN');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const isHttps = c.req.url.startsWith('https://') || c.req.header('x-forwarded-proto') === 'https';
  if (isHttps) {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

/**
 * 2. In-Memory Sliding-Window Rate Limiter
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (c: Context) => string;
}) {
  const { windowMs, max, message = 'Too many requests, please try again later.', keyGenerator } = options;

  return async (c: Context, next: Next) => {
    const clientKey = keyGenerator ? keyGenerator(c) : getClientIp(c);
    const routePrefix = c.req.path;
    const identifier = `${routePrefix}:${clientKey}`;
    const now = Date.now();

    const record = rateLimitMap.get(identifier);
    if (!record || now > record.resetTime) {
      rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    } else {
      record.count++;
      if (record.count > max) {
        const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
        c.header('Retry-After', retryAfter.toString());
        c.header('X-RateLimit-Limit', max.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

        if (c.req.path.startsWith('/api/')) {
          return c.json({ error: message, retry_after_seconds: retryAfter }, 429);
        }
        return c.text(message, 429);
      }
    }

    await next();
  };
}

/**
 * 3. Payload Body Size Limiter
 */
export function bodySizeLimiter(maxSizeBytes = 1024 * 1024) { // 1MB default
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      return c.json({ error: 'Payload too large. Maximum allowed size is 1MB.' }, 413);
    }
    await next();
  };
}
