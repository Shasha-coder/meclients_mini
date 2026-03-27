import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// POST /api/otp - Send or Verify OTP
export async function POST(req: NextRequest) {
  const { action, contact, code } = await req.json()

  if (!contact) {
    return NextResponse.json({ error: 'Contact required' }, { status: 400 })
  }

  const isEmail = contact.includes('@')
  const key = `otp:${contact}`

  // SEND OTP
  if (action === 'send') {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store in Redis with 90 second expiration
    await redis.set(key, otp, { ex: 90 })

    try {
      if (isEmail) {
        // Send via Resend
        const resendApiKey = process.env.RESEND_API_KEY
        
        if (!resendApiKey) {
          console.error('[v0] RESEND_API_KEY not found in env')
          await redis.del(key)
          return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
        }

        const { Resend } = await import('resend')
        const resend = new Resend(resendApiKey)
        
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'support@meclients.com'
        console.log('[v0] Sending OTP email to:', contact, 'from:', fromEmail, 'RESEND_FROM_EMAIL env:', process.env.RESEND_FROM_EMAIL ? 'SET' : 'NOT SET')
        
        const result = await resend.emails.send({
          from: fromEmail,
          to: contact,
          subject: `Your verification code: ${otp}`,
          html: `
            <div style="font-family:system-ui,-apple-system,sans-serif;max-width:420px;margin:0 auto;padding:40px 24px;">
              <div style="text-align:center;margin-bottom:32px;">
                <div style="width:56px;height:56px;background:#2eb87a;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
              </div>
              <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 12px;text-align:center;">Your verification code</h1>
              <p style="font-size:14px;color:#64748b;margin:0 0 28px;text-align:center;">Enter this code to verify your identity</p>
              <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
                <div style="font-size:40px;font-weight:800;letter-spacing:8px;color:#2eb87a;font-family:monospace;">${otp}</div>
              </div>
              <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">This code expires in 90 seconds. Do not share it with anyone.</p>
            </div>
          `,
        })
        
        console.log('[v0] Resend result:', JSON.stringify(result))
        
        if (result.error) {
          console.error('[v0] Resend error:', result.error)
          await redis.del(key)
          return NextResponse.json({ error: result.error.message || 'Failed to send email' }, { status: 500 })
        }
      } else {
        // Send via Twilio SMS
        const twilio = (await import('twilio')).default
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        await client.messages.create({
          body: `Your meclients verification code: ${otp}. Valid for 90 seconds.`,
          from: process.env.TWILIO_PHONE_NUMBER || '',
          to: contact,
        })
      }

      return NextResponse.json({ ok: true, sent: true })
    } catch (err: any) {
      console.error('OTP send error:', err)
      // Delete the stored code if send failed
      await redis.del(key)
      return NextResponse.json({ error: err.message || 'Failed to send code' }, { status: 500 })
    }
  }

  // VERIFY OTP
  if (action === 'verify') {
    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 })
    }

    const storedCode = await redis.get(key)
    
    if (!storedCode) {
      return NextResponse.json({ error: 'Code expired or not found', valid: false }, { status: 400 })
    }

    if (storedCode !== code) {
      return NextResponse.json({ error: 'Invalid code', valid: false }, { status: 400 })
    }

    // Code is valid - delete it so it can't be reused
    await redis.del(key)

    return NextResponse.json({ ok: true, valid: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
