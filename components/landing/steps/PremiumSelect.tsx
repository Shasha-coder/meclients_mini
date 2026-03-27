'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export default function PremiumSelect({ value, onChange, options, placeholder = "Select...", width = '100%' }: { value: string, onChange: (v: string) => void, options: string[], placeholder?: string, width?: string | number }) {
  const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropRef])

  return (
    <div ref={dropRef} style={{ position: 'relative', width }}>
      <div 
        onClick={() => setOpen(!open)}
        style={{ 
          width: '100%', padding: '10px 12px', background: '#fff', 
          border: `1px solid ${open ? '#2eb87a' : '#E2E8F0'}`, 
          borderRadius: 8, cursor: 'pointer', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center', 
          transition: 'all .2s', 
          boxShadow: open ? '0 0 0 2px rgba(46, 184, 122, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: open ? '#2eb87a' : '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color .2s' }}>
          {value || placeholder}
        </span>
        <ChevronDown size={18} color={open ? '#2eb87a' : '#64748B'} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0, marginLeft: 8 }} />
      </div>
      
      {open && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, width: '100%', minWidth: 160, 
          marginTop: 6, background: '#fff', border: '1px solid #E2E8F0', 
          borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.1)', 
          zIndex: 50, maxHeight: 240, overflowY: 'auto' 
        }}>
          <div style={{ padding: '8px 0' }}>
            {options.map(opt => (
              <div 
                key={opt} 
                onClick={() => { onChange(opt); setOpen(false) }}
                style={{ 
                  padding: '10px 16px', cursor: 'pointer', display: 'flex', 
                  alignItems: 'center', justifyContent: 'space-between', 
                  background: 'transparent',
                  color: value === opt ? '#2eb87a' : '#64748b', 
                  fontWeight: value === opt ? 600 : 500, fontSize: 13, 
                  transition: 'all .15s' 
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.background = '#f8fafc'
                  if (value !== opt) e.currentTarget.style.color = '#334155'
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.background = 'transparent'
                  if (value !== opt) e.currentTarget.style.color = '#64748b'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 14, display: 'inline-flex', justifyContent: 'center' }}>
                    {value === opt && <Check size={14} color="#2eb87a" strokeWidth={3} />}
                  </span>
                  {opt}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  )
}
