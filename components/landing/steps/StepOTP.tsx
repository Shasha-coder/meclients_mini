'use client'
import { useEffect, useRef, useState } from 'react'
import { GreenCard, W } from './shared'

type OtpState = 'waiting' | 'expired' | 'incorrect' | 'verified'

export default function StepOTP({ nextStep, prevStep, agentSay, setInputPlaceholder, setInputDisabled, inputVal }: any) {
  const [otpState, setOtpState] = useState<OtpState>('waiting')
  const [secs, setSecs] = useState(60)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    startTimer()
    setInputPlaceholder('Paste your 4-digit code…')
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Watch inputVal — validate when 4 digits entered
  useEffect(() => {
    const v = (inputVal || '').replace(/\D/g, '')
    if (v.length === 4) validateCode(v)
  }, [inputVal])

  function startTimer() {
    setSecs(60)
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

  function resend() {
    setOtpState('waiting')
    agentSay('New code sent!')
    startTimer()
  }

  function validateCode(code: string) {
    // Demo: any 4-digit code passes. Real: compare to stored code.
    const valid = /^\d{4}$/.test(code)
    if (valid) {
      clearInterval(timerRef.current!)
      setOtpState('verified')
      setInputDisabled(true)
      setInputPlaceholder('Verified ✓')
      setTimeout(() => nextStep(null, '✓ Verified'), 1000)
    } else {
      setOtpState('incorrect')
    }
  }

  const cardState = otpState === 'incorrect' ? 'err' : otpState === 'verified' ? 'ok' : 'default'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <GreenCard state={cardState}>
      {/* Left icon */}
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: otpState === 'incorrect' ? '#ef4444' : '#2eb87a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1, transition: 'background .3s',
      }}>
        {otpState === 'incorrect'
          ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
        }
      </div>

      {/* Body */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, marginBottom: 4,
          color: otpState === 'incorrect' ? '#ef4444' : otpState === 'verified' ? '#2eb87a' : '#1a7a4a',
          transition: 'color .3s',
        }}>
          {otpState === 'incorrect' ? 'Incorrect code' : otpState === 'verified' ? 'Verified!' : 'Code sent'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Waiting */}
          {otpState === 'waiting' && (
            <>
              <div style={{ width: 8, height: 8, border: '1.5px solid #b6e8d3', borderTopColor: '#2eb87a', borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#5aad8a' }}>Waiting…</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2eb87a' }}>{secs}s</span>
            </>
          )}

          {/* Expired */}
          {otpState === 'expired' && (
            <>
              <span style={{ fontSize: 11, color: '#5aad8a' }}>Code expired —</span>
              <ResendBtn onClick={resend} />
            </>
          )}

          {/* Incorrect */}
          {otpState === 'incorrect' && (
            <>
              <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>Incorrect</span>
              <ResendBtn onClick={resend} />
            </>
          )}

          {/* Verified */}
          {otpState === 'verified' && (
            <span style={{ fontSize: 11, color: '#2eb87a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2eb87a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              Proceeding…
            </span>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </GreenCard>
    <div style={{...W.btnRowAction, marginTop: 4}}>
      <button onClick={prevStep} style={W.backBtn}>← Back</button>
    </div>
    </div>
  )
}

function ResendBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 11, fontWeight: 600, color: '#fff',
      background: '#ef4444', border: 'none', borderRadius: 20,
      padding: '3px 10px', cursor: 'pointer',
    }}>
      RESEND
    </button>
  )
}
