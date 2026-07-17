/**
 * Safe Protobuf wire-format codec.
 * Preserves unknown fields; only mutates target varint fields when patching.
 */

export type WireType = 0 | 1 | 2 | 5;

export interface ProtoField {
  fieldNo: number;
  wireType: WireType;
  value: number | Uint8Array;
  /** Original bytes for this field including tag — used for pass-through */
  raw: Uint8Array;
}

export function readVarint(bytes: Uint8Array, offset: number): [value: number, next: number] {
  let result = 0;
  let shift = 1;
  let bit = 0;
  let i = offset;
  while (i < bytes.length) {
    const b = bytes[i++]!;
    if (bit < 56) {
      result += (b & 0x7f) * shift;
    }
    if ((b & 0x80) === 0) {
      return [result, i];
    }
    shift *= 128;
    bit += 7;
    if (bit >= 70) {
      throw new Error(`varint too long at ${offset}`);
    }
  }
  throw new Error(`truncated varint at ${offset}`);
}

/**
 * Encode a (possibly negative) integer as a protobuf-style varint.
 * Negative values are encoded as signed two's-complement 64-bit (10 bytes).
 */
export function encodeVarint(value: number): Uint8Array {
  let n = Math.floor(value);
  if (n >= 0) {
    const out: number[] = [];
    while (n >= 128) {
      out.push((n % 128) | 0x80);
      n = Math.floor(n / 128);
    }
    out.push(n);
    return Uint8Array.from(out);
  }

  // Two's complement 64-bit for negative numbers (Apple WLOC uses this for signed lat/lon)
  const limbs = [0, 0, 0, 0, 0, 0, 0, 0];
  let r = -n;
  for (let i = 0; i < 8; i++) {
    limbs[i] = r & 0xff;
    r = Math.floor(r / 256);
  }
  let carry = 1;
  for (let i = 0; i < 8; i++) {
    const t = (~limbs[i]! & 0xff) + carry;
    limbs[i] = t & 0xff;
    carry = t >> 8;
  }

  const out: number[] = [];
  for (let group = 0; group < 10; group++) {
    let byte = 0;
    for (let bit = 0; bit < 7; bit++) {
      const absBit = group * 7 + bit;
      if (absBit < 64) {
        const limb = limbs[absBit >> 3]!;
        byte |= ((limb >> (absBit & 7)) & 1) << bit;
      }
    }
    if (group < 9) byte |= 0x80;
    out.push(byte);
  }
  return Uint8Array.from(out);
}

export function concatBytes(parts: Array<Uint8Array | number[]>): Uint8Array {
  let total = 0;
  const arrays = parts.map((p) => (p instanceof Uint8Array ? p : Uint8Array.from(p)));
  for (const a of arrays) total += a.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

export function encodeField(fieldNo: number, wireType: WireType, value: number | Uint8Array): Uint8Array {
  const tag = encodeVarint(fieldNo * 8 + wireType);
  if (wireType === 0) {
    if (typeof value !== "number") throw new Error("varint field expects number");
    return concatBytes([tag, encodeVarint(value)]);
  }
  if (wireType === 1 || wireType === 5) {
    if (!(value instanceof Uint8Array)) throw new Error("fixed field expects bytes");
    return concatBytes([tag, value]);
  }
  if (wireType === 2) {
    if (!(value instanceof Uint8Array)) throw new Error("length-delimited field expects bytes");
    return concatBytes([tag, encodeVarint(value.length), value]);
  }
  throw new Error(`cannot encode wire type ${wireType}`);
}

/**
 * Parse a protobuf message into fields. Unknown wire types throw so callers can fail-open.
 */
export function parseMessage(bytes: Uint8Array): ProtoField[] {
  const fields: ProtoField[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    const start = offset;
    const [key, afterKey] = readVarint(bytes, offset);
    offset = afterKey;
    const fieldNo = Math.floor(key / 8);
    const wireType = (key & 7) as WireType;
    if (fieldNo === 0) {
      throw new Error(`invalid protobuf field 0 at ${start}`);
    }

    let value: number | Uint8Array;
    if (wireType === 0) {
      const [v, next] = readVarint(bytes, offset);
      value = v;
      offset = next;
    } else if (wireType === 1) {
      if (offset + 8 > bytes.length) throw new Error(`truncated fixed64 at ${start}`);
      value = bytes.subarray(offset, offset + 8);
      offset += 8;
    } else if (wireType === 2) {
      const [len, afterLen] = readVarint(bytes, offset);
      offset = afterLen;
      if (offset + len > bytes.length) throw new Error(`truncated length-delimited at ${start}`);
      value = bytes.subarray(offset, offset + len);
      offset += len;
    } else if (wireType === 5) {
      if (offset + 4 > bytes.length) throw new Error(`truncated fixed32 at ${start}`);
      value = bytes.subarray(offset, offset + 4);
      offset += 4;
    } else {
      throw new Error(`unsupported wire type ${wireType} at ${start}`);
    }

    fields.push({
      fieldNo,
      wireType,
      value,
      raw: bytes.subarray(start, offset),
    });
  }
  return fields;
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Decode length-delimited string value as Latin-1 (for BSSID checks). */
export function bytesToLatin1(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += String.fromCharCode(bytes[i]!);
  }
  return s;
}
