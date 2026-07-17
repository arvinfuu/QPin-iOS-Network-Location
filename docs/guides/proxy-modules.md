# Proxy module configuration

Script URLs in `dist/modules/` point at the built artifacts:

- `dist/site/scripts/qpin-nl.js` — response patcher
- `dist/site/scripts/qpin-nl-settings.js` — local save/query/clear API

Replace the GitHub raw base URL if you host scripts yourself.

## MITM hosts (do not expand)

```
gs-loc.apple.com
gs-loc-cn.apple.com
```

## Modules

| App | File |
|-----|------|
| Shadowrocket | `modules/qpin-nl.module` |
| Surge | `modules/qpin-nl.sgmodule` |
| Quantumult X | `modules/qpin-nl.conf` |
| Loon | `modules/qpin-nl.lpx` |
| Stash | `modules/qpin-nl.stoverride` |

## Paths intercepted

| Path | Role |
|------|------|
| `/clls/wloc` | Patch network location Protobuf |
| `/qpin-nl/settings` | Local settings (`action=save\|query\|clear`) |

Settings requests are answered by the script (echo-response / request script), not by Apple.

## Module arguments

| Argument | Meaning |
|----------|---------|
| `longitude` | Optional override; leave empty for store/passthrough |
| `latitude` | Optional override |
| `accuracy` | Meters, 1–10000 (default 25) |
| `logLevel` | `off` / `error` / `warn` / `info` / `debug` |

Priority: **persistent store (web save) > module args > passthrough**.

## Surge

1. Modules → install `qpin-nl.sgmodule`
2. Enable module
3. Configure MITM + trusted certificate

## Shadowrocket

1. On the QPin picker page, tap **Shadowrocket** to open the module installer in the app.
2. If app handoff is unavailable, download `qpin-nl.module` and add it from Config → Module.
3. Install and fully trust Shadowrocket's CA certificate. The module enables HTTPS and HTTP/2 MITM for only the two WLOC hosts.
4. After a module update, refresh it and reconnect Shadowrocket before testing.

## Quantumult X

Import rewrite resource `qpin-nl.conf` and enable MITM hostnames.

## Loon

Install plugin `qpin-nl.lpx`.

## Stash

Subscribe override `qpin-nl.stoverride`.
