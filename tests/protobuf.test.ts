import { describe, expect, it } from "vitest";
import {
  encodeField,
  encodeVarint,
  parseMessage,
  readVarint,
  bytesEqual,
} from "../src/core/protobuf.js";

describe("protobuf wire format", () => {
  it("encodes and decodes positive varints", () => {
    for (const n of [0, 1, 127, 128, 255, 300, 16384, 1_000_000]) {
      const enc = encodeVarint(n);
      const [val, next] = readVarint(enc, 0);
      expect(val).toBe(n);
      expect(next).toBe(enc.length);
    }
  });

  it("encodes negative varints as 10-byte two's complement form", () => {
    const enc = encodeVarint(-1);
    expect(enc.length).toBe(10);
    const [val] = readVarint(enc, 0);
    // Full uint64 interpretation of -1 is 2^64-1; our JS number loses precision
    // but Apple uses floor(coord*1e8) which fits safe integer range for earth coords.
    expect(enc[0]! & 0x80).toBeTruthy();
  });

  it("round-trips a simple message with unknown fields preserved", () => {
    const f1 = encodeField(1, 0, 123);
    const f2 = encodeField(2, 2, new TextEncoder().encode("hello"));
    const f9 = encodeField(9, 0, 42);
    const msg = new Uint8Array([...f1, ...f2, ...f9]);
    const fields = parseMessage(msg);
    expect(fields).toHaveLength(3);
    expect(fields[0]!.fieldNo).toBe(1);
    expect(fields[0]!.value).toBe(123);
    expect(fields[1]!.fieldNo).toBe(2);
    expect(fields[2]!.fieldNo).toBe(9);
    // Rebuild unknown field raw equals original
    expect(bytesEqual(fields[2]!.raw, f9)).toBe(true);
  });

  it("supports zero coordinate-like values", () => {
    const enc = encodeVarint(0);
    const [val] = readVarint(enc, 0);
    expect(val).toBe(0);
  });

  it("throws on truncated input", () => {
    expect(() => readVarint(new Uint8Array([0x80]), 0)).toThrow(/truncated/);
  });
});
