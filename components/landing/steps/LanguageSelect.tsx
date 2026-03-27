'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'

export type LangItem = { label: string; flag: string; code?: string }

export default function LanguageSelect({ 
  value, 
  onChange, 
  options, 
  width = '100%' 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  options: LangItem[]; 
  width?: string | number 
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropRef])

  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [open])

  const selected = options.find(o => o.label === value) || options[0]
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div ref={dropRef} style={{ position: 'relative', width }}>
      <div 
        onClick={() => { setOpen(!open); setSearch('') }}
        style={{ 
          width: '100%', padding: '10px 14px', background: '#fff', 
          border: `1px solid ${open ? '#2eb87a' : '#E2E8F0'}`, 
          borderRadius: 8, cursor: 'pointer', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center', 
          transition: 'all .2s', 
          boxShadow: open ? '0 0 0 2px rgba(46, 184, 122, 0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <span style={{ fontSize: 16 }}>{selected.flag}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: open ? '#2eb87a' : '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color .2s' }}>
            {selected.label}
          </span>
        </div>
        <ChevronDown size={18} color={open ? '#2eb87a' : '#64748B'} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s', flexShrink: 0, marginLeft: 8 }} />
      </div>
      
      {open && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, width: '100%', minWidth: 200, 
          marginTop: 6, background: '#fff', border: '1px solid #E2E8F0', 
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.1)', 
          zIndex: 50, display: 'flex', flexDirection: 'column'
        }}>
          {/* Search Box */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', borderRadius: 8, padding: '6px 10px', border: '1px solid #E2E8F0' }}>
              <Search size={14} color="#94A3B8" />
              <input 
                ref={searchInputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, width: '100%', color: '#334155' }}
              />
            </div>
          </div>
          
          <div style={{ padding: '6px 0', maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>No results found</div>
            ) : (
              filtered.map(opt => (
                <div 
                  key={opt.label} 
                  onClick={() => { onChange(opt.label); setOpen(false) }}
                  style={{ 
                    padding: '8px 16px', cursor: 'pointer', display: 'flex', 
                    alignItems: 'center', gap: 10,
                    background: value === opt.label ? '#f0fdf8' : 'transparent', 
                    color: value === opt.label ? '#2eb87a' : '#334155', 
                    fontWeight: value === opt.label ? 600 : 500, fontSize: 13, 
                    transition: 'all .1s' 
                  }}
                  onMouseEnter={(e) => { 
                    if (value !== opt.label) e.currentTarget.style.background = '#f8fafc'
                  }}
                  onMouseLeave={(e) => { 
                    if (value !== opt.label) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span style={{ fontSize: 16 }}>{opt.flag}</span>
                  <span style={{ flex: 1 }}>{opt.label}</span>
                  {value === opt.label && <Check size={14} color="#2eb87a" strokeWidth={3} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
