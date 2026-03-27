'use client'
// app/(auth)/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createBrowserClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-semibold text-ink">meclients</Link>
          <p className="text-ink-muted text-sm mt-2">Sign in to your account</p>
        </div>
        <div className="bg-white rounded-3xl border border-surface-border shadow-lifted p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wide block mb-2">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-surface-border rounded-2xl px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-300 transition"
                placeholder="you@yourbusiness.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wide block mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full border border-surface-border rounded-2xl px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-300 transition"
                placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white py-3 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 text-sm mt-2">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in...</> : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-xs text-ink-muted mt-5">
            No account? <Link href="/signup" className="text-brand-600 hover:text-brand-700">Get started free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
