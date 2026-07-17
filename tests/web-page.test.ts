import { describe, expect, it } from "vitest";
import { getPageHtml } from "../worker/src/page.js";
import { detectLang, t, hardwarePath } from "../web/i18n/messages.js";

describe("web page", () => {
  it("renders mobile-first map shell for all locales", () => {
    for (const lang of ["en", "zh-CN", "zh-TW", "ja", "es"] as const) {
      const html = getPageHtml(lang, `?lang=${lang}`);
      expect(html).toContain('id="map"');
      expect(html).toContain("leaflet");
      expect(html).toContain("viewport");
      expect(html).toContain(t(lang, "saveToDevice"));
      expect(html).toContain("qpin-nl/settings");
      expect(html).toContain("X-QPin-NL-Protocol");
      expect(html).toContain("X-QPin-NL-Longitude");
      expect(html).not.toContain("action=save&lon=");
      expect(html).not.toContain('parseApi: "/api/parse"');
      // No decorative marketing hero fluff
      expect(html.toLowerCase()).not.toContain("gradient-blob");
      expect(html).not.toContain("hero-banner-marketing");
      // Card radius cap style present
      expect(html).toContain("--radius:8px");
    }
  });

  it("uses client-side provider fallback without analytics search parameters", () => {
    const html = getPageHtml("en");
    expect(html).toContain("geocoding-api.open-meteo.com");
    expect(html).toContain("photon.komoot.io");
    expect(html).toContain("nominatim.openstreetmap.org");
    expect(html).not.toMatch(/gtag\([^)]*(lat|lon|search)/i);
  });

  it("includes hardware CTA with language path", () => {
    const html = getPageHtml("zh-CN", "?lang=zh-CN");
    expect(html).toContain(hardwarePath("zh-CN"));
    expect(html).toContain("products/hardware");
  });

  it("detectLang from Accept-Language", () => {
    expect(detectLang("zh-CN,zh;q=0.9")).toBe("zh-CN");
    expect(detectLang("ja-JP")).toBe("ja");
    expect(detectLang("es-ES")).toBe("es");
    expect(detectLang("en-US")).toBe("en");
  });

  it("desktop and mobile viewport meta present", () => {
    const html = getPageHtml("en");
    expect(html).toMatch(/width=device-width/);
    expect(html).toMatch(/@media\(min-width:768px\)/);
  });

  it("does not claim support for unverified iOS 27", () => {
    const html = getPageHtml("en");
    expect(html).not.toMatch(/supports iOS 27/i);
  });
});
