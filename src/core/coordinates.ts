/** Coordinate conversions used by both the browser picker and Worker API. */

const GCJ_A = 6378245.0;
const GCJ_EE = 0.00669342162296594323;
const X_PI = (Math.PI * 3000.0) / 180.0;

export type CoordinateSystem = "auto" | "none" | "gcj" | "bd09";
export type CoordinateSource = "apple" | "amap" | "google" | "baidu" | "text" | "unknown";

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface SourcedCoordinates extends Coordinates {
  name: string;
  src: CoordinateSource;
}

export interface NormalizedCoordinates extends SourcedCoordinates {
  crs: "wgs84" | "as-is";
}

export function outOfChina(lon: number, lat: number): boolean {
  return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function deltaLat(x: number, y: number): number {
  let result =
    -100.0 +
    2.0 * x +
    3.0 * y +
    0.2 * y * y +
    0.1 * x * y +
    0.2 * Math.sqrt(Math.abs(x));
  result +=
    ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) /
    3.0;
  result +=
    ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) /
    3.0;
  result +=
    ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) *
      2.0) /
    3.0;
  return result;
}

function deltaLon(x: number, y: number): number {
  let result =
    300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  result +=
    ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) /
    3.0;
  result +=
    ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) /
    3.0;
  result +=
    ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) *
      2.0) /
    3.0;
  return result;
}

export function wgs84ToGcj02(lat: number, lon: number): Coordinates {
  if (outOfChina(lon, lat)) return { lat, lon };
  let dLat = deltaLat(lon - 105.0, lat - 35.0);
  let dLon = deltaLon(lon - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - GCJ_EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic)) * Math.PI);
  dLon = (dLon * 180.0) / ((GCJ_A / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return { lat: lat + dLat, lon: lon + dLon };
}

/** Iterative inverse: GCJ-02 to WGS84. */
export function gcj02ToWgs84(lat: number, lon: number): Coordinates {
  if (outOfChina(lon, lat)) return { lat, lon };
  let wgsLat = lat;
  let wgsLon = lon;
  for (let i = 0; i < 6; i++) {
    const converted = wgs84ToGcj02(wgsLat, wgsLon);
    const errLat = converted.lat - lat;
    const errLon = converted.lon - lon;
    if (Math.abs(errLat) < 1e-9 && Math.abs(errLon) < 1e-9) break;
    wgsLat -= errLat;
    wgsLon -= errLon;
  }
  return { lat: wgsLat, lon: wgsLon };
}

/** Baidu BD-09 to GCJ-02. */
export function bd09ToGcj02(lat: number, lon: number): Coordinates {
  const x = lon - 0.0065;
  const y = lat - 0.006;
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
  return { lat: z * Math.sin(theta), lon: z * Math.cos(theta) };
}

export function bd09ToWgs84(lat: number, lon: number): Coordinates {
  const gcj = bd09ToGcj02(lat, lon);
  return gcj02ToWgs84(gcj.lat, gcj.lon);
}

export function normalizeMapCoordinates(
  value: SourcedCoordinates,
  system: CoordinateSystem = "auto"
): NormalizedCoordinates {
  let converted: Coordinates = { lat: value.lat, lon: value.lon };
  let crs: NormalizedCoordinates["crs"] = "as-is";

  if (system === "bd09" || (system === "auto" && value.src === "baidu")) {
    converted = bd09ToWgs84(value.lat, value.lon);
    crs = "wgs84";
  } else if (
    system === "gcj" ||
    (system === "auto" && (value.src === "amap" || value.src === "apple"))
  ) {
    converted = gcj02ToWgs84(value.lat, value.lon);
    crs = "wgs84";
  }

  return { ...value, ...converted, crs };
}

export function round6(value: number): number {
  return Math.round(Number(value) * 1e6) / 1e6;
}
