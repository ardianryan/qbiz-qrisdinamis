/**
 * Resolves the public Base URL.
 * Prioritizes BASE_URL from .env (if non-localhost).
 * Dynamically falls back to incoming request proxy headers (X-Forwarded-Host, Host).
 */
export function resolveBaseUrl(c?: any): string {
  const envBase = Deno.env.get("BASE_URL");
  if (envBase && !envBase.includes("localhost")) {
    return envBase.replace(/\/+$/, '');
  }
  if (c) {
    try {
      const proto = c.req.header('x-forwarded-proto') || (c.req.url.startsWith('https://') ? 'https' : 'http');
      const host = c.req.header('x-forwarded-host') || c.req.header('host');
      if (host && !host.includes("localhost")) {
        return `${proto}://${host}`.replace(/\/+$/, '');
      }
    } catch (_) {}
  }
  return envBase ? envBase.replace(/\/+$/, '') : "http://localhost:8000";
}
