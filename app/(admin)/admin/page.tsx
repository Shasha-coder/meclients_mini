import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle, Clock, AlertCircle, Users, Phone } from 'lucide-react'
import { format } from 'date-fns'

export default async function AdminPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check admin
  const { data: admin } = await supabase.from('admin_users').select('role').eq('id', user.id).single()
  if (!admin) redirect('/dashboard')

  // Fetch data
  const [{ data: pendingAgents }, { data: tenants }, { data: failedJobs }] = await Promise.all([
    supabase.from('retell_agents').select('*, tenants(business_name, industry)').eq('status', 'pending_review').order('created_at'),
    supabase.from('tenants').select('*, business_profiles(industry), retell_agents(status), phone_numbers(number)').order('created_at', { ascending: false }).limit(20),
    supabase.from('provisioning_jobs').select('*, tenants(business_name)').eq('status', 'failed').order('created_at', { ascending: false }).limit(10),
  ])

  async function approveAgent(agentId: string) {
    'use server'
    const sb = createServerClient()
    await sb.from('retell_agents').update({ status: 'live', approved_at: new Date().toISOString(), went_live_at: new Date().toISOString() }).eq('id', agentId)
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Admin</h1>
            <p className="text-sm text-ink-muted mt-0.5">meclients control panel · {admin.role}</p>
          </div>
          <div className="flex gap-3">
            {pendingAgents && pendingAgents.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm px-3 py-1.5 rounded-xl border border-amber-200">
                <Clock size={14} /> {pendingAgents.length} pending review
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total tenants', value: tenants?.length ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active agents', value: tenants?.filter(t => t.retell_agents?.[0]?.status === 'live').length ?? 0, icon: CheckCircle, color: 'text-brand-600', bg: 'bg-brand-50' },
            { label: 'Pending review', value: pendingAgents?.length ?? 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Failed jobs', value: failedJobs?.length ?? 0, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-surface-border p-5 shadow-card">
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon size={15} className={s.color} />
              </div>
              <p className="text-2xl font-semibold text-ink">{s.value}</p>
              <p className="text-xs text-ink-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pending agent review */}
        {pendingAgents && pendingAgents.length > 0 && (
          <div className="bg-white rounded-2xl border border-surface-border shadow-card mb-6">
            <div className="px-6 py-4 border-b border-surface-border flex items-center gap-2">
              <Clock size={15} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-ink">Agents pending review</h2>
            </div>
            <div className="divide-y divide-surface-border">
              {pendingAgents.map((agent: any) => (
                <div key={agent.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-ink">{agent.tenants?.business_name}</p>
                      <span className="text-xs text-ink-faint bg-surface-muted px-2 py-0.5 rounded-full capitalize">{agent.tenants?.industry}</span>
                    </div>
                    <p className="text-xs text-ink-muted mb-3 line-clamp-3">{agent.current_prompt?.slice(0, 200)}...</p>
                    <div className="bg-surface-muted rounded-xl p-3 text-xs text-ink-muted font-mono leading-relaxed max-h-32 overflow-y-auto">
                      {agent.current_prompt}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <form action={approveAgent.bind(null, agent.id)}>
                      <button type="submit" className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
                        <CheckCircle size={14} /> Approve & go live
                      </button>
                    </form>
                    <button className="flex items-center gap-2 border border-surface-border text-ink-muted hover:bg-surface-muted px-4 py-2 rounded-xl text-sm transition-colors">
                      Edit prompt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All tenants */}
        <div className="bg-white rounded-2xl border border-surface-border shadow-card mb-6">
          <div className="px-6 py-4 border-b border-surface-border flex items-center gap-2">
            <Users size={15} className="text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink">All tenants</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Business', 'Industry', 'Status', 'Phone', 'Joined'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-ink-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {tenants?.map((t: any) => (
                  <tr key={t.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-ink">{t.business_name}</td>
                    <td className="px-6 py-3 text-ink-muted capitalize">{t.business_profiles?.[0]?.industry || '—'}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-3 text-ink-muted font-mono text-xs">{t.phone_numbers?.[0]?.number || '—'}</td>
                    <td className="px-6 py-3 text-ink-muted text-xs">{format(new Date(t.created_at), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Failed jobs */}
        {failedJobs && failedJobs.length > 0 && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-card">
            <div className="px-6 py-4 border-b border-red-100 flex items-center gap-2">
              <AlertCircle size={15} className="text-red-500" />
              <h2 className="text-sm font-semibold text-ink">Failed provisioning jobs</h2>
            </div>
            <div className="divide-y divide-surface-border">
              {failedJobs.map((job: any) => (
                <div key={job.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{job.tenants?.business_name}</p>
                    <p className="text-xs text-ink-muted mt-0.5">Step: <span className="font-mono">{job.step}</span></p>
                    {job.error && <p className="text-xs text-red-500 mt-1">{job.error}</p>}
                  </div>
                  <button className="text-xs bg-surface-muted hover:bg-surface-border px-3 py-1.5 rounded-xl text-ink-muted transition-colors">
                    Retry
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-brand-50 text-brand-700',
    trial: 'bg-blue-50 text-blue-600',
    past_due: 'bg-amber-50 text-amber-700',
    suspended: 'bg-red-50 text-red-600',
    cancelled: 'bg-surface-muted text-ink-faint',
  }
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${map[status] ?? 'bg-surface-muted text-ink-muted'}`}>{status}</span>
}
