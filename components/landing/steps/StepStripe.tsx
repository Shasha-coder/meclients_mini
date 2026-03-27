'use client'
import { useState } from 'react'
import { createCheckoutSession } from '@/app/actions/stripe'
import { GreenCard, W } from './shared'
import { Loader2, ShieldCheck, Zap } from 'lucide-react'

export default function StepStripe({ agentSay, authData }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    setLoading(true)
    setError('')
    
    // Server action handles user session validation internally via createServerClient
    const res = await createCheckoutSession(authData?.value || '')
    
    if (res.success && res.url) {
      agentSay('Redirecting to secure Stripe checkout...')
      window.location.href = res.url
    } else {
      setError(res.error || 'Checkout failed')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ padding: '24px 20px', backgroundColor: '#F0FDF8', borderRadius: 20, border: '1.5px solid #2EB87A', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, backgroundColor: '#bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Zap size={24} color="#166534" fill="#166534" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Agent Ready</h3>
        <p style={{ fontSize: 13, color: '#166534', fontWeight: 500, marginBottom: 20 }}>
          Activate your $80/mo subscription to deploy your AI receptionist instantly.
        </p>

        {error && <div style={{ marginBottom: 16, fontSize: 12, color: '#ef4444', backgroundColor: '#fff8f8', padding: '8px', borderRadius: 8 }}>{error}</div>}

        <button 
          onClick={handleCheckout} 
          disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: 14, backgroundColor: '#0F172A', color: 'white', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <>Complete Activation</>}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, color: '#64748b', fontSize: 11, fontWeight: 500 }}>
          <ShieldCheck size={14} color="#2EB87A" />
          Secured by Stripe
        </div>
      </div>
    </div>
  )
}
