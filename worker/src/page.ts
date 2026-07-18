/**
 * QPin brand map picker — mobile-first tool page (not a marketing landing page).
 * First paint is an interactive map. Coordinates never leave the device for "save".
 */

import {
  detectLang,
  hardwarePath,
  LANGS,
  messagesJson,
  t,
  type Lang,
} from "../../web/i18n/messages.js";

const SETTINGS_API = "https://gs-loc.apple.com/qpin-nl/settings";
const SETTINGS_SERVICE = "qpin-ios-network-location";
const SETTINGS_PROTOCOL_VERSION = 1;
const FAV_KEY = "qpin_nl_favorites";
const LANG_KEY = "qpin_nl_lang";

export interface PageOptions {
  canonicalUrl?: string;
  alternateUrls?: Partial<Record<Lang, string>>;
  xDefaultUrl?: string;
  parseApi?: string;
  robots?: "index,follow" | "noindex,nofollow";
  buildCommit?: string;
}

export function getPageHtml(
  acceptLanguage?: string,
  search = "",
  options: PageOptions = {}
): string {
  const lang = detectLang(acceptLanguage, search);
  const msgs = messagesJson(lang);
  const hw = hardwarePath(lang);
  const title = t(lang, "seoTitle");
  const guideDoc =
    lang === "zh-CN"
      ? "https://github.com/arvinfuu/QPin-iOS-Network-Location/blob/main/docs/guides/shadowrocket-setup-zh-CN.md"
      : "https://github.com/arvinfuu/QPin-iOS-Network-Location/blob/main/docs/guides/install.md";
  const langOptions = LANGS.map(
    (l) =>
      `<option value="${l.code}"${l.code === lang ? " selected" : ""}>${l.label}</option>`
  ).join("");
  const canonicalTag = options.canonicalUrl
    ? `<link rel="canonical" href="${escapeHtml(options.canonicalUrl)}">`
    : "";
  const alternateTags = LANGS.map((item) => {
    const href = options.alternateUrls?.[item.code];
    return href
      ? `<link rel="alternate" hreflang="${item.code}" href="${escapeHtml(href)}">`
      : "";
  })
    .filter(Boolean)
    .concat(
      options.xDefaultUrl
        ? [`<link rel="alternate" hreflang="x-default" href="${escapeHtml(options.xDefaultUrl)}">`]
        : []
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<meta name="description" content="Free iOS network location changer via proxy MITM. WiFi/cell only — not GPS. By QPin.">
<meta name="robots" content="${options.robots || "index,follow"}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="QPin NL">
<meta property="og:title" content="${escapeHtml(title)}">
${canonicalTag}
${alternateTags}
<link rel="icon" type="image/png" href="/qpin-logo.png">
<link rel="apple-touch-icon" href="/qpin-logo.png">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""><\/script>
<script src="/scripts/qpin-map-links.js"><\/script>
<style>
:root{
  --bg:#f3f6fa;--surface:#fff;--surface-soft:#f8fafc;--border:#d9e0e9;
  --border-strong:#c6cfdb;--text:#172033;--muted:#68758a;--primary:#2878ea;
  --primary-press:#1764d1;--primary-soft:#edf5ff;--danger:#c53b45;--danger-soft:#fff1f2;
  --ok:#169447;--ok-soft:#ecf9f0;--warn:#b76b09;--warn-soft:#fff8e8;--radius:8px;
  --map-h:clamp(370px,52svh,500px);
  font-family:"Avenir Next",Avenir,"Segoe UI",sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html{background:var(--bg);color-scheme:light}
body{background:var(--bg);color:var(--text);min-height:100%;font-size:16px;line-height:1.4}
button,input,select{font:inherit}
button,a,select,summary{-webkit-tap-highlight-color:transparent}
a{color:var(--primary);text-decoration:none}
#map{height:var(--map-h);width:100%;background:#e7edf3}
.shell{max-width:760px;margin:0 auto;background:var(--surface);min-height:100vh}
.topbar{height:64px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;background:rgba(255,255,255,.96);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:1500;backdrop-filter:blur(14px)}
.brand{display:flex;align-items:center;gap:10px;min-width:0;font-weight:700;font-size:clamp(14px,4vw,18px);letter-spacing:0}
.brand span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brand-mark{width:40px;height:40px;border-radius:8px;object-fit:contain;display:block;flex:none}
.lang select{height:42px;max-width:126px;background:var(--surface);color:var(--text);border:1px solid var(--border-strong);border-radius:var(--radius);padding:0 32px 0 12px;font-size:14px;font-weight:600}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.map-wrap{position:relative;width:100%;isolation:isolate;background:#e7edf3}
#map .leaflet-tile-pane{filter:none}
.map-search{position:absolute;left:16px;right:16px;top:16px;z-index:1100}
.map-search-row{height:56px;display:flex;gap:8px;padding:6px;background:rgba(255,255,255,.97);border:1px solid rgba(198,207,219,.9);border-radius:var(--radius);box-shadow:0 8px 22px rgba(31,47,70,.14);backdrop-filter:blur(10px)}
.map-search-row input{flex:1;min-width:0;background:transparent;border:none;color:var(--text);padding:0 10px;font-size:16px;outline:none}
.map-search-row input::placeholder{color:var(--muted)}
.map-search-row .icon-button{background:var(--primary);color:#fff;border-color:var(--primary)}
.map-search .search-results{max-height:min(42vh,300px);overflow:auto;margin-top:6px;padding:6px;background:rgba(255,255,255,.98);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 10px 28px rgba(31,47,70,.16)}
.map-search .search-results:empty{display:none}
.map-tools{position:absolute;right:16px;top:92px;z-index:1000;display:flex;flex-direction:column;gap:8px}
.icon-button{width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border-strong);border-radius:var(--radius);background:rgba(255,255,255,.97);color:var(--text);cursor:pointer;box-shadow:0 4px 14px rgba(31,47,70,.12)}
.icon-button svg{width:21px;height:21px}
.layer-menu{display:none;position:absolute;right:0;top:52px;min-width:126px;padding:5px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 10px 24px rgba(31,47,70,.16)}
.layer-menu.show{display:grid;gap:3px}
.layer-btn{min-height:38px;border:0;background:transparent;color:var(--text);padding:7px 10px;border-radius:6px;font-size:13px;text-align:left;cursor:pointer}
.layer-btn.active{background:var(--primary-soft);color:var(--primary);font-weight:700}
.leaflet-control-zoom{border:1px solid var(--border-strong)!important;border-radius:var(--radius)!important;overflow:hidden;box-shadow:0 4px 14px rgba(31,47,70,.12)!important;margin-right:16px!important;margin-bottom:54px!important}
.leaflet-control-zoom a{width:42px!important;height:42px!important;line-height:42px!important;color:var(--text)!important;border-color:var(--border)!important}
.leaflet-control-attribution{font-size:9px!important;margin-bottom:38px!important;background:rgba(255,255,255,.82)!important}
.module-strip{position:absolute;left:0;right:0;bottom:0;z-index:1050;min-height:38px;display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 16px;background:rgba(255,248,232,.96);border-top:1px solid #efd8a6;color:var(--warn);font-size:13px;font-weight:700;backdrop-filter:blur(8px)}
.module-strip[data-state="ready"]{background:rgba(236,249,240,.96);border-color:#bde8ca;color:var(--ok)}
.module-strip[data-state="error"]{background:rgba(255,241,242,.97);border-color:#f2c4c8;color:var(--danger)}
.module-strip .state-icon{width:20px;height:20px;display:grid;place-items:center;border:1.5px solid currentColor;border-radius:50%;font-size:12px;line-height:1}
.selection-sheet{position:relative;background:var(--surface);border-bottom:1px solid var(--border);padding:12px 16px 16px}
.sheet-handle{width:48px;height:5px;background:#c6ced9;border-radius:3px;margin:0 auto 12px}
.location-summary{display:grid;grid-template-columns:44px minmax(0,1fr);gap:12px;align-items:center;margin-bottom:12px}
.location-icon{width:44px;height:44px;display:grid;place-items:center;border:1px solid #d7e4f5;border-radius:var(--radius);background:var(--primary-soft);color:var(--primary)}
.location-icon svg{width:23px;height:23px}
.location-copy{min-width:0}
.location-name{font-size:18px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.coords{margin-top:2px;color:var(--muted);font-family:"SFMono-Regular",Consolas,monospace;font-size:13px;word-break:break-word}
.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}
.btn{min-height:46px;display:inline-flex;align-items:center;justify-content:center;gap:8px;flex:1;min-width:110px;border:1px solid transparent;border-radius:var(--radius);padding:10px 13px;font-size:14px;font-weight:700;cursor:pointer;background:var(--surface)}
.btn svg{width:19px;height:19px;flex:none}
.btn:disabled{cursor:not-allowed;opacity:.48;transform:none}
.btn:active{transform:scale(.98)}
.btn-primary{background:var(--primary);color:#fff}
.btn-primary:active{background:var(--primary-press)}
.selection-sheet>.btn-primary{width:100%}
.btn-secondary{background:var(--surface);color:var(--text);border-color:var(--border-strong)}
.btn-danger{background:var(--danger-soft);color:var(--danger);border-color:#f1bfc4}
.btn-sm{flex:none;min-width:auto;padding:7px 10px;font-size:12px}
.save-status{min-height:30px;display:flex;align-items:center;justify-content:center;gap:7px;padding-top:9px;color:var(--muted);font-size:13px;font-weight:600;text-align:center}
.save-status[data-state="success"]{color:var(--ok)}
.save-status[data-state="error"]{color:var(--danger)}
.save-status[data-state="pending"]{color:var(--warn)}
.save-status .status-check{display:none;width:18px;height:18px;place-items:center;border-radius:50%;background:var(--ok);color:#fff;font-size:12px}
.save-status[data-state="success"] .status-check{display:grid}
.setup{padding:20px 16px 16px;background:var(--surface);border-bottom:1px solid var(--border)}
.section-title{font-size:20px;font-weight:750;letter-spacing:0;margin-bottom:16px}
.steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));position:relative;margin:0 4px 20px}
.steps:before{content:"";position:absolute;left:10%;right:10%;top:12px;height:2px;background:var(--border);z-index:0}
.step{position:relative;z-index:1;text-align:center;color:var(--muted);font-size:11px;line-height:1.25;padding:0 3px}
.step-dot{width:24px;height:24px;display:grid;place-items:center;margin:0 auto 7px;border:2px solid var(--border-strong);border-radius:50%;background:var(--surface);font-size:11px;font-weight:800}
.step.complete{color:var(--text)}
.step.complete .step-dot{background:var(--ok);border-color:var(--ok);color:#fff}
.step.optional .step-label:after{content:attr(data-optional);display:block;color:var(--warn);margin-top:3px}
.module-heading{font-size:13px;font-weight:700;margin-bottom:9px;color:var(--text)}
.module-grid{display:flex;gap:8px;overflow-x:auto;padding:1px 1px 4px;scrollbar-width:none}
.module-grid::-webkit-scrollbar{display:none}
.module-link{min-width:112px;min-height:62px;display:flex;align-items:center;justify-content:center;padding:8px 10px;border:1px solid var(--border);background:var(--surface);border-radius:var(--radius);font-size:12px;font-weight:650;color:var(--text);text-align:center}
.module-link.recommended{border-color:var(--primary);background:var(--primary-soft);color:var(--primary)}
.module-hint{font-size:11px;color:var(--muted);margin-top:7px}
.advanced{background:var(--surface);border-bottom:1px solid var(--border)}
.advanced summary{list-style:none;min-height:72px;display:grid;grid-template-columns:38px minmax(0,1fr) 22px;gap:10px;align-items:center;padding:12px 16px;cursor:pointer}
.advanced summary::-webkit-details-marker{display:none}
.advanced summary:focus{outline:none}
.advanced summary:focus-visible{outline:2px solid var(--primary);outline-offset:-2px}
.advanced-icon{width:38px;height:38px;display:grid;place-items:center;color:var(--text)}
.advanced-icon svg{width:23px;height:23px}
.advanced-copy{min-width:0}
.advanced-title{display:block;font-size:16px;font-weight:750}
.advanced-hint{display:block;color:var(--muted);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.advanced-chevron{transition:transform .2s}
.advanced[open] .advanced-chevron{transform:rotate(90deg)}
.advanced-body{padding:0 16px 18px}
.tool-section{padding:16px 0;border-top:1px solid var(--border)}
.tool-section h3{font-size:14px;font-weight:700;margin-bottom:9px}
.input-row{display:flex;gap:8px;margin-top:8px}
.input-row input,.manual input{height:44px;flex:1;min-width:0;background:var(--surface-soft);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);padding:9px 11px;font-size:14px}
.manual{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.manual .full{grid-column:1/-1}
.hint{font-size:11px;color:var(--muted);margin-top:6px;line-height:1.4}
.banner{display:none;color:var(--danger);font-size:12px;line-height:1.45;padding:10px 0 0}
.banner.show{display:block}
.banner b{display:block;margin-bottom:3px}
.note{background:var(--warn-soft);border-left:3px solid #e4a33c;color:#704a10;padding:10px 12px;font-size:12px;line-height:1.45}
.toast{position:fixed;left:50%;top:76px;transform:translateX(-50%);background:#172033;color:#fff;padding:10px 14px;border-radius:var(--radius);font-size:13px;opacity:0;pointer-events:none;transition:opacity .2s;z-index:9999;max-width:90vw;text-align:center;box-shadow:0 8px 24px rgba(23,32,51,.22)}
.toast.show{opacity:1}
.fav-item{display:flex;align-items:center;gap:8px;padding:9px 10px;background:var(--surface-soft);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:6px;cursor:pointer}
.fav-item .info{flex:1;min-width:0}
.fav-item .name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fav-item .meta{font-size:11px;color:var(--muted);font-family:"SFMono-Regular",Consolas,monospace}
.fav-item .tag{font-size:10px;color:var(--ok);font-weight:600}
.fav-del{border:none;background:transparent;color:var(--danger);width:28px;height:28px;border-radius:var(--radius);cursor:pointer;font-size:16px}
.fav-empty{text-align:center;color:var(--muted);font-size:12px;padding:12px 0}
.modal-overlay{position:fixed;inset:0;background:rgba(23,32,51,.48);display:none;align-items:center;justify-content:center;padding:16px;z-index:10000}
.modal-overlay.show{display:flex}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;width:100%;max-width:340px;box-shadow:0 18px 48px rgba(23,32,51,.2)}
.modal h3{text-align:center;margin-bottom:12px;font-size:15px}
.modal input{width:100%;height:44px;margin-bottom:10px;background:var(--surface-soft);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);padding:10px;font-size:14px}
.footer{padding:18px 16px 26px;background:var(--surface);text-align:center}
.boundary-note{display:flex;align-items:center;justify-content:center;gap:7px;color:var(--muted);font-size:12px}
.boundary-note svg{width:17px;height:17px}
.hardware-link{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;font-size:13px;color:var(--muted)}
.hardware-link a{display:inline-flex;align-items:center;gap:4px;font-weight:700}
.footer-links{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;font-size:11px;padding-top:16px}
.privacy-copy{max-width:620px;margin:14px auto 0;color:var(--muted);font-size:10px;line-height:1.45}
.diag-out{font-family:"SFMono-Regular",Consolas,monospace;font-size:11px;white-space:pre-wrap;background:var(--surface-soft);border-radius:var(--radius);padding:8px;margin-top:8px;color:var(--muted)}
.search-results{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.search-result{width:100%;border:1px solid transparent;background:var(--surface);color:var(--text);border-radius:6px;padding:9px 10px;text-align:left;cursor:pointer}
.search-result:hover,.search-result:focus{background:var(--primary-soft);border-color:#c7dcfa;outline:none}
.search-result strong{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.search-result span{display:block;color:var(--muted);font-size:10px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media(min-width:768px){
  :root{--map-h:min(58svh,540px)}
  body{padding:24px}
  .shell{border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;box-shadow:0 14px 44px rgba(31,47,70,.12)}
  .topbar{position:relative}
}
@media(max-width:390px){
  .topbar{padding-inline:8px;gap:6px}.brand{gap:6px;font-size:clamp(11.5px,3.1vw,13px)}.brand-mark{width:32px;height:32px}.lang select{width:84px;height:38px;padding:0 22px 0 7px;font-size:11.5px}
  .map-search{left:12px;right:12px}.map-tools{right:12px}.selection-sheet,.setup,.advanced summary,.advanced-body,.footer{padding-left:12px;padding-right:12px}
  .step{font-size:10px}.module-link{min-width:105px}.hardware-link{flex-wrap:wrap}
}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}.btn:active{transform:none}}
</style>
</head>
<body>
<div class="shell">
  <header class="topbar">
    <div class="brand">
      <img class="brand-mark" src="/qpin-logo.png" alt="QPin" width="40" height="40">
      <span id="brandTitle">QPin iOS Network Location</span>
    </div>
    <div class="lang">
      <label class="sr-only" for="langSelect">Language</label>
      <select id="langSelect" aria-label="Language">${langOptions}</select>
    </div>
  </header>

  <div class="map-wrap">
    <div id="map" role="application" aria-label="Map"></div>
    <div class="map-search" role="search">
      <div class="map-search-row">
        <input id="searchInput" type="search" autocomplete="off" enterkeyhint="search">
        <button type="button" class="icon-button" id="searchBtn" aria-label="Search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>
          <span class="sr-only" data-i18n="search"></span>
        </button>
      </div>
      <div class="search-results" id="searchResults"></div>
    </div>
    <div class="map-tools">
      <button type="button" class="icon-button" id="mapLocateBtn" aria-label="My location">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
      </button>
      <div style="position:relative">
        <button type="button" class="icon-button" id="layerToggle" aria-label="Map layers" aria-expanded="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></svg>
        </button>
        <div class="layer-menu" id="layerMenu">
          <button type="button" class="layer-btn active" data-layer="osm">OSM</button>
          <button type="button" class="layer-btn" data-layer="voyager">Voyager</button>
          <button type="button" class="layer-btn" data-layer="dark">Dark</button>
        </div>
      </div>
    </div>
    <div class="module-strip" id="moduleStrip" data-state="checking" role="status" aria-live="polite">
      <span class="state-icon" id="moduleStateIcon" aria-hidden="true">…</span>
      <span id="moduleStatusText" data-i18n="moduleChecking"></span>
    </div>
  </div>

  <section class="selection-sheet" aria-labelledby="selectedAddress">
    <div class="sheet-handle" aria-hidden="true"></div>
    <div class="location-summary">
      <div class="location-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.1 7 13 7 13s7-7.9 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg>
      </div>
      <div class="location-copy">
        <div class="location-name" id="selectedAddress" data-i18n="selectedLocation"></div>
        <div class="coords" id="coords">—</div>
      </div>
    </div>
    <button type="button" class="btn btn-primary" id="saveBtn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
      <span data-i18n="saveToDevice"></span>
    </button>
    <div class="save-status" id="status" role="status" aria-live="polite">
      <span class="status-check" aria-hidden="true">✓</span><span id="statusText"></span>
    </div>
    <div class="row">
      <button type="button" class="btn btn-secondary" id="favBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m12 2.5 3 6.1 6.7 1-4.9 4.7 1.2 6.7-6-3.2-6 3.2 1.2-6.7-4.9-4.7 6.7-1 3-6.1Z"/></svg>
        <span data-i18n="favorite"></span>
      </button>
      <button type="button" class="btn btn-secondary" id="locateBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
        <span data-i18n="myLocation"></span>
      </button>
    </div>
  </section>

  <section class="setup" aria-labelledby="setupTitle">
    <h2 class="section-title" id="setupTitle" data-i18n="setup"></h2>
    <div class="steps" aria-label="Setup progress">
      <div class="step" id="stepInstall"><span class="step-dot">1</span><span class="step-label" data-i18n="installModule"></span></div>
      <div class="step" id="stepTrust"><span class="step-dot">2</span><span class="step-label" data-i18n="trustCertificate"></span></div>
      <div class="step" id="stepSave"><span class="step-dot">3</span><span class="step-label" data-i18n="saveLocationStep"></span></div>
      <div class="step optional"><span class="step-dot">4</span><span class="step-label" data-i18n="restartIfNeeded" data-optional="${escapeHtml(t(lang, "optional"))}"></span></div>
    </div>
    <div class="module-heading" data-i18n="chooseProxyModule"></div>
    <div class="module-grid">
      <a class="module-link recommended" id="shadowrocketLink" href="/modules/qpin-nl.module">Shadowrocket</a>
      <a class="module-link" href="/modules/qpin-nl.sgmodule">Surge</a>
      <a class="module-link" href="/modules/qpin-nl.conf">Quantumult X</a>
      <a class="module-link" href="/modules/qpin-nl.lpx">Loon</a>
      <a class="module-link" href="/modules/qpin-nl.stoverride">Stash</a>
    </div>
    <p class="module-hint" data-i18n="proxyHint"></p>
  </section>

  <details class="advanced" id="advancedTools">
    <summary>
      <span class="advanced-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a4 4 0 0 0-5-5L7 4l3 3 2.7-2.7a4 4 0 0 0 2 2Z"/><path d="m9.4 6.6-7.1 7.1a2 2 0 0 0 0 2.8l5.2 5.2a2 2 0 0 0 2.8 0l7.1-7.1"/><path d="m14 12 6 6M17 9l-3 3"/></svg></span>
      <span class="advanced-copy"><span class="advanced-title" data-i18n="advancedTools"></span><span class="advanced-hint" data-i18n="advancedHint"></span></span>
      <svg class="advanced-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
    </summary>
    <div class="advanced-body">
      <div class="tool-section">
        <h3 data-i18n="manualCoords"></h3>
        <div class="manual">
          <input id="latInput" type="number" step="any" placeholder="lat" inputmode="decimal">
          <input id="lonInput" type="number" step="any" placeholder="lon" inputmode="decimal">
          <input id="accInput" class="full" type="number" min="1" max="10000" value="25" placeholder="accuracy">
          <button type="button" class="btn btn-secondary full" id="applyCoords" data-i18n="apply"></button>
        </div>
      </div>
      <div class="tool-section">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
          <h3 style="margin:0" data-i18n="favorites"></h3>
          <button type="button" class="btn btn-sm btn-secondary" id="clearFavs" data-i18n="clearAll"></button>
        </div>
        <div id="favList" style="margin-top:9px"></div>
      </div>
      <div class="tool-section">
        <h3 data-i18n="activeLocation"></h3>
        <div class="coords" id="activeValue">…</div>
        <div class="row">
          <button type="button" class="btn btn-secondary" id="queryBtn" data-i18n="refresh"></button>
          <button type="button" class="btn btn-danger" id="clearBtn" data-i18n="clearRestore"></button>
        </div>
      </div>
      <div class="tool-section">
        <h3 data-i18n="pasteLink"></h3>
        <div class="input-row">
          <input id="urlInput" type="text" autocomplete="off" enterkeyhint="go">
          <button type="button" class="btn btn-secondary" style="flex:none;min-width:76px" id="parseBtn" data-i18n="parse"></button>
        </div>
        <p class="hint" data-i18n="linkHint"></p>
      </div>
      <div class="tool-section">
        <h3 data-i18n="diagTitle"></h3>
        <p class="hint" data-i18n="mitmOnly"></p>
        <button type="button" class="btn btn-secondary" id="diagBtn" data-i18n="runDiag"></button>
        <div class="diag-out" id="diagOut"></div>
        <div class="banner" id="errorBanner"><b id="errTitle"></b><span id="errBody"></span></div>
      </div>
      <div class="note"><b data-i18n="iosCacheNote"></b><div data-i18n="iosCacheBody" style="margin-top:4px"></div></div>
    </div>
  </details>

  <footer class="footer">
    <p class="boundary-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg><span data-i18n="notGps"></span></p>
    <p class="hardware-link"><span data-i18n="needGpsControl"></span><a id="hwLink" href="https://qpinmap.com${hw}" rel="noopener"><span data-i18n="hardwareLink"></span><span aria-hidden="true">›</span></a></p>
    <p class="privacy-copy"><span data-i18n="privacyNote"></span> <span data-i18n="disclaimer"></span></p>
    <div class="footer-links">
      <a id="guideLink" href="${guideDoc}" target="_blank" rel="noopener" data-i18n="guide"></a>
      <a href="https://github.com/arvinfuu/QPin-iOS-Network-Location" target="_blank" rel="noopener">GitHub</a>
      <a href="https://github.com/Yu9191/wloc" target="_blank" rel="noopener">Upstream WLOC</a>
    </div>
  </footer>
</div>

<div class="toast" id="toast"></div>
<div class="modal-overlay" id="favModal">
  <div class="modal">
    <h3 data-i18n="favorite"></h3>
    <input id="favNameInput" maxlength="30">
    <div class="hint" id="favModalCoords" style="text-align:center;margin-bottom:10px"></div>
    <div class="row">
      <button type="button" class="btn btn-secondary" id="favCancel" data-i18n="cancel"></button>
      <button type="button" class="btn btn-primary" id="favConfirm" data-i18n="confirm"></button>
    </div>
  </div>
</div>

<script>
window.__QPIN_NL__ = {
  lang: ${JSON.stringify(lang)},
  messages: ${msgs},
  settingsApi: ${JSON.stringify(SETTINGS_API)},
  settingsService: ${JSON.stringify(SETTINGS_SERVICE)},
  settingsProtocolVersion: ${SETTINGS_PROTOCOL_VERSION},
  parseApi: ${JSON.stringify(options.parseApi || "")},
  buildCommit: ${JSON.stringify(options.buildCommit || "unknown")},
  favKey: ${JSON.stringify(FAV_KEY)},
  langKey: ${JSON.stringify(LANG_KEY)},
  hardwareBase: "https://qpinmap.com"
};
<\/script>
<script>
(function(){
  const C = window.__QPIN_NL__;
  let M = C.messages;
  let lang = C.lang;
  let lat = 22.3193, lon = 114.1694, acc = 25, selected = false;
  let marker = null;
  let map, layers = {}, activeLayer = "osm";
  let activePoint = null;
  let activeQuerySeq = 0;
  let reverseQuerySeq = 0;

  const $ = (id) => document.getElementById(id);
  const toast = (msg) => {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
  };
  const t = (k) => M[k] || k;

  function applyI18n(){
    document.title = t("seoTitle");
    $("brandTitle").textContent = t("title");
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (k && M[k]) el.textContent = M[k];
    });
    $("errTitle").textContent = t("moduleMissing");
    $("errBody").textContent = t("moduleMissingBody");
    $("urlInput").placeholder = t("pasteLink");
    $("searchInput").placeholder = t("searchPlace");
    $("favNameInput").placeholder = t("favNamePlaceholder");
    $("latInput").placeholder = t("lat");
    $("lonInput").placeholder = t("lon");
    $("accInput").placeholder = t("accuracy");
    const paths = {en:"en","zh-CN":"zh-CN","zh-TW":"zh-TW",ja:"ja",es:"es"};
    $("hwLink").href = C.hardwareBase + "/" + (paths[lang]||"en") + "/products/hardware";
    const shadowrocketModuleUrl = new URL("/modules/qpin-nl.module", location.origin).toString();
    $("shadowrocketLink").href = "shadowrocket://install?module=" + encodeURIComponent(shadowrocketModuleUrl);
    renderFavs();
    updateCoordsLabel();
  }

  function setSaveStatus(key, state){
    $("statusText").textContent = t(key);
    $("status").setAttribute("data-state", state || "");
    syncSetupProgress();
  }

  function setModuleState(state){
    const strip = $("moduleStrip");
    strip.setAttribute("data-state", state);
    $("moduleStateIcon").textContent = state === "ready" ? "✓" : state === "error" ? "!" : "…";
    $("moduleStatusText").textContent = t(state === "ready" ? "moduleReady" : state === "error" ? "moduleMissing" : "moduleChecking");
    $("stepInstall").classList.toggle("complete", state === "ready");
    $("stepTrust").classList.toggle("complete", state === "ready");
  }

  function syncSetupProgress(){
    if (!$("stepSave")) return;
    const target = selected ? {lat, lon, acc} : null;
    $("stepSave").classList.toggle("complete", pointsMatch(activePoint, target));
  }

  function pointsMatch(a, b){
    return Boolean(a && b && Math.abs(a.lat - b.lat) < 0.000001 && Math.abs(a.lon - b.lon) < 0.000001 && a.acc === b.acc);
  }

  function syncSelectionStatus(){
    if (!selected) {
      setSaveStatus("chooseLocationFirst", "");
      return;
    }
    const target = {lat, lon, acc};
    if (pointsMatch(activePoint, target)) setSaveStatus("savedActive", "success");
    else setSaveStatus("readyToSave", "pending");
  }

  function updateCoordsLabel(){
    if (!selected) {
      $("coords").textContent = "—";
      $("selectedAddress").textContent = t("selectedLocation");
      $("saveBtn").disabled = true;
      syncSelectionStatus();
      return;
    }
    $("saveBtn").disabled = false;
    $("coords").textContent = lat.toFixed(6) + ", " + lon.toFixed(6) + "  ±" + acc + "m";
    $("latInput").value = lat.toFixed(6);
    $("lonInput").value = lon.toFixed(6);
    $("accInput").value = String(acc);
    syncSelectionStatus();
  }

  function setPoint(la, lo, fly, label){
    if (!Number.isFinite(la) || !Number.isFinite(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) return false;
    lat = la; lon = lo; selected = true;
    $("selectedAddress").textContent = label || t("selectedLocation");
    if (!marker) {
      marker = L.marker([lat, lon], {draggable:true}).addTo(map);
      marker.on("dragend", function(){
        const p = marker.getLatLng();
        lat = p.lat; lon = p.lng; selected = true;
        updateCoordsLabel();
        reverseGeocode(lat, lon);
      });
    } else {
      marker.setLatLng([lat, lon]);
    }
    if (fly) map.flyTo([lat, lon], Math.max(map.getZoom(), 15), {duration:0.6});
    updateCoordsLabel();
    if (!label) reverseGeocode(lat, lon);
    return true;
  }

  async function reverseGeocode(la, lo){
    const seq = ++reverseQuerySeq;
    try {
      const res = await fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat="+encodeURIComponent(la)+"&lon="+encodeURIComponent(lo), {headers:{"Accept-Language":lang},referrerPolicy:"no-referrer"});
      if (!res.ok) return;
      const data = await res.json();
      if (seq !== reverseQuerySeq || !selected || Math.abs(lat-la) > 0.000001 || Math.abs(lon-lo) > 0.000001) return;
      const address = data && data.address || {};
      const label = [address.neighbourhood || address.suburb || address.city_district || address.city || data.name, address.city || address.state].filter(Boolean).filter((value,index,list) => list.indexOf(value) === index).slice(0,2).join(", ");
      if (label) $("selectedAddress").textContent = label;
    } catch {}
  }

  function initMap(){
    map = L.map("map", {zoomControl:false, attributionControl:true}).setView([lat, lon], 12);
    L.control.zoom({position:"bottomright"}).addTo(map);
    setTimeout(function(){ try { map.invalidateSize(); } catch (e) {} }, 100);
    layers.osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    });
    layers.voyager = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "&copy; OSM &copy; CARTO"
    });
    layers.dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "&copy; OSM &copy; CARTO"
    });
    layers.osm.addTo(map);
    map.on("click", function(e){
      $("searchResults").innerHTML = "";
      setPoint(e.latlng.lat, e.latlng.lng, false);
    });
    map.on("dragend", function(){
      const center = map.getCenter();
      setPoint(center.lat, center.lng, false);
    });
    document.querySelectorAll(".layer-btn").forEach((btn) => {
      btn.addEventListener("click", function(){
        const name = btn.getAttribute("data-layer");
        if (!name || !layers[name] || name === activeLayer) return;
        map.removeLayer(layers[activeLayer]);
        layers[name].addTo(map);
        activeLayer = name;
        document.querySelectorAll(".layer-btn").forEach((b) => b.classList.toggle("active", b === btn));
        $("layerMenu").classList.remove("show");
        $("layerToggle").setAttribute("aria-expanded", "false");
      });
    });
    $("layerToggle").addEventListener("click", function(){
      const open = $("layerMenu").classList.toggle("show");
      $("layerToggle").setAttribute("aria-expanded", String(open));
    });
  }

  function favs(){
    try {
      const raw = JSON.parse(localStorage.getItem(C.favKey) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw.filter((f) => f && typeof f.name === "string" && Number.isFinite(f.lat) && Number.isFinite(f.lon) && f.lat >= -90 && f.lat <= 90 && f.lon >= -180 && f.lon <= 180).map((f) => ({
        name: f.name.slice(0, 30), lat: f.lat, lon: f.lon, acc: clampAcc(Number(f.acc) || 25)
      })).slice(0, 50);
    } catch { return []; }
  }
  function saveFavs(list){
    localStorage.setItem(C.favKey, JSON.stringify(list.slice(0, 50)));
  }
  function renderFavs(){
    const list = favs();
    const box = $("favList");
    if (!list.length) {
      box.innerHTML = '<div class="fav-empty">' + t("noFavorites") + '</div>';
      return;
    }
    box.innerHTML = list.map((f, i) => {
      const active = selected && Math.abs(f.lat - lat) < 1e-5 && Math.abs(f.lon - lon) < 1e-5;
      return '<div class="fav-item" data-i="'+i+'"><div class="info"><div class="name">'+escapeHtml(f.name||"")+'</div><div class="meta">'+f.lat.toFixed(5)+', '+f.lon.toFixed(5)+'</div>'+(active?'<div class="tag">'+t("activeNow")+'</div>':'')+'</div><button type="button" class="fav-del" data-del="'+i+'" aria-label="delete">×</button></div>';
    }).join("");
    box.querySelectorAll(".fav-item").forEach((el) => {
      el.addEventListener("click", function(ev){
        if (ev.target && ev.target.getAttribute("data-del") != null) return;
        const f = list[+el.getAttribute("data-i")];
        if (f) { acc = f.acc; setPoint(f.lat, f.lon, true); }
      });
    });
    box.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", function(ev){
        ev.stopPropagation();
        const i = +btn.getAttribute("data-del");
        const next = favs();
        next.splice(i,1);
        saveFavs(next);
        renderFavs();
      });
    });
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      if (c === "&") return "&amp;";
      if (c === "<") return "&lt;";
      if (c === ">") return "&gt;";
      if (c === '"') return "&quot;";
      return "&#39;";
    });
  }

  async function settingsCall(action, coords){
    const u = C.settingsApi + "?action=" + encodeURIComponent(action) + "&nonce=" + encodeURIComponent(String(Date.now()) + Math.random().toString(16).slice(2));
    const headers = {"X-QPin-NL-Protocol": String(C.settingsProtocolVersion)};
    if (coords) {
      headers["X-QPin-NL-Longitude"] = String(coords.lon);
      headers["X-QPin-NL-Latitude"] = String(coords.lat);
      headers["X-QPin-NL-Accuracy"] = String(coords.acc);
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(u, {
        method: action === "query" ? "GET" : "POST",
        headers,
        signal: ctrl.signal,
        cache:"no-store",
        credentials:"omit",
        referrerPolicy:"no-referrer"
      });
      const data = await res.json();
      if (!data || data.service !== C.settingsService || data.protocolVersion !== C.settingsProtocolVersion) {
        throw new Error("unexpected settings response");
      }
      $("errorBanner").classList.remove("show");
      setModuleState("ready");
      return data;
    } catch (e) {
      $("errorBanner").classList.add("show");
      setModuleState("error");
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  function renderActive(data){
    if (data && data.success && Number.isFinite(data.latitude) && Number.isFinite(data.longitude)) {
      activePoint = {lat:data.latitude, lon:data.longitude, acc:data.accuracy || 25};
      $("activeValue").textContent = activePoint.lat.toFixed(6) + ", " + activePoint.lon.toFixed(6) + " ±" + activePoint.acc + "m";
    } else {
      activePoint = null;
      $("activeValue").textContent = t("passthrough");
    }
    syncSelectionStatus();
  }

  function showSaveSuccess(data, target){
    setSaveStatus("saved", "success");
    toast(t("saveSuccessTitle"));
  }

  async function queryActive(){
    const seq = ++activeQuerySeq;
    try {
      const data = await settingsCall("query");
      if (seq !== activeQuerySeq) return;
      renderActive(data);
    } catch {
      if (seq !== activeQuerySeq) return;
      activePoint = null;
      $("activeValue").textContent = t("needProxy");
      syncSelectionStatus();
    }
  }

  async function save(){
    if (!selected) { toast(t("chooseLocationFirst")); return; }
    acc = clampAcc(+$("accInput").value || acc);
    const target = {lon, lat, acc};
    activeQuerySeq += 1;
    $("saveBtn").disabled = true;
    setSaveStatus("saving", "pending");
    try {
      const data = await settingsCall("save", target);
      if (data && data.success) {
        track("network_location_save");
        activeQuerySeq += 1;
        renderActive(data);
        showSaveSuccess(data, target);
      } else {
        const message = (data && data.error) || t("saveFailed");
        toast(message);
        setSaveStatus("saveFailed", "error");
      }
    } catch {
      toast(t("needProxy"));
      setSaveStatus("saveFailed", "error");
    } finally {
      $("saveBtn").disabled = !selected;
    }
  }

  async function clearActive(){
    activeQuerySeq += 1;
    try {
      const data = await settingsCall("clear");
      if (data && data.success) {
        toast(t("cleared"));
        track("network_location_clear");
        activePoint = null;
        $("activeValue").textContent = t("passthrough");
        syncSelectionStatus();
      } else toast((data && data.error) || t("needProxy"));
    } catch { toast(t("needProxy")); }
  }

  function clampAcc(n){
    if (!Number.isFinite(n)) return 25;
    return Math.min(10000, Math.max(1, Math.round(n)));
  }

  function extractCoords(raw){
    try {
      const api = window.QPinMapLinks;
      if (!api || typeof api.extractFromString !== "function") return null;
      const parsed = api.extractFromString(String(raw || "").trim());
      return parsed ? api.normalizeMapCoordinates(parsed, "auto") : null;
    } catch { return null; }
  }

  async function parseUrl(){
    const raw = $("urlInput").value.trim();
    if (!raw) return;
    $("parseBtn").disabled = true;
    const hit = extractCoords(raw);
    if (hit) {
      setPoint(hit.lat, hit.lon, true, hit.name || undefined);
      toast(t("parseOk"));
      $("parseBtn").disabled = false;
      return;
    }
    if (!C.parseApi) {
      toast(t("parseFail"));
      $("parseBtn").disabled = false;
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const endpoint = new URL(C.parseApi, location.origin);
      endpoint.searchParams.set("u", raw);
      const res = await fetch(endpoint.toString(), {
        signal: ctrl.signal,
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer"
      });
      if (!res.ok) throw new Error("parse failed");
      const data = await res.json();
      if (!data || !Number.isFinite(data.lat) || !Number.isFinite(data.lon)) throw new Error("invalid parse response");
      setPoint(data.lat, data.lon, true, data.name || undefined);
      toast(t("parseOk"));
    } catch {
      toast(t("parseFail"));
    } finally {
      clearTimeout(timer);
      $("parseBtn").disabled = false;
    }
  }

  function normalizeResults(items){
    const seen = new Set();
    return items.filter((item) => item && Number.isFinite(item.lat) && Number.isFinite(item.lon) && item.lat >= -90 && item.lat <= 90 && item.lon >= -180 && item.lon <= 180).filter((item) => {
      const key = item.lat.toFixed(5) + "," + item.lon.toFixed(5);
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0, 6);
  }

  function renderSearchResults(items){
    const box = $("searchResults");
    box.innerHTML = items.map((item, index) => '<button type="button" class="search-result" data-result="'+index+'"><strong>'+escapeHtml(item.name || item.label || (item.lat.toFixed(5)+", "+item.lon.toFixed(5)))+'</strong><span>'+escapeHtml(item.label || item.provider || "")+'</span></button>').join("");
    box.querySelectorAll("[data-result]").forEach((button) => button.addEventListener("click", function(){
      const item = items[Number(button.getAttribute("data-result"))];
      if (item) { setPoint(item.lat, item.lon, true, item.name || item.label); box.innerHTML = ""; }
    }));
  }

  async function openMeteoSearch(q){
    const code = {"zh-CN":"zh","zh-TW":"zh",ja:"ja",es:"es",en:"en"}[lang] || "en";
    const res = await fetch("https://geocoding-api.open-meteo.com/v1/search?count=6&format=json&language="+code+"&name="+encodeURIComponent(q), {referrerPolicy:"no-referrer"});
    if (!res.ok) throw new Error("open-meteo failed");
    const data = await res.json();
    return (data.results || []).map((item) => ({lat:Number(item.latitude),lon:Number(item.longitude),name:item.name || "",label:[item.admin1,item.country].filter(Boolean).join(", "),provider:"Open-Meteo"}));
  }

  async function photonSearch(q){
    const res = await fetch("https://photon.komoot.io/api/?limit=6&q="+encodeURIComponent(q), {referrerPolicy:"no-referrer"});
    if (!res.ok) throw new Error("photon failed");
    const data = await res.json();
    return (data.features || []).map((item) => ({lat:Number(item.geometry && item.geometry.coordinates && item.geometry.coordinates[1]),lon:Number(item.geometry && item.geometry.coordinates && item.geometry.coordinates[0]),name:(item.properties && item.properties.name) || "",label:[item.properties && item.properties.city,item.properties && item.properties.state,item.properties && item.properties.country].filter(Boolean).join(", "),provider:"Photon"}));
  }

  async function nominatimSearch(q){
    const res = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&q="+encodeURIComponent(q), {headers:{"Accept-Language":lang},referrerPolicy:"no-referrer"});
    if (!res.ok) throw new Error("nominatim failed");
    const data = await res.json();
    return (data || []).map((item) => ({lat:Number(item.lat),lon:Number(item.lon),name:(item.name || String(item.display_name || "").split(",")[0]),label:item.display_name || "",provider:"Nominatim"}));
  }

  async function searchPlace(){
    const q = $("searchInput").value.trim();
    if (!q) return;
    $("searchBtn").disabled = true;
    $("searchResults").innerHTML = "";
    const direct = extractCoords(q);
    if (direct) {
      setPoint(direct.lat, direct.lon, true);
      $("searchBtn").disabled = false;
      return;
    }
    for (const provider of [openMeteoSearch, photonSearch, nominatimSearch]) {
      try {
        const results = normalizeResults(await provider(q));
        if (!results.length) continue;
        if (results.length === 1) setPoint(results[0].lat, results[0].lon, true, results[0].name || results[0].label);
        else renderSearchResults(results);
        $("searchBtn").disabled = false;
        return;
      } catch {}
    }
    $("searchBtn").disabled = false;
    toast(t("searchFail"));
  }

  async function runDiag(){
    track("network_location_diagnostic");
    const lines = [];
    lines.push("time: " + new Date().toISOString());
    lines.push("ua: " + (navigator.userAgent || "").slice(0, 80));
    try {
      const data = await settingsCall("query");
      lines.push("settings: ok (" + (data.success ? "active" : "passthrough") + ")");
      $("errorBanner").classList.remove("show");
      setModuleState("ready");
    } catch (e) {
      lines.push("settings: FAIL — module/MITM/proxy?");
      $("errorBanner").classList.add("show");
      setModuleState("error");
    }
    lines.push("MITM hosts: gs-loc.apple.com, gs-loc-cn.apple.com only");
    lines.push("scope: WiFi/cell network location — not GPS");
    $("diagOut").textContent = lines.join("\\n");
  }

  function track(event){
    // Anonymous feature events only — never coords or search terms
    try {
      if (window.plausible) window.plausible(event);
      else if (window.gtag) window.gtag("event", event, { transport_type: "beacon" });
    } catch {}
  }

  $("saveBtn").onclick = save;
  $("queryBtn").onclick = queryActive;
  $("clearBtn").onclick = clearActive;
  $("parseBtn").onclick = parseUrl;
  $("searchBtn").onclick = searchPlace;
  $("diagBtn").onclick = runDiag;
  function locateDevice(){
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function(pos){
      setPoint(pos.coords.latitude, pos.coords.longitude, true);
    });
  }
  $("locateBtn").onclick = locateDevice;
  $("mapLocateBtn").onclick = locateDevice;
  $("applyCoords").onclick = function(){
    const la = parseFloat($("latInput").value);
    const lo = parseFloat($("lonInput").value);
    const a = clampAcc(parseFloat($("accInput").value));
    if (!Number.isFinite(la) || !Number.isFinite(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) {
      toast(t("parseFail"));
      return;
    }
    acc = a;
    setPoint(la, lo, true);
    toast(t("readyToSave"));
  };
  $("favBtn").onclick = function(){
    if (!selected) { toast(t("chooseLocationFirst")); return; }
    $("favModalCoords").textContent = lat.toFixed(6) + ", " + lon.toFixed(6);
    $("favModal").classList.add("show");
    $("favNameInput").value = "";
    $("favNameInput").focus();
  };
  $("favCancel").onclick = () => $("favModal").classList.remove("show");
  $("favConfirm").onclick = function(){
    const name = ($("favNameInput").value || "").trim().slice(0, 30) || (lat.toFixed(4)+","+lon.toFixed(4));
    const list = favs();
    list.unshift({ name, lat, lon, acc });
    saveFavs(list);
    $("favModal").classList.remove("show");
    renderFavs();
  };
  $("clearFavs").onclick = function(){
    saveFavs([]);
    renderFavs();
  };
  $("hwLink").addEventListener("click", function(){ track("hardware_cta_click"); });
  $("langSelect").onchange = function(){
    const v = $("langSelect").value;
    localStorage.setItem(C.langKey, v);
    location.href = new URL("/" + encodeURIComponent(v) + "/", location.origin).toString();
  };
  $("urlInput").addEventListener("keydown", (e) => { if (e.key === "Enter") parseUrl(); });
  $("searchInput").addEventListener("keydown", (e) => { if (e.key === "Enter") searchPlace(); });

  // restore lang preference via query already handled server-side
  applyI18n();
  setModuleState("checking");
  initMap();
  queryActive();
})();
<\/script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
