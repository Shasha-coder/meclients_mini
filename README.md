# meclients

Done-for-you AI front desk. Paste a business website → the platform builds a voice receptionist, provisions a phone number, and goes live.

A visitor describes their business (or pastes a URL). meclients scrapes the site, drafts a Retell voice agent, lets them test it in the browser, then Stripe checkout provisions Twilio + SIP and the agent starts answering calls 24/7. Bookings, call logs, and daily summaries land in the dashboard.

---

## Table of contents

1. [Live product](#live-product)
2. [What it does](#what-it-does)
3. [Tech stack](#tech-stack)
4. [Getting started](#getting-started)
5. [Environment variables](#environment-variables)
6. [Project layout](#project-layout)
7. [Key flows](#key-flows)
8. [Security](#security)
9. [Scripts](#scripts)

---

## Live product

This is a production-style SaaS codebase. Run it locally with the steps below, then deploy to Vercel with the same environment variables.

## What it does

- **Onboarding in minutes** — scrape a website with Firecrawl, extract hours/services, draft a vertical-specific voice agent
- **In-browser test call** — talk to the agent before paying
- **Provisioning** — Stripe checkout → Twilio subaccount + local number → Retell SIP trunk → agent is live
- **Operations dashboard** — bookings calendar, call history, hours, services, profile
- **Admin panel** — internal ops for tenants and numbers
- **Webhooks** — Stripe billing, Retell call-ended summaries via Resend

## Tech stack

| Layer | Technology |
|-------|------------|
| App | Next.js 14 (App Router, TypeScript) |
| UI | Tailwind CSS, Radix UI, Geist |
| Auth + data | Supabase (Postgres, Auth, RLS) |
| Voice | Retell AI |
| Telephony | Twilio (numbers, SIP, SMS) |
| Payments | Stripe |
| Scraping | Firecrawl |
| Email | Resend |
| Cache | Upstash Redis |
| Deploy | Vercel |

## Getting started

**Prerequisites:** Node.js 18+, a Supabase project, and API keys for the services you want to exercise locally (Stripe test mode is enough for checkout).

```bash
git clone https://github.com/Shasha-coder/meclients_mini.git
cd meclients_mini
copy .env.example .env.local
npm install
```

Fill `.env.local` (see [Environment variables](#environment-variables)). Then load the schema:

1. Open Supabase → SQL Editor
2. Run `supabase/schema.sql`
3. Run `supabase/booking_setup.sql`
4. Authentication → Providers → enable Email
5. Authentication → URL Configuration → Site URL = `http://localhost:3000`

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First admin user

After you sign up:

```sql
INSERT INTO admin_users (id, email, name, role)
SELECT id, email, 'Your Name', 'super_admin'
FROM auth.users
WHERE email = 'you@example.com';
```

## Environment variables

Copy `.env.example` → `.env.local`. **Do not put real keys in git.**

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) | Server-only; bypasses RLS — never expose to the browser |
| `STRIPE_SECRET_KEY` | Checkout | Use `sk_test_…` locally |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Checkout | Matching publishable key |
| `STRIPE_WEBHOOK_SECRET` | Webhooks | Stripe CLI or dashboard signing secret |
| `RETELL_API_KEY` | Voice | Retell dashboard |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Phone | Twilio console |
| `TWILIO_PHONE_NUMBER` | SMS / OTP | E.164 number you own |
| `FIRECRAWL_API_KEY` | Onboarding scrape | firecrawl.dev |
| `OPENROUTER_API_KEY` | LLM | Optional depending on route |
| `RESEND_API_KEY` | Email | resend.com |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Cache | Upstash |

Stripe webhook (local):

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Events: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`.

Retell webhook (production): `https://your-domain.com/api/webhooks/retell`.

## Project layout

```
app/
  (public)/          Landing + public booking pages
  (auth)/            Login
  (onboarding)/      URL → agent → test → pay
  (dashboard)/       Client workspace (bookings, calls, settings)
  (admin)/           Internal admin
  api/               Scrape, provision, tools, Stripe webhook
  actions/           Server actions (onboarding, Stripe, tenant)

components/          Dashboard, admin, onboarding, landing
lib/                 Supabase, Retell, Twilio, Stripe, Resend, Firecrawl
types/               Shared TypeScript types
supabase/            SQL schema
middleware.ts        Auth routing
```

## Key flows

**Onboarding:** `/` → paste URL → `/api/scrape` → confirm → agent draft → test call → Stripe → `/api/provision` → live number.

**Incoming call:** Retell answers → call ends → webhook → call log + Resend summary.

**Booking:** Agent hits `/api/tools/availability` → caller picks a slot → `/api/tools/book` → confirmation email.

## Security

- Secrets live in `.env.local` and in the Vercel dashboard only. `.env*` is gitignored except `.env.example` (placeholders).
- The Supabase **service role key** is server-only. Client code uses the anon key + RLS.
- Stripe **live** keys must never be committed. Local development uses test keys.
- Rotate any key that was ever pasted into git, chat, or a screenshot.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (default port 3000) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Deploy

```bash
npx vercel --prod
```

Add the same variables in Vercel → Settings → Environment Variables. Point Stripe and Retell webhooks at the production URL.

---

Private portfolio project.
