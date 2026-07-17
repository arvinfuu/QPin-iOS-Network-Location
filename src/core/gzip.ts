import { gunzipSync } from "fflate";

/** True if bytes look like a gzip stream (magic 1f 8b). */
export function isGzip(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

/**
 * Decompress gzip if needed; otherwise return original bytes.
 * Throws on corrupt gzip so callers can fail-open.
 */
export function maybeGunzip(bytes: Uint8Array): Uint8Array {
  if (!isGzip(bytes)) return bytes;
  return gunzipSync(bytes);
}
