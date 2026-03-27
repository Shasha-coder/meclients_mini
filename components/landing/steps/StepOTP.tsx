'use client'
import { useEffect, useRef, useState } from 'react'
import { GreenCard, W } from './shared'

type OtpState = 'waiting' | 'expired' | 'incorrect' | 'verified' | 'verifying'

export default function StepOTP({ nextStep, prevStep, agentSay, setInputPlaceholder, setInputDisabled, inputVal, authData }: any) {
  const [otpState, setOtpState] = useState<OtpState>('waiting')
  const [secs, setSecs] = useState(90)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    startTimer()
    setInputPlaceholder('Enter your 6-digit code')
    setInputDisabled(true)
    // Focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Auto-validate when all 6 digits entered
  useEffect(() => {
    const fullCode = code.join('')
    if (fullCode.length === 6 && otpState === 'waiting') {
      validateCode(fullCode)
    }
  }, [code])

  function startTimer() {
    setSecs(90)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!)
          setOtpState('expired')
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  function handleCodeChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  async function resend() {
    setOtpState('waiting')
    setCode(['', '', '', '', '', ''])
    
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', contact: authData.value }),
      })
      
      if (res.ok) {
        agentSay('New code sent! Check your ' + (authData.type === 'email' ? 'inbox' : 'phone') + '.')
        startTimer()
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      } else {
        agentSay('Failed to send code. Please try again.')
        setOtpState('expired')
      }
    } catch {
      agentSay('Failed to send code. Please try again.')
      setOtpState('expired')
    }
  }

  async function validateCode(fullCode: string) {
    if (!authData || !authData.value) {
      setOtpState('incorrect')
      return
    }

    setOtpState('verifying')

    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'verify', 
          contact: authData.value, 
          code: fullCode 
        }),
      })
      
      const data = await res.json()

      if (data.valid) {
        clearInterval(timerRef.current!)
        setOtpState('verified')
        agentSay('Verified! Continuing setup...')
        setTimeout(() => nextStep(null, 'Verified'), 800)
      } else {
        setOtpState('incorrect')
        setCode(['', '', '', '', '', ''])
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      }
    } catch {
      setOtpState('incorrect')
      setCode(['', '', '', '', '', ''])
    }
  }

  const getStatusColor = () => {
    if (otpState === 'incorrect') return '#ef4444'
    if (otpState === 'verified') return '#2eb87a'
    if (otpState === 'verifying') return '#3b82f6'
    return '#64748b'
  }

  const getStatusText = () => {
    if (otpState === 'verifying') return 'Verifying...'
    if (otpState === 'verified') return 'Verified!'
    if (otpState === 'incorrect') return 'Incorrect code'
    if (otpState === 'expired') return 'Code expired'
    return `Code sent to ${authData?.value?.slice(0, 3)}***`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Status indicator */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10,
        padding: '12px 16px',
        borderRadius: 12,
        background: otpState === 'verified' ? '#f0fdf4' : otpState === 'incorrect' ? '#fef2f2' : '#f8fafc',
        border: `1px solid ${otpState === 'verified' ? '#bbf7d0' : otpState === 'incorrect' ? '#fecaca' : '#e2e8f0'}`,
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: getStatusColor(),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {otpState === 'verifying' ? (
            <div style={{ width: 10, height: 10, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          ) : otpState === 'verified' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          ) : otpState === 'incorrect' ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: getStatusColor() }}>
            {getStatusText()}
          </div>
          {otpState === 'waiting' && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              Expires in <span style={{ fontWeight: 700, color: secs <= 15 ? '#ef4444' : '#2eb87a' }}>{secs}s</span>
            </div>
          )}
        </div>
      </div>

      {/* 6-digit code input */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Enter 6-digit code
        </label>
        <div style={{ display: 'flex', gap: 8 }} onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleCodeChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={otpState === 'verified' || otpState === 'verifying'}
              style={{
                width: 44,
                height: 52,
                fontSize: 22,
                fontWeight: 700,
                textAlign: 'center',
                borderRadius: 12,
                border: `2px solid ${
                  digit 
                    ? (otpState === 'incorrect' ? '#fecaca' : '#2eb87a') 
                    : '#e2e8f0'
                }`,
                background: digit ? (otpState === 'incorrect' ? '#fef2f2' : '#f0fdf4') : '#fff',
                color: otpState === 'incorrect' ? '#ef4444' : '#1a7a4a',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button onClick={prevStep} style={W.backBtn}>
          Back
        </button>
        
        {(otpState === 'expired' || otpState === 'incorrect') && (
          <button 
            onClick={resend} 
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: '#2eb87a',
              color: '#fff',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/></svg>
            Resend code
          </button>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
