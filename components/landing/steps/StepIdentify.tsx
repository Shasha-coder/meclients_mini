'use client'
import { useState } from 'react'
import { Mail, Phone, Loader2 } from 'lucide-react'
import { W } from './shared'

function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
function isPhone(v: string) { return /^\+[1-9]\d{1,14}$/.test(v) }

type Mode = 'email' | 'phone'

export default function StepIdentify({ nextStep, agentSay, userSay, setInputPlaceholder, setInputDisabled, setAuthData }: any) {
  const [mode, setMode] = useState<Mode>('email')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  
  const isValid = mode === 'email' ? isEmail(value) : isPhone(value)
  const canSubmit = isValid && !loading

  function switchMode(newMode: Mode) {
    setMode(newMode)
    setValue('')
    setErr('')
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setLoading(true)
    setErr('')
    userSay(mode === 'email' ? value : `Phone: ${value}`)
    setInputPlaceholder('Sending code...')
    setInputDisabled(true)

    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', contact: value }),
      })

      const data = await res.json()
      setLoading(false)

      if (!res.ok) {
        setErr(data.error || 'Failed to send code')
        setInputDisabled(false)
        setInputPlaceholder('Type your answer...')
      } else {
        setAuthData({ type: mode, value })
        agentSay(`Perfect — secure code sent to ${value}. Enter the 6-digit code to continue.`)
        nextStep()
      }
    } catch (error: any) {
      setLoading(false)
      setErr(error.message || 'Failed to send code')
      setInputDisabled(false)
      setInputPlaceholder('Type your answer...')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toggle Tabs */}
      <div style={{ 
        display: 'flex', 
        background: '#f1f5f9', 
        borderRadius: 12, 
        padding: 4,
        gap: 4
      }}>
        <button
          onClick={() => switchMode('email')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 10,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
            background: mode === 'email' ? '#fff' : 'transparent',
            color: mode === 'email' ? '#2eb87a' : '#64748b',
            boxShadow: mode === 'email' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <Mail size={16} />
          Email
        </button>
        <button
          onClick={() => switchMode('phone')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 10,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
            background: mode === 'phone' ? '#fff' : 'transparent',
            color: mode === 'phone' ? '#2eb87a' : '#64748b',
            boxShadow: mode === 'phone' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <Phone size={16} />
          Phone
        </button>
      </div>

      {/* Input Field */}
      <div>
        <label style={{ ...W.flbl, marginBottom: 6, display: 'block' }}>
          {mode === 'email' ? 'Work Email' : 'WhatsApp Number'}
        </label>
        <div style={{ position: 'relative' }}>
          {mode === 'email' ? (
            <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          ) : (
            <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          )}
          <input
            type={mode === 'email' ? 'email' : 'tel'}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            disabled={loading}
            placeholder={mode === 'email' ? 'you@company.com' : '+1 555 000 0000'}
            style={{ 
              ...W.gin, 
              paddingLeft: 42, 
              width: '100%', 
              fontSize: 15,
              padding: '14px 16px 14px 42px',
              borderRadius: 14,
              border: `2px solid ${value.length > 0 && !isValid ? '#ef4444' : '#e2e8f0'}`, 
              backgroundColor: value.length > 0 && !isValid ? '#fff8f8' : '#fff',
              transition: 'all 0.2s ease',
            }}
          />
        </div>
        {value.length > 0 && !isValid && (
          <span style={{ fontSize: 11, color: '#ef4444', marginTop: 4, display: 'block' }}>
            {mode === 'email' ? 'Please enter a valid email address' : 'Include country code (e.g. +1)'}
          </span>
        )}
      </div>

      {err && (
        <div style={{ 
          fontSize: 12, 
          color: '#ef4444', 
          backgroundColor: '#fff8f8', 
          padding: '10px 12px', 
          borderRadius: 10, 
          border: '1px solid #fecaca' 
        }}>
          {err}
        </div>
      )}

      {/* Info text */}
      <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
        {mode === 'email' 
          ? 'We will send a 6-digit verification code to your email.'
          : 'We will send a verification code via SMS. Standard rates may apply.'
        }
      </p>

      <button 
        onClick={handleSubmit} 
        disabled={!canSubmit || loading} 
        style={{ 
          ...W.gbtn(true), 
          padding: '14px 20px',
          fontSize: 14,
          borderRadius: 14,
          background: canSubmit ? '#2eb87a' : '#cbd5e1', 
          cursor: canSubmit ? 'pointer' : 'not-allowed', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 8,
          transition: 'all 0.2s ease',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Sending...
          </>
        ) : (
          'Send verification code'
        )}
      </button>
    </div>
  )
}
