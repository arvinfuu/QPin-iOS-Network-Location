# Installation guide

中文 Shadowrocket 用户请直接查看：[Shadowrocket 安装与真机排障](./shadowrocket-setup-zh-CN.md)。

## What this tool does

QPin iOS Network Location intercepts Apple **Wi‑Fi / cell network location** responses (`gs-loc.apple.com` / `gs-loc-cn.apple.com`) inside a proxy app and rewrites coordinates in the `/clls/wloc` Protobuf body.

It does **not**:

- Spoof GPS hardware
- Guarantee every app will use the modified location
- Bypass outdoor GPS when the system prefers GPS
- Promise anti-ban or “absolute safety”

## Prerequisites

1. An iPhone with a supported proxy client:
   - Surge
   - Shadowrocket
   - Quantumult X
   - Loon
   - Stash
2. Ability to install and **trust** a MITM CA certificate from that proxy app
3. Safari (or another browser) whose traffic goes through the proxy when saving coordinates

## Quick start

1. Subscribe / import the module for your proxy app (see [proxy-modules.md](./proxy-modules.md)).
2. Enable the module and MITM for **only**:
   - `gs-loc.apple.com`
   - `gs-loc-cn.apple.com`
3. Install and trust the proxy MITM certificate ([mitm-certificate.md](./mitm-certificate.md)).
4. Open the standalone Amplify picker in Safari and choose your language path.
5. Select a point → **Save to device**.
6. Trigger a network location refresh (maps, Wi‑Fi-heavy indoor use). On some iOS builds you may need a reboot to clear `locationd` cache.

## Uninstall / restore real location

1. In the picker: **Clear & restore real network location** (or `action=clear`).
2. Disable or delete the module.
3. Optionally remove the MITM certificate from Settings → General → VPN & Device Management / Certificate Trust Settings.
4. Reboot if cached locations persist.

## Related

- [Proxy modules](./proxy-modules.md)
- [MITM certificate](./mitm-certificate.md)
- [FAQ](./faq.md)
- [Troubleshooting](./troubleshooting.md)
- [Real device test checklist](./device-test-checklist.md)
