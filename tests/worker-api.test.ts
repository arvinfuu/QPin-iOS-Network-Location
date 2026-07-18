import { beforeEach, describe, expect, it } from "vitest";
import app from "../worker/src/index.js";
import { __resetRateLimits } from "../worker/src/rate-limit.js";

describe("Worker map parser API", () => {
  beforeEach(() => __resetRateLimits());

  it("returns normalized WGS84 coordinates for an Amap link", async () => {
    const input = encodeURIComponent(
      "https://uri.amap.com/marker?p=B000A7VI5C,39.908823,116.397470,Tiananmen,Beijing"
    );
    const response = await app.request(`https://worker.example/api/parse?u=${input}`, {
      headers: { "CF-Connecting-IP": "203.0.113.10" },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      lat: 39.907422,
      lon: 116.391229,
      src: "amap",
      crs: "wgs84",
    });
  });

  it("uses BD-09 conversion for Baidu links", async () => {
    const input = encodeURIComponent(
      "https://api.map.baidu.com/marker?location=39.915000,116.404000"
    );
    const response = await app.request(`https://worker.example/api/parse?u=${input}`, {
      headers: { "CF-Connecting-IP": "203.0.113.11" },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      lat: 39.907255,
      lon: 116.391386,
      src: "baidu",
      crs: "wgs84",
    });
  });
});
