export interface LocationSettings {
  longitude: number;
  latitude: number;
  accuracy: number;
  updatedAt: string;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
  value?: LocationSettings;
}

export const LIMITS = {
  longitude: { min: -180, max: 180 },
  latitude: { min: -90, max: 90 },
  accuracy: { min: 1, max: 10000 },
} as const;

export const DEFAULT_ACCURACY = 25;

function strictNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;
  const text = value.trim();
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) return Number.NaN;
  return Number(text);
}

export function isValidLongitude(n: number): boolean {
  return Number.isFinite(n) && n >= LIMITS.longitude.min && n <= LIMITS.longitude.max;
}

export function isValidLatitude(n: number): boolean {
  return Number.isFinite(n) && n >= LIMITS.latitude.min && n <= LIMITS.latitude.max;
}

export function isValidAccuracy(n: number): boolean {
  return Number.isFinite(n) && n >= LIMITS.accuracy.min && n <= LIMITS.accuracy.max;
}

/**
 * Validate and normalize save payload.
 * Explicitly allows 0 for lon/lat (equator / prime meridian).
 */
export function validateSettingsInput(input: {
  longitude?: unknown;
  latitude?: unknown;
  accuracy?: unknown;
}): ValidationResult {
  const lon = strictNumber(input.longitude);
  const lat = strictNumber(input.latitude);
  let acc =
    input.accuracy == null || input.accuracy === ""
      ? DEFAULT_ACCURACY
      : strictNumber(input.accuracy);

  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return { ok: false, error: "longitude and latitude are required numbers" };
  }
  if (!isValidLongitude(lon)) {
    return { ok: false, error: `longitude must be between ${LIMITS.longitude.min} and ${LIMITS.longitude.max}` };
  }
  if (!isValidLatitude(lat)) {
    return { ok: false, error: `latitude must be between ${LIMITS.latitude.min} and ${LIMITS.latitude.max}` };
  }
  if (!Number.isFinite(acc)) {
    return { ok: false, error: "accuracy must be a number" };
  }
  if (!isValidAccuracy(acc)) {
    return { ok: false, error: `accuracy must be between ${LIMITS.accuracy.min} and ${LIMITS.accuracy.max}` };
  }

  return {
    ok: true,
    value: {
      longitude: lon,
      latitude: lat,
      accuracy: Math.round(acc),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function hasActiveCoordinates(
  s: { longitude?: number | null; latitude?: number | null } | null | undefined
): boolean {
  if (!s) return false;
  return (
    s.longitude != null &&
    s.latitude != null &&
    Number.isFinite(s.longitude) &&
    Number.isFinite(s.latitude)
  );
}
