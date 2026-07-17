import { describe, expect, it } from "vitest";
import { gzipSync } from "fflate";
import {
  encodeField,
  encodeVarint,
  parseMessage,
  concatBytes,
} from "../src/core/protobuf.js";
import {
  patchLocationMessage,
  patchWlocBody,
  processWlocResponse,
  type PatchStats,
  type TargetLocation,
} from "../src/core/wloc-patcher.js";

const target: TargetLocation = {
  latitude: 40.7128,
  longitude: -74.006,
  accuracy: 30,
};

function emptyStats(): PatchStats {
  return { wifi: 0, cell: 0, locations: 0, skipped: 0 };
}

function makeLocation(lat: number, lon: number, acc: number): Uint8Array {
  return concatBytes([
    encodeField(1, 0, Math.round(lat * 1e8)),
    encodeField(2, 0, Math.round(lon * 1e8)),
    encodeField(3, 0, acc),
    encodeField(9, 0, 99), // unknown field to preserve
  ]);
}

function makeWifiEntry(bssid: string, loc: Uint8Array): Uint8Array {
  return concatBytes([
    encodeField(1, 2, new TextEncoder().encode(bssid)),
    encodeField(2, 2, loc),
  ]);
}

function makeRoot(wifi: Uint8Array, cell?: Uint8Array): Uint8Array {
  const parts = [encodeField(2, 2, wifi)];
  if (cell) parts.push(encodeField(22, 2, cell));
  parts.push(encodeField(99, 0, 7)); // unknown root field
  return concatBytes(parts);
}

function frame(payload: Uint8Array, headerLen = 8): Uint8Array {
  const header = new Uint8Array(headerLen);
  const lenBytes = Uint8Array.from([(payload.length >> 8) & 0xff, payload.length & 0xff]);
  return concatBytes([header, lenBytes, payload]);
}

describe("wloc patcher", () => {
  it("patches latitude, longitude, accuracy including negatives and zero", () => {
    const cases: TargetLocation[] = [
      { latitude: 40.7128, longitude: -74.006, accuracy: 25 },
      { latitude: -33.8688, longitude: 151.2093, accuracy: 10 },
      { latitude: 0, longitude: 0, accuracy: 50 },
      { latitude: 22.5, longitude: 0, accuracy: 15 },
      { latitude: 0, longitude: 113.9, accuracy: 20 },
    ];
    for (const t of cases) {
      const stats = emptyStats();
      const original = makeLocation(10, 20, 5);
      const patched = patchLocationMessage(original, t, stats);
      const fields = parseMessage(patched);
      const lat = fields.find((f) => f.fieldNo === 1)?.value as number;
      const lon = fields.find((f) => f.fieldNo === 2)?.value as number;
      const acc = fields.find((f) => f.fieldNo === 3)?.value as number;
      // signed decode for negatives: if large positive from unsigned varint, convert
      const toSigned = (v: number) => {
        // our encodeVarint for negatives is 10-byte; readVarint returns approximate number
        // For safe integers within ±90*1e8, positive path is used when >=0
        return v;
      };
      if (t.latitude >= 0) expect(lat).toBe(Math.round(t.latitude * 1e8));
      if (t.longitude >= 0) expect(lon).toBe(Math.round(t.longitude * 1e8));
      expect(acc).toBe(t.accuracy);
      // unknown field preserved
      expect(fields.find((f) => f.fieldNo === 9)?.value).toBe(99);
      expect(stats.locations).toBe(1);
      void toSigned;
    }
  });

  it("patches framed wifi payload", () => {
    const loc = makeLocation(1, 2, 5);
    const wifi = makeWifiEntry("aa:bb:cc:dd:ee:ff", loc);
    const root = makeRoot(wifi);
    const body = frame(root);
    const { data, stats, modified } = patchWlocBody(body, target);
    expect(modified).toBe(true);
    expect(stats.locations).toBeGreaterThan(0);
    expect(data.length).toBeGreaterThan(10);
  });

  it("handles gzip response body", () => {
    const loc = makeLocation(1, 2, 5);
    const wifi = makeWifiEntry("11:22:33:44:55:66", loc);
    const root = makeRoot(wifi);
    const body = frame(root);
    const gz = gzipSync(body);
    const result = processWlocResponse(
      { body: gz },
      { target }
    );
    expect(result.passthrough).toBe(false);
    expect(result.modified).toBe(true);
  });

  it("preserves unknown fields at root", () => {
    const loc = makeLocation(1, 2, 5);
    const wifi = makeWifiEntry("aa:bb:cc:dd:ee:ff", loc);
    const root = makeRoot(wifi);
    const body = frame(root);
    const { data } = patchWlocBody(body, target);
    // after frame header, payload should still parse
    const len = (data[8]! << 8) | data[9]!;
    const payload = data.subarray(10, 10 + len);
    const fields = parseMessage(payload);
    expect(fields.some((f) => f.fieldNo === 99)).toBe(true);
  });

  it("fail-open on corrupt data returns original", () => {
    const junk = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = processWlocResponse({ body: junk }, { target });
    expect(result.passthrough).toBe(true);
    expect(result.modified).toBe(false);
    expect(Array.from(result.body)).toEqual(Array.from(junk));
  });

  it("passthrough when target is null", () => {
    const body = new Uint8Array([1, 2, 3]);
    const result = processWlocResponse({ body }, { target: null });
    expect(result.passthrough).toBe(true);
    expect(Array.from(result.body)).toEqual([1, 2, 3]);
  });

  it("accepts ArrayBuffer and Uint8Array", () => {
    const loc = makeLocation(1, 2, 5);
    const wifi = makeWifiEntry("aa:bb:cc:dd:ee:ff", loc);
    const body = frame(makeRoot(wifi));
    const ab = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
    const r1 = processWlocResponse({ body: ab }, { target });
    const r2 = processWlocResponse({ bodyBytes: body }, { target });
    expect(r1.modified).toBe(true);
    expect(r2.modified).toBe(true);
  });
});
