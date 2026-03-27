'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send } from 'lucide-react'
import StepIdentify from './steps/StepIdentify'
import StepOTP from './steps/StepOTP'
import StepAgent from './steps/StepAgent'
import StepLanguageVoice from './steps/StepLanguageVoice'
import StepNotifications from './steps/StepNotifications'
import StepHours from './steps/StepHours'
import StepGenerate from './steps/StepGenerate'

export type Msg = { role: 'a' | 'u'; text: string }

export type StepId = 'identify' | 'otp' | 'agent' | 'language' | 'notifications' | 'hours' | 'generate'

const STEPS: StepId[] = ['identify', 'otp', 'agent', 'language', 'notifications', 'hours', 'generate']
const TOTAL = STEPS.length

const STEP_LABELS: Record<StepId, string> = {
  identify:      '● Identification',
  otp:           '● Verification',
  agent:         '● Agent type',
  language:      '● Language & voice',
  notifications: '● Notifications',
  hours:         '● Business hours',
  generate:      '● Building…',
}

const STEP_MESSAGES: Record<StepId, string> = {
  identify:      "I've read your site — Smith Dental Clinic. To continue, enter your email or phone. 📱 Phone gets instant SMS notifications.",
  otp:           '', // injected after identify
  agent:         "Your site suggests healthcare — I've pre-selected Dental. Confirm or switch.",
  language:      'What language and voice should your agent use with callers?',
  notifications: 'How should I notify you after each call?',
  hours:         "I found your address but not your hours. Set them or skip — update anytime.",
  generate:      '',
}

export default function ChatPanel({
  open,
  scrapedData,
}: {
  open: boolean
  scrapedData: any
}) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [stepIdx, setStepIdx] = useState(0)
  const [typing, setTyping] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [inputState, setInputState] = useState<'idle' | 'ok' | 'err'>('idle')
  const [inputPlaceholder, setInputPlaceholder] = useState('Type your answer…')
  const [inputDisabled, setInputDisabled] = useState(false)
  const [started, setStarted] = useState(false)
  const msgsRef = useRef<HTMLDivElement>(null)

  const step = STEPS[stepIdx]
  const progress = Math.round((stepIdx / TOTAL) * 100)

  useEffect(() => {
    if (open && !started) { setStarted(true); setTimeout(() => agentSay(STEP_MESSAGES.identify), 800) }
  }, [open])

  function scrollBottom() { setTimeout(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight }, 50) }

  function agentSay(text: string) {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs(m => [...m, { role: 'a', text }])
      scrollBottom()
    }, 750)
  }

  function userSay(text: string) {
    setMsgs(m => [...m, { role: 'u', text }])
    scrollBottom()
  }

  function nextStep(userAnswer?: string, label?: string) {
    if (userAnswer) userSay(label || userAnswer)
    const next = stepIdx + 1
    if (next >= STEPS.length) return
    setStepIdx(next)
    const nextId = STEPS[next]
    const msg = STEP_MESSAGES[nextId]
    if (msg) setTimeout(() => agentSay(msg), 400)
    setInputVal('')
    setInputState('idle')
    setInputPlaceholder('Type your answer…')
    setInputDisabled(false)
  }

  function prevStep() {
    if (stepIdx > 0) {
      setStepIdx(stepIdx - 1)
      setInputVal('')
      setInputDisabled(false)
      setTimeout(() => agentSay("Going back to the previous step."), 300)
    }
  }

  // Handle free-text input submission
  function handleSend() {
    const v = inputVal.trim()
    if (!v || inputDisabled) return
    userSay(v)
    setInputVal('')
    const next = stepIdx + 1
    if (next < STEPS.length) {
      setStepIdx(next)
      const msg = STEP_MESSAGES[STEPS[next]]
      if (msg) setTimeout(() => agentSay(msg), 400)
    }
  }

  const stepProps = { scrapedData, agentSay, userSay, nextStep, prevStep, setInputPlaceholder, setInputDisabled, setInputState, inputVal }

  return (
    <div style={{
      width: '100%',
      maxHeight: open ? 800 : 0,
      overflow: 'hidden',
      transition: 'max-height .5s cubic-bezier(.4,0,.2,1)',
      borderRadius: '20px',
      boxShadow: '0 12px 60px rgba(0,0,0,.08)',
      border: open ? '1px solid rgba(0,0,0,.06)' : 'none',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: '1px solid #eef7f2' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2eb87a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>meclients</div>
          <div style={{ fontSize: 11, color: '#2eb87a' }}>{STEP_LABELS[step] || '● Setting up'}</div>
        </div>
        <span style={{ fontSize: 10, color: '#2eb87a', background: '#f0fdf8', border: '1px solid #b6e8d3', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>AI</span>
        <span style={{ fontSize: 10, color: '#aaa', marginLeft: 6 }}>{stepIdx + 1} / {TOTAL}</span>
      </div>

      {/* PROGRESS */}
      <div style={{ height: 2, background: '#eef7f2' }}>
        <div style={{ height: '100%', background: '#2eb87a', width: `${progress}%`, transition: 'width .5s ease' }} />
      </div>

      {/* SPLIT PANEL CONTENT */}
      <div className="flex flex-col md:flex-row h-[550px] md:h-[350px]">
        
        {/* LEFT: CHAT */}
        <div className="flex flex-col md:border-r md:border-b-0 border-b border-[#eef7f2] bg-[#fafbfc]" style={{ flex: '1 1 0%', minHeight: 0 }}>
          <div ref={msgsRef} style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'u' ? 'flex-end' : 'flex-start', flexShrink: 0 }}>
                {m.role === 'a' && (
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#2eb87a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  </div>
                )}
                <div style={{
                  maxWidth: '85%', fontSize: 14, lineHeight: 1.55, padding: '10px 14px', borderRadius: 16,
                  background: m.role === 'a' ? '#fff' : '#2eb87a',
                  color: m.role === 'a' ? '#222' : '#fff',
                  borderBottomLeftRadius: m.role === 'a' ? 4 : 16,
                  borderBottomRightRadius: m.role === 'u' ? 4 : 16,
                  wordBreak: 'break-word',
                  boxShadow: m.role === 'a' ? '0 1px 4px rgba(0,0,0,0.03)' : 'none',
                  border: m.role === 'a' ? '1px solid #f0f0f0' : 'none'
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', flexShrink: 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#2eb87a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '12px 14px', background: '#fff', borderRadius: 16, borderBottomLeftRadius: 4, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#ccc', animation: `bk 1.2s infinite ${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CHAT INPUT */}
          <div style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: inputState === 'err' ? '#fff8f8' : inputState === 'ok' ? '#f0fdf8' : '#f4f5f5',
              border: `1px solid ${inputState === 'err' ? '#ef4444' : inputState === 'ok' ? '#2eb87a' : 'transparent'}`,
              borderRadius: 24,
              padding: '4px 4px 4px 16px',
              transition: 'all .2s',
              opacity: inputDisabled ? 0.6 : 1,
            }}>
              <input
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={inputPlaceholder}
                disabled={inputDisabled}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  color: '#111',
                  outline: 'none',
                  minWidth: 0, // prevents flex overflow
                }}
              />
              <button
                onClick={handleSend}
                disabled={inputDisabled || !inputVal.trim()}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: (!inputDisabled && inputVal.trim()) ? '#2eb87a' : '#e0e0e0',
                  border: 'none', cursor: (!inputDisabled && inputVal.trim()) ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background .2s',
                }}>
                <Send size={14} color="white" style={{ position: 'relative', left: -1, top: 1 }} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: WIDGET AREA */}
        <div className="w-full md:w-[360px] p-5 md:p-6 flex flex-col gap-3 overflow-y-auto bg-white flex-shrink-0 h-[280px] md:h-full">
          {step === 'identify'      && <StepIdentify {...stepProps} />}
          {step === 'otp'           && <StepOTP {...stepProps} />}
          {step === 'agent'         && <StepAgent {...stepProps} />}
          {step === 'language'      && <StepLanguageVoice {...stepProps} />}
          {step === 'notifications' && <StepNotifications {...stepProps} />}
          {step === 'hours'         && <StepHours {...stepProps} />}
          {step === 'generate'      && <StepGenerate {...stepProps} />}
        </div>
      </div>

      <style>{`
        @keyframes bk { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
