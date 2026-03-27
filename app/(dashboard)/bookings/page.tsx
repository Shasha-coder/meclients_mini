'use client'
import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, Phone } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8) // 8am to 6pm

type Booking = {
  id: string
  caller_name: string | null
  caller_phone: string | null
  start_time: string
  end_time: string
  status: string
  service_types: { name: string; duration_mins: number } | null
  notes: string | null
}

export default function BookingsPage() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selected, setSelected] = useState<Booking | null>(null)
  const supabase = createBrowserClient()

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    fetchBookings()
  }, [weekStart])

  async function fetchBookings() {
    const from = weekStart.toISOString()
    const to = addDays(weekStart, 7).toISOString()
    const { data } = await supabase
      .from('bookings')
      .select('*, service_types(name, duration_mins)')
      .gte('start_time', from)
      .lt('start_time', to)
      .order('start_time')
    setBookings(data ?? [])
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('bookings').update({ status }).eq('id', id)
    await fetchBookings()
    setSelected(null)
  }

  const today = new Date()

  return (
    <div className="max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Bookings</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''} this week
          </p>
        </div>
        <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus size={15} /> Add manually
        </button>
      </div>

      {/* Week nav */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setWeekStart(d => addDays(d, -7))} className="p-2 rounded-xl border border-surface-border hover:bg-surface-muted transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-ink">
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </span>
        <button onClick={() => setWeekStart(d => addDays(d, 7))} className="p-2 rounded-xl border border-surface-border hover:bg-surface-muted transition-colors">
          <ChevronRight size={16} />
        </button>
        <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-xs text-brand-600 hover:text-brand-700 px-3 py-1.5 border border-brand-200 rounded-xl transition-colors ml-2">
          Today
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-surface-border">
          <div className="py-3 px-3 text-xs text-ink-faint" />
          {weekDays.map(day => (
            <div key={day.toISOString()} className={`py-3 text-center border-l border-surface-border ${isSameDay(day, today) ? 'bg-brand-50' : ''}`}>
              <p className="text-xs text-ink-faint">{format(day, 'EEE')}</p>
              <p className={`text-sm font-semibold mt-0.5 ${isSameDay(day, today) ? 'text-brand-600' : 'text-ink'}`}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="max-h-[520px] overflow-y-auto">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-surface-border last:border-0 min-h-[52px]">
              <div className="py-2 px-3 text-xs text-ink-faint text-right pr-3 pt-2.5">
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>
              {weekDays.map(day => {
                const dayBookings = bookings.filter(b => {
                  const t = parseISO(b.start_time)
                  return isSameDay(t, day) && t.getHours() === hour
                })
                return (
                  <div key={day.toISOString()} className={`border-l border-surface-border p-1 ${isSameDay(day, today) ? 'bg-brand-50/40' : ''}`}>
                    {dayBookings.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelected(b)}
                        className={`w-full text-left rounded-lg px-2 py-1.5 text-xs font-medium mb-1 transition-colors ${
                          b.status === 'confirmed' ? 'bg-brand-100 text-brand-800 hover:bg-brand-200' :
                          b.status === 'cancelled' ? 'bg-red-50 text-red-500 line-through' :
                          'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        <p className="truncate">{b.caller_name || 'Unknown'}</p>
                        <p className="text-xs font-normal opacity-70">{b.service_types?.name}</p>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Booking detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl shadow-lifted border border-surface-border p-6 w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-ink">Booking details</h3>
              <StatusBadge status={selected.status} />
            </div>

            <div className="space-y-3 mb-6">
              <Row icon={<User size={14} />} label="Name" value={selected.caller_name || 'Unknown'} />
              <Row icon={<Phone size={14} />} label="Phone" value={selected.caller_phone || '—'} />
              <Row icon={<Calendar size={14} />} label="Date" value={format(parseISO(selected.start_time), 'EEE, MMM d yyyy')} />
              <Row icon={<Clock size={14} />} label="Time" value={`${format(parseISO(selected.start_time), 'h:mm a')} – ${format(parseISO(selected.end_time), 'h:mm a')}`} />
              {selected.service_types && <Row icon={<Calendar size={14} />} label="Service" value={selected.service_types.name} />}
              {selected.notes && <Row icon={<Calendar size={14} />} label="Notes" value={selected.notes} />}
            </div>

            <div className="flex gap-2">
              {selected.status !== 'confirmed' && (
                <button onClick={() => updateStatus(selected.id, 'confirmed')} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Confirm
                </button>
              )}
              {selected.status !== 'cancelled' && (
                <button onClick={() => updateStatus(selected.id, 'cancelled')} className="flex-1 border border-surface-border text-ink-muted hover:bg-surface-muted py-2.5 rounded-xl text-sm transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-ink-faint mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-ink-faint">{label}</p>
        <p className="text-sm text-ink">{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'bg-brand-50 text-brand-700',
    pending: 'bg-amber-50 text-amber-700',
    cancelled: 'bg-red-50 text-red-600',
    completed: 'bg-surface-muted text-ink-muted',
  }
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${map[status] ?? 'bg-surface-muted text-ink-muted'}`}>{status}</span>
}
