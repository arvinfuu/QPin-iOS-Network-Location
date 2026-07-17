/**
 * Local settings endpoint intercepted by the proxy app.
 * Coordinates are accepted only after a successful CORS preflight from an approved picker origin.
 */

import { detectPlatform } from "../platforms/detect.js";
import { finish } from "../platforms/done.js";
import { createSettingsStore } from "../settings/store.js";
import {
  getRequestOrigin,
  handleSettingsRequest,
  isAllowedOrigin,
  SETTINGS_PROTOCOL_VERSION,
  SETTINGS_SERVICE,
  settingsJsonResponse,
  settingsPreflightResponse,
  type SettingsRequest,
} from "../settings/handlers.js";
import { createLogger } from "../utils/logger.js";

declare const __QPIN_NL_ALLOWED_ORIGINS__: string[];
declare const $request:
  | { url?: string; method?: string; headers?: Record<string, string | undefined> }
  | undefined;

const platform = detectPlatform();
const logger = createLogger("warn");
const allowedOrigins =
  typeof __QPIN_NL_ALLOWED_ORIGINS__ !== "undefined" ? __QPIN_NL_ALLOWED_ORIGINS__ : [];

function finishResponse(res: { status: number; headers: Record<string, string>; body: string }): void {
  if (platform === "Quantumult X") finish(platform, res);
  else finish(platform, { response: res });
}

function run(): void {
  const request: SettingsRequest = {
    url: (typeof $request !== "undefined" && $request?.url) || "",
    method: (typeof $request !== "undefined" && $request?.method) || "GET",
    headers: (typeof $request !== "undefined" && $request?.headers) || {},
  };

  if ((request.method || "GET").toUpperCase() === "OPTIONS") {
    finishResponse(settingsPreflightResponse(request, allowedOrigins));
    return;
  }

  const result = handleSettingsRequest(request, createSettingsStore(platform), allowedOrigins);
  if (!result.success) logger.warn(result.error || "settings error");
  const origin = getRequestOrigin(request);
  finishResponse(settingsJsonResponse(result, isAllowedOrigin(origin, allowedOrigins) ? origin : undefined));
}

try {
  run();
} catch (error) {
  finishResponse(
    settingsJsonResponse({
      service: SETTINGS_SERVICE,
      protocolVersion: SETTINGS_PROTOCOL_VERSION,
      success: false,
      error: error instanceof Error ? error.message : "settings error",
    })
  );
}
