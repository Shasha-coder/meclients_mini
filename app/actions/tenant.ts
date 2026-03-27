'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Retrieves the core Tenant info for the logged-in dashboard user
 */
export async function getTenantProfile() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*, business_profiles(*), retell_agents(*)')
    .eq('owner_id', user.id)
    .single()

  if (error || !tenant) {
    throw new Error('Tenant profile not found')
  }

  return tenant
}

/**
 * Retrieves real-time bookings (for the Dashboard Calendar view)
 */
export async function getDashboardBookings(startDateStr: string, endDateStr: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).single()
  if (!tenant) return []

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*, service_types(name, duration_mins)')
    .eq('tenant_id', tenant.id)
    .gte('start_time', startDateStr)
    .lte('end_time', endDateStr)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Failed to fetch dashboard bookings:', error)
    return []
  }

  return bookings
}

/**
 * Cancels a booking directly from the dashboard
 */
export async function cancelDashboardBooking(bookingId: string, reason: string) {
  const supabase = createServerClient()
  
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancel_reason: reason, cancelled_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/bookings')
  return { success: true }
}
