## Overview

This project is a Next.js 16 demo that combines a cached landing page and a logged-in casino lobby on the same `/` route. Unauthenticated users get a cacheable landing shell, while authenticated users get dynamic lobby data driven by a `session` cookie.

## Getting Started

1. Copy env values and fill in your Vercel storage credentials.
2. Start the development server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env` from `.env.example` and set:

- `STORAGE_TYPE=vercel`
- `EDGE_CONFIG`
- `EDGE_CONFIG_ID`
- `VERCEL_ACCESS_TOKEN`
- `VERCEL_TEAM_ID` if the Edge Config belongs to a team

If any of these are missing, the app falls back to in-memory storage.

## Storage Notes

- Reads use the official `@vercel/edge-config` client.
- Writes use the Vercel Edge Config REST API.
- The session cookie is still the login source of truth.
- The demo currently increments the balance by `+1` on each authenticated `/api/auth/me` request.

## Verification

```bash
npm run lint
npm run build
```

## References

- [Vercel Edge Config API](https://vercel.com/docs/storage/edge-config/vercel-api)
- [Next.js Cache Components](https://nextjs.org/docs/app/getting-started/caching)
