import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/otp/send
export async function POST(req: NextRequest) {
  const { contact, tenant_id } = await req.json()
  if (!contact) return NextResponse.json({ error: 'Contact required' }, { status: 400 })

  const code = Math.floor(1000 + Math.random() * 9000).toString()
  const expiresAt = new Date(Date.now() + 60 * 1000).toISOString()

  const supabase = createServiceClient()

  // Store code in Supabase (we'll add an otp_codes table or use provisioning_jobs as scratch)
  // For now store in a simple way — in production add otp_codes table
  const { error } = await supabase.from('provisioning_jobs').insert({
    tenant_id: tenant_id || '00000000-0000-0000-0000-000000000000',
    step: 'otp_' + contact,
    status: 'pending',
    payload: { code, expires_at: expiresAt, contact },
    idempotency_key: 'otp_' + contact + '_' + Date.now(),
  })

  const isEmail = contact.includes('@')

  if (isEmail) {
    // Send via Resend
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@meclients.com',
      to: contact,
      subject: `Your meclients verification code: ${code}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:400px;margin:0 auto;padding:32px;">
          <h2 style="font-size:18px;font-weight:600;color:#111;margin-bottom:8px;">Your verification code</h2>
          <div style="font-size:36px;font-weight:800;color:#2eb87a;letter-spacing:8px;margin:20px 0;">${code}</div>
          <p style="font-size:13px;color:#555;">This code expires in 60 seconds.</p>
        </div>
      `,
    })
  } else {
    // Send via Twilio SMS
    const twilio = (await import('twilio')).default
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await client.messages.create({
      body: `Your meclients code: ${code} (valid 60s)`,
      from: process.env.TWILIO_PHONE_NUMBER || '',
      to: contact,
    })
  }

  return NextResponse.json({ ok: true })
}
