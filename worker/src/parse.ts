import {
  assertSafeUrl,
  FETCH_TIMEOUT_MS,
  MAX_REDIRECTS,
  resolveRedirect,
  SsrfError,
} from "./ssrf.js";

export type CoordSource = "apple" | "amap" | "google" | "baidu" | "text" | "unknown";

export interface ParsedCoords {
  lat: number;
  lon: number;
  name: string;
  src: CoordSource;
}

function validated(value: ParsedCoords): ParsedCoords | null {
  if (
    !Number.isFinite(value.lat) ||
    !Number.isFinite(value.lon) ||
    value.lat < -90 ||
    value.lat > 90 ||
    value.lon < -180 ||
    value.lon > 180
  ) {
    return null;
  }
  return value;
}

export function safeDecode(s: string): string {
  if (!s) return "";
  try {
    return decodeURIComponent(String(s).replace(/\+/g, " "));
  } catch {
    return String(s);
  }
}

/**
 * Extract lat/lon/name from map URLs or free text.
 * Does not fetch network resources.
 */
export function extractFromString(s: string): ParsedCoords | null {
  if (!s) return null;
  const str = String(s);
  let m: RegExpMatchArray | null;

  // Apple Maps: coordinate= / ll= / sll=
  m = str.match(/(?:coordinate|ll|sll)=(-?\d{1,3}\.\d+)(?:,|%2C)(-?\d{1,3}\.\d+)/i);
  if (m) {
    const nm = str.match(/[?&]name=([^&]+)/i);
    return validated({
      lat: +m[1]!,
      lon: +m[2]!,
      name: nm ? safeDecode(nm[1]!) : "",
      src: "apple",
    });
  }

  // Google: @lat,lon or q=lat,lon
  m = str.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m && /google|goo\.gl/i.test(str)) {
    return validated({ lat: +m[1]!, lon: +m[2]!, name: "", src: "google" });
  }
  m = str.match(/[?&](?:q|query)=(-?\d{1,3}\.\d+)(?:,|%2C)(-?\d{1,3}\.\d+)/i);
  if (m && /google|goo\.gl/i.test(str)) {
    return validated({ lat: +m[1]!, lon: +m[2]!, name: "", src: "google" });
  }

  // Amap: ?p=POIID,lat,lon,name,city
  m = str.match(
    /[?&]p=[^,&%]*(?:,|%2C)(-?\d{1,3}\.\d+)(?:,|%2C)(-?\d{1,3}\.\d+)(?:(?:,|%2C)((?:(?!,|%2C|&).)+))?/i
  );
  if (m) {
    return validated({
      lat: +m[1]!,
      lon: +m[2]!,
      name: m[3] ? safeDecode(m[3]) : "",
      src: "amap",
    });
  }

  // Amap: ?q=lat,lon,name
  m = str.match(
    /[?&]q=(-?\d{1,3}\.\d+)(?:,|%2C)(-?\d{1,3}\.\d+)(?:(?:,|%2C)((?:(?!,|%2C|&).)+))?/i
  );
  if (m && /amap|gaode/i.test(str)) {
    return validated({
      lat: +m[1]!,
      lon: +m[2]!,
      name: m[3] ? safeDecode(m[3]) : "",
      src: "amap",
    });
  }

  // Baidu: location=lat,lon or &lat= &lng=
  m = str.match(/location=(-?\d{1,3}\.\d+)(?:,|%2C)(-?\d{1,3}\.\d+)/i);
  if (m && /baidu/i.test(str)) {
    return validated({ lat: +m[1]!, lon: +m[2]!, name: "", src: "baidu" });
  }
  m = str.match(/[?&]lat=(-?\d{1,3}\.\d+).*?[?&]l(?:ng|on)=(-?\d{1,3}\.\d+)/i);
  if (m && /baidu/i.test(str)) {
    return validated({ lat: +m[1]!, lon: +m[2]!, name: "", src: "baidu" });
  }

  // Plain text: lat,lon with enough decimals
  m = str.match(/(-?\d{1,3}\.\d{4,})\s*(?:,|%2C)\s*(-?\d{1,3}\.\d{4,})/);
  if (m) {
    return validated({ lat: +m[1]!, lon: +m[2]!, name: "", src: "text" });
  }

  return null;
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parse coordinates from map share text / URL.
 * Follows short-link redirects only for allowlisted hosts (SSRF-safe).
 *
 * Privacy: does not log the input URL or resulting coordinates.
 */
export async function parseCoords(raw: string): Promise<ParsedCoords> {
  const text = String(raw || "").trim();
  if (!text) throw new Error("empty input");

  const urlMatch = text.match(/https?:\/\/[^\s'"<>]+/i);
  let target = urlMatch ? urlMatch[0]! : text;

  let hit = extractFromString(target);
  if (hit) return hit;

  if (!urlMatch) {
    throw new Error("could not parse coordinates from input");
  }

  // Validate first hop
  try {
    target = assertSafeUrl(target).toString();
  } catch (e) {
    if (e instanceof SsrfError) throw new Error(`blocked URL: ${e.message}`);
    throw e;
  }

  let cur = target;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    let resp: Response;
    try {
      resp = await fetchWithTimeout(cur, {
        redirect: "manual",
        headers: {
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
        },
      });
    } catch {
      break;
    }

    const loc = resp.headers.get("location");
    if (loc) {
      hit = extractFromString(loc);
      if (hit) return hit;
      try {
        cur = resolveRedirect(cur, loc);
      } catch (e) {
        if (e instanceof SsrfError) throw new Error(`blocked redirect: ${e.message}`);
        throw e;
      }
      hit = extractFromString(cur);
      if (hit) return hit;
      continue;
    }

    hit = extractFromString(resp.url);
    if (hit) return hit;

    try {
      const body = await resp.text();
      // Limit body scan size
      hit = extractFromString(body.slice(0, 200_000));
      if (hit) return hit;
    } catch {
      // ignore body read errors
    }
    break;
  }

  throw new Error("could not parse coordinates from link");
}
