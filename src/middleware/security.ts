import { Context, Next } from 'hono';

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
    // Determine client identifier: API key, IP address, or custom generator
    const clientKey = keyGenerator 
      ? keyGenerator(c)
      : (c.req.header('x-forwarded-for')?.split(',')[0].trim() || c.req.header('x-real-ip') || 'client-ip');

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
