# Whatsblade Leads

Enterprise CRM for lead discovery, enrichment, and outreach. Built with Next.js 14, Supabase, tRPC, and AI-powered insights.

## Features

- **Lead Discovery** — Search businesses via Google Places API and Facebook Graph API
- **AI Enrichment** — Automatic lead scoring, website analysis, social media detection
- **Pipeline Management** — 7-stage Kanban board with drag-and-drop
- **Campaigns** — Create and manage outreach campaigns
- **AI Messaging** — Generate personalized outreach messages with Gemini AI
- **Real-time Notifications** — Push notifications for lead replies, meeting reminders, daily summaries
- **PWA Support** — Install on Android/iOS, offline lead viewing, background sync
- **Enterprise Security** — RLS policies, rate limiting, CORS, session timeout, input sanitization
- **Export** — CSV and Excel export for leads and campaigns

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| API | tRPC + React Query |
| AI | Google Gemini |
| Cache | Upstash Redis |
| UI | Radix UI + Tailwind CSS |
| PWA | Service Worker + Web Push |
| Deployment | Vercel |

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google Cloud Platform account
- Vercel account (for deployment)
- Upstash account (for Redis caching)

### 1. Clone and Install

```bash
git clone <repository-url>
cd whatsblade-leads
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Fill in all variables in `.env.local` (see [Environment Variables](#environment-variables) below).

### 3. Supabase Setup

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **SQL Editor** and run the migrations in order:
   - `src/migrations/001_initial_schema.sql`
   - `src/migrations/002_business_intelligence.sql`
   - `src/migrations/003_enterprise_crm.sql`
   - `src/migrations/004_push_notifications_settings.sql`
4. Go to **Authentication → Providers** and enable **Email** provider
5. Set **Site URL** to your app URL (e.g., `http://localhost:3000` or `https://w-leads.vercel.app`)
6. Add redirect URLs under **URL Configuration**:
   - `http://localhost:3000/callback`
   - `https://w-leads.vercel.app/callback`
7. Go to **Storage** and create a bucket named `lead-attachments` (set to private)

### 4. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `ENCRYPTION_KEY` in `.env.local`.

### 5. Generate VAPID Keys (for Push Notifications)

```bash
npx web-push generate-vapid-keys
```

Copy the output to:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- Set `VAPID_SUBJECT` to `mailto:your-email@domain.com`

### 6. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register your first account.

To make your first user an admin, run this in Supabase SQL Editor:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## Environment Variables

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL | Your deployment URL |
| `APP_NAME` | No | App display name | Any string |
| `NEXT_PUBLIC_APP_ENV` | Yes | Environment | `development`, `staging`, or `production` |
| `ENCRYPTION_KEY` | Yes | 64-char hex key for API vault | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GOOGLE_PLACES_API_KEY` | Yes | Google Places API key | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_ID` | No | OAuth client ID for Google Sheets/Calendar | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | No | OAuth client secret | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 |
| `FACEBOOK_ACCESS_TOKEN` | No | Facebook Graph API token | Meta for Developers → Your App → Settings |
| `FACEBOOK_APP_ID` | No | Facebook App ID | Meta for Developers → Your App → Settings |
| `FACEBOOK_APP_SECRET` | No | Facebook App Secret | Meta for Developers → Your App → Settings |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL | [console.upstash.com](https://console.upstash.com) → Create Redis |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token | [console.upstash.com](https://console.upstash.com) → Your Redis → REST API |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | Web push public key | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | No | Web push private key | `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | No | Web push contact email | `mailto:your-email@domain.com` |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project key | PostHog → Project Settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog API host | PostHog → Project Settings |
| `SESSION_MAX_AGE` | No | Session timeout in seconds | Default: `1800` (30 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max API requests per window | Default: `100` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms | Default: `60000` (1 min) |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated allowed origins | e.g., `http://localhost:3000,https://w-leads.vercel.app` |
| `CSP_POLICY` | No | Content Security Policy | Customize as needed |
| `VERCEL_URL` | No | Vercel deployment URL | Set automatically by Vercel |
| `CRON_SECRET` | No | Secret for cron job auth | Generate: `openssl rand -hex 32` |

---

## Getting API Keys

### Google Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - **Places API (New)**
   - **Maps JavaScript API**
   - **Geocoding API**
4. Go to **APIs & Services → Credentials**
5. Click **Create Credentials → API Key**
6. Restrict the key to the enabled APIs
7. Copy the key to `GOOGLE_PLACES_API_KEY`

### Google OAuth (Sheets/Calendar)

1. In Google Cloud Console, go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/integrations/google-sheets/oauth/callback`
   - `https://w-leads.vercel.app/api/integrations/google-sheets/oauth/callback`
5. Copy Client ID and Client Secret

### Facebook Graph API

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app (type: **Business**)
3. Add **Facebook Login** product
4. Go to **Settings → Basic** and copy App ID and App Secret
5. Generate a Page Access Token with `pages_read_engagement` permission
6. Add to `FACEBOOK_ACCESS_TOKEN`

### Gemini AI

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy to `GEMINI_API_KEY`

### Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com/)
2. Click **Create Database**
3. Choose region closest to your users
4. Copy the **REST URL** and **REST Token**

---

## Vercel Deployment

### Install Vercel CLI

```bash
npm install -g vercel
```

### Login to Vercel

```bash
vercel login
```

### Deploy

```bash
vercel
```

Follow the prompts:
- Link to existing project or create new
- Set project name: `whatsblade-leads`
- Directory: `./` (root)
- Override settings: **No**

### Set Environment Variables

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ENCRYPTION_KEY production
vercel env add GOOGLE_PLACES_API_KEY production
vercel env add GEMINI_API_KEY production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
vercel env add VAPID_PRIVATE_KEY production
vercel env add VAPID_SUBJECT production
vercel env add CRON_SECRET production
vercel env add NEXT_PUBLIC_APP_ENV production
```

Repeat for `preview` and `development` environments as needed.

### Deploy to Production

```bash
vercel --prod
```

### Set Custom Domain

```bash
vercel domains add w-leads.vercel.app
```

Or configure in Vercel Dashboard:
1. Go to your project → **Settings → Domains**
2. Add `w-leads.vercel.app`
3. Wait for DNS propagation (usually instant for Vercel subdomains)

### Set Up Cron Jobs

Add to `vercel.json` (already included):

```json
{
  "crons": [
    {
      "path": "/api/cron/enrich",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Or configure in Vercel Dashboard → **Settings → Cron Jobs**.

---

## PWA Install Guide

### Android (Chrome)

1. Open the app URL in Chrome
2. Tap the **Install** icon in the address bar (or the **⋮** menu → **Install App**)
3. Confirm installation
4. The app will appear on your home screen

### iOS (Safari)

1. Open the app URL in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Rename if desired, then tap **Add**
5. The app icon will appear on your home screen

### Desktop (Chrome/Edge)

1. Open the app URL
2. Click the **Install** icon in the address bar
3. Confirm installation
4. The app will be available in your applications menu

### Offline Support

Once installed, the app caches:
- Dashboard pages
- Lead data (last viewed)
- Search results (cached via Redis, 24hr TTL)
- Static assets (JS, CSS, fonts, icons)

To view saved leads offline, open the app — cached data will load automatically.

---

## Project Structure

```
whatsblade-leads/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   ├── robots.txt              # SEO robots file
│   └── icons/                  # App icons
├── src/
│   ├── app/
│   │   ├── (auth)/             # Auth routes (login, register)
│   │   ├── (dashboard)/        # Dashboard routes
│   │   └── api/                # API routes (tRPC, search, webhooks, cron)
│   ├── components/
│   │   ├── dashboard/          # Dashboard UI components
│   │   ├── leads/              # Lead management components
│   │   ├── pipeline/           # Kanban board components
│   │   ├── discover/           # Search/discovery components
│   │   ├── outreach/           # Messaging components
│   │   ├── mobile/             # Mobile-specific (bottom nav)
│   │   └── ui/                 # Base UI components (shadcn)
│   ├── hooks/                  # React hooks
│   ├── lib/
│   │   ├── db/                 # Supabase client + schema
│   │   ├── trpc/               # tRPC routers
│   │   ├── ai/                 # Gemini AI integration
│   │   ├── enrichment/         # Lead enrichment engine
│   │   ├── redis/              # Redis caching
│   │   ├── security/           # Sanitization, CORS
│   │   └── validations/        # Zod schemas
│   ├── migrations/             # Versioned SQL migrations
│   ├── providers/              # Context providers
│   └── types/                  # TypeScript types
├── middleware.ts               # Auth + security middleware
├── next.config.mjs             # Next.js configuration
├── vercel.json                 # Vercel deployment config
├── tailwind.config.ts          # Tailwind configuration
└── .env.example                # Environment variables template
```

---

## Security

- **Row Level Security (RLS)** — Enforced on every Supabase table
- **Rate Limiting** — 100 requests/min per user (Redis-backed)
- **Session Timeout** — 30 minutes of inactivity
- **Input Sanitization** — DOMPurify + custom sanitizers on all forms
- **CORS Policy** — Configurable allowed origins
- **Security Headers** — CSP, X-Frame-Options, HSTS, etc.
- **API Keys** — Stored encrypted in database (AES-256-GCM), never exposed to client
- **Environment Validation** — All env vars validated at runtime with Zod

---

## Database Migrations

Run migrations in order in Supabase SQL Editor:

1. `001_initial_schema.sql` — Core tables (users, leads, campaigns, messages, etc.)
2. `002_business_intelligence.sql` — Google/Facebook enrichment fields
3. `003_enterprise_crm.sql` — Pipeline, notes, reminders, templates
4. `004_push_notifications_settings.sql` — Push subscriptions, preferences, integrations

For existing databases, all migrations use `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` for safe re-runs.

---

## License

Private — All rights reserved.
