import { describe, expect, it } from "vitest";
import {
  bd09ToWgs84,
  gcj02ToWgs84,
  normalizeMapCoordinates,
  outOfChina,
  round6,
  wgs84ToGcj02,
} from "../src/core/coordinates.js";

describe("GCJ-02 / WGS84", () => {
  it("outOfChina", () => {
    expect(outOfChina(0, 0)).toBe(true);
    expect(outOfChina(-74, 40)).toBe(true);
    expect(outOfChina(116.4, 39.9)).toBe(false);
  });

  it("round-trip near Beijing with sub-meter residual", () => {
    const wgs = { lat: 39.9042, lon: 116.4074 };
    const gcj = wgs84ToGcj02(wgs.lat, wgs.lon);
    expect(gcj.lat).not.toBe(wgs.lat);
    const back = gcj02ToWgs84(gcj.lat, gcj.lon);
    expect(Math.abs(back.lat - wgs.lat)).toBeLessThan(1e-6);
    expect(Math.abs(back.lon - wgs.lon)).toBeLessThan(1e-6);
  });

  it("does not convert outside China", () => {
    const r = gcj02ToWgs84(40.7128, -74.006);
    expect(r.lat).toBe(40.7128);
    expect(r.lon).toBe(-74.006);
  });

  it("normalizes Amap GCJ-02 coordinates to WGS84", () => {
    const result = normalizeMapCoordinates({
      lat: 39.908823,
      lon: 116.39747,
      name: "Tiananmen",
      src: "amap",
    });
    expect(result.crs).toBe("wgs84");
    expect(result.lat).toBeCloseTo(39.907422, 5);
    expect(result.lon).toBeCloseTo(116.391229, 5);
  });

  it("converts Baidu BD-09 through GCJ-02 to WGS84", () => {
    const result = bd09ToWgs84(39.915, 116.404);
    expect(result.lat).toBeCloseTo(39.907255, 5);
    expect(result.lon).toBeCloseTo(116.391386, 5);

    const normalized = normalizeMapCoordinates({
      lat: 39.915,
      lon: 116.404,
      name: "",
      src: "baidu",
    });
    expect(normalized.crs).toBe("wgs84");
    expect(normalized.lat).toBeCloseTo(result.lat, 8);
    expect(normalized.lon).toBeCloseTo(result.lon, 8);
  });

  it("keeps Google and plain-text coordinates unchanged", () => {
    const google = normalizeMapCoordinates({
      lat: 39.9,
      lon: 116.4,
      name: "",
      src: "google",
    });
    expect(google).toMatchObject({ lat: 39.9, lon: 116.4, crs: "as-is" });
  });

  it("round6", () => {
    expect(round6(1.123456789)).toBe(1.123457);
  });
});
