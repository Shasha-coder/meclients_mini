import { createServerClient } from '@/lib/supabase/server'
import { Phone, Calendar, TrendingUp, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tenant } = await supabase.from('tenants').select('id, business_name').eq('owner_id', user!.id).single()

  // Stats
  const today = new Date().toISOString().split('T')[0]
  const [{ count: totalCalls }, { count: todayBookings }, { data: recentCalls }] = await Promise.all([
    supabase.from('calls').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant!.id),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant!.id).gte('start_time', today),
    supabase.from('calls').select('*, call_outcomes(outcome)').eq('tenant_id', tenant!.id).order('created_at', { ascending: false }).limit(5),
  ])

  const { data: outcomes } = await supabase
    .from('call_outcomes')
    .select('outcome')
    .eq('tenant_id', tenant!.id)

  const bookings = outcomes?.filter(o => o.outcome === 'booked').length ?? 0
  const estimatedRevenue = bookings * 150 // avg booking value

  const stats = [
    { label: 'Total calls handled', value: totalCalls ?? 0, icon: Phone, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: "Today's bookings", value: todayBookings ?? 0, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Bookings from calls', value: bookings, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Est. revenue generated', value: `$${estimatedRevenue}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">Good morning 👋</h1>
        <p className="text-ink-muted text-sm mt-1">Here's what your agent handled while you were away.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-surface-border p-5 shadow-card">
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <p className="text-2xl font-semibold text-ink">{stat.value}</p>
            <p className="text-xs text-ink-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent calls */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-ink">Recent calls</h2>
          <a href="/calls" className="text-xs text-brand-600 hover:text-brand-700">View all →</a>
        </div>

        {recentCalls?.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Phone size={28} className="text-ink-faint mx-auto mb-3" />
            <p className="text-sm text-ink-muted">No calls yet. Your agent is standing by.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {recentCalls?.map(call => {
              const outcome = call.call_outcomes?.[0]?.outcome
              return (
                <div key={call.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-surface-muted flex items-center justify-center">
                      <Phone size={14} className="text-ink-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{call.caller_phone || 'Unknown caller'}</p>
                      <p className="text-xs text-ink-faint">
                        {call.started_at ? format(new Date(call.started_at), 'MMM d, h:mm a') : '—'}
                        {call.duration_secs ? ` · ${Math.floor(call.duration_secs / 60)}m ${call.duration_secs % 60}s` : ''}
                      </p>
                    </div>
                  </div>
                  <OutcomeBadge outcome={outcome} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function OutcomeBadge({ outcome }: { outcome?: string }) {
  const map: Record<string, { label: string; class: string }> = {
    booked: { label: 'Booked', class: 'bg-brand-50 text-brand-700' },
    transferred: { label: 'Transferred', class: 'bg-blue-50 text-blue-700' },
    message_taken: { label: 'Message', class: 'bg-amber-50 text-amber-700' },
    info_provided: { label: 'Info given', class: 'bg-purple-50 text-purple-700' },
    missed: { label: 'Missed', class: 'bg-red-50 text-red-600' },
    spam: { label: 'Spam', class: 'bg-surface-muted text-ink-faint' },
  }
  const config = outcome ? map[outcome] : null
  if (!config) return <span className="text-xs text-ink-faint">—</span>
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.class}`}>{config.label}</span>
}
