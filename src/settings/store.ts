import type { Platform } from "../platforms/detect.js";
import {
  isValidAccuracy,
  isValidLatitude,
  isValidLongitude,
  type LocationSettings,
} from "./validate.js";

/** Persistent key used by proxy tools ($persistentStore / $prefs). */
export const SETTINGS_KEY = "qpin_network_location";

declare const $persistentStore: {
  read: (key: string) => string | null;
  write: (value: string | null, key: string) => boolean;
} | undefined;

declare const $prefs: {
  valueForKey: (key: string) => string | null | undefined;
  setValueForKey: (value: string, key: string) => boolean;
  removeValueForKey: (key: string) => boolean;
} | undefined;

/** In-memory fallback for Node tests and unknown runtimes. */
const memoryStore = new Map<string, string>();

export interface SettingsStore {
  get(): LocationSettings | null;
  set(value: LocationSettings): boolean;
  clear(): boolean;
}

function parseStored(raw: string | null | undefined): LocationSettings | null {
  if (raw == null || raw === "" || raw === "null") return null;
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== "object") return null;
    const o = obj as Record<string, unknown>;
    if (o.longitude == null || o.latitude == null) return null;
    const longitude = Number(o.longitude);
    const latitude = Number(o.latitude);
    const accuracy = o.accuracy != null ? Number(o.accuracy) : 25;
    if (!isValidLongitude(longitude) || !isValidLatitude(latitude) || !isValidAccuracy(accuracy)) {
      return null;
    }
    return {
      longitude,
      latitude,
      accuracy,
      updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function createSettingsStore(platform: Platform): SettingsStore {
  return {
    get() {
      try {
        let raw: string | null | undefined;
        switch (platform) {
          case "Surge":
          case "Loon":
          case "Stash":
          case "Egern":
          case "Shadowrocket":
            raw = typeof $persistentStore !== "undefined" ? $persistentStore.read(SETTINGS_KEY) : null;
            break;
          case "Quantumult X":
            raw = typeof $prefs !== "undefined" ? $prefs.valueForKey(SETTINGS_KEY) : null;
            break;
          case "Node.js":
          default:
            raw = memoryStore.get(SETTINGS_KEY) ?? null;
            break;
        }
        // Some runtimes auto-JSON-parse
        if (raw && typeof raw === "object") {
          return parseStored(JSON.stringify(raw));
        }
        return parseStored(raw as string | null);
      } catch {
        return null;
      }
    },

    set(value: LocationSettings) {
      const payload = JSON.stringify(value);
      try {
        switch (platform) {
          case "Surge":
          case "Loon":
          case "Stash":
          case "Egern":
          case "Shadowrocket":
            if (typeof $persistentStore === "undefined") return false;
            return Boolean($persistentStore.write(payload, SETTINGS_KEY));
          case "Quantumult X":
            if (typeof $prefs === "undefined") return false;
            return Boolean($prefs.setValueForKey(payload, SETTINGS_KEY));
          case "Node.js":
          default:
            memoryStore.set(SETTINGS_KEY, payload);
            return true;
        }
      } catch {
        return false;
      }
    },

    clear() {
      try {
        switch (platform) {
          case "Quantumult X":
            if (typeof $prefs === "undefined") return false;
            return Boolean($prefs.removeValueForKey(SETTINGS_KEY));
          case "Surge":
          case "Loon":
          case "Stash":
          case "Egern":
          case "Shadowrocket":
            if (typeof $persistentStore !== "undefined") {
              let wrote = false;
              try {
                wrote = Boolean($persistentStore.write(null, SETTINGS_KEY));
              } catch {
                wrote = false;
              }
              if (!wrote) wrote = Boolean($persistentStore.write("", SETTINGS_KEY));
              if (!wrote) return false;
              return parseStored($persistentStore.read(SETTINGS_KEY)) === null;
            }
            return false;
          case "Node.js":
          default:
            memoryStore.delete(SETTINGS_KEY);
            return true;
        }
      } catch {
        return false;
      }
    },
  };
}

/** Test helper: reset in-memory store */
export function __resetMemoryStore(): void {
  memoryStore.clear();
}
