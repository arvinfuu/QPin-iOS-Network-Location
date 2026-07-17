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

import { Hono } from "hono";
import { corsHeaders, jsonResponse, textResponse } from "./cors.js";
import { gcj02ToWgs84, round6 } from "./coords.js";
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
    let { lat, lon, name, src } = await parseCoords(raw);
    const needConv =
      cs === "gcj" || (cs !== "none" && (src === "amap" || src === "apple" || src === "baidu"));
    if (needConv) {
      ({ lat, lon } = gcj02ToWgs84(lat, lon));
    }
    lat = round6(lat);
    lon = round6(lon);
    name = name || "";

    // Intentionally do not log lat/lon/url
    if (fmt === "text") {
      return textResponse(`lat=${lat}&lon=${lon}`, 200, origin);
    }
    return jsonResponse({ lat, lon, name, src, crs: needConv ? "wgs84" : "as-is" }, 200, origin);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "parse failed";
    return jsonResponse({ error: msg }, 422, origin);
  }
});

function page(c: { req: { header: (n: string) => string | undefined } }): Response {
  const lang = c.req.header("Accept-Language") || "en";
  return new Response(getPageHtml(lang), {
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
