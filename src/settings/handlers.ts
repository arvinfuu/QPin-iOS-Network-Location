import { parseQueryFromUrl } from "../utils/args.js";
import type { SettingsStore } from "./store.js";
import { hasActiveCoordinates, validateSettingsInput } from "./validate.js";

export type SettingsAction = "save" | "query" | "clear";

export const SETTINGS_SERVICE = "qpin-ios-network-location";
export const SETTINGS_PROTOCOL_VERSION = 1;
export const SETTINGS_HEADERS = {
  protocol: "X-QPin-NL-Protocol",
  longitude: "X-QPin-NL-Longitude",
  latitude: "X-QPin-NL-Latitude",
  accuracy: "X-QPin-NL-Accuracy",
} as const;

export interface SettingsRequest {
  url: string;
  method?: string;
  headers?: Record<string, string | undefined>;
}

export interface SettingsResponse {
  service: typeof SETTINGS_SERVICE;
  protocolVersion: typeof SETTINGS_PROTOCOL_VERSION;
  success: boolean;
  longitude?: number;
  latitude?: number;
  accuracy?: number;
  updatedAt?: string | null;
  error?: string;
  mode?: "active" | "passthrough";
}

function response(body: Omit<SettingsResponse, "service" | "protocolVersion">): SettingsResponse {
  return {
    service: SETTINGS_SERVICE,
    protocolVersion: SETTINGS_PROTOCOL_VERSION,
    ...body,
  };
}

export function getRequestHeader(
  headers: SettingsRequest["headers"],
  name: string
): string | undefined {
  if (!headers) return undefined;
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === wanted) return value;
  }
  return undefined;
}

export function getRequestOrigin(request: SettingsRequest): string | undefined {
  return getRequestHeader(request.headers, "Origin")?.replace(/\/$/, "");
}

export function isAllowedOrigin(origin: string | undefined, allowedOrigins: readonly string[]): boolean {
  if (!origin) return false;
  return allowedOrigins.some((item) => item.replace(/\/$/, "") === origin);
}

export function handleSettingsRequest(
  request: SettingsRequest,
  store: SettingsStore,
  allowedOrigins: readonly string[]
): SettingsResponse {
  const method = (request.method || "GET").toUpperCase();
  const origin = getRequestOrigin(request);
  if (!isAllowedOrigin(origin, allowedOrigins)) {
    return response({ success: false, error: "origin not allowed" });
  }
  if (getRequestHeader(request.headers, SETTINGS_HEADERS.protocol) !== String(SETTINGS_PROTOCOL_VERSION)) {
    return response({ success: false, error: "invalid settings protocol" });
  }

  const params = parseQueryFromUrl(request.url);
  const rawAction = (params.get("action") || "").toLowerCase();
  if (!(["save", "query", "clear"] as const).includes(rawAction as SettingsAction)) {
    return response({ success: false, error: "unsupported action" });
  }
  const action = rawAction as SettingsAction;

  if (action === "query") {
    if (method !== "GET") return response({ success: false, error: "query requires GET" });
    const current = store.get();
    if (current && hasActiveCoordinates(current)) {
      return response({
        success: true,
        longitude: current.longitude,
        latitude: current.latitude,
        accuracy: current.accuracy,
        updatedAt: current.updatedAt || null,
        mode: "active",
      });
    }
    return response({ success: false, error: "no saved coordinates", mode: "passthrough" });
  }

  if (method !== "POST") {
    return response({ success: false, error: `${action} requires POST` });
  }

  if (action === "clear") {
    const ok = store.clear();
    if (!ok) return response({ success: false, error: "failed to clear storage" });
    return response({ success: true, mode: "passthrough" });
  }

  const lonRaw = getRequestHeader(request.headers, SETTINGS_HEADERS.longitude);
  const latRaw = getRequestHeader(request.headers, SETTINGS_HEADERS.latitude);
  const accRaw = getRequestHeader(request.headers, SETTINGS_HEADERS.accuracy);
  if (lonRaw == null || latRaw == null) {
    return response({ success: false, error: "missing coordinate headers" });
  }

  const validated = validateSettingsInput({
    longitude: lonRaw,
    latitude: latRaw,
    accuracy: accRaw,
  });
  if (!validated.ok || !validated.value) {
    return response({ success: false, error: validated.error || "invalid coordinates" });
  }

  const ok = store.set(validated.value);
  if (!ok) return response({ success: false, error: "storage write failed" });

  return response({
    success: true,
    longitude: validated.value.longitude,
    latitude: validated.value.latitude,
    accuracy: validated.value.accuracy,
    updatedAt: validated.value.updatedAt,
    mode: "active",
  });
}

function corsHeaders(origin?: string): Record<string, string> {
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": Object.values(SETTINGS_HEADERS).join(", "),
    "Access-Control-Max-Age": "0",
    "Cache-Control": "no-store",
    Vary: "Origin, Access-Control-Request-Headers",
  };
}

export function settingsPreflightResponse(
  request: SettingsRequest,
  allowedOrigins: readonly string[]
): { status: number; headers: Record<string, string>; body: string } {
  const origin = getRequestOrigin(request);
  const requested = (getRequestHeader(request.headers, "Access-Control-Request-Headers") || "")
    .toLowerCase()
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedHeaders = new Set(Object.values(SETTINGS_HEADERS).map((value) => value.toLowerCase()));
  const valid =
    isAllowedOrigin(origin, allowedOrigins) &&
    requested.includes(SETTINGS_HEADERS.protocol.toLowerCase()) &&
    requested.every((value) => allowedHeaders.has(value));
  return {
    status: valid ? 204 : 403,
    headers: corsHeaders(valid ? origin : undefined),
    body: "",
  };
}

export function settingsJsonResponse(
  body: SettingsResponse,
  origin?: string
): { status: number; headers: Record<string, string>; body: string } {
  return {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
    },
    body: JSON.stringify(body),
  };
}
