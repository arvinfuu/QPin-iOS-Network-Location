/** Reproducible build for the standalone Amplify site and proxy artifacts. */
import * as esbuild from "esbuild";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPageHtml } from "../worker/src/page.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const siteDir = path.join(root, "dist/site");
const LANGS = ["en", "zh-CN", "zh-TW", "ja", "es"] as const;

function resolveBuildCommit(): string {
  if (process.env.AWS_COMMIT_ID) return process.env.AWS_COMMIT_ID;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const BUILD_COMMIT = resolveBuildCommit();

function normalizeBase(value: string): string {
  return value.trim().replace(/\/$/, "");
}

function resolvePublicBase(): string {
  if (process.env.QPIN_NL_PUBLIC_BASE) return normalizeBase(process.env.QPIN_NL_PUBLIC_BASE);
  const appId = process.env.AWS_APP_ID;
  const branch = process.env.AWS_BRANCH || "main";
  if (appId) return `https://${branch}.${appId}.amplifyapp.com`;
  return "http://127.0.0.1:8788";
}

const publicBase = resolvePublicBase();
const scriptBase = `${publicBase}/scripts`;
const parseApi = (process.env.QPIN_NL_PARSE_API || "").trim();
const allowedOrigins = Array.from(
  new Set(
    [
      publicBase,
      "https://qpinmap.com",
      "https://www.qpinmap.com",
      "http://127.0.0.1:8788",
      "http://localhost:8788",
      ...(process.env.QPIN_NL_ALLOWED_ORIGINS || "").split(","),
    ]
      .map(normalizeBase)
      .filter(Boolean)
  )
);

function banner(name: string): string {
  return `/* ${name} - QPin iOS Network Location
 * Build commit: ${BUILD_COMMIT}
 * Upstream concept: https://github.com/Yu9191/wloc (Yu9191)
 * Original idea: https://github.com/FFF686868/proxypin-wloc-spoofer
 * License: MIT - see repository NOTICE
 */
`;
}

async function buildScripts(): Promise<void> {
  const outDir = path.join(siteDir, "scripts");
  await mkdir(outDir, { recursive: true });
  const common: esbuild.BuildOptions = {
    bundle: true,
    platform: "neutral",
    target: ["es2018"],
    format: "iife",
    minify: true,
    legalComments: "inline",
    logLevel: "info",
    mainFields: ["module", "main"],
  };

  await esbuild.build({
    ...common,
    entryPoints: [path.join(root, "src/entries/wloc.ts")],
    outfile: path.join(outDir, "qpin-nl.js"),
    banner: { js: banner("qpin-nl.js") },
  });
  await esbuild.build({
    ...common,
    entryPoints: [path.join(root, "src/entries/settings.ts")],
    outfile: path.join(outDir, "qpin-nl-settings.js"),
    banner: { js: banner("qpin-nl-settings.js") },
    define: {
      __QPIN_NL_ALLOWED_ORIGINS__: JSON.stringify(allowedOrigins),
    },
  });
  await esbuild.build({
    ...common,
    entryPoints: [path.join(root, "src/entries/map-links.ts")],
    outfile: path.join(outDir, "qpin-map-links.js"),
    banner: { js: banner("qpin-map-links.js") },
    globalName: "QPinMapLinks",
  });
  console.log(`Scripts: ${scriptBase}`);
}

async function buildWeb(): Promise<void> {
  await mkdir(siteDir, { recursive: true });
  const toolUrl = `${publicBase}/tools/ios-network-location/`;
  const alternateUrls = Object.fromEntries(
    LANGS.map((lang) => [lang, `${publicBase}/${lang}/`])
  );
  const pageOptions = (canonicalUrl: string) => ({
    canonicalUrl,
    alternateUrls,
    xDefaultUrl: toolUrl,
    parseApi,
    buildCommit: BUILD_COMMIT,
  });
  await copyFile(path.join(root, "assets/qpin-logo.png"), path.join(siteDir, "qpin-logo.png"));
  await writeFile(path.join(siteDir, "index.html"), getPageHtml("en", "", pageOptions(toolUrl)), "utf8");
  await writeFile(
    path.join(siteDir, "404.html"),
    getPageHtml("en", "", { ...pageOptions(toolUrl), robots: "noindex,nofollow" }),
    "utf8"
  );
  const toolDir = path.join(siteDir, "tools/ios-network-location");
  await mkdir(toolDir, { recursive: true });
  await writeFile(path.join(toolDir, "index.html"), getPageHtml("en", "", pageOptions(toolUrl)), "utf8");
  for (const lang of LANGS) {
    const dir = path.join(siteDir, lang);
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "index.html"),
      getPageHtml(lang, `?lang=${lang}`, pageOptions(alternateUrls[lang]!)),
      "utf8"
    );
  }
  await writeFile(
    path.join(siteDir, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${publicBase}/sitemap.xml\n`,
    "utf8"
  );
  const urls = [toolUrl, ...LANGS.map((lang) => `${publicBase}/${lang}/`)];
  await writeFile(
    path.join(siteDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `\n  <url><loc>${url}</loc></url>`).join("")}\n</urlset>\n`,
    "utf8"
  );
  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")) as {
    version: string;
  };
  await writeFile(
    path.join(siteDir, "release.json"),
    `${JSON.stringify({ service: "qpin-ios-network-location", version: packageJson.version, commit: BUILD_COMMIT }, null, 2)}\n`,
    "utf8"
  );
  console.log(`Site: ${publicBase}`);
}

async function writeModules(): Promise<void> {
  const modulesDir = path.join(root, "modules");
  const outDir = path.join(siteDir, "modules");
  await mkdir(outDir, { recursive: true });
  if (!existsSync(modulesDir)) return;
  for (const file of await readdir(modulesDir)) {
    const source = await readFile(path.join(modulesDir, file), "utf8");
    await writeFile(
      path.join(outDir, file),
      source.replaceAll("__SCRIPT_BASE__", scriptBase).replaceAll("__APP_BASE__", publicBase),
      "utf8"
    );
  }
}

async function main(): Promise<void> {
  const target = process.argv[2] || "all";
  if (target === "all") await rm(siteDir, { recursive: true, force: true });
  if (target === "scripts" || target === "all") await buildScripts();
  if (target === "web" || target === "all") await buildWeb();
  if (target === "modules" || target === "all") await writeModules();
  if (target === "worker") console.log("Optional Worker source is under worker/ and is not a production dependency.");
  console.log("Build complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
