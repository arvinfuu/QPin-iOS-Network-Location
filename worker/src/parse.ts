import {
  assertSafeUrl,
  FETCH_TIMEOUT_MS,
  MAX_REDIRECTS,
  resolveRedirect,
  SsrfError,
} from "./ssrf.js";
import { extractFromString } from "../../src/core/map-links.js";
import type { SourcedCoordinates as ParsedCoords } from "../../src/core/coordinates.js";

export { extractFromString } from "../../src/core/map-links.js";
export type { CoordinateSource as CoordSource } from "../../src/core/coordinates.js";

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
