# QPin iOS Network Location

An open-source, local-first iOS network location changer for Surge, Shadowrocket, Quantumult X, Loon, and Stash.

QPin iOS Network Location intercepts Apple Wi-Fi and cellular network-location responses and replaces their coordinates inside the proxy client. It does **not** modify the device's GPS hardware.

- [Try the web picker](https://ios-location.qpinmap.com/)
- [Installation guide](./docs/guides/install.md)
- [Shadowrocket 中文安装与排障](./docs/guides/shadowrocket-setup-zh-CN.md)
- [Security policy](./docs/security.md)

## Features

- Map-based location picker with search, favorites, manual coordinates, and map-link parsing
- Local `save`, `query`, and `clear` operations through the proxy module
- Protobuf and gzip-aware Apple WLOC response patching
- Modules for five supported proxy clients
- English, Simplified Chinese, Traditional Chinese, Japanese, and Spanish UI
- Strict coordinate and accuracy validation
- Unknown Protobuf field preservation
- Fail-open behavior when a response cannot be decoded safely
- No QPin coordinate backend

## Scope and limitations

| This project does | This project does not |
|---|---|
| Intercept `gs-loc.apple.com` and `gs-loc-cn.apple.com` | Modify GPS radio signals |
| Patch latitude, longitude, and accuracy in `/clls/wloc` responses | Guarantee that every app uses network location |
| Store selected coordinates in the proxy client's local storage | Upload selected coordinates to QPin servers |
| Support indoor and weak-GPS network-location testing | Override strong outdoor GPS in every situation |
| Return the original response when patching fails | Promise anti-ban, undetectability, or absolute safety |

iOS and individual apps can combine Wi-Fi, cellular, and GPS sources differently. Real-device testing is required for each target environment.

## Supported clients

| Client | Module |
|---|---|
| Shadowrocket | `modules/qpin-nl.module` |
| Surge | `modules/qpin-nl.sgmodule` |
| Quantumult X | `modules/qpin-nl.conf` |
| Loon | `modules/qpin-nl.lpx` |
| Stash | `modules/qpin-nl.stoverride` |

The modules limit MITM scope to:

```text
gs-loc.apple.com
gs-loc-cn.apple.com
```

Do not expand the MITM list to broad patterns such as `*.apple.com`.

## How it works

```text
Web picker ── save / query / clear ──► Proxy settings script
                                               │
                                               ▼
                                     Local proxy app storage

Apple locationd ── /clls/wloc ──────► Proxy response script
                                               │
                                               ▼
                              gunzip → Protobuf patch → response
                                  or original body on failure
```

The settings endpoint is intercepted locally by the proxy script. Selected coordinates are not processed by a QPin application server.

## Quick start

### End users

1. Open the [web picker](https://ios-location.qpinmap.com/).
2. Install the module for your proxy client.
3. Install and fully trust the proxy client's MITM CA certificate.
4. Enable HTTPS decryption for the two WLOC hostnames only.
5. Select a location and save it to the device.
6. Verify the active coordinates in **Advanced tools**.

See the [installation guide](./docs/guides/install.md) for the complete setup and removal process.

### Developers

Requirements:

- Node.js 18 or newer
- npm

```bash
git clone https://github.com/arvinfuu/QPin-iOS-Network-Location.git
cd QPin-iOS-Network-Location
npm install
npm run check
```

Start the local picker:

```bash
npm run dev:web
```

The development page is available at:

```text
http://127.0.0.1:8788/
```

## Commands

| Command | Purpose |
|---|---|
| `npm run lint` | Type-check the core, worker, and web code |
| `npm test` | Run the Vitest suite |
| `npm run build` | Build proxy scripts, modules, and the static site |
| `npm run check` | Run lint, tests, and the complete build |
| `npm run dev:web` | Start the local web picker |

## Repository structure

```text
src/core/          Protobuf, gzip, body handling, and WLOC patching
src/settings/      Validation and local save/query/clear handlers
src/platforms/     Proxy-client runtime adapters
src/entries/       Proxy script entry points
modules/           Surge, Shadowrocket, QX, Loon, and Stash modules
web/i18n/          UI translations
worker/            Static page generator and optional Worker reference
tests/             Unit and integration tests
docs/              User, security, privacy, and development documentation
```

## Privacy and security

- The project does not collect decrypted WLOC payloads, BSSIDs, or cell identifiers.
- Favorites remain in browser `localStorage`.
- Active coordinates remain in the proxy client's local storage.
- Search requests go directly from the browser to the configured public geocoding providers.
- Analytics, when enabled by a site operator, must not include coordinates or search terms.
- The proxy MITM certificate should be removed when it is no longer needed.

Read [Privacy](./docs/privacy.md), [Security](./docs/security.md), and the [Disclaimer](./docs/disclaimer.md) before use.

## Testing

The test suite covers:

- Positive, negative, and zero coordinates
- Accuracy validation
- Protobuf unknown-field preservation
- Gzip input and corrupt-body fail-open behavior
- Settings save/query/clear behavior
- Module hostname scope
- Worker SSRF protections
- Static page routing and privacy boundaries

```bash
npm run check
```

Automated tests do not replace real iPhone validation across iOS versions, regions, network types, proxy clients, and indoor or outdoor conditions. See the [device test checklist](./docs/guides/device-test-checklist.md).

## Documentation

- [Installation guide](./docs/guides/install.md)
- [Shadowrocket 安装与真机排障](./docs/guides/shadowrocket-setup-zh-CN.md)
- [Proxy modules](./docs/guides/proxy-modules.md)
- [MITM certificate](./docs/guides/mitm-certificate.md)
- [Troubleshooting](./docs/guides/troubleshooting.md)
- [FAQ](./docs/guides/faq.md)
- [Device test checklist](./docs/guides/device-test-checklist.md)
- [Self-hosting reference](./docs/self-host-worker.md)
- [Build and release](./docs/build-and-release.md)

## Contributing

Issues and pull requests are welcome.

Before opening a pull request:

1. Keep MITM scope limited to the two WLOC hostnames.
2. Do not add coordinate or search-term analytics.
3. Preserve fail-open behavior for malformed responses.
4. Add or update tests for behavior changes.
5. Run `npm run check`.

Please do not include proxy credentials, exported CA data, private messages, device identifiers, or decrypted location payloads in issues.

## Upstream and attribution

This project is a TypeScript implementation based on the WLOC approach:

- [Yu9191/wloc](https://github.com/Yu9191/wloc)
- [FFF686868/proxypin-wloc-spoofer](https://github.com/FFF686868/proxypin-wloc-spoofer)

See [NOTICE](./NOTICE) for attribution details.

## License

Released under the [MIT License](./LICENSE).

Apple, iOS, and related product names are trademarks of Apple Inc. This project is not affiliated with or endorsed by Apple.
