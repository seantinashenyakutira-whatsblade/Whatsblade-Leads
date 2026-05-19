# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **New project**
3. Enter:
   - **Name**: `whatsblade-leads`
   - **Database Password**: Generate a strong password (save it somewhere safe)
   - **Region**: Choose the closest to your users (e.g., `us-east-1`)
4. Click **Create new project** (takes ~2 minutes)

## Step 2: Get API Credentials

1. In your project dashboard, go to **Project Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)
3. Open `.env.local` and paste these values

## Step 3: Run the Database Schema

1. In your project dashboard, go to **SQL Editor**
2. Click **New query**
3. Open `src/lib/db/schema.sql` in your code editor and copy the entire contents
4. Paste into the SQL Editor and click **Run** (or Ctrl+Enter)
5. Verify all tables were created: Go to **Table Editor** and you should see:
   - `users`, `leads`, `campaigns`, `campaign_leads`, `messages`
   - `activities`, `api_keys`, `webhooks`, `notifications`

## Step 4: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Under **Email**, make sure it's enabled
3. (Optional) Configure other providers (Google, GitHub, etc.)
4. Go to **Authentication** → **Settings**
5. Under **Site URL**, enter: `http://localhost:3000`
6. Under **Redirect URLs**, add: `http://localhost:3000/callback`

## Step 5: Set Up Storage (for attachments)

1. Go to **Storage** → **New bucket**
2. Name: `lead-attachments`
3. Set to **Public** if leads need to share files, or **Private** for security
4. Click **Create bucket**

## Step 6: Generate Encryption Key

Run this command to generate your API key vault encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as your `ENCRYPTION_KEY` in `.env.local`.

## Step 7: (Optional) Set Up PostHog

1. Go to [app.posthog.com](https://app.posthog.com) and create an account
2. Create a new project
3. Copy the **Project API Key** → `NEXT_PUBLIC_POSTHOG_KEY`
4. Set `NEXT_PUBLIC_POSTHOG_HOST` to `https://app.posthog.com`

## Step 8: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you should see the login page.

## First User

The first user to register will automatically get a profile created via the database trigger (`on_auth_user_created`). By default, all new users are assigned the `agent` role. To make yourself an admin:

1. Go to your Supabase **Table Editor**
2. Open the `users` table
3. Find your user record and change `role` from `agent` to `admin`
