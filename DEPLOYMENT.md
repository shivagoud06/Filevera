# Deployment Guide

## Requirements
- Node.js 20+
- npm
- Ghostscript installed on the host or container when PDF compression is enabled
- A public HTTPS domain or a reverse proxy in front of the app

## Install
```bash
npm install
cp .env.example .env.local
```

## Build
```bash
npm run build
```

## Start
```bash
npm run start
```

## Production notes
- Set `NEXT_PUBLIC_SITE_URL` to the public domain.
- Install Ghostscript and set `GHOSTSCRIPT_PATH` if it is not on PATH.
- Set `BETTER_AUTH_SECRET` to a long random value in production and keep `AUTH_DATABASE_PATH` on persistent storage.
- Set `NEXT_PUBLIC_SUPPORT_EMAIL` before publishing the contact and legal pages.
- Password reset email delivery and Google OAuth are not enabled until an email provider and OAuth credentials are configured in the Better Auth setup.
- To enable Google sign-in, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. In Google Cloud Console, add this development redirect URI: `{NEXT_PUBLIC_SITE_URL}/api/auth/callback/google` (normally `http://localhost:3000/api/auth/callback/google`). For production, use the same path on the configured HTTPS `NEXT_PUBLIC_SITE_URL`, for example `https://your-filevera-domain.example/api/auth/callback/google`.
- Google sign-in uses Better Auth's existing account linking and session handling. Do not expose either Google credential in client-side variables.
- Keep PDF/image processing behind the application server and clean temporary files in `finally` blocks.
- Use a production reverse proxy or platform to enforce HTTPS, caching, and security headers.
