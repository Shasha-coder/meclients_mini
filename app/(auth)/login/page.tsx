'use client'
// app/(auth)/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { ArrowRight, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()
  const supabase = createBrowserClient()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMsg('')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/auth/callback` } })
    if (error) { setError(error.message); setLoading(false); return }
    setMsg('A magical login link has been sent to your email!')
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } })
    if (error) { setError(error.message); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Abstract Side */}
      <div className="hidden md:flex flex-1 relative bg-[#f0fdf8] items-center justify-center overflow-hidden">
        {/* Abstract Geometry */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#bbf7d0] rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#86efac] rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        
        <div className="relative z-10 max-w-lg p-12">
          <div className="text-[28px] font-bold text-[#111] tracking-tight mb-4 flex items-center gap-1">
            <span className="text-[#2eb87a]">me</span>clients
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold leading-[1.1] text-[#0f172a] tracking-tight mb-6">
            Your front desk, <br /> reimagined with AI.
          </h1>
          <p className="text-lg text-[#475569] leading-relaxed">
            Handle calls, intelligently schedule appointments, and capture every lead 24/7.
          </p>
        </div>
      </div>

      {/* Right Login Form Side */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="w-full max-w-[400px] mx-auto">
          <div className="md:hidden text-[24px] font-bold text-[#111] tracking-tight mb-8">
            <span className="text-[#2eb87a]">me</span>clients
          </div>

          <h2 className="text-3xl font-bold text-[#0f172a] tracking-tight mb-2">Welcome back</h2>
          <p className="text-[#64748B] text-sm mb-8">Sign in or create an account to manage your AI receptionist.</p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#E2E8F0] text-[#0F172A] font-medium py-3 px-4 rounded-xl hover:bg-[#F8FAFC] transition-colors mb-6 shadow-sm disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
            <span className="flex-shrink-0 px-4 text-[#94A3B8] text-xs font-medium uppercase tracking-wider bg-white">Or continue with email</span>
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
          </div>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -transform-y-1/2 text-[#94A3B8]" size={18} style={{ transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Work Email"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[15px] outline-none transition-colors focus:border-[#2eb87a] focus:bg-white text-[#0f172a]"
              />
            </div>
            
            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            {msg && <p className="text-sm text-[#2eb87a] bg-[#f0fdf8] px-3 py-2 rounded-lg">{msg}</p>}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 bg-[#2eb87a] text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-[#259b66] transition-all shadow-[0_4px_14px_rgba(46,184,122,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Processing...' : (
                <>
                  Continue <ArrowRight size={18} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
