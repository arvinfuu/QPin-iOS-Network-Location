/**
 * Normalize proxy response body variants into Uint8Array.
 * Supports ArrayBuffer, TypedArray views, array-like, and binary strings.
 */
export function toUint8Array(body: unknown): Uint8Array {
  if (body == null) return new Uint8Array(0);

  if (typeof ArrayBuffer !== "undefined") {
    if (body instanceof ArrayBuffer) {
      return new Uint8Array(body);
    }
    if (ArrayBuffer.isView(body)) {
      const view = body as ArrayBufferView;
      return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    }
  }

  if (typeof body === "string") {
    // Binary string (each char is a byte) — used by some proxy runtimes
    const out = new Uint8Array(body.length);
    for (let i = 0; i < body.length; i++) {
      out[i] = body.charCodeAt(i) & 0xff;
    }
    return out;
  }

  if (typeof (body as { length?: number }).length === "number" && typeof body !== "function") {
    const arr = body as ArrayLike<number>;
    const out = new Uint8Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
      out[i] = (arr[i] as number) & 0xff;
    }
    return out;
  }

  return new Uint8Array(0);
}

export function cloneBytes(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(bytes);
}
