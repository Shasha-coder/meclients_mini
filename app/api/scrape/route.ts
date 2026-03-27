import { NextRequest, NextResponse } from 'next/server'
import { openRouterJSON } from '@/lib/openrouter'

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  try {
    // Firecrawl scrape
    const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
      body: JSON.stringify({ url, formats: ['markdown'] }),
    })
    const scrapeData = await scrapeRes.json()
    const markdown = scrapeData.data?.markdown ?? ''

    // Qwen2.5 via OpenRouter
    const info = await openRouterJSON({
      messages: [
        { role: 'system', content: 'Extract business info from website content. Respond with raw JSON only — no markdown, no backticks.' },
        { role: 'user', content: `Return a JSON object with: name, industry (dental|legal|salon|medical|realestate|hvac|restaurant|vet|other), description, services (comma-separated), hours, phone, address, city. Empty string for missing fields.\n\nContent:\n${markdown.slice(0, 4000)}` },
      ],
    })

    return NextResponse.json({ info, url })
  } catch (e: any) {
    console.error('Scrape error:', e.message)
    return NextResponse.json({ error: 'Scrape failed', info: {} }, { status: 500 })
  }
}
