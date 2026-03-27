'use client'
import { useState, useRef } from 'react'
import { ArrowRight, Upload } from 'lucide-react'

const SCRAPE_STEPS = [
  { label: 'Fetching website',               tag: '200 OK',        color: '#2eb87a' },
  { label: 'Extracting content',             tag: '1,842 words',   color: '#2eb87a' },
  { label: 'Reading business name & services',tag: 'Name · Services', color: '#2eb87a' },
  { label: 'Checking hours & location',      tag: 'Incomplete',    color: '#f59e0b' },
  { label: 'Compiling agent knowledge',      tag: 'Ready',         color: '#2eb87a' },
]

type StepState = 'idle' | 'running' | 'done'

export default function ScrapeCard({
  chatOpen,
  onComplete,
}: {
  chatOpen: boolean
  onComplete: (data: any) => void
}) {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState<'input' | 'scraping'>('input')
  const [steps, setSteps] = useState<StepState[]>(Array(5).fill('idle'))
  const [progress, setProgress] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    if (!url.trim() && phase === 'input') return
    setPhase('scraping')

    const pcts = [20, 42, 62, 80, 100]
    for (let i = 0; i < SCRAPE_STEPS.length; i++) {
      await delay(i === 0 ? 100 : 900)
      setSteps(s => s.map((v, idx) => idx === i ? 'running' : v))
      await delay(700)
      setSteps(s => s.map((v, idx) => idx === i ? 'done' : v))
      setProgress(pcts[i])
    }

    await delay(600)
    // In production: call /api/scrape and pass real data
    onComplete({ businessName: 'Smith Dental Clinic', url, industry: 'dental' })
  }

  function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

  const S = {
    card: {
      borderRadius: 20,
      boxShadow: chatOpen ? 'none' : '0 4px 40px rgba(0,0,0,.09)',
      border: chatOpen ? 'none' : '1px solid rgba(255,255,255,.92)',
      background: '#fff',
      overflow: 'hidden',
      transition: 'all .3s ease',
      maxHeight: chatOpen ? 0 : 500,
      opacity: chatOpen ? 0 : 1,
    } as React.CSSProperties,
  }

  return (
    <div style={S.card}>
      {/* URL INPUT */}
      {phase === 'input' && !chatOpen && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 18px 14px', background: '#fff', borderBottom: '1px solid #eee' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.8" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Paste your business website URL…"
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 14,
                background: '#fff', color: '#222',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8f8f8' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #e0e0e0', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#666', background: '#fff', cursor: 'pointer' }}>
              <Upload size={13} />
              Upload PDF instead
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} />
            </label>
            <button
              onClick={handleSubmit}
              style={{
                width: 42, height: 42, borderRadius: '50%',
                background: '#2eb87a', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(46,184,122,.45)',
              }}>
              <ArrowRight size={20} color="white" strokeWidth={2.2} />
            </button>
          </div>
        </>
      )}

      {/* SCRAPING */}
      {phase === 'scraping' && !chatOpen && (
        <div style={{ padding: '22px 22px 20px', background: '#fff' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#f0fdf8', border: '1px solid #b6e8d3', borderRadius: 8, padding: '5px 10px', fontSize: 12, color: '#2eb87a', fontFamily: 'monospace', marginBottom: 18, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2eb87a" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            {url || 'smithdental.com'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {SCRAPE_STEPS.map((step, i) => {
              const state = steps[i]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, opacity: state === 'idle' ? 0 : 1, transform: state === 'idle' ? 'translateY(4px)' : 'none', transition: 'opacity .3s, transform .3s' }}>
                  {/* Icon */}
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: state === 'done' ? '#eafaf3' : state === 'running' ? '#fffbeb' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {state === 'done' && <span style={{ fontSize: 11, color: '#2eb87a', fontWeight: 700 }}>✓</span>}
                    {state === 'running' && <Spinner />}
                    {state === 'idle' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ddd', display: 'block' }} />}
                  </div>
                  <span style={{ fontSize: 13, color: state === 'idle' ? '#aaa' : '#333', flex: 1 }}>{step.label}</span>
                  {state === 'done' && (
                    <span style={{ fontSize: 11, fontWeight: 500, color: step.color }}>{step.tag}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 16, height: 2, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#2eb87a', width: `${progress}%`, borderRadius: 2, transition: 'width .5s ease' }} />
          </div>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 11, height: 11,
      border: '2px solid #fcd34d', borderTopColor: '#d97706',
      borderRadius: '50%',
      animation: 'spin .7s linear infinite',
    }} />
  )
}
