import { describe, expect, it } from "vitest";
import { gcj02ToWgs84, outOfChina, wgs84ToGcj02, round6 } from "../worker/src/coords.js";

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

  it("round6", () => {
    expect(round6(1.123456789)).toBe(1.123457);
  });
});
