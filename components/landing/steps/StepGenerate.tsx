import { useEffect, useState } from 'react'
import { Mail, Phone, ArrowRight, PhoneCall, PhoneForwarded } from 'lucide-react'
import { W } from './shared'

const LOAD_STEPS = [
  'Compiling knowledge',
  'Configuring voice',
  'Setting hours',
  'Provisioning number',
  'Quality check',
]

type LoadState = 'idle' | 'running' | 'done'
type Phase = 'loading' | 'ready'

export default function StepGenerate({ agentSay }: any) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [loadStates, setLoadStates] = useState<LoadState[]>(LOAD_STEPS.map(() => 'idle'))
  const [loadTxt, setLoadTxt] = useState('Building your AI receptionist…')
  const [progress, setProgress] = useState(0)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loadingCheckout, setLoadingCheckout] = useState(false)

  const isValid = email.includes('@') && phone.length > 6

  async function handleCheckout() {
    if (!isValid) return
    setLoadingCheckout(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Error initiating checkout.')
      }
    } catch(err) {
      console.error(err)
      alert('Error initiating checkout.')
    } finally {
      setLoadingCheckout(false)
    }
  }

  useEffect(() => {
    runLoading()
  }, [])

  async function runLoading() {
    const pcts = [72, 79, 86, 93, 100]
    for (let i = 0; i < LOAD_STEPS.length; i++) {
      await delay(i === 0 ? 200 : 600)
      setLoadStates(s => s.map((v, idx) => idx === i ? 'running' : idx < i ? 'done' : 'idle'))
      setLoadTxt(LOAD_STEPS[i] + '…')
      await delay(600)
      setLoadStates(s => s.map((v, idx) => idx <= i ? 'done' : 'idle'))
      setProgress(pcts[i])
    }
    await delay(500)
    setPhase('ready')
    agentSay('🎉 Your AI receptionist is ready! Test it before paying — no card needed yet.')
  }

  function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }

  if (phase === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 8 }}>
        <div style={{ width: 36, height: 36, border: '3px solid #d4f0e5', borderTopColor: '#2eb87a', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <div style={{ fontSize: 12, color: '#2eb87a', fontWeight: 500 }}>{loadTxt}</div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {LOAD_STEPS.map((s, i) => (
            <div key={i} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 8, color: loadStates[i] === 'done' ? '#2eb87a' : loadStates[i] === 'running' ? '#111' : '#aaa', fontWeight: loadStates[i] === 'running' ? 500 : 400 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: loadStates[i] === 'done' ? '#2eb87a' : loadStates[i] === 'running' ? '#fcd34d' : '#f0f0f0', display: 'block' }} />
              {s}
            </div>
          ))}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 8px', textAlign: 'center' }}>
      
      {/* Custom Pro Icon */}
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18" />
          <path d="M3 12h18" />
          <path d="M7 7l10 10" />
          <path d="M17 7L7 17" />
          <path d="M16 4h4v4" />
        </svg>
      </div>

      <div style={{ fontSize: 32, fontWeight: 800, color: '#0B1527', letterSpacing: '-0.02em', marginBottom: 16 }}>
        Agent Ready
      </div>
      
      <div style={{ fontSize: 18, color: '#64748B', lineHeight: 1.4, padding: '0 10px', maxWidth: 400, marginBottom: 32 }}>
        Your AI receptionist has been compiled. Test it completely free before deployment.
      </div>
      
      {/* Cards Row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginBottom: 32 }}>
        <div style={{ width: '100%', padding: '16px 20px', borderRadius: 12, background: '#fff', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all .2s', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ width: 42, height: 42, background: '#F0F9FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneCall size={20} color="#0ea5e9" strokeWidth={2} />
          </div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 2 }}>Web Call</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>Talk right in your browser</div>
          </div>
          <ArrowRight size={16} color="#CBD5E1" />
        </div>

        <div style={{ width: '100%', padding: '16px 20px', borderRadius: 12, background: '#fff', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'all .2s', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ width: 42, height: 42, background: '#F0FDF4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneForwarded size={20} color="#10b981" strokeWidth={2} />
          </div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 2 }}>Phone Call</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>Request an instant callback</div>
          </div>
          <ArrowRight size={16} color="#CBD5E1" />
        </div>
      </div>

      <div style={{ width: '100%', height: 1, background: '#F1F5F9', marginBottom: 24 }} />

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: '100%', position: 'relative' }}>
          <Mail size={18} color="#94A3B8" strokeWidth={1.5} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="email" 
            placeholder="Work Email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: 16, border: '1px solid #E2E8F0', fontSize: 15, outline: 'none', background: '#F8FAFC', color: '#0F172A', transition: 'border .2s' }}
          />
        </div>
        <div style={{ width: '100%', position: 'relative' }}>
          <Phone size={18} color="#94A3B8" strokeWidth={1.5} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="tel" 
            placeholder="Phone Number (Required)" 
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: 16, border: '1px solid #E2E8F0', fontSize: 15, outline: 'none', background: '#F8FAFC', color: '#0F172A', transition: 'border .2s' }}
          />
        </div>
        <button 
          onClick={handleCheckout}
          disabled={loadingCheckout || !isValid}
          style={{ width: '100%', padding: '18px', borderRadius: 16, background: (loadingCheckout || !isValid) ? '#E2E8F0' : '#0B1527', color: (loadingCheckout || !isValid) ? '#94A3B8' : '#fff', border: 'none', fontSize: 16, fontWeight: 600, cursor: (loadingCheckout || !isValid) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all .2s', marginTop: 8, boxShadow: (!loadingCheckout && isValid) ? '0 8px 20px rgba(11,21,39,0.15)' : 'none' }}>
          {loadingCheckout ? 'Preparing secure checkout...' : (
            <>
              Deploy Agent <ArrowRight size={18} strokeWidth={2} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
