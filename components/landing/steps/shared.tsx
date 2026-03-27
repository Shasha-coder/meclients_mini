// Shared styles for all chat step widgets
import React from 'react'

export const W = {
  // Green pill input
  gin: {
    width: '100%',
    padding: '10px 16px',
    fontSize: 14,
    borderRadius: 50,
    backgroundColor: '#f0fdf8',
    border: '1.5px solid #b6e8d3',
    color: '#1a7a4a',
    outline: 'none',
    boxShadow: 'none',
  } as React.CSSProperties,

  // Green dropdown
  gsel: {
    width: '100%',
    padding: '9px 32px 9px 13px',
    fontSize: 13,
    borderRadius: 12,
    backgroundColor: '#f0fdf8',
    border: '1px solid #b6e8d3',
    color: '#1a7a4a',
    outline: 'none',
    boxShadow: 'none',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%232eb87a' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    cursor: 'pointer',
  } as React.CSSProperties,

  // Primary green button
  gbtn: (full = false) => ({
    padding: full ? '11px 20px' : '10px 20px',
    width: full ? '100%' : 'auto',
    borderRadius: 50,
    background: '#2eb87a',
    color: '#fff',
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties),

  // Skip/secondary button
  skip: {
    padding: '10px 16px',
    borderRadius: 50,
    background: 'transparent',
    border: '1.5px solid #b6e8d3',
    color: '#5aad8a',
    fontSize: 13,
    cursor: 'pointer',
  } as React.CSSProperties,

  // Back button
  backBtn: {
    padding: '10px 16px',
    borderRadius: 50,
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6
  } as React.CSSProperties,

  // Field label
  flbl: {
    fontSize: 10,
    color: '#5aad8a',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: 4,
    display: 'block',
  } as React.CSSProperties,

  // Col wrapper
  col: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as React.CSSProperties,
  btnRow: { display: 'flex', gap: 8, alignItems: 'center' } as React.CSSProperties,
  btnRowAction: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 } as React.CSSProperties,
}

export function GreenCard({ children, state = 'default' }: { children: React.ReactNode; state?: 'default' | 'err' | 'ok' }) {
  const borderColor = state === 'err' ? '#ef4444' : state === 'ok' ? '#2eb87a' : '#b6e8d3'
  const bg = state === 'err' ? '#fff8f8' : state === 'ok' ? '#eafaf3' : '#f0fdf8'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 14, border: `1.5px solid ${borderColor}`, background: bg, transition: 'border-color .3s, background .3s' }}>
      {children}
    </div>
  )
}
