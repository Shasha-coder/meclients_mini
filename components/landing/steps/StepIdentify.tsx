'use client'
import { useState } from 'react'
import { Mail, Phone } from 'lucide-react'
import { W } from './shared'

function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
function isPhone(v: string) { return /^\+?[\d\s\-().]{7,}$/.test(v) }

export default function StepIdentify({ nextStep, agentSay, userSay, setInputPlaceholder, setInputDisabled }: any) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  
  const validEmail = email.length === 0 || isEmail(email)
  const validPhone = isPhone(phone)
  const canSubmit = isEmail(email) && validPhone

  function handleSubmit() {
    if (!canSubmit) return
    userSay(`Email: ${email}\nPhone: ${phone}`)
    setInputPlaceholder('Paste your 4-digit code…')
    setTimeout(() => {
      agentSay('Perfect — code sent to ' + phone + '. Paste the 4-digit code below.')
      nextStep(undefined, undefined) // move to OTP step
    }, 300)
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
            placeholder="you@business.com"
            style={{ ...W.gin, paddingLeft: 34, width: '100%', border: `1.5px solid ${!validEmail ? '#ef4444' : '#e2e8f0'}`, backgroundColor: !validEmail ? '#fff8f8' : '#fff' }}
          />
        </div>
      </div>

      <div>
        <label style={{ ...W.flbl, marginBottom: 4, display: 'block' }}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
        <div style={{ position: 'relative' }}>
          <Phone size={14} color="#a0aec0" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="+1 555 000 0000"
            style={{ ...W.gin, paddingLeft: 34, width: '100%', border: `1.5px solid ${phone.length > 0 && !validPhone ? '#ef4444' : '#e2e8f0'}`, backgroundColor: (phone.length > 0 && !validPhone) ? '#fff8f8' : '#fff' }}
          />
        </div>
      </div>

      <span style={{ fontSize: 11, color: '#64748b' }}>📱 Phone receives instant SMS setup.</span>
      <button onClick={handleSubmit} disabled={!canSubmit} style={{ ...W.gbtn(true), marginTop: 2, background: canSubmit ? '#2eb87a' : '#cbd5e1', cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
        Send verification code →
      </button>
    </div>
  )
}
