# Privacy policy

**Product:** QPin iOS Network Location (free tool)

## What stays on your device

| Data | Where |
|------|--------|
| Active longitude / latitude / accuracy | Proxy app persistent store (`qpin_network_location`) |
| Favorites list | Browser `localStorage` only |
| Proxy debug logs | Proxy app log (user-controlled; disable sensitive debug) |

## Browser search requests

The official Amplify app has no QPin search backend. User-initiated place searches fall back through:

- Open-Meteo geocoding
- Photon
- Nominatim

The search term is sent by the browser to the provider that answers the request. It is not sent to QPin analytics or a QPin API. Coordinate text and map URLs are parsed locally without resolving short links.

The optional self-host Worker under `worker/` is reference code only and is not part of the official Amplify deployment.

## What we do not collect

- Decrypted Apple WLOC response bodies
- Wi‑Fi BSSID lists or cell tower identifiers from WLOC
- GPS traces
- Analytics of coordinates or map search keywords

## Analytics (if enabled by host)

Only anonymous feature events:

- `network_location_save`
- `network_location_clear`
- `network_location_diagnostic`
- `hardware_cta_click`

No coordinate or search-term parameters.

## Third parties

- Map tiles: OpenStreetMap / CARTO (browser requests)
- Place search: Open-Meteo, Photon, Nominatim (user-initiated fallback)
- Upstream concepts: WLOC project (local scripts; see NOTICE)

## Contact

Use the project GitHub issues for privacy questions about this open-source tool.
