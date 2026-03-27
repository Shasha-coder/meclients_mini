import { NextRequest, NextResponse } from 'next/server'
import { openRouterJSON } from '@/lib/openrouter'

interface AnalysisItem {
  field: string
  label: string
  status: 'found' | 'missing' | 'partial'
  value?: string
  suggestion?: string
}

interface AnalysisResult {
  items: AnalysisItem[]
  summary: string
  ready: boolean
}

export async function POST(req: NextRequest) {
  const { scrapedData, source } = await req.json()
  
  if (!scrapedData) {
    return NextResponse.json({ error: 'No data to analyze' }, { status: 400 })
  }

  try {
    const analysis = await openRouterJSON<AnalysisResult>({
      messages: [
        { 
          role: 'system', 
          content: `You are analyzing business data to determine if it's sufficient to create an AI voice receptionist agent.

Analyze the provided business data and return a JSON object with this exact structure:
{
  "items": [
    { "field": "name", "label": "Business Name", "status": "found|missing|partial", "value": "extracted value or empty", "suggestion": "what user should add if missing" },
    { "field": "industry", "label": "Industry Type", "status": "found|missing|partial", "value": "", "suggestion": "" },
    { "field": "services", "label": "Services Offered", "status": "found|missing|partial", "value": "", "suggestion": "" },
    { "field": "hours", "label": "Business Hours", "status": "found|missing|partial", "value": "", "suggestion": "" },
    { "field": "phone", "label": "Phone Number", "status": "found|missing|partial", "value": "", "suggestion": "" },
    { "field": "address", "label": "Address", "status": "found|missing|partial", "value": "", "suggestion": "" }
  ],
  "summary": "A short conversational message (1-2 sentences) telling the user what was found and what they need to add. Be friendly and helpful.",
  "ready": true/false (true if name and at least 2 other fields are found)
}

Rules:
- status "found" = clear data found
- status "partial" = some info found but incomplete
- status "missing" = not found at all
- Keep suggestions actionable and brief
- summary should be conversational like you're talking to a business owner` 
        },
        { 
          role: 'user', 
          content: `Analyze this business data from ${source === 'pdf' ? 'a PDF document' : 'their website'}:

${JSON.stringify(scrapedData, null, 2)}` 
        },
      ],
      temperature: 0.2,
    })

    return NextResponse.json(analysis)
  } catch (e: any) {
    console.error('Analysis error:', e.message)
    
    // Fallback basic analysis if AI fails
    const fallback: AnalysisResult = {
      items: [
        { field: 'name', label: 'Business Name', status: scrapedData.name ? 'found' : 'missing', value: scrapedData.name || '', suggestion: 'Add your business name' },
        { field: 'industry', label: 'Industry Type', status: scrapedData.industry ? 'found' : 'missing', value: scrapedData.industry || '', suggestion: 'Select your industry' },
        { field: 'services', label: 'Services Offered', status: scrapedData.services ? 'found' : 'missing', value: scrapedData.services || '', suggestion: 'List your main services' },
        { field: 'hours', label: 'Business Hours', status: scrapedData.hours ? 'found' : 'missing', value: scrapedData.hours || '', suggestion: 'Add your operating hours' },
        { field: 'phone', label: 'Phone Number', status: scrapedData.phone ? 'found' : 'missing', value: scrapedData.phone || '', suggestion: 'Add a contact phone number' },
        { field: 'address', label: 'Address', status: scrapedData.address ? 'found' : 'missing', value: scrapedData.address || '', suggestion: 'Add your business address' },
      ],
      summary: 'I analyzed your data. Please review and fill in any missing fields.',
      ready: Boolean(scrapedData.name),
    }
    
    return NextResponse.json(fallback)
  }
}
