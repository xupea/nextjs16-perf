## Overview

This project is a Next.js 16 demo that combines a cached landing page and a logged-in casino lobby on the same `/` route. Unauthenticated users get a cacheable landing shell, while authenticated users get dynamic lobby data driven by a `session` cookie.

## Getting Started

1. Copy env values and fill in your Neon connection string.
2. Start the development server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env` from `.env.example` and set:

- `STORAGE_TYPE=neon`
- `DATABASE_URL`

If `DATABASE_URL` is missing, the app falls back to in-memory storage.

## Storage Notes

- The app uses Neon Postgres via `@neondatabase/serverless`.
- User and session data live in `users` and `sessions` tables.
- The schema is created automatically on first access.
- The session cookie is still the login source of truth.

## Verification

```bash
npm run lint
npm run build
```

## References

- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver)
- [Next.js Cache Components](https://nextjs.org/docs/app/getting-started/caching)
