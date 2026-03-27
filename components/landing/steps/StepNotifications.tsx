'use client'
import { useState } from 'react'
import { W } from './shared'

const OPTS = [
  { icon: '📱', n: 'SMS',  s: 'Instant text' },
  { icon: '✉️', n: 'Email',s: 'Transcript & recap' },
  { icon: '📱✉️',n:'Both', s: 'SMS + Email' },
  { icon: '🔕', n: 'None', s: 'Dashboard only' },
]

export default function StepNotifications({ nextStep }: any) {
  const [sel, setSel] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        {OPTS.map((o, i) => (
          <div key={i} onClick={() => setSel(i)} style={{
            padding: 11, borderRadius: 14, textAlign: 'center', cursor: 'pointer', transition: 'all .15s',
            background: sel === i ? '#2eb87a' : '#f0fdf8',
            border: `1px solid ${sel === i ? '#2eb87a' : '#b6e8d3'}`,
          }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{o.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: sel === i ? '#fff' : '#1a7a4a' }}>{o.n}</div>
            <div style={{ fontSize: 10, color: sel === i ? 'rgba(255,255,255,.8)' : '#5aad8a' }}>{o.s}</div>
          </div>
        ))}
      </div>
      <div style={W.btnRow}>
        <button onClick={() => nextStep(sel !== null ? OPTS[sel].n : 'SMS')} style={W.gbtn()}>Next →</button>
        <button onClick={() => nextStep(undefined, 'Skipped')} style={W.skip}>Skip</button>
      </div>
    </div>
  )
}
