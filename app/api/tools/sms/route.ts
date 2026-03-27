import { NextResponse } from 'next/response'
import Twilio from 'twilio'
import { createServerClient } from '@/lib/supabase/server'

/**
 * [RETELL CUSTOM TOOL ENDPOINT]
 * Allows the Voice AI to actively send SMS payloads to the caller mid-conversation!
 * E.g., "I just texted you a link to our intake form."
 */
export async function POST(req: Request) {
  try {
    const { tenant_id, caller_number, message } = await req.json()

    if (!tenant_id || !caller_number || !message) {
      return NextResponse.json({ error: 'Payload insufficient' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Retrieve Twilio credentials or business info from Admin table if you don't use absolute master keys
    // For MeClients, we leverage the master Twilio account abstraction
    const twilio = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    // Lookup the active Twilio Outbound Number assigned to this Tenant
    const { data: profile } = await supabase.from('business_profiles').select('description').eq('tenant_id', tenant_id).single()
    const match = profile?.description?.match(/Dedicated AI Number: (\+[0-9]+)/)
    const fromNumber = match ? match[1] : process.env.TWILIO_MASTER_NUMBER

    if (!fromNumber) {
      return NextResponse.json({ success: false, message: 'I am unable to send text messages from this business line right now.' })
    }

    // Fire the SMS via Twilio SDK
    await twilio.messages.create({
      body: message,
      from: fromNumber,
      to: caller_number
    })

    return NextResponse.json({
      success: true,
      message: 'Great, I successfully dispatched the text message to their phone!'
    })

  } catch (error: any) {
    console.error('SMS Tool Error:', error)
    return NextResponse.json({ error: 'Twilio Pipeline execution fault' }, { status: 500 })
  }
}
