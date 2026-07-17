/**
 * Apple WLOC (/clls/wloc) response patcher.
 *
 * Based on the technical approach of Yu9191/wloc (upstream) and
 * FFF686868/proxypin-wloc-spoofer (original idea).
 *
 * Coordinate scale: degrees * 1e8 as signed varints.
 * Field layout (observed):
 *   Location: field 1 = lat, field 2 = lon, field 3 = accuracy
 *   WiFi entry: nested message with BSSID (field 1) + location (field 2)
 *   Cell entry: nested message with location at field 5
 *   Root: field 2 = wifi list, fields 22/24 = cell lists
 */

import {
  bytesEqual,
  bytesToLatin1,
  concatBytes,
  encodeField,
  parseMessage,
  type ProtoField,
} from "./protobuf.js";
import { maybeGunzip } from "./gzip.js";
import { toUint8Array } from "./body.js";

export interface TargetLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface PatchStats {
  wifi: number;
  cell: number;
  locations: number;
  skipped: number;
}

export interface PatchResult {
  data: Uint8Array;
  stats: PatchStats;
  modified: boolean;
}

const BSSID_RE = /^[0-9a-fA-F]{1,2}(:[0-9a-fA-F]{1,2}){5}$/;
const COORD_SCALE = 1e8;

function emptyStats(): PatchStats {
  return { wifi: 0, cell: 0, locations: 0, skipped: 0 };
}

function copyStats(s: PatchStats): PatchStats {
  return { wifi: s.wifi, cell: s.cell, locations: s.locations, skipped: s.skipped };
}

function restoreStats(target: PatchStats, from: PatchStats): void {
  target.wifi = from.wifi;
  target.cell = from.cell;
  target.locations = from.locations;
  target.skipped = from.skipped;
}

function rebuild(fields: Array<Uint8Array>): Uint8Array {
  return concatBytes(fields);
}

/**
 * Patch a Location message (fields 1/2/3 as varints).
 * Returns original bytes if lat/lon fields are missing.
 */
export function patchLocationMessage(
  bytes: Uint8Array,
  target: TargetLocation,
  stats: PatchStats
): Uint8Array {
  const fields = parseMessage(bytes);
  let hasLat = false;
  let hasLon = false;
  for (const f of fields) {
    if (f.fieldNo === 1 && f.wireType === 0) hasLat = true;
    if (f.fieldNo === 2 && f.wireType === 0) hasLon = true;
  }
  if (!hasLat || !hasLon) return bytes;

  const out: Uint8Array[] = [];
  for (const f of fields) {
    if (f.fieldNo === 1 && f.wireType === 0) {
      out.push(encodeField(1, 0, Math.round(target.latitude * COORD_SCALE)));
    } else if (f.fieldNo === 2 && f.wireType === 0) {
      out.push(encodeField(2, 0, Math.round(target.longitude * COORD_SCALE)));
    } else if (f.fieldNo === 3 && f.wireType === 0) {
      out.push(encodeField(3, 0, Math.round(target.accuracy)));
    } else {
      out.push(f.raw);
    }
  }
  stats.locations += 1;
  return rebuild(out);
}

function isWifiEntry(fields: ProtoField[]): boolean {
  for (const f of fields) {
    if (f.fieldNo === 1 && f.wireType === 2 && f.value instanceof Uint8Array) {
      const s = bytesToLatin1(f.value);
      if (BSSID_RE.test(s)) return true;
    }
  }
  return false;
}

export function patchWifiEntry(
  bytes: Uint8Array,
  target: TargetLocation,
  stats: PatchStats
): Uint8Array {
  const fields = parseMessage(bytes);
  if (!isWifiEntry(fields)) return bytes;

  let changed = false;
  const out: Uint8Array[] = [];
  for (const f of fields) {
    if (f.fieldNo === 2 && f.wireType === 2 && f.value instanceof Uint8Array) {
      try {
        const patched = patchLocationMessage(f.value, target, stats);
        if (!bytesEqual(patched, f.value)) changed = true;
        out.push(encodeField(f.fieldNo, f.wireType, patched));
      } catch {
        stats.skipped += 1;
        out.push(f.raw);
      }
    } else {
      out.push(f.raw);
    }
  }
  if (changed) stats.wifi += 1;
  return rebuild(out);
}

export function patchCellEntry(
  bytes: Uint8Array,
  target: TargetLocation,
  stats: PatchStats
): Uint8Array {
  const fields = parseMessage(bytes);
  let changed = false;
  const out: Uint8Array[] = [];
  for (const f of fields) {
    if (f.fieldNo === 5 && f.wireType === 2 && f.value instanceof Uint8Array) {
      try {
        const patched = patchLocationMessage(f.value, target, stats);
        if (!bytesEqual(patched, f.value)) changed = true;
        out.push(encodeField(f.fieldNo, f.wireType, patched));
      } catch {
        stats.skipped += 1;
        out.push(f.raw);
      }
    } else {
      out.push(f.raw);
    }
  }
  if (changed) stats.cell += 1;
  return rebuild(out);
}

export function patchRootMessage(
  bytes: Uint8Array,
  target: TargetLocation,
  stats: PatchStats
): Uint8Array {
  const fields = parseMessage(bytes);
  const out: Uint8Array[] = [];
  for (const f of fields) {
    if (f.wireType === 2 && f.fieldNo === 2 && f.value instanceof Uint8Array) {
      out.push(encodeField(f.fieldNo, f.wireType, patchWifiEntry(f.value, target, stats)));
    } else if (
      f.wireType === 2 &&
      (f.fieldNo === 22 || f.fieldNo === 24) &&
      f.value instanceof Uint8Array
    ) {
      out.push(encodeField(f.fieldNo, f.wireType, patchCellEntry(f.value, target, stats)));
    } else {
      out.push(f.raw);
    }
  }
  return rebuild(out);
}

function deltaPatches(before: PatchStats, after: PatchStats): number {
  return (
    after.locations -
    before.locations +
    (after.wifi - before.wifi) +
    (after.cell - before.cell)
  );
}

/**
 * Try framed WLOC body: optional header + 2-byte big-endian length + protobuf payload.
 */
function tryPatchFrame(
  body: Uint8Array,
  headerOffset: number,
  target: TargetLocation,
  stats: PatchStats
): Uint8Array {
  if (body.length < headerOffset + 10) {
    throw new Error(`body too short: ${body.length}, base=${headerOffset}`);
  }
  const len =
    ((body[headerOffset + 8]! & 0xff) << 8) | (body[headerOffset + 9]! & 0xff);
  if (len <= 0) {
    throw new Error(`invalid empty frame length at ${headerOffset}`);
  }
  if (headerOffset + 10 + len > body.length) {
    throw new Error(`invalid frame length ${len} at ${headerOffset} for ${body.length}`);
  }

  const prefix = body.subarray(0, headerOffset + 8);
  const payload = body.subarray(headerOffset + 10, headerOffset + 10 + len);
  const suffix = body.subarray(headerOffset + 10 + len);

  const snap = copyStats(stats);
  const patched = patchRootMessage(payload, target, stats);
  const d = deltaPatches(snap, stats);

  if (patched.length > 65535) {
    restoreStats(stats, snap);
    throw new Error(`patched payload too large: ${patched.length}`);
  }
  if (d <= 0 || bytesEqual(payload, patched)) {
    restoreStats(stats, snap);
    throw new Error(`frame parsed but no patchable wloc payload at ${headerOffset}`);
  }

  const lenBytes = Uint8Array.from([(patched.length >> 8) & 0xff, patched.length & 0xff]);
  return concatBytes([prefix, lenBytes, patched, suffix]);
}

function tryRawScan(body: Uint8Array, target: TargetLocation, stats: PatchStats): Uint8Array {
  const errors: string[] = [];
  const max = Math.min(256, body.length);
  for (let i = 0; i <= max; i++) {
    const snap = copyStats(stats);
    try {
      const slice = body.subarray(i);
      const patched = patchRootMessage(slice, target, stats);
      if (deltaPatches(snap, stats) > 0 && !bytesEqual(slice, patched)) {
        return concatBytes([body.subarray(0, i), patched]);
      }
      restoreStats(stats, snap);
    } catch (e) {
      restoreStats(stats, snap);
      if (errors.length < 6) {
        errors.push(`raw@${i}:${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
  throw new Error(`raw protobuf scan failed; ${errors.join(" | ")}`);
}

/**
 * Patch a full WLOC response body (already gunzipped if needed).
 */
export function patchWlocBody(body: Uint8Array, target: TargetLocation): PatchResult {
  const stats = emptyStats();
  if (body.length < 10) {
    throw new Error(`body too short: ${body.length}`);
  }

  const errors: string[] = [];
  const preferred = [0, 2, 4, 6, 8, 10, 12, 14, 16];
  const offsets = new Set(preferred);
  const max = Math.min(96, Math.max(0, body.length - 10));
  for (let i = 0; i <= max; i++) offsets.add(i);

  for (const offset of offsets) {
    const snap = copyStats(stats);
    try {
      const data = tryPatchFrame(body, offset, target, stats);
      return { data, stats, modified: true };
    } catch (e) {
      restoreStats(stats, snap);
      if (errors.length < 6) {
        errors.push(`@${offset}:${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  try {
    const data = tryRawScan(body, target, stats);
    return { data, stats, modified: true };
  } catch (e) {
    errors.push(`raw:${e instanceof Error ? e.message : String(e)}`);
  }

  throw new Error(`no patchable wloc payload found; ${errors.join(" | ")}`);
}

export interface ProcessResponseInput {
  body?: unknown;
  bodyBytes?: unknown;
  rawBody?: unknown;
}

export interface ProcessResponseOptions {
  target: TargetLocation | null;
  /** When true, include coordinate details in debug callbacks */
  onInfo?: (msg: string) => void;
  onWarn?: (msg: string) => void;
  onError?: (msg: string) => void;
  onDebug?: (msg: string) => void;
}

export interface ProcessResponseResult {
  body: Uint8Array;
  modified: boolean;
  stats: PatchStats;
  /** Fail-open: true when original body is returned due to error or pass-through */
  passthrough: boolean;
}

/**
 * End-to-end response processor: normalize body, gunzip, patch, fail-open.
 */
export function processWlocResponse(
  input: ProcessResponseInput,
  options: ProcessResponseOptions
): ProcessResponseResult {
  const raw = toUint8Array(input.bodyBytes ?? input.rawBody ?? input.body);
  if (!raw.length) {
    options.onWarn?.("empty binary body, skip");
    return { body: raw, modified: false, stats: emptyStats(), passthrough: true };
  }

  if (!options.target) {
    options.onInfo?.("passthrough mode: no target coordinates");
    return { body: raw, modified: false, stats: emptyStats(), passthrough: true };
  }

  try {
    options.onDebug?.(`input length=${raw.length}`);
    const inflated = maybeGunzip(raw);
    options.onDebug?.(
      inflated !== raw ? `gunzipped to ${inflated.length} bytes` : "not gzip"
    );
    const { data, stats, modified } = patchWlocBody(inflated, options.target);
    options.onInfo?.(
      `patched locations=${stats.locations} wifi=${stats.wifi} cell=${stats.cell} skipped=${stats.skipped}`
    );
    return { body: data, modified, stats, passthrough: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    options.onError?.(`patch failed, fail-open: ${msg}`);
    return { body: raw, modified: false, stats: emptyStats(), passthrough: true };
  }
}
