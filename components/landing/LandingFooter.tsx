export default function LandingFooter() {
  const industries = [
    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.7"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, label: 'Clinic' },
    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.7"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: 'Real Estate' },
    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.7"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: 'Law Firm' },
    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.7"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/><circle cx="12" cy="12" r="4"/></svg>, label: 'HVAC' },
    { icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.7"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/></svg>, label: 'Salon' },
  ]

  return (
    <div style={{ borderTop: '1px solid rgba(0,0,0,.06)', background: 'rgba(255,255,255,.5)', padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', marginTop: 'auto' }}>
      <span style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Built for local businesses</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {industries.map((ind, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: 0.5 }}>
            {ind.icon}
            <span style={{ fontSize: 12, color: '#333' }}>{ind.label}</span>
          </div>
        ))}
        <span style={{ fontSize: 12, color: '#aaa' }}>& more →</span>
      </div>
    </div>
  )
}
