'use client'
import { useEffect, useState } from 'react'
import LanguageSelect, { LangItem } from './steps/LanguageSelect'

const LANGUAGES: LangItem[] = [
  { code: 'en', flag: '🇺🇸', label: 'English (US)' },
  { code: 'en-GB', flag: '🇬🇧', label: 'English (UK)' },
  { code: 'es', flag: '🇪🇸', label: 'Spanish' },
  { code: 'fr', flag: '🇫🇷', label: 'French' },
  { code: 'de', flag: '🇩🇪', label: 'German' },
  { code: 'it', flag: '🇮🇹', label: 'Italian' },
  { code: 'pt', flag: '🇵🇹', label: 'Portuguese' },
  { code: 'ar', flag: '🇸🇦', label: 'Arabic' },
  { code: 'sw', flag: '🇰🇪', label: 'Swahili' },
  { code: 'zh-CN', flag: '🇨🇳', label: 'Mandarin' },
]

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('English (US)')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/)
    if (match) {
      const code = match[1]
      const found = LANGUAGES.find(l => l.code === code)
      if (found) setLang(found.label)
    } else {
      setLang('English (US)')
    }
  }, [])

  function handleChange(label: string) {
    const found = LANGUAGES.find(l => l.label === label)
    if (!found) return
    
    if (found.code?.startsWith('en')) {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
    } else {
      document.cookie = `googtrans=/en/${found.code}; path=/; domain=${window.location.hostname}`
      document.cookie = `googtrans=/en/${found.code}; path=/`
    }
    
    window.location.reload()
  }

  if (!mounted) return <div style={{ width: 140, height: 40 }}></div>

  return (
    <div style={{ width: 150 }}>
      <LanguageSelect 
        value={lang} 
        onChange={handleChange} 
        options={LANGUAGES} 
      />
    </div>
  )
}

