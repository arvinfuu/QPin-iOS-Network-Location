/**
 * QPin iOS Network Location — Cloudflare Worker
 *
 * Routes:
 *   GET /                         → web picker (static HTML)
 *   GET /tools/ios-network-location → same picker
 *   GET /api/parse?u=...          → map link → coordinates
 *   GET /api/health               → health check
 *
 * Privacy:
 *   - Does not log user coordinates or full map URLs
 *   - Does not store parse results
 *   - SSRF-protected outbound fetches
 */

import { Hono, type Context } from "hono";
import { corsHeaders, jsonResponse, textResponse } from "./cors.js";
import {
  normalizeMapCoordinates,
  round6,
  type CoordinateSystem,
} from "../../src/core/coordinates.js";
import { parseCoords } from "./parse.js";
import { checkRateLimit } from "./rate-limit.js";
import { getPageHtml } from "./page.js";

const app = new Hono();

app.options("*", (c) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(c.req.header("Origin")),
  });
});

app.get("/api/health", (c) => {
  return jsonResponse(
    {
      ok: true,
      service: "qpin-ios-network-location",
      version: "1.0.0",
    },
    200,
    c.req.header("Origin")
  );
});

app.get("/api/parse", async (c) => {
  const origin = c.req.header("Origin");
  const ip =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const rl = checkRateLimit(`parse:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) {
    return jsonResponse({ error: "rate limit exceeded" }, 429, origin);
  }

  const raw = c.req.query("u") || "";
  if (!raw || raw.length > 4000) {
    return jsonResponse({ error: "missing or too long parameter u" }, 400, origin);
  }

  const cs = (c.req.query("cs") || "").toLowerCase();
  const fmt = (c.req.query("format") || "json").toLowerCase();

  try {
    const parsed = await parseCoords(raw);
    const system: CoordinateSystem =
      cs === "none" || cs === "gcj" || cs === "bd09" ? cs : "auto";
    let { lat, lon, name, src, crs } = normalizeMapCoordinates(parsed, system);
    lat = round6(lat);
    lon = round6(lon);
    name = name || "";

    // Intentionally do not log lat/lon/url
    if (fmt === "text") {
      return textResponse(`lat=${lat}&lon=${lon}`, 200, origin);
    }
    return jsonResponse({ lat, lon, name, src, crs }, 200, origin);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "parse failed";
    return jsonResponse({ error: msg }, 422, origin);
  }
});

function page(c: Context): Response {
  const lang = c.req.header("Accept-Language") || "en";
  const requestUrl = new URL(c.req.url);
  const canonicalPath = requestUrl.pathname.startsWith("/tools/")
    ? "/tools/ios-network-location/"
    : "/";
  return new Response(getPageHtml(lang, "", {
    canonicalUrl: `${requestUrl.origin}${canonicalPath}`,
    parseApi: `${requestUrl.origin}/api/parse`,
    buildCommit: "worker",
  }), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      ...corsHeaders(),
    },
  });
}

app.get("/", page);
app.get("/tools/ios-network-location", page);
app.get("/tools/ios-network-location/", page);

app.notFound((c) => jsonResponse({ error: "not found" }, 404, c.req.header("Origin")));

app.onError((_err, c) => {
  // Do not include request URL/body in logs
  return jsonResponse({ error: "internal error" }, 500, c.req.header("Origin"));
});

export default app;
