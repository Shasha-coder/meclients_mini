import { NextResponse } from 'next/response'
import { getTenantAvailability } from '@/lib/upstash'

/**
 * [RETELL CUSTOM TOOL ENDPOINT]
 * This webhook is actively called by the Retell Agent when it decides it needs to 
 * verify calendar availability before confirming a booking with the human caller.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Retell sends custom variables along with function arguments
    const { tenant_id, date, service } = body

    if (!tenant_id) {
      return NextResponse.json({ error: 'System architecture error: Missing Tenant Context' }, { status: 400 })
    }

    // Ping Upstash Redis for sub-millisecond latency lookup
    const availability = await getTenantAvailability(tenant_id)
    
    // Filter specifically if the AI requested a certain date block
    const matchingSlots = date 
      ? availability.filter((a: any) => a.date?.includes(date)) 
      : availability

    if (matchingSlots.length === 0) {
      return NextResponse.json({
        success: true,
        message: `There are currently no slots available for ${date || 'the requested period'}. Please offer alternative dates.`,
        slots: []
      })
    }

    // Returns directly back to the Retell Conversation LLM
    return NextResponse.json({
      success: true,
      message: `I found ${matchingSlots.length} available slots.`,
      slots: matchingSlots
    })

  } catch (error: any) {
    console.error('Availability Tool Error:', error)
    return NextResponse.json(
      { error: 'Platform availability service temporarily interrupted' }, 
      { status: 500 }
    )
  }
}
