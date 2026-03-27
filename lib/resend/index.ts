// lib/resend/index.ts
import { Resend } from 'resend'
import { format } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@meclients.com'

export async function sendActivationEmail({
  to,
  businessName,
  phoneNumber,
}: {
  to: string
  businessName: string
  phoneNumber: string
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `🎉 Your AI receptionist is live — ${phoneNumber}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
        <h1 style="font-size: 22px; font-weight: 600; margin-bottom: 8px;">You're live! 🚀</h1>
        <p style="color: #64748b; margin-bottom: 24px;">
          Your AI receptionist for <strong>${businessName}</strong> is now answering calls 24/7.
        </p>

        <div style="background: #f7f8fa; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
          <p style="font-size: 13px; color: #64748b; margin: 0 0 6px;">Your new AI number</p>
          <p style="font-size: 28px; font-weight: 600; margin: 0; color: #0f172a;">${phoneNumber}</p>
        </div>

        <h2 style="font-size: 15px; font-weight: 600; margin-bottom: 12px;">Next step: Forward your existing number</h2>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
          To start capturing every call, set up call forwarding from your current business number to <strong>${phoneNumber}</strong>.
        </p>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">
          Most carriers let you do this in your phone's settings or by dialling <strong>*21*${phoneNumber}#</strong>. Contact your carrier if you need help.
        </p>

        <div style="border-top: 1px solid #e8edf2; padding-top: 20px; font-size: 12px; color: #94a3b8;">
          You'll receive a daily call summary every morning. Questions? Reply to this email.
        </div>
      </div>
    `,
  })
}

export async function sendDailyCallSummary({
  to,
  businessName,
  date,
  calls,
}: {
  to: string
  businessName: string
  date: Date
  calls: Array<{
    caller_phone: string | null
    duration_secs: number | null
    outcome: string | null
    summary: string | null
    started_at: string | null
  }>
}) {
  const booked = calls.filter(c => c.outcome === 'booked').length
  const missed = calls.filter(c => c.outcome === 'missed').length
  const total = calls.length
  const estimatedRevenue = booked * 150

  const callRows = calls.map(c => {
    const mins = c.duration_secs ? Math.floor(c.duration_secs / 60) : 0
    const secs = c.duration_secs ? c.duration_secs % 60 : 0
    const time = c.started_at ? format(new Date(c.started_at), 'h:mm a') : '—'
    return `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 13px; color: #0f172a;">${c.caller_phone || 'Unknown'}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 13px; color: #64748b;">${time}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 13px; color: #64748b;">${mins > 0 ? `${mins}m ` : ''}${secs}s</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e8edf2; font-size: 13px;">
          <span style="background: ${c.outcome === 'booked' ? '#edf9f2' : '#f7f8fa'}; color: ${c.outcome === 'booked' ? '#166534' : '#64748b'}; padding: 2px 8px; border-radius: 20px; font-size: 12px;">
            ${c.outcome || '—'}
          </span>
        </td>
      </tr>
    `
  }).join('')

  return resend.emails.send({
    from: FROM,
    to,
    subject: `📞 Daily summary — ${format(date, 'MMM d')}: ${total} calls, ${booked} bookings`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
        <p style="font-size: 13px; color: #94a3b8; margin-bottom: 4px;">${format(date, 'EEEE, MMMM d yyyy')}</p>
        <h1 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">${businessName} — Daily summary</h1>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px;">
          ${[
            { label: 'Total calls', value: total },
            { label: 'Bookings made', value: booked },
            { label: 'Est. revenue', value: `$${estimatedRevenue}` },
          ].map(s => `
            <div style="background: #f7f8fa; border-radius: 12px; padding: 16px; text-align: center;">
              <p style="font-size: 22px; font-weight: 600; margin: 0;">${s.value}</p>
              <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">${s.label}</p>
            </div>
          `).join('')}
        </div>

        ${missed > 0 ? `<p style="font-size: 13px; color: #ef4444; margin-bottom: 20px;">⚠️ ${missed} call${missed > 1 ? 's' : ''} missed — consider checking escalation settings.</p>` : ''}

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              ${['Caller', 'Time', 'Duration', 'Outcome'].map(h => `<th style="text-align: left; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 8px;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${callRows}</tbody>
        </table>

        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e8edf2; font-size: 12px; color: #94a3b8;">
          Powered by meclients · <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="color: #5fca8a;">View dashboard</a>
        </div>
      </div>
    `,
  })
}
