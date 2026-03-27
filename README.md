# meclients

AI front-desk operating system. URL → agent → phone number → live.

## Stack
- **Next.js 14** (App Router)
- **Supabase** (Postgres + Auth + RLS)
- **Retell AI** (voice agent)
- **Twilio** (SIP trunking + phone numbers)
- **Stripe** (billing + webhooks)
- **Resend** (transactional email)
- **Firecrawl** (website scraping)
- **Vercel** (deployment)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
```bash
cp .env.example .env.local
# Fill in all values
```

### 3. Supabase
- Create project at supabase.com
- Paste `meclients_schema.sql` into SQL editor → Run
- Enable Email auth in Authentication → Providers
- Go to Authentication → URL Configuration → set Site URL to your domain

### 4. Stripe
- Create two products: Starter ($197/mo) and setup fee ($99 one-time)
- Copy price IDs to `.env.local`
- Add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
- Events to listen: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`

### 5. Retell AI
- Get API key from retell.ai
- Set webhook URL: `https://yourdomain.com/api/webhooks/retell`

### 6. Twilio
- Create account at twilio.com
- Enable subaccounts
- Get Account SID + Auth Token

### 7. Firecrawl
- Get API key at firecrawl.dev

### 8. Resend
- Create account at resend.com
- Verify your sending domain

### 9. Run locally
```bash
npm run dev
```

### 10. Deploy to Vercel
```bash
npx vercel --prod
```
Add all env vars in Vercel dashboard → Settings → Environment Variables.

---

## Project structure

```
app/
  (public)/           ← Landing page (no auth)
  (auth)/             ← Login + signup
  (onboarding)/       ← 4-step agent setup flow
  (dashboard)/        ← Client dashboard (protected)
    dashboard/        ← Overview + stats
    bookings/         ← Week calendar view
    calls/            ← Call history
    settings/         ← Hours, services, profile
  (admin)/            ← Internal admin panel
  api/
    scrape/           ← Firecrawl + AI extraction
    agent/            ← Create Retell draft agent
    availability/     ← Booking slot checker
    bookings/         ← Create/update bookings
    provision/        ← Full A→Z provisioning job
    webhooks/
      stripe/         ← Stripe events
      retell/         ← Call ended → log + email
      twilio/         ← SMS events (future)

components/
  dashboard/          ← Sidebar, stats cards
  admin/              ← Admin-specific components
  onboarding/         ← Step components
  landing/            ← Hero, ticker, pricing

lib/
  supabase/           ← client.ts + server.ts
  retell/             ← Retell SDK wrapper
  twilio/             ← Twilio client wrapper
  stripe/             ← Stripe client + helpers
  resend/             ← Email templates
  firecrawl/          ← Scrape wrapper

types/index.ts        ← All shared TypeScript types
middleware.ts         ← Auth routing
```

---

## First super_admin

After deploying, insert yourself as admin:
```sql
INSERT INTO admin_users (id, email, name, role)
SELECT id, email, 'Your Name', 'super_admin'
FROM auth.users
WHERE email = 'your@email.com';
```

---

## API routes to uncomment

The file `app/api/routes.reference.ts` contains all API route implementations as comments.
Copy each section into its own `route.ts` file and uncomment.

---

## Key flows

**Onboarding:** `/` → paste URL → `/api/scrape` → confirm → `/api/agent` → test → Stripe → `/api/provision` → live

**Incoming call:** Retell receives call → processes → call ends → webhook → `/api/webhooks/retell` → logs call + outcome → Resend sends summary

**Booking:** Agent calls `/api/availability` → gets slots → caller picks → `/api/bookings` → confirmation email sent
