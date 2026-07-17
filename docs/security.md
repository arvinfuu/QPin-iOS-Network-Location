# Security boundaries

## Trust model

1. User installs a **proxy MITM CA** and enables interception for two Apple hosts.
2. Response script may rewrite WLOC Protobuf coordinates.
3. Settings script answers synthetic requests on `/qpin-nl/settings`.

## Boundaries

| In scope | Out of scope |
|----------|----------------|
| `gs-loc.apple.com` | Other Apple services |
| `gs-loc-cn.apple.com` | iCloud, App Store, etc. |
| `/clls/wloc` responses | Arbitrary HTTPS sites |
| Local settings API on same hosts | Uploading locations to QPin backend |

## Fail-open

If body parsing or patching fails, the **original response** is returned. The tool must not hard-break Apple network location due to script bugs.

## Worker SSRF

`/api/parse` outbound fetches:

- Allowlisted map domains only
- Block localhost, private IPv4, link-local, cloud metadata hosts
- HTTP(S) only
- Max redirect hops
- Timeouts

## Certificate risk

A trusted MITM CA is powerful. Users should:

- Prefer modules that only list the two WLOC hostnames
- Remove trust when finished
- Avoid unknown third-party module URLs

## Reporting

Report security issues via GitHub private security advisories when available, or public issues if no sensitive detail is involved.
