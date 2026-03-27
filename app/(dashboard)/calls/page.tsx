import { createServerClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { Phone, PhoneIncoming, PhoneMissed, Clock } from 'lucide-react'

export default async function CallsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user!.id).single()

  const { data: calls } = await supabase
    .from('calls')
    .select('*, call_outcomes(outcome)')
    .eq('tenant_id', tenant!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">Call history</h1>
        <p className="text-sm text-ink-muted mt-0.5">{calls?.length ?? 0} calls total</p>
      </div>

      <div className="bg-white rounded-2xl border border-surface-border shadow-card">
        {!calls?.length ? (
          <div className="py-16 text-center">
            <Phone size={32} className="text-ink-faint mx-auto mb-3" />
            <p className="text-sm text-ink-muted">No calls yet. Your agent is ready and waiting.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {calls.map(call => {
              const outcome = call.call_outcomes?.[0]?.outcome
              const mins = call.duration_secs ? Math.floor(call.duration_secs / 60) : 0
              const secs = call.duration_secs ? call.duration_secs % 60 : 0
              return (
                <div key={call.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-muted/50 transition-colors">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    call.status === 'missed' ? 'bg-red-50' : 'bg-brand-50'
                  }`}>
                    {call.status === 'missed'
                      ? <PhoneMissed size={15} className="text-red-400" />
                      : <PhoneIncoming size={15} className="text-brand-600" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{call.caller_phone || 'Unknown caller'}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-ink-faint">
                        {call.started_at ? format(new Date(call.started_at), 'MMM d, h:mm a') : '—'}
                      </span>
                      {call.duration_secs != null && (
                        <span className="flex items-center gap-1 text-xs text-ink-faint">
                          <Clock size={11} />
                          {mins > 0 ? `${mins}m ` : ''}{secs}s
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary snippet */}
                  {call.summary && (
                    <p className="text-xs text-ink-muted max-w-xs truncate hidden md:block">{call.summary}</p>
                  )}

                  {/* Outcome */}
                  <OutcomeBadge outcome={outcome} status={call.status} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function OutcomeBadge({ outcome, status }: { outcome?: string; status: string }) {
  if (status === 'missed') return <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-500 font-medium shrink-0">Missed</span>
  const map: Record<string, { label: string; class: string }> = {
    booked:           { label: 'Booked',      class: 'bg-brand-50 text-brand-700' },
    transferred:      { label: 'Transferred', class: 'bg-blue-50 text-blue-700' },
    message_taken:    { label: 'Message',     class: 'bg-amber-50 text-amber-700' },
    info_provided:    { label: 'Info given',  class: 'bg-purple-50 text-purple-700' },
    after_hours_lead: { label: 'After hours', class: 'bg-orange-50 text-orange-600' },
    spam:             { label: 'Spam',        class: 'bg-surface-muted text-ink-faint' },
    callback_requested: { label: 'Callback',  class: 'bg-indigo-50 text-indigo-600' },
  }
  const config = outcome ? map[outcome] : null
  if (!config) return <span className="text-xs text-ink-faint shrink-0">—</span>
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${config.class}`}>{config.label}</span>
}
