import { NextRequest, NextResponse } from 'next/server'
import { openRouterJSON } from '@/lib/openrouter'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 })
    }

    // Read file content as text using pdf-parse
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    let textContent = ''
    
    try {
      // Dynamic import pdf-parse
      const pdfParse = (await import('pdf-parse')).default
      const pdfData = await pdfParse(buffer)
      textContent = pdfData.text
    } catch (pdfError) {
      console.error('PDF parse error:', pdfError)
      return NextResponse.json({ error: 'Failed to parse PDF file' }, { status: 400 })
    }

    if (!textContent || textContent.length < 20) {
      return NextResponse.json({ error: 'PDF appears to be empty or unreadable' }, { status: 400 })
    }

    // Use Qwen to extract business info from the PDF content
    const info = await openRouterJSON({
      messages: [
        { 
          role: 'system', 
          content: 'Extract business information from PDF document content. Respond with raw JSON only — no markdown, no backticks.' 
        },
        { 
          role: 'user', 
          content: `Return a JSON object with these fields: name (business name), industry (one of: dental, legal, salon, medical, realestate, hvac, restaurant, vet, other), description (brief business description), services (comma-separated list), hours (business hours if found), phone, address, city, email, website. Use empty string for any field not found.

Here is the PDF content to analyze:

${textContent.slice(0, 6000)}` 
        },
      ],
      temperature: 0.2,
    })

    return NextResponse.json({ 
      success: true, 
      info,
      source: 'pdf',
      fileName: file.name,
    })
  } catch (e: any) {
    console.error('PDF extraction error:', e.message)
    return NextResponse.json({ error: e.message || 'Failed to extract PDF' }, { status: 500 })
  }
}
