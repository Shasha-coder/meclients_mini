'use server'

import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20', // Latest stable
})

export async function createCheckoutSession(email: string) {
  try {
    // 1. Double check the user is logged in
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'User must be authenticated to check out.' }
    }

    const { data: profile } = await supabase.from('business_profiles').select('tenant_id').eq('user_id', user.id).single()
    if (!profile) return { success: false, error: 'Tenant profile missing' }
    const tenantId = profile.tenant_id

    // 2. We use a placeholder Price ID for the "Starter" tier. 
    // In production, pass this from your Stripe Dashboard.
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER || 'price_mock_123'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding?checkout_cancelled=true`,
      metadata: {
        tenant_id: tenantId, // Crucial for Webhooks to map payment to Tenant!
      }
    })

    return { success: true, url: session.url }
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error)
    return { success: false, error: error.message || 'Payment provider unavailable' }
  }
}
