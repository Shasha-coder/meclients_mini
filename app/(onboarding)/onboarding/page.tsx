'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, ArrowLeft, Globe, FileText, Clock, Loader2, Mic, MicOff } from 'lucide-react'

type Step = 'source' | 'confirm' | 'test' | 'pay'

interface BusinessInfo {
  name: string
  industry: string
  hours: string
  escalation_phone: string
  services: string
  description: string
}

const INDUSTRIES = [
  { value: 'dental', label: '🦷 Dental Clinic' },
  { value: 'legal', label: '⚖️ Law Firm' },
  { value: 'salon', label: '✂️ Hair Salon' },
  { value: 'realestate', label: '🏠 Real Estate' },
  { value: 'plumbing', label: '🔧 Plumbing' },
  { value: 'medical', label: '💊 Medical / GP' },
  { value: 'vet', label: '🐾 Vet Clinic' },
  { value: 'restaurant', label: '🍕 Restaurant' },
  { value: 'other', label: '🏢 Other' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')

  const [step, setStep] = useState<Step>('source')
  const [url, setUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [info, setInfo] = useState<BusinessInfo>({
    name: '', industry: '', hours: 'Mon–Fri 9am–5pm', escalation_phone: '', services: '', description: ''
  })
  const [calling, setCalling] = useState(false)
  const [agentReady, setAgentReady] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('mc_url')
    if (saved) { setUrl(saved); sessionStorage.removeItem('mc_url') }
  }, [])

  async function handleScrape() {
    if (!url.trim()) return
    setScraping(true)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (data.info) {
        setInfo(prev => ({ ...prev, ...data.info }))
        setStep('confirm')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setScraping(false)
    }
  }

  async function handleBuildAgent() {
    setScraping(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ info, url }),
      })
      const data = await res.json()
      if (data.agent_id) {
        sessionStorage.setItem('mc_agent_id', data.agent_id)
        setAgentReady(true)
        setStep('test')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setScraping(false)
    }
  }

  const steps: { id: Step; label: string }[] = [
    { id: 'source', label: 'Your website' },
    { id: 'confirm', label: 'Confirm details' },
    { id: 'test', label: 'Talk to agent' },
    { id: 'pay', label: 'Go live' },
  ]

  const currentStepIdx = steps.findIndex(s => s.id === step)

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 max-w-2xl mx-auto w-full">
        <span className="text-lg font-semibold text-ink">meclients</span>
        <button onClick={() => router.push('/')} className="text-sm text-ink-muted hover:text-ink transition-colors">
          ← Back
        </button>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full px-6 mb-8">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${i <= currentStepIdx ? 'text-brand-600' : 'text-ink-faint'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 transition-colors ${
                  i < currentStepIdx ? 'bg-brand-500 text-white' :
                  i === currentStepIdx ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400' :
                  'bg-surface-border text-ink-faint'
                }`}>
                  {i < currentStepIdx ? '✓' : i + 1}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 transition-colors ${i < currentStepIdx ? 'bg-brand-400' : 'bg-surface-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-6">

        {/* STEP 1: Source */}
        {step === 'source' && (
          <div className="bg-white rounded-3xl shadow-lifted border border-surface-border p-8 animate-slide-up">
            <h2 className="text-2xl font-semibold text-ink mb-1">Tell us about your business</h2>
            <p className="text-ink-muted text-sm mb-8">Paste your website URL and we'll do the rest in 30 seconds.</p>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-ink flex items-center gap-2">
                  <Globe size={15} className="text-brand-500" /> Your website URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://yourpractice.com"
                  className="w-full border border-surface-border rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:ring-2 focus:ring-brand-300 transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-surface-border" />
                <span className="text-xs text-ink-faint">or</span>
                <div className="h-px flex-1 bg-surface-border" />
              </div>

              <label className="flex items-center gap-3 border-2 border-dashed border-surface-border rounded-2xl p-5 cursor-pointer hover:border-brand-300 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                  <FileText size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Upload a PDF instead</p>
                  <p className="text-xs text-ink-muted">Menu, brochure, or info sheet</p>
                </div>
                <input type="file" accept=".pdf" className="hidden" />
              </label>
            </div>

            <button
              onClick={handleScrape}
              disabled={!url.trim() || scraping}
              className="w-full mt-8 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white py-3.5 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {scraping ? (
                <><Loader2 size={16} className="animate-spin" /> Reading your website...</>
              ) : (
                <>Build my agent <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: Confirm details */}
        {step === 'confirm' && (
          <div className="bg-white rounded-3xl shadow-lifted border border-surface-border p-8 animate-slide-up">
            <h2 className="text-2xl font-semibold text-ink mb-1">Looks right?</h2>
            <p className="text-ink-muted text-sm mb-8">We scraped your site. Fix anything that's off — takes 30 seconds.</p>

            <div className="space-y-4">
              <Field label="Business name" value={info.name} onChange={v => setInfo(p => ({ ...p, name: v }))} />

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">Industry</label>
                <select
                  value={info.industry}
                  onChange={e => setInfo(p => ({ ...p, industry: e.target.value }))}
                  className="w-full border border-surface-border rounded-2xl px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-300 bg-white"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
              </div>

              <Field label="Business hours" value={info.hours} onChange={v => setInfo(p => ({ ...p, hours: v }))} placeholder="Mon–Fri 9am–5pm, Sat 10am–2pm" />
              <Field label="Services offered" value={info.services} onChange={v => setInfo(p => ({ ...p, services: v }))} placeholder="Teeth cleaning, X-rays, Fillings..." />
              <Field label="Urgent call transfer number" value={info.escalation_phone} onChange={v => setInfo(p => ({ ...p, escalation_phone: v }))} placeholder="+1 (555) 000-0000" />
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep('source')} className="flex-1 border border-surface-border text-ink-muted py-3 rounded-2xl text-sm hover:bg-surface-muted transition-colors flex items-center justify-center gap-2">
                <ArrowLeft size={15} /> Back
              </button>
              <button
                onClick={handleBuildAgent}
                disabled={!info.name || !info.industry || scraping}
                className="flex-2 flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white py-3 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {scraping ? <><Loader2 size={16} className="animate-spin" /> Building agent...</> : <>Build agent <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Test agent */}
        {step === 'test' && (
          <div className="bg-white rounded-3xl shadow-lifted border border-surface-border p-8 animate-slide-up text-center">
            <div className="w-16 h-16 rounded-3xl bg-brand-50 flex items-center justify-center mx-auto mb-5">
              <Mic size={28} className="text-brand-600" />
            </div>
            <h2 className="text-2xl font-semibold text-ink mb-2">Talk to your agent</h2>
            <p className="text-ink-muted text-sm mb-8 max-w-sm mx-auto">
              This is your AI receptionist. Call it, test it, ask anything a real customer would ask.
              No payment needed yet.
            </p>

            <button
              onClick={() => setCalling(!calling)}
              className={`w-full py-4 rounded-2xl font-medium transition-all text-sm mb-4 flex items-center justify-center gap-3 ${
                calling
                  ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                  : 'bg-brand-500 hover:bg-brand-600 text-white shadow-soft'
              }`}
            >
              {calling ? <><MicOff size={18} /> End call</> : <><Mic size={18} /> Start talking</>}
            </button>

            {calling && (
              <div className="bg-surface-muted rounded-2xl px-5 py-4 mb-6 text-left animate-fade-in">
                <div className="flex items-center gap-2 text-xs text-ink-muted mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Agent speaking...
                </div>
                <p className="text-sm text-ink italic">"Hello, thank you for calling {info.name || 'us'}! How can I help you today?"</p>
              </div>
            )}

            <button
              onClick={() => setStep('pay')}
              className="w-full border border-surface-border text-ink py-3 rounded-2xl text-sm hover:bg-surface-muted transition-colors flex items-center justify-center gap-2"
            >
              Hire this agent <ArrowRight size={15} />
            </button>
            <p className="text-xs text-ink-faint mt-3">You can keep testing as long as you want</p>
          </div>
        )}

        {/* STEP 4: Pay */}
        {step === 'pay' && (
          <div className="bg-white rounded-3xl shadow-lifted border border-surface-border p-8 animate-slide-up">
            <h2 className="text-2xl font-semibold text-ink mb-1">Let's go live 🚀</h2>
            <p className="text-ink-muted text-sm mb-8">Your agent is ready. Activate it and get your real phone number.</p>

            <div className="bg-surface-muted rounded-2xl p-5 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Setup fee (one-time)</span>
                <span className="font-semibold text-ink">$99</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Monthly subscription</span>
                <span className="font-semibold text-ink">$197/mo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">Real phone number</span>
                <span className="font-semibold text-brand-600">Included</span>
              </div>
              <div className="h-px bg-surface-border" />
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-ink">Due today</span>
                <span className="text-ink">$296</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {[
                { icon: <Clock size={14} />, text: 'Agent live within 2 minutes of payment' },
                { icon: <Phone size={14} />, text: 'Real local phone number included' },
                { icon: '📧', text: 'Daily call summary emails to you' },
                { icon: '🔒', text: 'Cancel anytime, no lock-in' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-ink-muted">
                  <span className="text-brand-500">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            <form action="/api/provision" method="POST">
              <input type="hidden" name="info" value={JSON.stringify(info)} />
              <button
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white py-4 rounded-2xl font-medium transition-colors text-sm shadow-soft"
              >
                Pay & activate my agent →
              </button>
            </form>
            <p className="text-xs text-ink-faint mt-3 text-center">Powered by Stripe. Your card details never touch our servers.</p>
          </div>
        )}
      </div>

      <div className="h-16" />
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-surface-border rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:ring-2 focus:ring-brand-300 transition"
      />
    </div>
  )
}
