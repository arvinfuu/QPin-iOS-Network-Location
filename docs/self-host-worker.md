# Self-host Cloudflare Worker

## Why self-host

- Control rate limits and availability
- Avoid relying on a public demo hostname
- Inspect open-source code before running it

## Deploy

```bash
cd QPin-iOS-Network-Location
npm install
npx wrangler login
npx wrangler deploy -c worker/wrangler.toml
```

Point the picker and shortcuts at your `*.workers.dev` or custom domain.

## Routes

| Path | Purpose |
|------|---------|
| `/` or `/tools/ios-network-location` | Map picker HTML |
| `/api/parse?u=&format=json` | Map link parse |
| `/api/health` | Health check |

## Privacy notes

- Do not enable logging that captures full `u=` query strings in production analytics
- No durable storage is required for parse

## Local dev

```bash
npm run dev:worker
# or map-only UI:
npm run dev:web
```
