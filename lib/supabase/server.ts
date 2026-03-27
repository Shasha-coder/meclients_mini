// lib/supabase/server.ts — Use in Server Components and API Routes
import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Mock client for when Supabase is not configured
const mockClient = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({ data: null, error: new Error('Supabase not configured.') }),
    insert: () => ({ data: null, error: new Error('Supabase not configured.') }),
    update: () => ({ data: null, error: new Error('Supabase not configured.') }),
    delete: () => ({ data: null, error: new Error('Supabase not configured.') }),
    upsert: () => ({ data: null, error: new Error('Supabase not configured.') }),
  }),
} as any

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return mockClient
  }

  const cookieStore = cookies()
  return _createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )
}

// For API routes that need elevated access (webhooks, provisioning)
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return mockClient
  }

  return _createServerClient(
    url,
    key,
    { cookies: { get: () => undefined, set: () => {}, remove: () => {} } }
  )
}
