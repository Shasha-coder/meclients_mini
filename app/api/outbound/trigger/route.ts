import { NextResponse } from 'next/response'
import Retell from 'retell-sdk'
import { createServerClient } from '@/lib/supabase/server'

/**
 * [CRON / DASHBOARD OUTBOUND TRIGGER]
 * A powerful endpoint utilized for natively launching Outbound Follow-Ups via Retell AI.
 */
export async function POST(req: Request) {
  try {
    const supabase = createServerClient()
    const body = await req.json()
    const { tenant_id, destination_number, prompt_override } = body

    if (!tenant_id || !destination_number) {
      return NextResponse.json({ error: 'Invalid Outbound Execution Payload' }, { status: 400 })
    }

    // Fetch the stored AI agent definition
    const { data: agent } = await supabase.from('retell_agents').select('retell_agent_id').eq('tenant_id', tenant_id).single()
    if (!agent?.retell_agent_id) {
      return NextResponse.json({ error: 'Tenant does not have an active Retell LLM binding to utilize outbound dialing.' }, { status: 404 })
    }

    const retell = new Retell({ apiKey: process.env.RETELL_API_KEY! })

    // To place an outbound call through Retell using your Twilio SIP trunk,
    // you ping Retell's call creation API targeting the specified agent ID.
    const outboundCall = await retell.call.createPhoneCall({
      from_number: '+10000000000', // You must dynamically inject the Twilio Originating Number bound to this Tenant!
      to_number: destination_number,
      override_agent_id: agent.retell_agent_id,
      retell_llm_dynamic_variables: {
        // By injecting custom state variables directly here, the AI knows exactly *why* it's calling!
        customer_name: body.customer_name || 'Valued Client',
        call_reason: prompt_override || 'Post-Visit Follow-up'
      }
    })

    return NextResponse.json({
      success: true,
      call_id: outboundCall.call_id,
      status: outboundCall.call_status
    })

  } catch (error: any) {
    console.error('Outbound Execution Pipeline Error:', error)
    return NextResponse.json({ error: error.message || 'Fatal error routing outbound traffic to Retell AI' }, { status: 500 })
  }
}
