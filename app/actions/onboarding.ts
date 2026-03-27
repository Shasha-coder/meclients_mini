'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'

/**
 * Validates the initial website URL and inserts a background job
 * to scrape the data for AI Agent context.
 */
export async function initiateScrapeJob(url: string, contactData?: { email?: string; phone?: string; isWhatsApp: boolean }) {
  if (!url) return { success: false, error: 'Missing URL' }
  
  let parsedUrl = url.trim()
  if (!parsedUrl.startsWith('http') && !url.includes('.pdf')) {
    parsedUrl = `https://${parsedUrl}`
  }

  try {
    const firecrawlUrl = 'https://api.firecrawl.dev/v1/scrape'
    const response = await fetch(firecrawlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url: parsedUrl,
        formats: ['markdown'],
        onlyMainContent: true
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Firecrawl API rejection:', response.status, errorText)
      
      if (response.status === 401) {
        return { success: false, error: 'Firecrawl API Key is missing or invalid in your .env.local file!' }
      }
      return { success: false, error: `Firecrawl API Error (${response.status}): The website could not be scraped.` }
    }
    
    // In production, this Markdown text translates natively into `knowledge_sources` once the Tenant ID is hydrated
    const result = await response.json()
    const markdown = result.data?.markdown || ''
    
    let businessName = parsedUrl.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
    let industry = 'custom'
    
    // Leverage Qwen 3.5 via Inworld API to intelligently parse the business identity!
    if (process.env.INWORLD_API_KEY && markdown) {
      try {
        const openai = new OpenAI({ apiKey: process.env.INWORLD_API_KEY, baseURL: 'https://api.inworld.ai/v1' })
        const llm = await openai.chat.completions.create({
          model: 'qwen/qwen-2.5-72b-instruct',
          messages: [{
            role: 'system',
            content: `Extract the real Business Name and Industry category from this website. 
            Return ONLY a raw JSON object like {"businessName": "Acme Logic", "industry": "plumber"}. No markdown backticks.`
          }, {
            role: 'user', content: markdown.slice(0, 4000)
          }]
        })
        const parsed = JSON.parse(llm.choices[0]?.message?.content?.replace(/```json|```/g, '') || '{}')
        if (parsed.businessName && parsed.businessName.length < 50) businessName = parsed.businessName
        if (parsed.industry) industry = parsed.industry
      } catch (e) {
        console.error('LLM Extractor natively skipped:', e)
      }
    }
    
    return {
      success: true,
      jobId: result.data?.id || 'live-job',
      meta: { url: parsedUrl, businessName, industry, scraped_markdown_snippet: markdown.slice(0, 500) }
    }
  } catch (error: any) {
    console.error('Firecrawl Error caught:', error)
    return { success: false, error: error.message || 'We could not connect to that website.' }
  }
}

/**
 * Submits the Voice, Language, and Vertical configurations 
 * directly to the 'retell_agents' database table.
 */
export async function saveAgentConfiguration(config: { voice_id: string; vertical_pack: string; language: string }) {
  const supabase = createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: profile } = await supabase.from('business_profiles').select('tenant_id').eq('user_id', user.id).single()
  if (!profile) return { success: false, error: 'Tenant not found' }

  const { data, error } = await supabase.from('retell_agents').upsert({
    tenant_id: profile.tenant_id,
    voice_id: config.voice_id,
    vertical_pack: config.vertical_pack,
    status: 'draft',
    current_prompt: `You are a professional AI receptionist. Speak in ${config.language} with a ${config.vertical_pack} context.`
  }, { onConflict: 'tenant_id' }).select().single()

  if (error) {
    console.error('Failed to save agent config:', error)
    return { success: false, error: 'Could not save AI settings' }
  }

  return { success: true, agent: data }
}

/**
 * Updates the existing business_profile with the provided operating hours
 */
export async function updateBusinessHours(hours: string) {
  const supabase = createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { error } = await supabase.from('business_profiles').update({
    description: `Working Hours: ${hours}`
  }).eq('user_id', user.id)

  if (error) return { success: false }
  return { success: true }
}
