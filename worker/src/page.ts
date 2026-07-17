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

export function getPageHtml(acceptLanguage?: string, search = ""): string {
  const lang = detectLang(acceptLanguage, search);
  const msgs = messagesJson(lang);
  const hw = hardwarePath(lang);
  const title = t(lang, "seoTitle");
  const langOptions = LANGS.map(
    (l) =>
      `<option value="${l.code}"${l.code === lang ? " selected" : ""}>${l.label}</option>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<meta name="description" content="Free iOS network location changer via proxy MITM. WiFi/cell only — not GPS. By QPin.">
<meta name="robots" content="index,follow">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="QPin NL">
<meta property="og:title" content="${escapeHtml(title)}">
<link rel="icon" type="image/png" href="/qpin-logo.png">
<link rel="apple-touch-icon" href="/qpin-logo.png">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""><\/script>
<style>
:root{
  --bg:#0b0f14;--panel:#121820;--card:#161d27;--border:#243041;
  --text:#e8eef6;--muted:#8b9bb0;--primary:#3b82f6;--primary-press:#2563eb;
  --danger:#ef4444;--ok:#22c55e;--warn:#f59e0b;--radius:8px;
  --map-h:min(52vh,420px);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--bg);color:var(--text);min-height:100%}
a{color:var(--primary);text-decoration:none}
#map{height:var(--map-h);width:100%;background:#0a1018}
.shell{max-width:720px;margin:0 auto;padding:0 0 32px}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:rgba(18,24,32,.92);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:500}
.brand{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px}
.brand-mark{width:28px;height:28px;border-radius:6px;object-fit:contain;display:block;flex:none}
.lang select{background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:var(--radius);padding:6px 8px;font-size:12px}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.map-wrap{position:relative;width:100%;isolation:isolate}
#map .leaflet-tile-pane{filter:none}
.map-search{position:absolute;left:10px;right:10px;top:10px;z-index:1100}
.map-search-row{display:flex;gap:7px;padding:6px;background:rgba(11,15,20,.94);border:1px solid rgba(139,155,176,.32);border-radius:var(--radius);box-shadow:0 8px 24px rgba(0,0,0,.28);backdrop-filter:blur(10px)}
.map-search-row input{flex:1;min-width:0;min-height:42px;background:transparent;border:none;color:var(--text);padding:0 8px;font-size:16px;outline:none}
.map-search-row input::placeholder{color:var(--muted)}
.map-search-row .btn{flex:none;min-width:68px;min-height:42px;padding:8px 12px}
.map-search .search-results{max-height:min(42vh,300px);overflow:auto;margin-top:6px;padding:6px;background:rgba(11,15,20,.96);border:1px solid rgba(139,155,176,.32);border-radius:var(--radius);box-shadow:0 10px 28px rgba(0,0,0,.34)}
.map-search .search-results:empty{display:none}
.layer-switch{position:absolute;left:10px;bottom:10px;z-index:900;display:flex;flex-wrap:wrap;gap:4px;max-width:70%}
.layer-btn{border:1px solid var(--border);background:rgba(18,24,32,.92);color:var(--text);padding:6px 8px;border-radius:var(--radius);font-size:11px;cursor:pointer}
.layer-btn.active{background:var(--primary);border-color:var(--primary)}
.panel{padding:12px;display:flex;flex-direction:column;gap:10px}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:12px}
.card h3{font-size:13px;font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.card h3 .icon{width:16px;height:16px;opacity:.85}
.coords{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:8px 10px;word-break:break-all}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.btn{flex:1;min-width:110px;border:none;border-radius:var(--radius);padding:11px 12px;font-size:13px;font-weight:600;cursor:pointer}
.btn:disabled{cursor:not-allowed;opacity:.48;transform:none}
.btn:active{transform:scale(.98)}
.btn-primary{background:var(--primary);color:#fff}
.btn-primary:active{background:var(--primary-press)}
.btn-secondary{background:var(--panel);color:var(--text);border:1px solid var(--border)}
.btn-danger{background:rgba(239,68,68,.15);color:#fecaca;border:1px solid rgba(239,68,68,.35)}
.btn-sm{flex:none;min-width:auto;padding:7px 10px;font-size:12px}
.input-row{display:flex;gap:8px;margin-top:8px}
.input-row input, .manual input{flex:1;min-width:0;background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);padding:10px;font-size:14px}
.manual{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.manual .full{grid-column:1/-1}
.hint{font-size:11px;color:var(--muted);margin-top:6px;line-height:1.4}
.banner{display:none;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);color:#fecaca;border-radius:var(--radius);padding:10px 12px;font-size:12px;line-height:1.45}
.banner.show{display:block}
.banner b{display:block;margin-bottom:4px}
.note{background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);color:#fde68a;border-radius:var(--radius);padding:10px 12px;font-size:12px;line-height:1.45}
.cta{background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.3);border-radius:var(--radius);padding:10px 12px;font-size:12px;line-height:1.45}
.cta a.btn{display:inline-flex;align-items:center;justify-content:center;margin-top:8px;text-decoration:none}
.status{font-size:12px;line-height:1.4;color:var(--muted);margin-top:8px;padding:8px 10px;background:var(--panel);border-left:3px solid var(--border);border-radius:0 var(--radius) var(--radius) 0}
.status[data-state="pending"]{color:#fde68a;border-left-color:var(--warn)}
.status[data-state="success"]{color:#bbf7d0;border-left-color:var(--ok)}
.status[data-state="error"]{color:#fecaca;border-left-color:var(--danger)}
.toast{position:fixed;left:50%;top:56px;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;padding:10px 14px;border-radius:var(--radius);font-size:13px;opacity:0;pointer-events:none;transition:opacity .2s;z-index:9999;max-width:90vw;text-align:center}
.toast.show{opacity:1}
.fav-item{display:flex;align-items:center;gap:8px;padding:8px;background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:6px;cursor:pointer}
.fav-item .info{flex:1;min-width:0}
.fav-item .name{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fav-item .meta{font-size:11px;color:var(--muted);font-family:ui-monospace,monospace}
.fav-item .tag{font-size:10px;color:var(--ok);font-weight:600}
.fav-del{border:none;background:transparent;color:var(--danger);width:28px;height:28px;border-radius:var(--radius);cursor:pointer;font-size:16px}
.fav-empty{text-align:center;color:var(--muted);font-size:12px;padding:12px 0}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:none;align-items:center;justify-content:center;padding:16px;z-index:10000}
.modal-overlay.show{display:flex}
.modal{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;width:100%;max-width:340px}
.modal h3{text-align:center;margin-bottom:12px;font-size:15px}
.modal input{width:100%;margin-bottom:10px;background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);padding:10px;font-size:14px}
.footer-links{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;font-size:12px;padding:8px}
.diag-out{font-family:ui-monospace,monospace;font-size:11px;white-space:pre-wrap;background:var(--panel);border-radius:var(--radius);padding:8px;margin-top:8px;color:var(--muted)}
.search-results{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.search-result{width:100%;border:1px solid var(--border);background:var(--panel);color:var(--text);border-radius:var(--radius);padding:9px 10px;text-align:left;cursor:pointer}
.search-result strong{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.search-result span{display:block;color:var(--muted);font-size:10px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.module-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
.module-link{display:flex;align-items:center;justify-content:center;min-height:42px;border:1px solid var(--border);background:var(--panel);border-radius:var(--radius);font-size:12px;font-weight:600;color:var(--text)}
.module-link:last-child:nth-child(odd){grid-column:1/-1}
@media(min-width:768px){
  :root{--map-h:min(58vh,520px)}
  .panel{padding:16px}
}
</style>
</head>
<body>
<div class="shell">
  <header class="topbar">
    <div class="brand">
      <img class="brand-mark" src="/qpin-logo.png" alt="" width="28" height="28">
      <span id="brandTitle">QPin Network Location</span>
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
        <button type="button" class="btn btn-primary" id="searchBtn" data-i18n="search"></button>
      </div>
      <div class="search-results" id="searchResults"></div>
    </div>
    <div class="layer-switch">
      <button type="button" class="layer-btn active" data-layer="osm">OSM</button>
      <button type="button" class="layer-btn" data-layer="voyager">Voyager</button>
      <button type="button" class="layer-btn" data-layer="dark">Dark</button>
    </div>
  </div>

  <div class="panel">
    <div class="banner" id="errorBanner"><b id="errTitle"></b><span id="errBody"></span></div>

    <div class="card">
      <h3>
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
        <span data-i18n="selectLocation"></span>
      </h3>
      <div class="coords" id="coords">—</div>
      <div class="status" id="status" role="status" aria-live="polite"></div>
      <div class="row">
        <button type="button" class="btn btn-primary" id="saveBtn" data-i18n="saveToDevice"></button>
        <button type="button" class="btn btn-secondary" id="favBtn" data-i18n="favorite"></button>
        <button type="button" class="btn btn-secondary" id="locateBtn" data-i18n="myLocation"></button>
      </div>
      <p class="hint" data-i18n="hintSave"></p>
    </div>

    <div class="card">
      <h3 data-i18n="manualCoords"></h3>
      <div class="manual">
        <input id="latInput" type="number" step="any" placeholder="lat" inputmode="decimal">
        <input id="lonInput" type="number" step="any" placeholder="lon" inputmode="decimal">
        <input id="accInput" class="full" type="number" min="1" max="10000" value="25" placeholder="accuracy">
        <button type="button" class="btn btn-secondary full" id="applyCoords" data-i18n="apply"></button>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3 style="margin:0" data-i18n="favorites"></h3>
        <button type="button" class="btn btn-sm btn-secondary" id="clearFavs" data-i18n="clearAll"></button>
      </div>
      <div id="favList"></div>
    </div>

    <div class="card">
      <h3 data-i18n="activeLocation"></h3>
      <div class="coords" id="activeValue">…</div>
      <div class="row">
        <button type="button" class="btn btn-sm btn-secondary" id="queryBtn" data-i18n="refresh"></button>
        <button type="button" class="btn btn-sm btn-danger" id="clearBtn" data-i18n="clearRestore"></button>
      </div>
    </div>

    <div class="card">
      <h3 data-i18n="pasteLink"></h3>
      <div class="input-row">
        <input id="urlInput" type="text" autocomplete="off" enterkeyhint="go">
        <button type="button" class="btn btn-secondary" style="flex:none;min-width:72px" id="parseBtn" data-i18n="parse"></button>
      </div>
      <p class="hint" data-i18n="linkHint"></p>
    </div>

    <div class="card">
      <h3 data-i18n="guide"></h3>
      <div class="module-grid">
        <a class="module-link" href="/modules/qpin-nl.sgmodule">Surge</a>
        <a class="module-link" id="shadowrocketLink" href="/modules/qpin-nl.module">Shadowrocket</a>
        <a class="module-link" href="/modules/qpin-nl.conf">Quantumult X</a>
        <a class="module-link" href="/modules/qpin-nl.lpx">Loon</a>
        <a class="module-link" href="/modules/qpin-nl.stoverride">Stash</a>
      </div>
    </div>

    <div class="note">
      <b data-i18n="iosCacheNote"></b>
      <div data-i18n="iosCacheBody" style="margin-top:4px"></div>
    </div>

    <div class="card">
      <h3 data-i18n="diagTitle"></h3>
      <p class="hint" data-i18n="mitmOnly"></p>
      <button type="button" class="btn btn-secondary" id="diagBtn" data-i18n="runDiag"></button>
      <div class="diag-out" id="diagOut"></div>
    </div>

    <div class="cta" id="hwCta">
      <b data-i18n="hardwareCta"></b>
      <div data-i18n="hardwareCtaBody" style="margin-top:4px"></div>
      <a class="btn btn-primary" id="hwLink" href="https://qpinmap.com${hw}" data-i18n="hardwareLink" rel="noopener"></a>
    </div>

    <p class="hint" style="text-align:center" data-i18n="disclaimer"></p>
    <p class="hint" style="text-align:center" data-i18n="privacyNote"></p>
    <p class="hint" style="text-align:center" data-i18n="notGps"></p>
    <div class="footer-links">
      <a id="guideLink" href="https://github.com/arvinfuu/QPin-iOS-Network-Location/blob/main/docs/guides/install.md" target="_blank" rel="noopener" data-i18n="guide"></a>
      <a href="https://github.com/arvinfuu/QPin-iOS-Network-Location" target="_blank" rel="noopener">GitHub</a>
      <a href="https://github.com/Yu9191/wloc" target="_blank" rel="noopener">Upstream WLOC</a>
    </div>
  </div>
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
    $("status").textContent = t(key);
    $("status").setAttribute("data-state", state || "");
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
      $("saveBtn").disabled = true;
      syncSelectionStatus();
      return;
    }
    $("saveBtn").disabled = false;
    $("coords").textContent = t("lat") + ": " + lat.toFixed(6) + "  " + t("lon") + ": " + lon.toFixed(6) + "  ±" + acc + "m";
    $("latInput").value = String(lat);
    $("lonInput").value = String(lon);
    $("accInput").value = String(acc);
    syncSelectionStatus();
  }

  function setPoint(la, lo, fly){
    if (!Number.isFinite(la) || !Number.isFinite(lo) || la < -90 || la > 90 || lo < -180 || lo > 180) return false;
    lat = la; lon = lo; selected = true;
    if (!marker) {
      marker = L.marker([lat, lon], {draggable:true}).addTo(map);
      marker.on("dragend", function(){
        const p = marker.getLatLng();
        lat = p.lat; lon = p.lng; selected = true;
        updateCoordsLabel();
      });
    } else {
      marker.setLatLng([lat, lon]);
    }
    if (fly) map.flyTo([lat, lon], Math.max(map.getZoom(), 15), {duration:0.6});
    updateCoordsLabel();
    return true;
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
      });
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
      return data;
    } catch (e) {
      $("errorBanner").classList.add("show");
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
        toast(t("saved"));
        track("network_location_save");
        activeQuerySeq += 1;
        renderActive(data);
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
    const text = String(raw || "").trim();
    const patterns = [
      /(?:coordinate|ll|sll)=(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)(-?\d{1,3}(?:\.\d+)?)/i,
      /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/,
      /[?&](?:q|query|location)=(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)(-?\d{1,3}(?:\.\d+)?)/i,
      /(-?\d{1,3}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)/
    ];
    for (const pattern of patterns) {
      const hit = text.match(pattern);
      if (!hit) continue;
      const la = Number(hit[1]), lo = Number(hit[2]);
      if (Number.isFinite(la) && Number.isFinite(lo) && la >= -90 && la <= 90 && lo >= -180 && lo <= 180) return {lat:la, lon:lo};
    }
    return null;
  }

  async function parseUrl(){
    const raw = $("urlInput").value.trim();
    if (!raw) return;
    const hit = extractCoords(raw);
    if (hit) {
      setPoint(hit.lat, hit.lon, true);
      toast(t("parseOk"));
      return;
    }
    toast(t("parseFail"));
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
      if (item) { setPoint(item.lat, item.lon, true); box.innerHTML = ""; }
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
        if (results.length === 1) setPoint(results[0].lat, results[0].lon, true);
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
    } catch (e) {
      lines.push("settings: FAIL — module/MITM/proxy?");
      $("errorBanner").classList.add("show");
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
  $("locateBtn").onclick = function(){
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function(pos){
      setPoint(pos.coords.latitude, pos.coords.longitude, true);
    });
  };
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
