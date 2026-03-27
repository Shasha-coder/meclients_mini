import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { W } from './shared'

const LANGS = ['English (US)','English (UK)','French','Spanish','Portuguese','Arabic','Swahili','German','Italian','Mandarin']
const VOICES = [
  { icon: '👨', n: 'James', s: 'Male' },
  { icon: '👩', n: 'Sarah', s: 'Female' },
  { icon: '🧑', n: 'Alex',  s: 'Neutral' },
  { icon: '👩‍💼', n: 'Emma', s: 'Friendly' },
]

export default function StepLanguageVoice({ nextStep }: any) {
  const [lang, setLang] = useState('English (US)')
  const [voice, setVoice] = useState(0)
  const [openDropdown, setOpenDropdown] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(event.target as Node)) {
        setOpenDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropRef])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Premium Language Dropdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Language</span>
        <div ref={dropRef} style={{ position: 'relative' }}>
          <div 
            onClick={() => setOpenDropdown(!openDropdown)}
            style={{ width: '100%', padding: '12px 16px', background: '#fff', border: `1px solid ${openDropdown ? '#0EA5E9' : '#E2E8F0'}`, borderRadius: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all .2s', boxShadow: openDropdown ? '0 0 0 3px rgba(14, 165, 233, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)' }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, color: '#0F172A' }}>{lang}</span>
            <ChevronDown size={18} color="#94A3B8" style={{ transform: openDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }} />
          </div>
          
          {openDropdown && (
            <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: 6, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.08)', zIndex: 10, maxHeight: 180, overflowY: 'auto' }}>
              <div style={{ padding: 6 }}>
                {LANGS.map(l => (
                  <div 
                    key={l} 
                    onClick={() => { setLang(l); setOpenDropdown(false) }}
                    style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: lang === l ? '#F0F9FF' : 'transparent', color: lang === l ? '#0EA5E9' : '#334155', fontWeight: lang === l ? 600 : 400, fontSize: 13, transition: 'background .15s' }}
                    onMouseEnter={(e) => { if(lang !== l) e.currentTarget.style.background = '#F8FAFC' }}
                    onMouseLeave={(e) => { if(lang !== l) e.currentTarget.style.background = 'transparent' }}
                  >
                    {l}
                    {lang === l && <Check size={16} color="#0EA5E9" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Premium Voice Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Setup Voice</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {VOICES.map((v, i) => (
            <div key={i} onClick={() => setVoice(i)} style={{
              padding: '12px 6px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
              background: voice === i ? '#F0F9FF' : '#fff',
              border: `1px solid ${voice === i ? '#0EA5E9' : '#E2E8F0'}`,
              transition: 'all .2s',
              boxShadow: voice === i ? '0 4px 12px rgba(14, 165, 233, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{v.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: voice === i ? '#0EA5E9' : '#334155' }}>{v.n}</div>
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{v.s}</div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => nextStep(`${lang} · ${VOICES[voice].n}`)} style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#0F172A', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .2s', marginTop: 8 }}>
        Confirm Setup &amp; Continue <Check size={16} strokeWidth={2} />
      </button>
    </div>
  )
}
