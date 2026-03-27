'use client'
import { useState, useRef } from 'react'
import { ArrowRight, Upload } from 'lucide-react'
import { initiateScrapeJob } from '@/app/actions/onboarding'

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
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const FORBIDDEN_DOMAINS = ['amazon.', 'ebay.', 'etsy.', 'yelp.', 'facebook.', 'instagram.', 'twitter.', 'google.', 'linkedin.', 'youtube.']

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErr('File size must be strictly under 5MB.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setErr('')
    setUrl(file.name)
    setPhase('scraping')
    setSteps(s => s.map((_, idx) => idx === 0 ? 'running' : 'idle'))
    setProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setPhase('input')
        setErr(data.error || 'Failed to extract PDF content')
        if (fileRef.current) fileRef.current.value = ''
        return
      }

      // Animate completion
      setSteps(s => s.map(() => 'done'))
      setProgress(100)
      await delay(600)

      onComplete({
        isFile: true,
        source: 'pdf',
        fileName: file.name,
        ...data.info,
        businessName: data.info?.name || file.name.replace('.pdf', ''),
        industry: data.info?.industry || 'other',
      })
    } catch (error: any) {
      setPhase('input')
      setErr(error.message || 'Failed to process PDF')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSubmit() {
    if (!url.trim() && phase === 'input') return
    setErr('')

    // Validate strict URL TLD constraint
    if (!url.includes('.') || url.length < 5) {
      setErr('Please provide a valid website domain containing a Top Level Domain (e.g. .com, .org).')
      return
    }

    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      if (FORBIDDEN_DOMAINS.some(d => urlObj.hostname.includes(d))) {
        setErr('Marketplaces or generic social networks are not permitted. Please use a direct business website.')
        return
      }
    } catch (e) {
      setErr('Please provide a valid website URL.')
      return
    }

    // 5-use LocalStorage Constraint with 24-hour reset
    const now = Date.now()
    const storedStr = localStorage.getItem('mc_scrape_limit_data')
    let storedData = { count: 0, timestamp: now }
    
    if (storedStr) {
      try { storedData = JSON.parse(storedStr) } catch (e) {}
    }
    
    // Reset count if it has been strictly over 24 hours (86400000 ms)
    if (now - storedData.timestamp > 86400000) {
      storedData.count = 0
      storedData.timestamp = now
    }

    if (storedData.count >= 5) {
      setErr('You have reached the maximum allowed AI test scrapes (5) for today. Please try again in 24 hours.')
      return
    }
    
    localStorage.setItem('mc_scrape_limit_data', JSON.stringify({
      count: storedData.count + 1,
      timestamp: storedData.timestamp
    }))

    setPhase('scraping')

    // Simulate initial sequence while waiting for network
    setSteps(s => s.map((v, idx) => idx === 0 ? 'running' : v))
    setProgress(20)

    // Execute ACTUAL Firecrawl fetch behind the scenes
    const res = await initiateScrapeJob(url)

    if (!res.success) {
      setPhase('input')
      setErr(res.error || 'Failed to analyze this website. It may be blocking scrapers.')
      return
    }

    // Fast-forward completion
    setSteps(s => s.map(() => 'done'))
    setProgress(100)
    await delay(600)
    
    onComplete({ 
      businessName: res.meta?.businessName || 'Analyzed Business', 
      url, 
      industry: res.meta?.industry || 'custom', 
      markdown: res.meta?.scraped_markdown_snippet 
    })
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
              autoFocus
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
          {err && <div style={{ fontSize: 13, color: '#ef4444', backgroundColor: '#fff8f8', padding: '8px 14px', borderTop: '1px solid #fecaca' }}>{err}</div>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8f8f8' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #e0e0e0', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: '#666', background: '#fff', cursor: 'pointer' }}>
              <Upload size={13} />
              Upload PDF instead
              <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
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
