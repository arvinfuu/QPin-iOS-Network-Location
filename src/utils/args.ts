/**
 * Parse Surge / Loon style $argument query strings.
 */
export function parseArgument(raw: unknown): Record<string, string> {
  if (raw == null) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (v != null) out[k] = String(v);
    }
    return out;
  }
  if (typeof raw !== "string") return {};

  const q = raw.replace(/^\?/, "").trim();
  if (!q) return {};

  const out: Record<string, string> = {};
  for (const part of q.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const keyRaw = eq === -1 ? part : part.slice(0, eq);
    const valRaw = eq === -1 ? "" : part.slice(eq + 1);
    let key: string;
    let val: string;
    try {
      key = decodeURIComponent(keyRaw.replace(/\+/g, " "));
    } catch {
      key = keyRaw;
    }
    try {
      val = decodeURIComponent(valRaw.replace(/\+/g, " "));
    } catch {
      val = valRaw;
    }
    if (!(key in out)) out[key] = val;
  }
  return out;
}

export function parseQueryFromUrl(url: string): Map<string, string> {
  const map = new Map<string, string>();
  const q = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
  for (const part of q.split("&")) {
    if (!part) continue;
    const eq = part.indexOf("=");
    const keyRaw = eq === -1 ? part : part.slice(0, eq);
    const valRaw = eq === -1 ? "" : part.slice(eq + 1);
    let key: string;
    let val: string;
    try {
      key = decodeURIComponent(keyRaw.replace(/\+/g, " "));
    } catch {
      key = keyRaw;
    }
    try {
      val = decodeURIComponent(valRaw.replace(/\+/g, " "));
    } catch {
      val = valRaw;
    }
    if (!map.has(key)) map.set(key, val);
  }
  return map;
}
