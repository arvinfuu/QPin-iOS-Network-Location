import type { Platform } from "./detect.js";

declare const $done: (value?: unknown) => void;

const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  204: "No Content",
  400: "Bad Request",
  404: "Not Found",
  500: "Internal Server Error",
};

export interface ProxyResponse {
  status?: number;
  statusCode?: number;
  headers?: Record<string, string>;
  body?: unknown;
  bodyBytes?: unknown;
  rawBody?: unknown;
}

/**
 * Finish a script with platform-specific $done payload shape.
 */
export function finish(platform: Platform, payload: { response?: ProxyResponse } | ProxyResponse | Record<string, never>): void {
  if (typeof $done !== "function") {
    return;
  }

  if (platform === "Quantumult X") {
    const res = "response" in payload && payload.response ? payload.response : (payload as ProxyResponse);
    const out: Record<string, unknown> = {
      status:
        typeof res.status === "number"
          ? `HTTP/1.1 ${res.status} ${STATUS_TEXT[res.status] || "OK"}`
          : res.status || "HTTP/1.1 200 OK",
      headers: res.headers || {},
    };

    const body = res.bodyBytes ?? res.body ?? res.rawBody;
    if (body instanceof ArrayBuffer) {
      out.bodyBytes = body;
    } else if (ArrayBuffer.isView(body)) {
      const view = body as ArrayBufferView;
      out.bodyBytes = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
    } else if (typeof body === "string") {
      out.body = body;
    } else if (body != null) {
      out.body = body;
    }
    $done(out);
    return;
  }

  // Surge / Loon / Stash / Shadowrocket / Egern
  if ("response" in payload) {
    $done(payload);
    return;
  }
  if (Object.keys(payload).length === 0) {
    $done({});
    return;
  }
  $done({ response: payload });
}

/**
 * Pass through original response without modification.
 */
export function finishPassthrough(platform: Platform): void {
  finish(platform, {});
}
