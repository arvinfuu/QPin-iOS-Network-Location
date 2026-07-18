# Build and release

## Production architecture

The picker is a standalone AWS Amplify static app. It does not import or deploy code from the QPin commerce site. Direct map links are parsed in the browser; an optional Cloudflare Worker can resolve allowlisted short links.

Current production URL: `https://ios-location.qpinmap.com/`

Production responsibilities are isolated:

- Amplify hosts the picker, proxy scripts, and installable modules.
- Browser place search calls Open-Meteo, Photon, then Nominatim directly.
- The proxy module intercepts the local settings endpoint and stores active coordinates in the proxy app.
- No QPin API receives coordinates, map links, or search terms.

## Build

```bash
npm ci
npm run check
```

Output under `dist/site/`:

- `/index.html` and `/{lang}/index.html`
- `/tools/ios-network-location/index.html`
- `/scripts/qpin-nl.js`
- `/scripts/qpin-nl-settings.js`
- `/scripts/qpin-map-links.js`
- `/modules/*`
- `/robots.txt` and `/sitemap.xml`
- `/release.json`

For a local production-style build:

```bash
QPIN_NL_PUBLIC_BASE=https://ios-location.qpinmap.com \
QPIN_NL_ALLOWED_ORIGINS=https://main.d2vo47nlrvlxva.amplifyapp.com \
npm run build
```

`QPIN_NL_PUBLIC_BASE` is used for module install URLs, script URLs, sitemap entries, and the settings-script origin allowlist. On Amplify, the build derives the public base from `AWS_BRANCH` and `AWS_APP_ID` when the variable is not explicitly configured.

Optional additional picker origins can be comma-separated in `QPIN_NL_ALLOWED_ORIGINS`. Do not use a wildcard.

Set `QPIN_NL_PARSE_API` to an allowlisted Worker endpoint when short-link resolution is enabled. Leave it unset to keep all direct-link parsing in the browser.

## Amplify

The repository root contains `amplify.yml`:

1. Select Node.js 22 with `nvm`.
2. Run `npm ci`.
3. Run `npm run check`.
4. Publish `dist/site`.

No rewrite to the QPin commerce application is required. Locale pages use physical directories, so Amplify can serve them without an SPA catch-all.

Automatic branch builds are controlled in the Amplify branch configuration, not by `amplify.yml`. Keep the setting explicit and verify it before each release.

`customHttp.yml` defines the standalone app's CSP, privacy headers, and short cache lifetime for proxy scripts and modules.

## Release checklist

1. Run `npm run check`.
2. Confirm settings requests contain coordinates only in `X-QPin-NL-*` headers, never the URL.
3. Confirm the generated settings script contains the exact deployed picker origin.
4. Confirm module MITM hosts remain only `gs-loc.apple.com` and `gs-loc-cn.apple.com`.
5. Test save, query, clear, and restore on a real iPhone and every supported proxy client.
6. Tag only iOS versions verified on physical devices.

## Do not

- Connect this app to order or payment APIs.
- Add a coordinate collection endpoint.
- Expand the MITM host list.
- Use `Access-Control-Allow-Origin: *` for settings storage.
- Claim unverified iOS support.
