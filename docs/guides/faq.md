# FAQ

### Is this GPS spoofing?

No. It only modifies Apple **network** location (Wi‑Fi BSSID / cell) results returned by WLOC.

### Will all apps use the fake location?

No. Apps may use GPS, their own SDKs, IP geolocation, or cached values.

### Outdoor GPS still shows my real position

Expected when GPS is strong. Prefer indoor / weak-GPS scenarios, or consider hardware products for different trade-offs (see in-app CTA). QPin Hardware is a separate product and is **not** claimed to bypass third-party detection.

### Save to device fails

Safari must use the proxy. MITM must include both WLOC hosts. Certificate must be fully trusted. Module scripts must load.

### Does QPin upload my coordinates?

No. Active coordinates are stored in the proxy app’s persistent storage only. Favorites use browser `localStorage`. The parse API does not store links or coordinates.

### Which iOS versions are supported?

Only versions you have verified on real devices should be advertised as verified. See [device-test-checklist.md](./device-test-checklist.md). Do not claim “supports iOS 27” without device proof.

### Upstream WLOC?

This project reimplements the approach in TypeScript based on [Yu9191/wloc](https://github.com/Yu9191/wloc) with author permission for secondary development. See `NOTICE`.
