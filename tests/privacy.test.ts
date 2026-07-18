import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("privacy boundaries", () => {
  it("logs target coordinates only at debug level", () => {
    const source = readFileSync(path.join(root, "src/entries/wloc.ts"), "utf8");
    expect(source).toContain("logger.debug(\n      `target=${redactCoords");
    expect(source).not.toContain("logger.info(\n      `target=${redactCoords");
  });
});
