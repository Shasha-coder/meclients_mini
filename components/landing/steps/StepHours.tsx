'use client'
import { useState } from 'react'
import { W } from './shared'
import PremiumSelect from './PremiumSelect'
import { updateBusinessHours } from '@/app/actions/onboarding'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

const TIMES: string[] = []
for (let h = 0; h < 24; h++) {
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h
  const ampm = h < 12 ? 'AM' : 'PM'
  TIMES.push(`${hr}:00 ${ampm}`)
  TIMES.push(`${hr}:30 ${ampm}`)
}

const TZS = [
  'UTC', 'EST — New York', 'PST — Los Angeles', 
  'GMT — London', 'CET — Paris', 'EAT — Nairobi', 
  'WAT — Lagos', 'CAT — Kampala', 'IST — Mumbai'
]

type DayConfig = { isOpen: boolean; opens: string; closes: string }

export default function StepHours({ nextStep, prevStep }: any) {
  const [schedule, setSchedule] = useState<Record<number, DayConfig>>(() => {
    const s: Record<number, DayConfig> = {}
    for (let i = 0; i < 7; i++) {
      s[i] = { isOpen: i < 5, opens: '9:00 AM', closes: '5:00 PM' }
    }
    return s
  })
  
  const [tz, setTz] = useState('UTC')

  async function handleNext() {
    const openDaysList = Object.entries(schedule).filter(([_, v]) => v.isOpen).map(([i]) => DAYS[parseInt(i)])
    const count = openDaysList.length
    
    const formattedHours = Object.entries(schedule)
      .filter(([_, v]) => v.isOpen)
      .map(([i, v]) => `${DAYS[parseInt(i)]}: ${v.opens}-${v.closes}`)
      .join(' | ')

    await updateBusinessHours(`TZ: ${tz}. ${formattedHours}`)
    nextStep(`${count} days · ${tz}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={W.flbl}>Business Hours</span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DAYS.map((d, i) => {
            const conf = schedule[i]
            return (
              <div key={i} style={{ 
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px', 
                background: conf.isOpen ? '#f0fdf8' : '#fff', 
                border: `1px solid ${conf.isOpen ? '#2eb87a' : '#e2e8f0'}`, 
                borderRadius: 12, transition: 'all .2s' 
              }}>
                <button 
                  onClick={() => setSchedule(s => ({ ...s, [i]: { ...s[i], isOpen: !s[i].isOpen } }))}
                  style={{ 
                    width: 38, height: 38, borderRadius: '50%', 
                    background: conf.isOpen ? '#2eb87a' : '#f1f5f9', 
                    color: conf.isOpen ? '#fff' : '#64748b', 
                    border: 'none', fontWeight: 600, fontSize: 11, 
                    cursor: 'pointer', flexShrink: 0 
                  }}
                >
                  {d}
                </button>
                
                {conf.isOpen ? (
                  <div style={{ display: 'flex', flex: 1, gap: 6, minWidth: 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <PremiumSelect 
                        value={conf.opens} 
                        onChange={(v) => setSchedule(s => ({ ...s, [i]: { ...s[i], opens: v } }))} 
                        options={TIMES} 
                      />
                    </div>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', flexShrink: 0 }}>-</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <PremiumSelect 
                        value={conf.closes} 
                        onChange={(v) => setSchedule(s => ({ ...s, [i]: { ...s[i], closes: v } }))} 
                        options={TIMES} 
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, fontSize: 13, color: '#94a3b8', paddingLeft: 8, fontWeight: 500 }}>Closed</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      <div style={W.col}>
        <span style={W.flbl}>Timezone</span>
        <PremiumSelect value={tz} onChange={(v) => setTz(v)} options={TZS} />
      </div>
      
      <div style={{...W.btnRowAction, justifyContent: 'space-between'}}>
        <div style={W.btnRow}>
          <button onClick={prevStep} style={W.backBtn}>← Back</button>
          <button onClick={handleNext} style={W.gbtn()}>Next →</button>
        </div>
        <button onClick={() => nextStep(undefined, 'Skipped')} style={W.skip}>Skip</button>
      </div>
    </div>
  )
}
