# MITM certificate guide

## Why a certificate is required

Apple WLOC traffic is HTTPS. The proxy must terminate TLS for:

- `gs-loc.apple.com`
- `gs-loc-cn.apple.com`

That requires installing the proxy app’s CA certificate and enabling full trust.

## Security impact (read carefully)

- A trusted MITM CA can decrypt **any** TLS traffic the proxy is configured to intercept.
- This project’s modules only request the two WLOC hosts. **Do not** add broad `*.apple.com` MITM.
- Remove the certificate when you no longer need the tool.
- Use a proxy you trust; malicious configs can expand MITM scope.

## Install (typical iOS flow)

1. In the proxy app, export / install the CA certificate (opens Settings profile).
2. Settings → General → VPN & Device Management → install profile.
3. Settings → General → About → Certificate Trust Settings → enable full trust for the CA.

Exact menus vary by iOS version and proxy app.

## Verify

1. Module enabled, VPN/proxy connected.
2. Open the picker → Run diagnostic (or Save).
3. If save/query fails, MITM/proxy path is not active.

## Remove

1. Disable module.
2. Delete configuration profile for the CA.
3. Confirm Certificate Trust Settings no longer lists it.
