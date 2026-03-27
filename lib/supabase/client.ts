// lib/supabase/client.ts — Use in Client Components
import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Return a mock client that throws helpful errors
    return {
      auth: {
        signInWithOtp: async () => ({ error: new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.') }),
        verifyOtp: async () => ({ error: new Error('Supabase not configured.') }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ data: null, error: new Error('Supabase not configured.') }),
        insert: () => ({ data: null, error: new Error('Supabase not configured.') }),
        update: () => ({ data: null, error: new Error('Supabase not configured.') }),
        delete: () => ({ data: null, error: new Error('Supabase not configured.') }),
      }),
    } as any
  }

  return _createBrowserClient(url, key)
}
