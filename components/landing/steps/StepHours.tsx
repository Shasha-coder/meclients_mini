'use client'
import { useState } from 'react'
import { W } from './shared'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const TIMES = ['6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM']
const TZS = ['UTC','EST — New York','PST — Los Angeles','GMT — London','CET — Paris','EAT — Nairobi','WAT — Lagos','CAT — Kampala','IST — Mumbai']

export default function StepHours({ nextStep }: any) {
  const [openDays, setOpenDays] = useState([0,1,2,3,4])
  const [opens, setOpens] = useState('9:00 AM')
  const [closes, setCloses] = useState('5:00 PM')
  const [tz, setTz] = useState('UTC')

  function toggleDay(i: number) {
    setOpenDays(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])
  }

  function handleNext() {
    const days = DAYS.filter((_, i) => openDays.includes(i)).join(', ')
    nextStep(`${days} · ${opens}–${closes} · ${tz}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <span style={W.flbl}>Open days</span>
        <div style={{ display: 'flex', gap: 5 }}>
          {DAYS.map((d, i) => (
            <button key={i} onClick={() => toggleDay(i)} style={{
              width: 33, height: 33, borderRadius: '50%', fontSize: 10, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', transition: 'all .15s',
              background: openDays.includes(i) ? '#2eb87a' : '#f0fdf8',
              color: openDays.includes(i) ? '#fff' : '#1a7a4a',
              outline: `1px solid ${openDays.includes(i) ? '#2eb87a' : '#b6e8d3'}`,
            }}>{d}</button>
          ))}
        </div>
      </div>
      <div style={W.row2}>
        <div style={W.col}>
          <span style={W.flbl}>Opens</span>
          <select value={opens} onChange={e => setOpens(e.target.value)} style={W.gsel}>
            {TIMES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div style={W.col}>
          <span style={W.flbl}>Closes</span>
          <select value={closes} onChange={e => setCloses(e.target.value)} style={W.gsel}>
            {TIMES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div style={W.col}>
        <span style={W.flbl}>Timezone</span>
        <select value={tz} onChange={e => setTz(e.target.value)} style={W.gsel}>
          {TZS.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div style={W.btnRow}>
        <button onClick={handleNext} style={W.gbtn()}>Next →</button>
        <button onClick={() => nextStep(undefined, 'Skipped')} style={W.skip}>Skip</button>
      </div>
    </div>
  )
}
