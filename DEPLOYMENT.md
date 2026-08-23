# Filevera Deployment & Configuration Guide

## Requirements
- Node.js 20+
- npm
- Ghostscript installed on the host or container when PDF compression is enabled
- A public HTTPS domain or reverse proxy for production deployment

## Quick Start
```bash
npm install
cp .env.example .env.local
```

## Production Build & Run
```bash
npm run build
npm run start
```

---

## Google Cloud OAuth 2.0 Configuration

Filevera uses **Better Auth** with native OpenID Connect / OAuth 2.0 for Google Authentication.

### Step-by-Step Google Cloud Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `Filevera-Production`).
3. Under **APIs & Services** → **OAuth consent screen**:
   - Choose **External** User Type.
   - Fill in **App Name** (`Filevera`), **User support email**, and **Developer contact email**.
   - Add scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   - Publish the app or add test users during development.
4. Under **APIs & Services** → **Credentials**:
   - Click **Create Credentials** → **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Filevera Web Client`.
   - **Authorized JavaScript origins**:
     - Development: `http://localhost:3000`
     - Production: `https://fileveraio.vercel.app` (or your custom `NEXT_PUBLIC_SITE_URL`)
   - **Authorized redirect URIs**:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://fileveraio.vercel.app/api/auth/callback/google`
5. Copy the generated **Client ID** and **Client Secret** into your `.env.local` or hosting environment variables:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

---

## Authentication Architecture & Security

- **Library**: `better-auth`
- **Database**: PostgreSQL with connection pooling and automated schema initialization via `DATABASE_URL`.
- **Session Handling**: Cryptographically signed HttpOnly session cookies with automatic token rotation and session isolation.
- **Account Linking**: Enabled for trusted `google` provider. If a user registers with email/password and later clicks *Continue with Google* using the same verified email, the accounts are linked without duplicating user records.
- **Error Handling**: Graceful fallback when Google credentials are not configured, displaying user-friendly notices without exposing stack traces or internal endpoints.
