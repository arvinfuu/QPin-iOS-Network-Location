import { describe, expect, it } from "vitest";
import {
  assertSafeUrl,
  isAllowedMapHost,
  resolveRedirect,
  SsrfError,
} from "../worker/src/ssrf.js";
import { extractFromString } from "../worker/src/parse.js";

describe("SSRF protection", () => {
  it("allows known map hosts", () => {
    expect(isAllowedMapHost("maps.apple.com")).toBe(true);
    expect(isAllowedMapHost("uri.amap.com")).toBe(true);
    expect(isAllowedMapHost("maps.google.com")).toBe(true);
    expect(isAllowedMapHost("j.map.baidu.com")).toBe(true);
  });

  it("blocks localhost, private IPs, metadata", () => {
    expect(isAllowedMapHost("localhost")).toBe(false);
    expect(isAllowedMapHost("127.0.0.1")).toBe(false);
    expect(isAllowedMapHost("10.0.0.1")).toBe(false);
    expect(isAllowedMapHost("192.168.1.1")).toBe(false);
    expect(isAllowedMapHost("169.254.169.254")).toBe(false);
    expect(isAllowedMapHost("metadata.google.internal")).toBe(false);
    expect(isAllowedMapHost("evil.example.com")).toBe(false);
  });

  it("rejects non-http schemes", () => {
    expect(() => assertSafeUrl("file:///etc/passwd")).toThrow(SsrfError);
    expect(() => assertSafeUrl("ftp://maps.apple.com/x")).toThrow(SsrfError);
  });

  it("rejects redirect to private host", () => {
    expect(() => resolveRedirect("https://uri.amap.com/x", "http://127.0.0.1/")).toThrow(
      SsrfError
    );
  });

  it("allows redirect within allowlist", () => {
    const next = resolveRedirect("https://uri.amap.com/x", "https://www.amap.com/share?p=1");
    expect(next).toContain("amap.com");
  });
});

describe("map link extract", () => {
  it("parses Apple coordinate", () => {
    const r = extractFromString(
      "https://maps.apple.com/?ll=37.3349,-122.0090&q=Apple%20Park"
    );
    // ll may use coordinate= or ll=
    expect(r?.lat).toBeCloseTo(37.3349, 3);
    expect(r?.lon).toBeCloseTo(-122.009, 3);
  });

  it("parses plain text coords", () => {
    const r = extractFromString("40.712800, -74.006000");
    expect(r?.lat).toBeCloseTo(40.7128, 4);
    expect(r?.lon).toBeCloseTo(-74.006, 4);
  });

  it("parses amap p= param", () => {
    const r = extractFromString("https://uri.amap.com/marker?p=B000A7VI5C,39.908823,116.397470,天安门,北京");
    expect(r?.src).toBe("amap");
    expect(r?.lat).toBeCloseTo(39.908823, 4);
  });

  it("parses amap position as longitude then latitude", () => {
    const result = extractFromString(
      "https://uri.amap.com/marker?position=116.397428,39.909230&name=Beijing"
    );
    expect(result).toMatchObject({
      lat: 39.90923,
      lon: 116.397428,
      name: "Beijing",
      src: "amap",
    });
  });

  it("identifies Baidu coordinates as BD-09 input", () => {
    const result = extractFromString(
      "https://api.map.baidu.com/marker?location=39.915000,116.404000"
    );
    expect(result).toMatchObject({ lat: 39.915, lon: 116.404, src: "baidu" });
  });

  it("rejects coordinates outside valid latitude and longitude ranges", () => {
    expect(extractFromString("999.0000,999.0000")).toBeNull();
    expect(extractFromString("https://maps.apple.com/?ll=91.0000,10.0000")).toBeNull();
  });
});
