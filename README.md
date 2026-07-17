# QPin iOS Network Location

**中文名：** QPin iOS 网络定位修改器

**SEO title:** Free iOS Network Location Changer | QPin

**Deployment:** standalone AWS Amplify static app (`/{lang}/`)

**Live URL:** https://main.d2vo47nlrvlxva.amplifyapp.com/
**Repository:** `qpin-ios-network-location`

Free, open-source tool under the QPin brand. It rewrites Apple **Wi‑Fi / cell network location** responses locally through Surge, Shadowrocket, Quantumult X, Loon, or Stash — **not** GPS hardware.

> Secondary development based on [Yu9191/wloc](https://github.com/Yu9191/wloc), with permission from the WLOC author.
> See [NOTICE](./NOTICE) for upstream attribution. Private chat content is not published.

## Honest scope

| Does | Does not |
|------|----------|
| MITM `gs-loc.apple.com` & `gs-loc-cn.apple.com` only | Spoof GPS radio |
| Patch `/clls/wloc` Protobuf lat/lon/accuracy | Promise all apps will follow |
| Save coordinates in the proxy app store | Upload coords to QPin backend |
| Fail-open on parse errors | Claim anti-ban / “absolute safety” |
| | Claim untested iOS versions (e.g. iOS 27) |

Outdoor GPS can override network location. Prefer indoor / weak-GPS testing.

## Architecture (short)

```
Amplify picker ──CORS preflight──► gs-loc*.apple.com/qpin-nl/settings
       │                  (no coordinates in preflight)
       └──save/query/clear───────► Proxy settings script
                                      │
                                      ▼
                            ($persistentStore / $prefs)

Apple locationd ──/clls/wloc──► Proxy response script
                                      │
                                      ▼
                            gunzip → protobuf patch → body out
                            (or original body if fail-open)
```

| Area | Keep from WLOC idea | Rewrite in this repo |
|------|---------------------|----------------------|
| Protobuf lat/lon/acc patch | Algorithm / field layout | Auditable TypeScript |
| gzip body handling | Behavior | `fflate` + clean API |
| Settings save/query | Pattern | Origin-bound preflight + strict validation + passthrough |
| Modules (5 clients) | Formats | QPin hosts only + empty default args |
| Place search | — | Browser-only Open-Meteo → Photon → Nominatim fallback |
| Picker UI | Map-first flow | QPin brand, i18n, diagnostics, Hardware CTA |

## Repository layout

```
src/core/          protobuf, gzip, wloc patcher
src/settings/      validate, store, handlers, resolve
src/platforms/     Surge / QX / Loon / Shadowrocket / Stash adapters
src/entries/       qpin-nl + settings script entrypoints
worker/            Static page generator + optional self-host Worker reference
web/i18n/          EN / 简体 / 繁體 / 日本語 / Español
modules/           .module .sgmodule .conf .lpx .stoverride
tests/             vitest suite
docs/              install, privacy, security, self-host
dist/site/         Amplify artifact (pages, scripts, modules)
```

## Quick start (developers)

```bash
npm install
npm run check    # lint + test + build
npm run dev:web  # local picker http://127.0.0.1:8788
```

Proxy install for end users: [docs/guides/install.md](./docs/guides/install.md).

## Modules

After `npm run build`, use `dist/site/modules/*`; the Amplify build resolves both URL placeholders.

MITM hostnames **only**:

- `gs-loc.apple.com`
- `gs-loc-cn.apple.com`

## Privacy

- No collection of decrypted WLOC bodies, BSSIDs, or cell IDs
- Active coordinates are sent only after the local proxy module passes preflight; QPin has no coordinate backend
- Analytics (if any): `network_location_save` / `network_location_clear` / `network_location_diagnostic` / `hardware_cta_click` only
- Details: [docs/privacy.md](./docs/privacy.md)

## QPin Hardware CTA

When free network location is a poor fit (outdoor GPS, no proxy, no MITM cert, need more stable mobility), the picker shows a restrained CTA to:

`/{lang}/products/hardware`

No claim that Hardware bypasses third-party app detection.

## Upstream & license

- Upstream: [Yu9191/wloc](https://github.com/Yu9191/wloc)
- Original idea lineage: [proxypin-wloc-spoofer](https://github.com/FFF686868/proxypin-wloc-spoofer)
- License: [MIT](./LICENSE)
- Attribution: [NOTICE](./NOTICE)
- Disclaimer (EN/中文): [docs/disclaimer.md](./docs/disclaimer.md)

## Documentation index

- [Install](./docs/guides/install.md)
- [Proxy modules](./docs/guides/proxy-modules.md)
- [MITM certificate](./docs/guides/mitm-certificate.md)
- [FAQ](./docs/guides/faq.md)
- [Troubleshooting](./docs/guides/troubleshooting.md)
- [Device test checklist](./docs/guides/device-test-checklist.md)
- [Self-host Worker](./docs/self-host-worker.md)
- [Build & release](./docs/build-and-release.md)
- [Security](./docs/security.md)

## Still needs real iPhone verification

See the checklist. Unit tests do **not** replace device validation for iOS 18 / 26, CN vs international WLOC hosts, Wi‑Fi vs cell, indoor vs outdoor, or full uninstall recovery.
