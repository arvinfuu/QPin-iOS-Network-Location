import { parseArgument } from "../utils/args.js";
import type { Logger } from "../utils/logger.js";
import type { TargetLocation } from "../core/wloc-patcher.js";
import type { SettingsStore } from "./store.js";
import { hasActiveCoordinates, isValidAccuracy, isValidLatitude, isValidLongitude } from "./validate.js";

export interface ResolveOptions {
  /** Raw $argument from module */
  argument?: unknown;
  store: SettingsStore;
  logger?: Logger;
}

/**
 * Resolve effective target coordinates.
 * Priority: persistent store > module argument > null (passthrough).
 *
 * Unlike upstream WLOC, we do NOT treat magic default module args as
 * "active" coordinates. Empty/invalid args mean passthrough.
 */
export function resolveTarget(options: ResolveOptions): TargetLocation | null {
  const args = parseArgument(options.argument);
  const stored = options.store.get();

  if (stored && hasActiveCoordinates(stored)) {
    const lon = stored.longitude;
    const lat = stored.latitude;
    let acc = stored.accuracy;
    if (!isValidAccuracy(acc)) acc = 25;
    if (isValidLongitude(lon) && isValidLatitude(lat)) {
      options.logger?.info("using saved coordinates from persistent store");
      options.logger?.debug(`lon=${lon} lat=${lat} acc=${acc}`);
      return { longitude: lon, latitude: lat, accuracy: acc };
    }
  }

  const argLon = args.longitude != null && args.longitude !== "" ? parseFloat(args.longitude) : NaN;
  const argLat = args.latitude != null && args.latitude !== "" ? parseFloat(args.latitude) : NaN;
  let argAcc =
    args.accuracy != null && args.accuracy !== "" ? parseInt(args.accuracy, 10) : 25;

  // Explicit empty-string or missing → passthrough
  if (!Number.isFinite(argLon) || !Number.isFinite(argLat)) {
    options.logger?.info("passthrough: no valid coordinates in store or module args");
    return null;
  }
  if (!isValidLongitude(argLon) || !isValidLatitude(argLat)) {
    options.logger?.warn("invalid module argument coordinates, passthrough");
    return null;
  }
  if (!isValidAccuracy(argAcc)) argAcc = 25;

  options.logger?.info("using module argument coordinates");
  options.logger?.debug(`lon=${argLon} lat=${argLat} acc=${argAcc}`);
  return { longitude: argLon, latitude: argLat, accuracy: argAcc };
}

export function resolveLogLevel(argument?: unknown): string {
  const args = parseArgument(argument);
  return args.logLevel || args.LogLevel || "info";
}
