# Real device test checklist

Automated unit tests cover Protobuf, settings, coords, SSRF, and modules.
**The following require a physical iPhone** before claiming verification.

Mark only after real-device success. Do **not** mark iOS versions not tested.

| Case | Status | Notes |
|------|--------|-------|
| iOS 18 — save + Apple Maps network location | ☐ Not verified | |
| iOS 26 — save + cache/reboot behavior | ☐ Not verified | |
| Domain `gs-loc.apple.com` (international) | ☐ Not verified | |
| Domain `gs-loc-cn.apple.com` (China) | ☐ Not verified | |
| Wi‑Fi environment | ☐ Not verified | |
| Cellular environment | ☐ Not verified | |
| Indoor | ☐ Not verified | |
| Outdoor (expect GPS may win) | ☐ Not verified | |
| Apple Maps visual check | ☐ Not verified | |
| Clear → passthrough restore | ☐ Not verified | |
| Uninstall module + remove cert | ☐ Not verified | |
| Surge | ☐ Not verified | |
| Shadowrocket | ☐ Not verified | |
| Quantumult X | ☐ Not verified | |
| Loon | ☐ Not verified | |
| Stash | ☐ Not verified | |

## Explicit non-claims

- Do not write “supports iOS 27” until tested on iOS 27 hardware.
- Do not claim all apps or anti-detection guarantees.
