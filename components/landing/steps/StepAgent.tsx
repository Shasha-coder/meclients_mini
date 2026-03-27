'use client'
// ── StepAgent ────────────────────────────────────────────────
import { useState } from 'react'
import { W } from './shared'

const AGENTS = [
  { icon: '🦷', name: 'Dental',      desc: 'Appointments, emergencies' },
  { icon: '⚖️', name: 'Law Firm',    desc: 'Intake, consultations' },
  { icon: '✂️', name: 'Salon',       desc: 'Bookings, availability' },
  { icon: '🏠', name: 'Real Estate', desc: 'Viewings, leads' },
  { icon: '🔧', name: 'HVAC',        desc: 'Dispatch, quotes' },
  { icon: '💊', name: 'Medical',     desc: 'GP, prescriptions' },
]

export default function StepAgent({ nextStep, scrapedData }: any) {
  const [sel, setSel] = useState(0) // pre-select Dental
  const [custom, setCustom] = useState('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        {AGENTS.map((a, i) => (
          <AgentCard key={i} {...a} on={sel === i} onClick={() => setSel(i)} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Not listed? Type below</span>
        <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="e.g. Vet clinic, Pharmacy…" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', background: '#fff', color: '#0F172A', transition: 'border .2s' }} />
      </div>
      <button onClick={() => {
        const v = custom.trim() || AGENTS[sel].name
        nextStep(v + ' receptionist')
      }} style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#0F172A', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s', marginTop: 4 }}>
        Next Step
      </button>
    </div>
  )
}

function AgentCard({ icon, name, desc, on, onClick }: any) {
  return (
    <div onClick={onClick} style={{
      padding: '12px 14px', borderRadius: 14, cursor: 'pointer', transition: 'all .2s',
      background: on ? '#F0F9FF' : '#fff',
      border: `1px solid ${on ? '#0EA5E9' : '#E2E8F0'}`,
      boxShadow: on ? '0 4px 12px rgba(14, 165, 233, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)'
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: on ? '#0EA5E9' : '#334155' }}>{name}</div>
      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{desc}</div>
    </div>
  )
}
