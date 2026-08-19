# meclients

Paste a business website. Walk away with a live AI receptionist and a phone number.

Onboarding is the product: scrape the site → draft a Retell agent → test it in the browser → pay with Stripe → Twilio provisions a number. After that, the dashboard is bookings, call logs, and hours — not a prompt playground.

---

## Stack

| | |
|---|---|
| App | Next.js 14, TypeScript, Tailwind, Radix |
| Data | Supabase (Postgres, Auth, RLS) |
| Voice + phone | Retell AI, Twilio SIP |
| Money | Stripe |
| Other | Firecrawl, Resend, Upstash |

## Run it

```bash
git clone https://github.com/Shasha-coder/meclients_mini.git
cd meclients_mini
copy .env.example .env.local
npm install
```

Fill `.env.local`, then in Supabase SQL Editor run `supabase/schema.sql` and `supabase/booking_setup.sql`. Enable Email auth.

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)

Need an admin user after signup:

```sql
INSERT INTO admin_users (id, email, name, role)
SELECT id, email, 'Your Name', 'super_admin'
FROM auth.users
WHERE email = 'you@example.com';
```

## How a tenant goes live

```
Website URL  →  Firecrawl scrape  →  draft agent  →  in-browser test
       →  Stripe Checkout  →  Twilio number + SIP  →  answering calls
```

Incoming call: Retell → webhook → call log + email summary.  
Booking: agent hits `/api/tools/availability` → slot picked → `/api/tools/book`.

## Layout

```
app/(public) (auth) (onboarding) (dashboard) (admin)
app/api          scrape, provision, tools, Stripe webhook
lib/             supabase, retell, twilio, stripe, resend
supabase/        schema
```

## Env

Copy `.env.example`. Use Stripe **test** keys locally. The service-role key is server-only. Never commit `.env.local`.

| Need | Variables |
|------|-----------|
| App | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Checkout | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Voice | `RETELL_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| Scrape / mail | `FIRECRAWL_API_KEY`, `RESEND_API_KEY` |

```bash
npm run dev      # localhost:3000
npm run build
npm run lint
```
