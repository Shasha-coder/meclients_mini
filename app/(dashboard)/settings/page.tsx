'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Save, Plus, Trash2, Loader2 } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type Schedule = { id?: string; day_of_week: number; is_open: boolean; open_time: string; close_time: string }
type ServiceType = { id?: string; name: string; duration_mins: number; buffer_mins: number; is_active: boolean }

export default function SettingsPage() {
  const supabase = createBrowserClient()
  const [tenantId, setTenantId] = useState<string>('')
  const [profile, setProfile] = useState<any>({})
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [services, setServices] = useState<ServiceType[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user!.id).single()
    if (!tenant) return
    setTenantId(tenant.id)

    const [{ data: bp }, { data: sched }, { data: svcs }] = await Promise.all([
      supabase.from('business_profiles').select('*').eq('tenant_id', tenant.id).single(),
      supabase.from('availability_schedules').select('*').eq('tenant_id', tenant.id).order('day_of_week'),
      supabase.from('service_types').select('*').eq('tenant_id', tenant.id).order('created_at'),
    ])

    setProfile(bp ?? {})

    // Fill missing days
    const filled = Array.from({ length: 7 }, (_, i) => {
      const existing = sched?.find(s => s.day_of_week === i)
      return existing ?? { day_of_week: i, is_open: i >= 1 && i <= 5, open_time: '09:00', close_time: '17:00' }
    })
    setSchedules(filled)
    setServices(svcs ?? [])
  }

  async function save() {
    setSaving(true)
    try {
      // Save profile
      await supabase.from('business_profiles').upsert({ ...profile, tenant_id: tenantId })

      // Save schedules
      for (const s of schedules) {
        await supabase.from('availability_schedules').upsert(
          { ...s, tenant_id: tenantId },
          { onConflict: 'tenant_id,day_of_week' }
        )
      }

      // Save services
      for (const svc of services) {
        if (svc.id) {
          await supabase.from('service_types').update(svc).eq('id', svc.id)
        } else {
          await supabase.from('service_types').insert({ ...svc, tenant_id: tenantId })
        }
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  function updateSchedule(i: number, field: keyof Schedule, value: any) {
    setSchedules(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function addService() {
    setServices(prev => [...prev, { name: '', duration_mins: 30, buffer_mins: 10, is_active: true }])
  }

  function updateService(i: number, field: keyof ServiceType, value: any) {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  function removeService(i: number) {
    setServices(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Settings</h1>
          <p className="text-sm text-ink-muted mt-0.5">Manage your agent's knowledge and availability</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>

      {/* Business basics */}
      <Section title="Business info" desc="Your agent uses this to answer caller questions.">
        <Field label="Business name" value={profile.phone ?? ''} onChange={v => setProfile((p: any) => ({ ...p, phone: v }))} />
        <Field label="Your existing phone (for forwarding instructions)" value={profile.phone ?? ''} onChange={v => setProfile((p: any) => ({ ...p, phone: v }))} placeholder="+1 (555) 000-0000" />
        <Field label="Urgent call transfer number" value={profile.escalation_phone ?? ''} onChange={v => setProfile((p: any) => ({ ...p, escalation_phone: v }))} placeholder="+1 (555) 000-0000" />
        <Field label="Timezone" value={profile.timezone ?? 'UTC'} onChange={v => setProfile((p: any) => ({ ...p, timezone: v }))} placeholder="America/New_York" />
      </Section>

      {/* Business hours */}
      <Section title="Business hours" desc="When your agent says you're open or closed.">
        <div className="space-y-2">
          {schedules.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8">
                <input type="checkbox" checked={s.is_open} onChange={e => updateSchedule(i, 'is_open', e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-500" />
              </div>
              <span className="text-sm text-ink w-24">{DAYS[s.day_of_week]}</span>
              {s.is_open ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" value={s.open_time} onChange={e => updateSchedule(i, 'open_time', e.target.value)}
                    className="border border-surface-border rounded-xl px-3 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-300" />
                  <span className="text-xs text-ink-faint">to</span>
                  <input type="time" value={s.close_time} onChange={e => updateSchedule(i, 'close_time', e.target.value)}
                    className="border border-surface-border rounded-xl px-3 py-1.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
              ) : (
                <span className="text-sm text-ink-faint">Closed</span>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Service types */}
      <Section title="Services & booking slots" desc="What callers can book and how long each takes.">
        <div className="space-y-3">
          {services.map((svc, i) => (
            <div key={i} className="flex items-center gap-3 bg-surface-muted rounded-2xl p-3">
              <input type="text" value={svc.name} onChange={e => updateService(i, 'name', e.target.value)}
                placeholder="Service name (e.g. Consultation)"
                className="flex-1 bg-white border border-surface-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-300" />
              <div className="flex items-center gap-1">
                <input type="number" value={svc.duration_mins} onChange={e => updateService(i, 'duration_mins', parseInt(e.target.value))}
                  className="w-16 border border-surface-border rounded-xl px-2 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-brand-300 bg-white" />
                <span className="text-xs text-ink-faint">min</span>
              </div>
              <button onClick={() => removeService(i)} className="text-ink-faint hover:text-red-400 transition-colors p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={addService}
            className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 transition-colors py-1">
            <Plus size={15} /> Add service
          </button>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-card p-6 mb-5">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="text-xs text-ink-muted mt-0.5">{desc}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-muted uppercase tracking-wide block mb-1.5">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-surface-border rounded-2xl px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-300 transition" />
    </div>
  )
}
