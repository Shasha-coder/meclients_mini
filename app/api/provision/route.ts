import { NextResponse } from 'next/response'
import { createServerClient } from '@/lib/supabase/server'
import Twilio from 'twilio'
import Retell from 'retell-sdk'

export async function POST(req: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { tenantId } = await req.json()
    if (!tenantId) return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 })

    // Verify ownership
    const { data: profile } = await supabase.from('business_profiles').select('*').eq('tenant_id', tenantId).eq('user_id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 1. Create Retell Agent
    const retell = new Retell({ apiKey: process.env.RETELL_API_KEY! })
    const { data: agentConfig } = await supabase.from('retell_agents').select('*').eq('tenant_id', tenantId).single()
    
    // Create the actual agent on Retell servers
    const retellAgent = await retell.agent.create({
      llm_websocket_url: `${process.env.NEXT_PUBLIC_SITE_URL?.replace('http', 'ws')}/api/llm-websocket/${tenantId}`,
      voice_id: agentConfig?.voice_id || '11labs-James',
      agent_name: `${profile.business_name} AI`,
      language: agentConfig?.language?.includes('Spanish') ? 'es-ES' : 'en-US'
    })

    // 2. Buy Twilio Number
    const twilio = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    // Find available number
    const localNumbers = await twilio.availablePhoneNumbers('US').local.list({ limit: 1 })
    if (localNumbers.length === 0) throw new Error('No Twilio numbers available')

    const newNumber = await twilio.incomingPhoneNumbers.create({
      phoneNumber: localNumbers[0].phoneNumber,
      // Connect Twilio directly to Retell's SIP Trunking logic
      sipEndpoint: `${retellAgent.agent_id}@sip.retellai.com`
    })

    // 3. Save to Supabase
    await supabase.from('retell_agents').update({
      retell_agent_id: retellAgent.agent_id,
      status: 'active'
    }).eq('tenant_id', tenantId)

    // The user's schema requires storing the active number, could be `business_profiles` or a phone table
    await supabase.from('business_profiles').update({
      description: profile.description + `\nDedicated AI Number: ${newNumber.phoneNumber}`
    }).eq('tenant_id', tenantId)

    return NextResponse.json({
      success: true,
      agentId: retellAgent.agent_id,
      phoneNumber: newNumber.phoneNumber
    })

  } catch (error: any) {
    console.error('Provisioning Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to provision AI Agent' }, { status: 500 })
  }
}
