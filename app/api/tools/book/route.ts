import { NextResponse } from 'next/response'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantAvailability, syncTenantCalendarToRedis } from '@/lib/upstash'

/**
 * [RETELL CUSTOM TOOL ENDPOINT]
 * This webhook is actively called by the Retell Agent when the user fully confirms
 * a date and time slot. We must mutationally lock this into Postgres and flush Redis.
 */
export async function POST(req: Request) {
  try {
    const supabase = createServerClient()
    const payload = await req.json()

    // Retell Tool payload extraction
    const { tenant_id, caller_number, date, time, client_name, service } = payload

    if (!tenant_id || !date || !time) {
      return NextResponse.json({ error: 'Missing mandatory booking parameters' }, { status: 400 })
    }

    // 1. Transactionally lock appointment in Supabase
    // Note: Depends on the precise `schema.sql` you executed for appointments! Assuming `bookings` table.
    const { data: booking, error } = await supabase.from('bookings').insert({
      tenant_id,
      client_phone: caller_number,
      client_name: client_name || 'Guest',
      service_type: service || 'General Consultation',
      appointment_time: `${date}T${time}:00Z`, // Normalized ISO
      status: 'confirmed'
    }).select().single()

    if (error) {
      console.error('Supabase Insertion Blocked:', error)
      return NextResponse.json({
        success: false,
        message: 'I encountered a database lock while securing the appointment. Let me try again.'
      })
    }

    // 2. Flush the availability cached state in Upstash Redis so double-booking is impossible
    const cachedSlots = await getTenantAvailability(tenant_id)
    if (cachedSlots.length > 0) {
      // Filter out the booked slot dynamically based on time/date
      const purgedCache = cachedSlots.filter((slot: any) => !(slot.date === date && slot.time === time))
      await syncTenantCalendarToRedis(tenant_id, purgedCache)
    }

    return NextResponse.json({
      success: true,
      message: `Your appointment for ${service || 'your visit'} is securely locked in for ${date} at ${time}.`,
      booking_id: booking.id
    })

  } catch (error: any) {
    console.error('Booking Mutator Error:', error)
    return NextResponse.json(
      { error: 'Appointment Mutator disconnected.' }, 
      { status: 500 }
    )
  }
}
