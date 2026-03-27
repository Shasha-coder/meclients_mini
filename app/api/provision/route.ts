import { NextRequest, NextResponse } from 'next/server'
import { openRouterCall } from '@/lib/openrouter'
import { Redis } from '@upstash/redis'
import Retell from 'retell-sdk'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

interface ProvisionPayload {
  businessName: string
  industry: string
  services?: string
  hours?: string
  phone?: string
  address?: string
  language: string
  voice: string
  contactEmail?: string
  contactPhone?: string
  scrapedData?: any
}

interface ProvisionResult {
  success: boolean
  agentId?: string
  phoneNumber?: string
  sipTrunkSid?: string
  error?: string
}

export async function POST(req: NextRequest) {
  const payload: ProvisionPayload = await req.json()

  if (!payload.businessName) {
    return NextResponse.json({ error: 'Business name required' }, { status: 400 })
  }

  // Generate idempotency key from business name
  const idempotencyKey = `provision:${payload.businessName.toLowerCase().replace(/\s+/g, '-')}`
  
  // Check if already provisioning
  const existing = await redis.get(idempotencyKey)
  if (existing) {
    return NextResponse.json({ error: 'Agent provisioning already in progress', existing }, { status: 409 })
  }

  // Lock for 5 minutes
  await redis.set(idempotencyKey, { status: 'provisioning', startedAt: Date.now() }, { ex: 300 })

  try {
    // STEP 1: Generate AI Agent Prompt using Qwen 3.5
    const systemPrompt = await generateAgentPrompt(payload)

    // STEP 2: Create Retell AI Agent
    const retell = new Retell({ apiKey: process.env.RETELL_API_KEY! })
    
    const agentResponse = await retell.agent.create({
      agent_name: `${payload.businessName} AI Receptionist`,
      voice_id: mapVoiceId(payload.voice, payload.language),
      language: mapLanguageCode(payload.language),
      response_engine: {
        type: 'retell-llm',
        llm_id: '', // Will be created
      },
    })

    // Create LLM with the generated prompt
    const llmResponse = await retell.llm.create({
      general_prompt: systemPrompt,
      begin_message: `Hello, thank you for calling ${payload.businessName}. How can I help you today?`,
      model: 'gpt-4o-mini',
      general_tools: [
        {
          type: 'end_call',
          name: 'end_call',
          description: 'End the call when the conversation is complete',
        },
        {
          type: 'transfer_call',
          name: 'transfer_call', 
          description: 'Transfer the call to a human operator when needed',
          number: payload.phone || '',
        },
      ],
    })

    // Update agent with LLM
    await retell.agent.update(agentResponse.agent_id, {
      response_engine: {
        type: 'retell-llm',
        llm_id: llmResponse.llm_id,
      },
    })

    // STEP 3: Create Twilio SIP Trunk and Buy Number
    const twilio = (await import('twilio')).default
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    // Search for available local number
    const countryCode = 'US' // TODO: Make configurable
    const availableNumbers = await twilioClient.availablePhoneNumbers(countryCode).local.list({
      limit: 1,
      voiceEnabled: true,
      smsEnabled: true,
    })

    if (availableNumbers.length === 0) {
      // Try toll-free if no local available
      const tollFreeNumbers = await twilioClient.availablePhoneNumbers(countryCode).tollFree.list({
        limit: 1,
        voiceEnabled: true,
      })
      if (tollFreeNumbers.length === 0) {
        throw new Error('No phone numbers available in this region')
      }
      availableNumbers.push(tollFreeNumbers[0] as any)
    }

    // Purchase the number
    const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: availableNumbers[0].phoneNumber,
      friendlyName: `${payload.businessName} AI Line`,
    })

    // Create SIP Trunk for Retell
    const sipTrunk = await twilioClient.trunking.v1.trunks.create({
      friendlyName: `${payload.businessName} Retell Trunk`,
    })

    // Add Retell's SIP domain as origination URI
    await twilioClient.trunking.v1.trunks(sipTrunk.sid)
      .originationUrls.create({
        weight: 10,
        priority: 10,
        enabled: true,
        friendlyName: 'Retell AI',
        sipUrl: `sip:${agentResponse.agent_id}@5t4n6j0wnrl.sip.livekit.cloud`, // Retell's SIP endpoint
      })

    // Associate phone number with trunk
    await twilioClient.trunking.v1.trunks(sipTrunk.sid)
      .phoneNumbers.create({
        phoneNumberSid: purchasedNumber.sid,
      })

    // STEP 4: Import number to Retell
    await retell.phoneNumber.import({
      phone_number: purchasedNumber.phoneNumber,
      termination_uri: `${sipTrunk.sid}.pstn.twilio.com`,
    })

    // STEP 5: Bind number to agent
    await retell.phoneNumber.update(purchasedNumber.phoneNumber, {
      inbound_agent_id: agentResponse.agent_id,
    })

    // Update Redis with success
    await redis.set(idempotencyKey, {
      status: 'completed',
      agentId: agentResponse.agent_id,
      llmId: llmResponse.llm_id,
      phoneNumber: purchasedNumber.phoneNumber,
      sipTrunkSid: sipTrunk.sid,
      completedAt: Date.now(),
    }, { ex: 86400 }) // Keep for 24 hours

    const result: ProvisionResult = {
      success: true,
      agentId: agentResponse.agent_id,
      phoneNumber: purchasedNumber.phoneNumber,
      sipTrunkSid: sipTrunk.sid,
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Provisioning error:', error)
    
    // Update Redis with failure
    await redis.set(idempotencyKey, {
      status: 'failed',
      error: error.message,
      failedAt: Date.now(),
    }, { ex: 3600 })

    return NextResponse.json({ 
      error: error.message || 'Failed to provision agent',
      details: error.toString(),
    }, { status: 500 })
  }
}

// Generate a customized agent prompt using Qwen 3.5
async function generateAgentPrompt(payload: ProvisionPayload): Promise<string> {
  const prompt = await openRouterCall({
    messages: [
      {
        role: 'system',
        content: `You are an expert at creating prompts for AI voice receptionists. Generate a professional, friendly system prompt for an AI phone receptionist.

The prompt should:
- Be warm and professional
- Include the business name naturally
- Handle common scenarios for the industry
- Know when to transfer to a human
- Be concise but comprehensive
- NOT include placeholder brackets - use the actual values provided`,
      },
      {
        role: 'user',
        content: `Create a system prompt for an AI receptionist with these details:

Business Name: ${payload.businessName}
Industry: ${payload.industry}
Services: ${payload.services || 'General services'}
Business Hours: ${payload.hours || 'Standard business hours'}
Address: ${payload.address || 'Not specified'}
Language Style: ${payload.language}

The receptionist should be able to:
1. Answer general questions about the business
2. Help with appointment scheduling
3. Handle common inquiries for a ${payload.industry} business
4. Know when to transfer to a human
5. Be friendly but professional

Output ONLY the system prompt text, no explanations.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  })

  return prompt || getDefaultPrompt(payload)
}

function getDefaultPrompt(payload: ProvisionPayload): string {
  return `You are the AI receptionist for ${payload.businessName}. You are friendly, professional, and helpful.

Your responsibilities:
- Answer calls professionally with "Thank you for calling ${payload.businessName}, how may I help you today?"
- Provide information about our services: ${payload.services || 'our various services'}
- Help callers schedule appointments when appropriate
- Answer questions about our business hours: ${payload.hours || 'Please ask about our current hours'}
- Provide our location information: ${payload.address || 'Please ask for directions'}

Guidelines:
- Be warm and conversational, not robotic
- If you don't know something, offer to have someone call them back
- For complex issues or complaints, offer to transfer to a team member
- Always confirm important details like phone numbers and appointment times
- End calls politely and thank them for calling

Remember: You represent ${payload.businessName}. Be helpful, professional, and make every caller feel valued.`
}

function mapVoiceId(voice: string, language: string): string {
  const voiceMap: Record<string, string> = {
    'James': '11labs-Adrian',
    'Sarah': '11labs-Paola',
    'Alex': '11labs-Jason',
    'Emma': '11labs-Amy',
    'Jacques': '11labs-Chris',
  }
  return voiceMap[voice] || '11labs-Adrian'
}

function mapLanguageCode(language: string): string {
  if (language.includes('Spanish') || language.includes('Espanol')) return 'es-ES'
  if (language.includes('French') || language.includes('Francais')) return 'fr-FR'
  if (language.includes('German') || language.includes('Deutsch')) return 'de-DE'
  if (language.includes('Portuguese')) return 'pt-BR'
  return 'en-US'
}
