'use client'
import { useState } from 'react'
import { Mail, Phone, Loader2 } from 'lucide-react'
import { W } from './shared'
import { createBrowserClient } from '@/lib/supabase/client'
import { initiateScrapeJob } from '@/app/actions/onboarding'

function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
// Strict E.164 WhatsApp validation
function isPhone(v: string) { return /^\+[1-9]\d{1,14}$/.test(v) }

export default function StepIdentify({ nextStep, agentSay, userSay, setInputPlaceholder, setInputDisabled, setAuthData, websiteUrl }: any) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  
  const validEmail = email.length === 0 || isEmail(email)
  const validPhone = phone.length === 0 || isPhone(phone)
  const canSubmit = (isEmail(email) || isPhone(phone)) && !loading

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setErr('')
    userSay(`Contact: ${email || phone}`)
    setInputPlaceholder('Sending code...')
    setInputDisabled(true)

    const supabase = createBrowserClient()
    const targetEmail = isEmail(email)

    // Trigger Supabase OTP
    const { error } = targetEmail
      ? await supabase.auth.signInWithOtp({ email })
      : await supabase.auth.signInWithOtp({ phone })

    setLoading(false)

    if (error) {
      setErr(error.message)
      setInputDisabled(false)
      setInputPlaceholder('Type your answer...')
    } else {
      const identifier = email || phone
      setAuthData({ type: targetEmail ? 'email' : 'phone', value: identifier })
      agentSay(`Perfect — secure code sent to ${identifier}. Paste the 6-digit code below.`)
      nextStep()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ ...W.flbl, marginBottom: 4, display: 'block' }}>Work Email</label>
        <div style={{ position: 'relative' }}>
          <Mail size={14} color="#a0aec0" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            placeholder="you@business.com"
            style={{ ...W.gin, paddingLeft: 34, width: '100%', border: `1.5px solid ${!validEmail ? '#ef4444' : '#e2e8f0'}`, backgroundColor: !validEmail ? '#fff8f8' : '#fff' }}
          />
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: '4px 0' }}>
        <div style={{ flexGrow: 1, borderTop: '1px solid #E2E8F0' }}></div>
        <span style={{ flexShrink: 0, padding: '0 12px', color: '#94A3B8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>OR</span>
        <div style={{ flexGrow: 1, borderTop: '1px solid #E2E8F0' }}></div>
      </div>

      <div>
        <label style={{ ...W.flbl, marginBottom: 4, display: 'block' }}>WhatsApp Number <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ position: 'relative' }}>
          <Phone size={14} color="#a0aec0" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            disabled={loading}
            placeholder="+15550000000"
            style={{ ...W.gin, paddingLeft: 34, width: '100%', border: `1.5px solid ${phone.length > 0 && !validPhone ? '#ef4444' : '#e2e8f0'}`, backgroundColor: (phone.length > 0 && !validPhone) ? '#fff8f8' : '#fff' }}
          />
        </div>
        {phone.length > 0 && !validPhone && <span style={{ fontSize: 10, color: '#ef4444' }}>Must include country code (e.g. +1)</span>}
      </div>

      {err && <div style={{ fontSize: 11, color: '#ef4444', backgroundColor: '#fff8f8', padding: '6px 10px', borderRadius: 6, border: '1px solid #fecaca' }}>{err}</div>}

      <span style={{ fontSize: 11, color: '#64748b' }}>📱 Provide a valid WhatsApp for instant alerts.</span>
      <button onClick={handleSubmit} disabled={!canSubmit || loading} style={{ ...W.gbtn(true), marginTop: 2, background: canSubmit ? '#2eb87a' : '#cbd5e1', cursor: canSubmit ? 'pointer' : 'not-allowed', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : 'Send verification code →'}
      </button>
    </div>
  )
}
