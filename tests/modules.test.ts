import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulesDir = path.join(root, "modules");

const REQUIRED = [
  "qpin-nl.module",
  "qpin-nl.sgmodule",
  "qpin-nl.conf",
  "qpin-nl.lpx",
  "qpin-nl.stoverride",
];

describe("proxy modules", () => {
  it("includes all five formats", () => {
    const files = readdirSync(modulesDir);
    for (const f of REQUIRED) {
      expect(files).toContain(f);
    }
  });

  it("only MITMs the two Apple WLOC hosts", () => {
    for (const f of REQUIRED) {
      const text = readFileSync(path.join(modulesDir, f), "utf8");
      expect(text).toMatch(/gs-loc\.apple\.com/);
      expect(text).toMatch(/gs-loc-cn\.apple\.com/);
      // Must not expand MITM to broad Apple domains
      expect(text).not.toMatch(/icloud\.com/);
      expect(text).not.toMatch(/\*\.apple\.com/);
      expect(text).not.toMatch(/apple\.com\.cn/);
    }
  });

  it("hooks wloc response and settings path", () => {
    for (const f of REQUIRED) {
      const text = readFileSync(path.join(modulesDir, f), "utf8");
      // Modules escape slashes as \/ in regex patterns
      expect(text).toMatch(/clls\\?\/wloc/);
      expect(text).toMatch(/qpin-nl\\?\/settings/);
    }
  });

  it("references script artifacts", () => {
    for (const f of REQUIRED) {
      const text = readFileSync(path.join(modulesDir, f), "utf8");
      expect(text).toMatch(/qpin-nl\.js|__SCRIPT_BASE__/);
      expect(text).toMatch(/qpin-nl-settings\.js|__SCRIPT_BASE__/);
    }
  });

  it("keeps the standalone app and script placeholders for Amplify builds", () => {
    for (const f of REQUIRED) {
      const text = readFileSync(path.join(modulesDir, f), "utf8");
      expect(text).toContain("__APP_BASE__");
      expect(text).toContain("__SCRIPT_BASE__");
    }
  });
});
