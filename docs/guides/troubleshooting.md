# Troubleshooting

## Save / query returns network error

| Check | Action |
|-------|--------|
| Proxy connected | VPN icon / proxy status on |
| Module enabled | Toggle on in app |
| MITM hosts | Only the two `gs-loc*` hosts required |
| Certificate trust | Full trust enabled |
| Script URL reachable | Open `qpin-nl-settings.js` URL in Safari via proxy |

## Location does not change

1. Confirm save succeeded (Active on device shows coordinates).
2. Confirm WLOC script logs “patched” (debug log level).
3. Try indoor Wi‑Fi; disable strong outdoor GPS if possible.
4. Reboot to clear `locationd` cache (especially newer iOS).
5. Apple Maps may blend sources — try apps that rely more on network location.

## Parse map link fails

- Link must be from allowlisted domains (Apple / Google / Amap / Baidu).
- Self-host Worker if public rate limits hit.
- Paste raw `lat,lon` as fallback.

## Real location after clear

Clear sets passthrough. If cache remains, reboot. Disable module for full restore.

## Script errors / blocked Apple location entirely

This project **fail-opens**: parse failures return the original body. If location breaks, disable the module and check for conflicting rules.
