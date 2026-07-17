/**
 * SSRF protections for map-link fetch / redirect following.
 */

const ALLOWED_HOST_SUFFIXES = [
  "maps.apple.com",
  "maps.apple.cn",
  "goo.gl",
  "maps.google.com",
  "maps.app.goo.gl",
  "www.google.com",
  "google.com",
  "amap.com",
  "www.amap.com",
  "uri.amap.com",
  "surl.amap.com",
  "ditu.amap.com",
  "wb.amap.com",
  "map.baidu.com",
  "j.map.baidu.com",
  "map.qq.com",
  "apis.map.qq.com",
];

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
  "instance-data",
]);

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

function isPrivateIpv4(hostname: string): boolean {
  const m = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const c = Number(m[3]);
  const d = Number(m[4]);
  if ([a, b, c, d].some((n) => n > 255)) return true; // treat invalid as blocked
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isIpv6Literal(hostname: string): boolean {
  return hostname.includes(":") || hostname.startsWith("[");
}

function normalizeHost(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase().replace(/\.$/, "");
}

export function isAllowedMapHost(hostname: string): boolean {
  const host = normalizeHost(hostname);
  if (!host) return false;
  if (BLOCKED_HOSTS.has(host)) return false;
  if (host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) {
    return false;
  }
  if (isPrivateIpv4(host)) return false;
  if (isIpv6Literal(host)) {
    // Block loopback and unique-local IPv6
    const h = host.replace(/^\[|\]$/g, "");
    if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) {
      return false;
    }
    // Only allow if somehow listed (unlikely) — default deny IPv6 literals
    return false;
  }

  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}

export function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SsrfError("invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SsrfError("only http/https allowed");
  }
  if (url.username || url.password) {
    throw new SsrfError("URL credentials not allowed");
  }
  if (!isAllowedMapHost(url.hostname)) {
    throw new SsrfError("host not in allowlist");
  }
  return url;
}

export function resolveRedirect(current: string, location: string): string {
  let next: URL;
  try {
    next = new URL(location, current);
  } catch {
    throw new SsrfError("invalid redirect location");
  }
  return assertSafeUrl(next.toString()).toString();
}

export const MAX_REDIRECTS = 5;
export const FETCH_TIMEOUT_MS = 8000;
