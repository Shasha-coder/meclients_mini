import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'meclients — Your Business, Answered 24/7',
  description: 'AI receptionist that goes live in minutes. Paste your website, talk to your agent, pay. Done.',
  openGraph: {
    title: 'meclients',
    description: 'Your AI front desk, live in minutes.',
    url: 'https://meclients.com',
    siteName: 'meclients',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
