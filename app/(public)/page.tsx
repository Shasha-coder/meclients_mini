'use client'
import { useRef, useState } from 'react'
import ScrapeCard from '@/components/landing/ScrapeCard'
import ChatPanel from '@/components/landing/ChatPanel'
import LandingFooter from '@/components/landing/LandingFooter'

export default function LandingPage() {
  const [chatOpen, setChatOpen] = useState(false)
  const [scrapedData, setScrapedData] = useState<any>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  function handleScrapeComplete(data: any) {
    setScrapedData(data)
    setChatOpen(true)
    setTimeout(() => chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)
  }

  return (
    <div className="min-h-screen flex flex-col items-center" style={{
      background: `radial-gradient(ellipse 110% 60% at 8% 100%, #9dd9bc 0%, transparent 50%),
                   radial-gradient(ellipse 80% 50% at 92% 2%, #bfecd4 0%, transparent 48%), #edf8f2`
    }}>
      <nav className="w-full px-10 pt-6">
        <span style={{ fontSize: 20, letterSpacing: '-0.4px' }}>
          <span style={{ color: '#2eb87a', fontWeight: 700 }}>me</span>
          <span style={{ color: '#111', fontWeight: 700 }}>clients</span>
        </span>
      </nav>
      <div className="text-center mt-9 mb-7 w-full max-w-4xl px-4">
        <h1 style={{ fontSize: 'clamp(36px,8vw,50px)', fontWeight: 500, lineHeight: 1.08, color: '#111', letterSpacing: '-1.8px', marginBottom: 14 }}>
          Your Business,<br />
          <em style={{ fontStyle: 'italic', fontWeight: 400, color: '#2eb87a' }}>Answered 24/7.</em>
        </h1>
        <p style={{ fontSize: 15, color: '#555', lineHeight: 1.65 }}>
          Paste your website. Your AI receptionist is live in minutes.
        </p>
      </div>
      <div className="w-full max-w-4xl px-4">
        <ScrapeCard chatOpen={chatOpen} onComplete={handleScrapeComplete} />
        <div ref={chatRef}>
          <ChatPanel open={chatOpen} scrapedData={scrapedData} />
        </div>
      </div>
      <div className="flex-1" />
      <LandingFooter />
    </div>
  )
}
