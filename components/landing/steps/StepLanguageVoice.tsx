import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { W } from './shared'
import LanguageSelect, { LangItem } from './LanguageSelect'

const LANGS: LangItem[] = [
  { flag: '🇺🇸', label: 'English (US)' },
  { flag: '🇬🇧', label: 'English (UK)' },
  { flag: '🇫🇷', label: 'French' },
  { flag: '🇪🇸', label: 'Spanish' },
  { flag: '🇵🇹', label: 'Portuguese' },
  { flag: '🇸🇦', label: 'Arabic' },
  { flag: '🇰🇪', label: 'Swahili' },
  { flag: '🇩🇪', label: 'German' },
  { flag: '🇮🇹', label: 'Italian' },
  { flag: '🇨🇳', label: 'Mandarin' },
]

const VOICES = [
  { icon: '👨', n: 'James', s: 'Male' },
  { icon: '👩', n: 'Sarah', s: 'Female' },
  { icon: '🧑', n: 'Alex',  s: 'Neutral' },
  { icon: '👩‍💼', n: 'Emma', s: 'Friendly' },
]

export default function StepLanguageVoice({ nextStep, prevStep }: any) {
  const [lang, setLang] = useState('English (US)')
  const [voice, setVoice] = useState(0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Premium Language Dropdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Language</span>
        <LanguageSelect value={lang} onChange={setLang} options={LANGS} />
      </div>

      {/* Premium Voice Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Setup Voice</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {VOICES.map((v, i) => (
            <div key={i} onClick={() => setVoice(i)} style={{
              padding: '12px 6px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
              background: voice === i ? '#f0fdf8' : '#fff',
              border: `1px solid ${voice === i ? '#2eb87a' : '#E2E8F0'}`,
              transition: 'all .2s',
              boxShadow: voice === i ? '0 4px 12px rgba(46, 184, 122, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{v.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: voice === i ? '#2eb87a' : '#334155' }}>{v.n}</div>
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{v.s}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{...W.btnRowAction, justifyContent: 'space-between', alignItems: 'center'}}>
        <button onClick={prevStep} style={W.backBtn}>← Back</button>
        <button onClick={() => nextStep(`${lang} · ${VOICES[voice].n}`)} style={{ ...W.gbtn(), padding: '12px 24px' }}>
          Continue →
        </button>
      </div>
    </div>
  )
}
