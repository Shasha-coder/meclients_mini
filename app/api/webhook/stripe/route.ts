import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123', {
  apiVersion: '2024-06-20',
})
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } else {
      // Fallback for local testing if no signature
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const email = session.customer_email || session.customer_details?.email || session.client_reference_id
      
      if (email) {
        // Create Tenant linked to Stripe Customer
        const { data: tenant, error: tenantErr } = await supabase
          .from('tenants')
          .insert({
            business_name: 'MeClients Setup (' + email + ')',
            status: 'active',
            plan: 'starter',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .select()
          .single()

        if (tenantErr) {
          console.error('Error creating tenant:', tenantErr)
        } else if (tenant && session.subscription) {
          // Sync Subscription
          const { error: subErr } = await supabase
            .from('subscriptions')
            .insert({
              tenant_id: tenant.id,
              stripe_subscription_id: session.subscription as string,
              plan: 'starter',
              status: 'active',
            })
          if (subErr) console.error('Error tracking subscription:', subErr)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Database sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
