const VALID_HOST_REGEX = /^[a-zA-Z0-9.-]+(?::\d{1,5})?$/;

/**
 * Resolves the public Base URL.
 * Prioritizes BASE_URL from .env (if non-localhost).
 * Dynamically falls back to validated incoming request proxy headers (X-Forwarded-Host, Host).
 */
export function resolveBaseUrl(c?: any): string {
  const envBase = Deno.env.get("BASE_URL");
  if (envBase && !envBase.includes("localhost")) {
    return envBase.replace(/\/+$/, '');
  }
  if (c) {
    try {
      const rawProto = (c.req.header('x-forwarded-proto') || '').split(',')[0].trim().toLowerCase();
      const proto = rawProto === 'https' || rawProto === 'http'
        ? rawProto
        : (c.req.url.startsWith('https://') ? 'https' : 'http');

      const rawHost = (c.req.header('x-forwarded-host') || c.req.header('host') || '').split(',')[0].trim();
      if (rawHost && !rawHost.includes("localhost") && VALID_HOST_REGEX.test(rawHost)) {
        return `${proto}://${rawHost}`.replace(/\/+$/, '');
      }
    } catch (_) {}
  }
  return (envBase || "http://localhost:8000").replace(/\/+$/, '');
}
