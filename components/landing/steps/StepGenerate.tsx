'use client'
import { useEffect, useState } from 'react'
import { Check, Loader2, Phone, PhoneCall, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { W } from './shared'

const PROVISION_STEPS = [
  { id: 'prompt', label: 'Generating AI personality', icon: Sparkles },
  { id: 'agent', label: 'Creating voice agent', icon: PhoneCall },
  { id: 'number', label: 'Provisioning phone number', icon: Phone },
  { id: 'connect', label: 'Connecting systems', icon: Check },
]

type StepStatus = 'pending' | 'running' | 'done' | 'error'
type Phase = 'provisioning' | 'ready' | 'error'

export default function StepGenerate({ 
  agentSay, 
  prevStep, 
  scrapedData, 
  agentConfig,
}: any) {
  const [phase, setPhase] = useState<Phase>('provisioning')
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(
    Object.fromEntries(PROVISION_STEPS.map(s => [s.id, 'pending']))
  )
  const [provisionResult, setProvisionResult] = useState<{
    agentId?: string
    phoneNumber?: string
    sipTrunkSid?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    runProvisioning()
  }, [])

  async function runProvisioning() {
    try {
      // Step 1: Generating prompt
      setStepStatuses(prev => ({ ...prev, prompt: 'running' }))
      await delay(800)
      setStepStatuses(prev => ({ ...prev, prompt: 'done' }))

      // Step 2: Creating agent
      setStepStatuses(prev => ({ ...prev, agent: 'running' }))
      
      // Make the actual API call
      const res = await fetch('/api/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: scrapedData?.businessName || scrapedData?.name || 'My Business',
          industry: scrapedData?.industry || 'other',
          services: scrapedData?.services || '',
          hours: scrapedData?.hours || '',
          phone: scrapedData?.phone || '',
          address: scrapedData?.address || '',
          language: agentConfig?.language || 'English (US)',
          voice: agentConfig?.voice || 'James',
          scrapedData,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to provision agent')
      }

      setStepStatuses(prev => ({ ...prev, agent: 'done' }))

      // Step 3: Phone number provisioned
      setStepStatuses(prev => ({ ...prev, number: 'running' }))
      await delay(600)
      setStepStatuses(prev => ({ ...prev, number: 'done' }))

      // Step 4: Connecting
      setStepStatuses(prev => ({ ...prev, connect: 'running' }))
      await delay(500)
      setStepStatuses(prev => ({ ...prev, connect: 'done' }))

      setProvisionResult({
        agentId: data.agentId,
        phoneNumber: data.phoneNumber,
        sipTrunkSid: data.sipTrunkSid,
      })

      setPhase('ready')
      agentSay(`Your AI receptionist is live! Your dedicated number is ${data.phoneNumber}. Test it now!`)

    } catch (err: any) {
      console.error('Provisioning error:', err)
      setError(err.message || 'Failed to create your agent')
      setPhase('error')
      
      // Mark current running step as error
      setStepStatuses(prev => {
        const updated = { ...prev }
        for (const key in updated) {
          if (updated[key] === 'running') {
            updated[key] = 'error'
          }
        }
        return updated
      })

      agentSay('There was an issue creating your agent. Please try again or contact support.')
    }
  }

  function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  function formatPhoneNumber(phone: string) {
    if (!phone) return ''
    // Format as (XXX) XXX-XXXX for US numbers
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  // Provisioning state
  if (phase === 'provisioning') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 64, 
            height: 64, 
            margin: '0 auto 16px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, #2eb87a 0%, #22c55e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(46, 184, 122, 0.3)',
          }}>
            <Loader2 size={32} color="white" className="animate-spin" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            Creating Your Agent
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            This usually takes about 30 seconds
          </p>
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PROVISION_STEPS.map((step, i) => {
            const status = stepStatuses[step.id]
            const Icon = step.icon
            
            return (
              <div 
                key={step.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: status === 'done' ? '#f0fdf4' : status === 'running' ? '#fefce8' : '#f8fafc',
                  border: `1px solid ${status === 'done' ? '#bbf7d0' : status === 'running' ? '#fef08a' : '#e2e8f0'}`,
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: status === 'done' ? '#22c55e' : status === 'running' ? '#fbbf24' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {status === 'done' ? (
                    <Check size={18} color="white" strokeWidth={3} />
                  ) : status === 'running' ? (
                    <Loader2 size={18} color="white" className="animate-spin" />
                  ) : (
                    <Icon size={18} color="#94a3b8" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    color: status === 'done' ? '#166534' : status === 'running' ? '#854d0e' : '#64748b',
                    margin: 0,
                  }}>
                    {step.label}
                  </p>
                </div>
                {status === 'done' && (
                  <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Complete</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Error state
  if (phase === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '32px 16px', textAlign: 'center' }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <AlertCircle size={32} color="#ef4444" />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            Something went wrong
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            {error || 'Failed to create your agent. Please try again.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={prevStep} style={W.backBtn}>
            Go Back
          </button>
          <button 
            onClick={() => {
              setPhase('provisioning')
              setError(null)
              setStepStatuses(Object.fromEntries(PROVISION_STEPS.map(s => [s.id, 'pending'])))
              runProvisioning()
            }}
            style={{
              ...W.gbtn(false),
              padding: '12px 24px',
              borderRadius: 12,
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Ready state
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '24px 0' }}>
      {/* Success header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 72,
          height: 72,
          margin: '0 auto 16px',
          borderRadius: 24,
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 40px rgba(34, 197, 94, 0.4)',
        }}>
          <Check size={36} color="white" strokeWidth={3} />
        </div>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Agent Live!
        </h3>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          Your AI receptionist is ready to take calls
        </p>
      </div>

      {/* Phone number display */}
      {provisionResult?.phoneNumber && (
        <div style={{
          width: '100%',
          padding: '20px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '2px solid #bbf7d0',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Your Dedicated Number
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#166534', margin: 0, fontFamily: 'monospace', letterSpacing: '0.02em' }}>
            {formatPhoneNumber(provisionResult.phoneNumber)}
          </p>
        </div>
      )}

      {/* Test call CTA */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => {
            if (provisionResult?.phoneNumber) {
              window.location.href = `tel:${provisionResult.phoneNumber}`
            }
          }}
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: 14,
            background: '#2eb87a',
            color: 'white',
            border: 'none',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 8px 24px rgba(46, 184, 122, 0.35)',
            transition: 'all 0.2s ease',
          }}
        >
          <PhoneCall size={20} />
          Call Your Agent Now
        </button>

        <button
          onClick={prevStep}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: 14,
            background: '#f1f5f9',
            color: '#64748b',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
          Back to Settings
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: 0 }}>
        Agent ID: {provisionResult?.agentId?.slice(0, 12)}...
      </p>
    </div>
  )
}
