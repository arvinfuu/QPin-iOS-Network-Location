/**
 * QPin Network Location — WLOC response script
 *
 * Intercepts HTTP responses from:
 *   gs-loc.apple.com/clls/wloc
 *   gs-loc-cn.apple.com/clls/wloc
 *
 * Upstream concept: https://github.com/Yu9191/wloc (Yu9191)
 * Original idea: https://github.com/FFF686868/proxypin-wloc-spoofer
 */

import { processWlocResponse } from "../core/wloc-patcher.js";
import { detectPlatform } from "../platforms/detect.js";
import { finish, finishPassthrough, type ProxyResponse } from "../platforms/done.js";
import { createSettingsStore } from "../settings/store.js";
import { resolveLogLevel, resolveTarget } from "../settings/resolve.js";
import { createLogger, redactCoords } from "../utils/logger.js";

declare const $request: { url?: string } | undefined;
declare const $response: ProxyResponse | undefined;
declare const $argument: unknown;

const platform = detectPlatform();
const logLevel = resolveLogLevel(typeof $argument !== "undefined" ? $argument : undefined);
const logger = createLogger(logLevel);

function getResponse(): ProxyResponse | undefined {
  try {
    return typeof $response !== "undefined" ? $response : undefined;
  } catch {
    return undefined;
  }
}

function run(): void {
  const response = getResponse();
  if (!response) {
    logger.warn("not in response mode, skip");
    finishPassthrough(platform);
    return;
  }

  const store = createSettingsStore(platform);
  const target = resolveTarget({
    argument: typeof $argument !== "undefined" ? $argument : undefined,
    store,
    logger,
  });

  const result = processWlocResponse(
    {
      body: response.body,
      bodyBytes: response.bodyBytes,
      rawBody: response.rawBody,
    },
    {
      target,
      onInfo: (m) => logger.info(m),
      onWarn: (m) => logger.warn(m),
      onError: (m) => logger.error(m),
      onDebug: (m) => logger.debug(m),
    }
  );

  if (result.passthrough || !result.modified) {
    finishPassthrough(platform);
    return;
  }

  const headers = { ...(response.headers || {}) } as Record<string, string>;
  // Drop encoding that no longer matches body; set Content-Length
  for (const key of Object.keys(headers)) {
    const lower = key.toLowerCase();
    if (
      lower === "content-encoding" ||
      lower === "transfer-encoding" ||
      lower === "content-length"
    ) {
      delete headers[key];
    }
  }
  headers["Content-Length"] = String(result.body.length);

  if (target) {
    logger.debug(
      `target=${redactCoords(target.longitude, target.latitude)} acc=${target.accuracy}`
    );
  }

  const out: ProxyResponse = {
    status: 200,
    statusCode: 200,
    headers,
    body: result.body,
    bodyBytes: result.body,
    rawBody: result.body,
  };

  if (platform === "Quantumult X") {
    finish(platform, out);
  } else {
    finish(platform, { response: out });
  }
}

try {
  run();
} catch (e) {
  logger.error(e instanceof Error ? e.message : String(e));
  finishPassthrough(platform);
}
