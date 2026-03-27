'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Returns the public booking profile details for a specific [slug]
 */
export async function getPublicBookingProfile(slug: string) {
  const supabase = createServerClient()
  
  // RLS bypass: We added a public policy allowing SELECT on business_profiles
  const { data: profile, error } = await supabase
    .from('business_profiles')
    .select('tenant_id, business_name, tagline, timezone, description')
    .eq('slug', slug)
    .single()

  if (error || !profile) {
    throw new Error('Business not found')
  }

  // Fetch their active services and availability
  const [servicesResponse, availabilityResponse] = await Promise.all([
    supabase.from('service_types').select('*').eq('tenant_id', profile.tenant_id).eq('is_active', true),
    supabase.from('availability_schedules').select('*').eq('tenant_id', profile.tenant_id)
  ])

  return {
    profile,
    services: servicesResponse.data || [],
    availability: availabilityResponse.data || []
  }
}

/**
 * Securly inserts a new appointment from the public /book flow
 */
export async function createPublicBooking(formData: {
  tenant_id: string
  service_type_id: string
  caller_name: string
  caller_email: string
  caller_phone: string
  start_time: string
  end_time: string
  timezone: string
}) {
  const supabase = createServerClient()

  const { data, error } = await supabase.from('bookings').insert({
    tenant_id: formData.tenant_id,
    service_type_id: formData.service_type_id,
    caller_name: formData.caller_name,
    caller_email: formData.caller_email,
    caller_phone: formData.caller_phone,
    start_time: formData.start_time,
    end_time: formData.end_time,
    timezone: formData.timezone,
    status: 'pending',
    booked_by: 'system',
  }).select().single()

  if (error) {
    console.error('Booking insertion failed:', error.message)
    return { success: false, error: 'Could not secure your booking slot.' }
  }

  // Revalidate the dashboard cache so the business owner sees it instantly
  revalidatePath('/bookings')
  
  return { success: true, booking: data }
}
