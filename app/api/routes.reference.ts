// ============================================================
// API ROUTES — meclients
// Each section = one file. Split into individual route.ts files.
// ============================================================

// ============================================================
// app/api/scrape/route.ts
// ============================================================
/*
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  try {
    // Firecrawl scrape
    const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({ url, formats: ['markdown'] }),
    })
    const scrapeData = await scrapeRes.json()
    const markdown = scrapeData.data?.markdown ?? ''

    // Use Claude/GPT to extract structured business info
    const extractRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Extract business info from this website content as JSON only. Fields: name, industry (dental/legal/salon/medical/restaurant/other), description, hours, services (comma-separated), phone, address. If missing, use empty string.\n\n${markdown.slice(0, 3000)}`
        }]
      })
    })
    const extractData = await extractRes.json()
    const raw = extractData.content[0].text
    const info = JSON.parse(raw.replace(/```json|```/g, '').trim())

    return NextResponse.json({ info })
  } catch (e) {
    return NextResponse.json({ error: 'Scrape failed' }, { status: 500 })
  }
}
*/

// ============================================================
// app/api/agent/route.ts — Create Retell draft agent
// ============================================================
/*
import { NextRequest, NextResponse } from 'next/server'
import Retell from 'retell-sdk'

const retell = new Retell({ apiKey: process.env.RETELL_API_KEY! })

export async function POST(req: NextRequest) {
  const { info, url } = await req.json()

  // Build vertical pack prompt
  const prompt = buildPrompt(info)

  // Create LLM in Retell
  const llm = await retell.llm.create({
    model: 'gpt-4o-mini',
    general_prompt: prompt,
  })

  // Create agent
  const agent = await retell.agent.create({
    llm_websocket_url: llm.llm_websocket_url,
    agent_name: `${info.name} Receptionist`,
    voice_id: 'elevenlabs-jessica',
    language: 'en-US',
  })

  return NextResponse.json({ agent_id: agent.agent_id })
}

function buildPrompt(info: any) {
  return `You are a professional AI receptionist for ${info.name}, a ${info.industry} business.

BUSINESS INFO:
- Name: ${info.name}
- Services: ${info.services}
- Hours: ${info.hours}
- Escalation: ${info.escalation_phone || 'Take a message'}

RULES:
1. Greet warmly, identify yourself as the receptionist for ${info.name}
2. Answer questions about services, hours, and location
3. Offer to book appointments when appropriate
4. For emergencies or complex issues, offer to transfer or take a message
5. Never make up information not provided
6. Keep responses concise and professional
7. Always end by asking if there's anything else you can help with

When booking: collect name, phone, preferred service, and preferred time.`
}
*/

// ============================================================
// app/api/availability/route.ts — Check booking slots
// ============================================================
/*
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { parseISO, format, addMinutes, isWithinInterval } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenant_id = searchParams.get('tenant_id')
  const date = searchParams.get('date') // YYYY-MM-DD
  const service_type_id = searchParams.get('service_type_id')

  if (!tenant_id || !date) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = createServiceClient()

  // Get business profile for timezone
  const { data: profile } = await supabase.from('business_profiles').select('timezone').eq('tenant_id', tenant_id).single()
  const timezone = profile?.timezone ?? 'UTC'

  // Get day schedule
  const dayOfWeek = new Date(date).getDay()
  const { data: schedule } = await supabase.from('availability_schedules')
    .select('*').eq('tenant_id', tenant_id).eq('day_of_week', dayOfWeek).single()

  if (!schedule?.is_open) return NextResponse.json({ slots: [], message: 'Closed this day' })

  // Get service type
  const { data: service } = service_type_id
    ? await supabase.from('service_types').select('*').eq('id', service_type_id).single()
    : { data: { duration_mins: 30, buffer_mins: 10 } }

  const duration = service?.duration_mins ?? 30
  const buffer = service?.buffer_mins ?? 10

  // Get existing bookings for that day
  const { data: existing } = await supabase.from('bookings')
    .select('start_time, end_time')
    .eq('tenant_id', tenant_id)
    .gte('start_time', `${date}T00:00:00Z`)
    .lt('start_time', `${date}T23:59:59Z`)
    .neq('status', 'cancelled')

  // Generate slots
  const slots: string[] = []
  const [openH, openM] = schedule.open_time.split(':').map(Number)
  const [closeH, closeM] = schedule.close_time.split(':').map(Number)

  let cursor = fromZonedTime(new Date(`${date}T${String(openH).padStart(2, '0')}:${String(openM).padStart(2, '0')}:00`), timezone)
  const closeTime = fromZonedTime(new Date(`${date}T${String(closeH).padStart(2, '0')}:${String(closeM).padStart(2, '0')}:00`), timezone)

  while (addMinutes(cursor, duration) <= closeTime) {
    const slotEnd = addMinutes(cursor, duration)
    const clash = existing?.some(b =>
      isWithinInterval(cursor, { start: parseISO(b.start_time), end: parseISO(b.end_time) }) ||
      isWithinInterval(slotEnd, { start: parseISO(b.start_time), end: parseISO(b.end_time) })
    )
    if (!clash) slots.push(cursor.toISOString())
    cursor = addMinutes(cursor, duration + buffer)
  }

  return NextResponse.json({ slots, timezone })
}
*/

// ============================================================
// app/api/bookings/route.ts — Create booking
// ============================================================
/*
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { addMinutes, parseISO } from 'date-fns'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tenant_id, service_type_id, caller_name, caller_phone, caller_email, start_time, call_id, notes } = body

  const supabase = createServiceClient()

  // Get service duration
  let duration = 30
  if (service_type_id) {
    const { data: s } = await supabase.from('service_types').select('duration_mins').eq('id', service_type_id).single()
    duration = s?.duration_mins ?? 30
  }

  const end_time = addMinutes(parseISO(start_time), duration).toISOString()

  const { data, error } = await supabase.from('bookings').insert({
    tenant_id, service_type_id, caller_name, caller_phone, caller_email,
    start_time, end_time, call_id, notes,
    status: 'confirmed', booked_by: call_id ? 'agent' : 'manual',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // TODO: Send confirmation email via Resend

  return NextResponse.json({ booking: data })
}
*/

// ============================================================
// app/api/webhooks/retell/route.ts — Handle Retell call events
// ============================================================
/*
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { event, call } = body

  // Verify webhook (check Retell docs for signature)
  const supabase = createServiceClient()

  // Idempotency check
  const eventId = call.call_id + '_' + event
  const { data: existing } = await supabase.from('webhook_events')
    .select('id').eq('source', 'retell').eq('event_id', eventId).single()
  if (existing) return NextResponse.json({ ok: true })

  await supabase.from('webhook_events').insert({
    source: 'retell', event_type: event, event_id: eventId, payload: body
  })

  if (event === 'call_ended') {
    // Find tenant by retell agent id
    const { data: agent } = await supabase.from('retell_agents')
      .select('tenant_id').eq('retell_agent_id', call.agent_id).single()

    if (agent) {
      // Log call
      const { data: callRecord } = await supabase.from('calls').insert({
        tenant_id: agent.tenant_id,
        retell_call_id: call.call_id,
        direction: 'inbound',
        caller_phone: call.from_number,
        duration_secs: call.duration_ms ? Math.round(call.duration_ms / 1000) : null,
        status: 'completed',
        transcript: call.transcript,
        started_at: call.start_timestamp,
        ended_at: call.end_timestamp,
      }).select().single()

      // Detect outcome from transcript and log
      // TODO: Run AI outcome detection and insert call_outcomes

      // Send email summary via Resend
      // TODO: sendCallSummaryEmail(agent.tenant_id, callRecord)
    }
  }

  await supabase.from('webhook_events').update({ processed: true, processed_at: new Date().toISOString() })
    .eq('source', 'retell').eq('event_id', eventId)

  return NextResponse.json({ ok: true })
}
*/

// ============================================================
// app/api/webhooks/stripe/route.ts
// ============================================================
/*
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Idempotency
  const { data: existing } = await supabase.from('webhook_events')
    .select('id').eq('source', 'stripe').eq('event_id', event.id).single()
  if (existing) return NextResponse.json({ ok: true })

  await supabase.from('webhook_events').insert({
    source: 'stripe', event_type: event.type, event_id: event.id, payload: event as any
  })

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const tenantId = session.metadata?.tenant_id
      if (tenantId) {
        await supabase.from('tenants').update({ status: 'active', stripe_customer_id: session.customer as string }).eq('id', tenantId)
        // Trigger provisioning
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/provision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: tenantId, session_id: session.id }),
        })
      }
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      await supabase.from('tenants').update({ status: 'past_due' }).eq('stripe_customer_id', customerId)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase.from('tenants').update({ status: 'cancelled' }).eq('stripe_subscription_id', sub.id)
      break
    }
  }

  await supabase.from('webhook_events').update({ processed: true, processed_at: new Date().toISOString() })
    .eq('source', 'stripe').eq('event_id', event.id)

  return NextResponse.json({ ok: true })
}
*/

// ============================================================
// app/api/provision/route.ts — Full A→Z provisioning
// ============================================================
/*
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import twilio from 'twilio'
import Retell from 'retell-sdk'

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const retell = new Retell({ apiKey: process.env.RETELL_API_KEY! })

export async function POST(req: NextRequest) {
  const { tenant_id } = await req.json()
  const supabase = createServiceClient()

  async function runStep(step: string, fn: () => Promise<any>) {
    const key = `${tenant_id}_${step}`
    await supabase.from('provisioning_jobs').upsert({
      tenant_id, step, status: 'running', idempotency_key: key
    }, { onConflict: 'idempotency_key' })
    try {
      const result = await fn()
      await supabase.from('provisioning_jobs').update({ status: 'completed', result, completed_at: new Date().toISOString() })
        .eq('idempotency_key', key)
      return result
    } catch (e: any) {
      await supabase.from('provisioning_jobs').update({ status: 'failed', error: e.message }).eq('idempotency_key', key)
      throw e
    }
  }

  try {
    // Step 1: Create Twilio Subaccount
    const subaccount = await runStep('create_subaccount', async () => {
      const { data: tenant } = await supabase.from('tenants').select('business_name').eq('id', tenant_id).single()
      return twilioClient.api.v2010.accounts.create({ friendlyName: tenant!.business_name })
    })

    // Step 2: Purchase phone number
    const number = await runStep('purchase_number', async () => {
      const subClient = twilio(subaccount.sid, subaccount.authToken)
      const [available] = await subClient.availablePhoneNumbers('US').local.list({ limit: 1 })
      return subClient.incomingPhoneNumbers.create({ phoneNumber: available.phoneNumber })
    })

    // Step 3: Create SIP trunk and bind
    await runStep('create_sip_trunk', async () => {
      const subClient = twilio(subaccount.sid, subaccount.authToken)
      const trunk = await subClient.trunking.v1.trunks.create({ friendlyName: `meclients-${tenant_id}` })
      // Add Retell SIP URI as origination
      await subClient.trunking.v1.trunks(trunk.sid).originationUrls.create({
        friendlyName: 'retell',
        sipUrl: `sip:${number.phoneNumber}@${process.env.RETELL_SIP_DOMAIN}`,
        priority: 0, weight: 100, enabled: true
      })
      return { trunk_sid: trunk.sid }
    })

    // Step 4: Store phone number in DB
    await runStep('store_number', async () => {
      return supabase.from('phone_numbers').insert({
        tenant_id,
        number: number.phoneNumber,
        twilio_sid: number.sid,
        twilio_subaccount_sid: subaccount.sid,
        status: 'active',
      })
    })

    // Step 5: Mark agent as live
    await runStep('activate_agent', async () => {
      return supabase.from('retell_agents').update({ status: 'live', went_live_at: new Date().toISOString() }).eq('tenant_id', tenant_id)
    })

    // Step 6: Send activation email
    await runStep('send_activation_email', async () => {
      // TODO: sendActivationEmail(tenant_id, number.phoneNumber)
      return { sent: true }
    })

    return NextResponse.json({ ok: true, number: number.phoneNumber })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
*/

export {} // Make this a module
