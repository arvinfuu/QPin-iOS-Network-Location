export type Platform =
  | "Quantumult X"
  | "Loon"
  | "Shadowrocket"
  | "Egern"
  | "Surge"
  | "Stash"
  | "Worker"
  | "Node.js"
  | "Unknown";

function hasGlobal(name: string): boolean {
  try {
    return name in globalThis;
  } catch {
    return false;
  }
}

/**
 * Detect the current proxy / runtime environment.
 */
export function detectPlatform(): Platform {
  if (hasGlobal("$task")) return "Quantumult X";
  if (hasGlobal("$loon")) return "Loon";
  if (hasGlobal("$rocket")) return "Shadowrocket";
  if (hasGlobal("Egern")) return "Egern";

  const env = (globalThis as { $environment?: Record<string, unknown> }).$environment;
  if (env && env["surge-version"]) return "Surge";
  if (env && env["stash-version"]) return "Stash";

  if (hasGlobal("Cloudflare")) return "Worker";
  if (typeof process !== "undefined" && process.versions?.node) return "Node.js";
  return "Unknown";
}
