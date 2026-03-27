'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send } from 'lucide-react'
import StepIdentify from './steps/StepIdentify'
import StepOTP from './steps/StepOTP'
import StepAnalysis from './steps/StepAnalysis'
import StepAgent from './steps/StepAgent'
import StepLanguageVoice from './steps/StepLanguageVoice'
import StepNotifications from './steps/StepNotifications'
import StepHours from './steps/StepHours'
import StepGenerate from './steps/StepGenerate'
import StepStripe from './steps/StepStripe'

export type Msg = { role: 'a' | 'u'; text: string }

export type StepId = 'identify' | 'otp' | 'analysis' | 'agent' | 'language' | 'notifications' | 'hours' | 'generate'

const STEPS: StepId[] = ['identify', 'otp', 'analysis', 'agent', 'language', 'notifications', 'hours', 'generate']
const TOTAL = STEPS.length

const STEP_LABELS: Record<StepId, string> = {
  identify:      'Identification',
  otp:           'Verification',
  analysis:      'Data Analysis',
  agent:         'Agent Type',
  language:      'Language & Voice',
  notifications: 'Notifications',
  hours:         'Business Hours',
  generate:      'Deploy Agent',
}

const STEP_MESSAGES: Record<StepId, string> = {
  identify:      '', // handled dynamically
  otp:           '', // injected after identify
  analysis:      'Let me analyze your business data to see what we have...',
  agent:         '', // handled dynamically
  language:      'What language and voice should your agent use with callers?',
  notifications: 'How should I notify you after each call?',
  hours:         "I found your address but not your hours. Set them or skip — update anytime.",
  generate:      'Everything looks great! Let me create your AI receptionist...',
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
  const [authData, setAuthData] = useState({ type: '', value: '' })
  const [agentConfig, setAgentConfig] = useState({ vertical: 'Dental', language: 'English (US)', voice: 'James' })
  const [localScrapedData, setLocalScrapedData] = useState<any>(scrapedData || {})
  const msgsRef = useRef<HTMLDivElement>(null)

  const step = STEPS[stepIdx]
  const progress = Math.round((stepIdx / TOTAL) * 100)

  const getStepMessage = (id: StepId) => {
    if (id === 'identify') return `I've read your site — ${scrapedData?.businessName || 'your business'}. To continue, enter your email or phone. 📱 Phone gets instant SMS notifications.`
    if (id === 'agent') return `Based on your site, I've pre-selected the ${scrapedData?.industry || 'Dental'} industry. Confirm or switch.`
    return STEP_MESSAGES[id]
  }

  useEffect(() => {
    if (open && !started) { setStarted(true); setTimeout(() => agentSay(getStepMessage('identify')), 800) }
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
    const msg = getStepMessage(nextId)
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
      const msg = getStepMessage(STEPS[next])
      if (msg) setTimeout(() => agentSay(msg), 400)
    }
  }

  const stepProps = { scrapedData: localScrapedData, setScrapedData: setLocalScrapedData, agentSay, userSay, nextStep, prevStep, setInputPlaceholder, setInputDisabled, setInputState, inputVal, authData, setAuthData, agentConfig, setAgentConfig }

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
      <div className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 border-b border-[#eef7f2]">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#2eb87a] to-[#22c55e] flex items-center justify-center flex-shrink-0 shadow-md">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm md:text-base font-semibold text-[#111] truncate">meclients</div>
          <div className="text-xs text-[#2eb87a] font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2eb87a] animate-pulse"></span>
            {STEP_LABELS[step] || 'Setting up'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#2eb87a] bg-[#f0fdf8] border border-[#b6e8d3] rounded-md px-2 py-1 font-semibold">AI</span>
          <span className="text-[11px] text-[#94a3b8] font-medium">{stepIdx + 1}/{TOTAL}</span>
        </div>
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
          {step === 'analysis'      && <StepAnalysis {...stepProps} />}
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
