import { Redis } from '@upstash/redis'

// Construct the high-speed Redis client
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
})

/**
 * Synchronizes a Tenant's available booking slots and business rules directly from Postgres into Upstash Redis.
 * Called automatically when the Master Dashboard calendar changes.
 */
export async function syncTenantCalendarToRedis(tenantId: string, availabilitySlots: any[]) {
  if (!tenantId) return false
  
  try {
    const key = `tenant:${tenantId}:availability`
    
    // Cache the array natively (expires in 24 hours so stale data isn't locked forever)
    await redis.set(key, JSON.stringify(availabilitySlots), { ex: 86400 })
    return true

  } catch (error) {
    console.error('Failed to sync Upstash Cache:', error)
    return false
  }
}

/**
 * Pulls the absolute lowest latency availability state for Retell during a live call.
 */
export async function getTenantAvailability(tenantId: string) {
  try {
    const key = `tenant:${tenantId}:availability`
    const cache = await redis.get(key)
    
    if (cache) {
      return typeof cache === 'string' ? JSON.parse(cache) : cache
    }
    
    // In production: If Cache Miss, heavily execute a Supabase fetch query here,
    // formulate the slots, and push back to Upstash Redis.
    return []
    
  } catch (error) {
    console.error('Cache Miss/Error:', error)
    return []
  }
}
