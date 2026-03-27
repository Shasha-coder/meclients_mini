// lib/openrouter/index.ts
// Reusable OpenRouter client — Qwen2.5 for all AI tasks

const BASE = 'https://openrouter.ai/api/v1/chat/completions'

interface Message { role: 'system' | 'user' | 'assistant'; content: string }

interface CallOptions {
  model?: string
  messages: Message[]
  max_tokens?: number
  temperature?: number
}

export async function openRouterCall(options: CallOptions): Promise<string> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://meclients.com',
      'X-Title': 'meclients',
    },
    body: JSON.stringify({
      model: options.model || 'qwen/qwen-2.5-72b-instruct',
      max_tokens: options.max_tokens || 1024,
      temperature: options.temperature ?? 0.3,
      messages: options.messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error: ${res.status} — ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// Convenience: parse JSON response safely
export async function openRouterJSON<T = any>(options: CallOptions): Promise<T> {
  const raw = await openRouterCall(options)
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim()) as T
  } catch {
    throw new Error('Failed to parse JSON from OpenRouter response: ' + raw.slice(0, 200))
  }
}

/*
  USAGE EXAMPLES:
  
  // Extract business info
  const info = await openRouterJSON({ messages: [{ role: 'user', content: prompt }] })

  // Build agent prompt
  const prompt = await openRouterCall({
    messages: [
      { role: 'system', content: 'You are a prompt engineer for AI voice agents.' },
      { role: 'user', content: `Build a receptionist prompt for: ${JSON.stringify(info)}` }
    ]
  })

  // Cheaper model for simple tasks (use qwen-2.5-7b)
  const summary = await openRouterCall({
    model: 'qwen/qwen-2.5-7b-instruct',
    messages: [{ role: 'user', content: 'Summarize: ' + transcript }]
  })
*/
