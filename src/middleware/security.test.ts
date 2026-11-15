import { assertEquals } from "@std/assert";
import { Hono } from "hono";
import { clientIpMiddleware, getClientIp, isPrivateOrLoopbackIp, isValidIp } from "./security.ts";
import { resolveBaseUrl } from "../utils/url.ts";

Deno.test("Security IP - isValidIp and isPrivateOrLoopbackIp validate IPv4/IPv6 accurately", () => {
  assertEquals(isValidIp("203.0.113.45"), true);
  assertEquals(isValidIp("2400:cb00:2048:1::c629:d7a2"), true);
  assertEquals(isValidIp("not-an-ip; DROP TABLE"), false);
  assertEquals(isValidIp(""), false);

  assertEquals(isPrivateOrLoopbackIp("127.0.0.1"), true);
  assertEquals(isPrivateOrLoopbackIp("::1"), true);
  assertEquals(isPrivateOrLoopbackIp("172.18.0.5"), true);
  assertEquals(isPrivateOrLoopbackIp("192.168.1.10"), true);
  assertEquals(isPrivateOrLoopbackIp("203.0.113.45"), false);
});

Deno.test("Security IP - prioritizes CF-Connecting-IP behind local reverse proxy + Cloudflare", async () => {
  const prevTrusted = Deno.env.get("TRUSTED_PROXY");
  const prevCf = Deno.env.get("CLOUDFLARE_PROXY");
  Deno.env.delete("TRUSTED_PROXY");
  Deno.env.delete("CLOUDFLARE_PROXY");

  try {
    const testApp = new Hono<{ Variables: { clientIp: string } }>();
    testApp.use("*", clientIpMiddleware);
    testApp.get("/ip", (c) => c.json({ ip: c.get("clientIp"), direct: getClientIp(c) }));

    // Direct TCP peer is Docker/Nginx reverse proxy (172.18.0.2), CF-Connecting-IP has true client IP
    const res = await testApp.request("/ip", {
      headers: {
        "CF-Connecting-IP": "114.122.10.25",
        "X-Real-IP": "172.70.188.10", // Cloudflare edge IP set by Nginx
        "X-Forwarded-For": "172.70.188.10, 172.18.0.2",
      },
    }, { remoteAddr: { hostname: "172.18.0.2" } });

    const body = await res.json();
    assertEquals(body.ip, "114.122.10.25");
    assertEquals(body.direct, "114.122.10.25");
  } finally {
    if (prevTrusted !== undefined) Deno.env.set("TRUSTED_PROXY", prevTrusted);
    if (prevCf !== undefined) Deno.env.set("CLOUDFLARE_PROXY", prevCf);
  }
});

Deno.test("Security IP - ignores spoofed CF-Connecting-IP when direct peer is a public IP and TRUSTED_PROXY is unset", async () => {
  const prevTrusted = Deno.env.get("TRUSTED_PROXY");
  const prevCf = Deno.env.get("CLOUDFLARE_PROXY");
  Deno.env.delete("TRUSTED_PROXY");
  Deno.env.delete("CLOUDFLARE_PROXY");

  try {
    const testApp = new Hono();
    testApp.get("/ip", (c) => c.json({ ip: getClientIp(c) }));

    const res = await testApp.request("/ip", {
      headers: {
        "CF-Connecting-IP": "1.2.3.4",
        "X-Forwarded-For": "5.6.7.8",
      },
    }, { remoteAddr: { hostname: "198.51.100.99" } });

    const body = await res.json();
    assertEquals(body.ip, "198.51.100.99");
  } finally {
    if (prevTrusted !== undefined) Deno.env.set("TRUSTED_PROXY", prevTrusted);
    if (prevCf !== undefined) Deno.env.set("CLOUDFLARE_PROXY", prevCf);
  }
});

Deno.test("Security URL - resolveBaseUrl rejects injected X-Forwarded-Host and invalid proto", async () => {
  const prevBase = Deno.env.get("BASE_URL");
  Deno.env.delete("BASE_URL");

  try {
    const testApp = new Hono();
    testApp.get("/url", (c) => c.json({ base: resolveBaseUrl(c) }));

    const malicious = await testApp.request("/url", {
      headers: {
        "X-Forwarded-Proto": "javascript",
        "X-Forwarded-Host": "evil.com/phish@qbiz.com",
      },
    });
    assertEquals((await malicious.json()).base, "http://localhost:8000");

    const valid = await testApp.request("/url", {
      headers: {
        "X-Forwarded-Proto": "https",
        "X-Forwarded-Host": "pay.ppti.me",
      },
    });
    assertEquals((await valid.json()).base, "https://pay.ppti.me");
  } finally {
    if (prevBase !== undefined) Deno.env.set("BASE_URL", prevBase);
  }
});
