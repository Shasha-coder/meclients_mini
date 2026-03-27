import { NextResponse } from 'next/response'
import { createServerClient } from '@/lib/supabase/server'

/**
 * [RETELL CUSTOM TOOL ENDPOINT]
 * Hit by the Retell Voice Agent when a caller wants to drop or cancel an existing appointment.
 */
export async function POST(req: Request) {
  try {
    const supabase = createServerClient()
    const { tenant_id, caller_number, date } = await req.json()

    if (!tenant_id || !caller_number) {
      return NextResponse.json({ error: 'Caller authorization missing' }, { status: 400 })
    }

    // Attempt to locate and cancel the booking
    let query = supabase.from('bookings').update({ status: 'canceled' }).eq('tenant_id', tenant_id).eq('client_phone', caller_number)
    if (date) query = query.like('appointment_time', `${date}%`)

    const { error, count } = await query

    if (error || count === 0) {
      return NextResponse.json({
        success: false,
        message: 'I was unable to find an active appointment under your phone number that matches that date.'
      })
    }

    // Depending on schema, you might also trigger a re-sync to Upstash Redis here to free up the slot

    return NextResponse.json({
      success: true,
      message: 'Done. I have successfully canceled your appointment. Thank you for letting us know.'
    })

  } catch (error: any) {
    console.error('Cancellation Tool Error:', error)
    return NextResponse.json({ error: 'System fault during cancellation iteration' }, { status: 500 })
  }
}
