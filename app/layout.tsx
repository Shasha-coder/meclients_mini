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

import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head />
      <body className="font-sans" suppressHydrationWarning>
        <div id="google_translate_element" style={{ display: 'none' }} suppressHydrationWarning></div>
        {children}

        <Script id="google-translate-init" strategy="afterInteractive">
          {`function googleTranslateElementInit() { new window.google.translate.TranslateElement({pageLanguage: 'en', autoDisplay: false}, 'google_translate_element'); }`}
        </Script>
        <Script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
      </body>
    </html>
  )
}
