import { createServerClient } from '@/lib/supabase/server'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Clock, User, Filter } from 'lucide-react'

export default async function BookingsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // MOCK: Fetch real bookings later
  const mockBookings = [
    { id: 1, title: 'Dental Consultation', client: 'Alice Freeman', time: '10:00 AM - 11:00 AM', day: 2, color: 'bg-emerald-100 border-emerald-300 text-emerald-800', top: '25%', height: '10%' },
    { id: 2, title: 'Follow-up Check', client: 'John Doe', time: '01:30 PM - 02:00 PM', day: 4, color: 'bg-blue-100 border-blue-300 text-blue-800', top: '55%', height: '8%' },
    { id: 3, title: 'Emergency Repair', client: 'Mark S.', time: '03:00 PM - 04:30 PM', day: 5, color: 'bg-amber-100 border-amber-300 text-amber-800', top: '70%', height: '15%' },
    { id: 4, title: 'Initial Intake', client: 'Sarah Connor', time: '09:00 AM - 09:30 AM', day: 1, color: 'bg-purple-100 border-purple-300 text-purple-800', top: '15%', height: '5%' }
  ]

  const hours = Array.from({ length: 11 }, (_, i) => i + 8) // 8am to 6pm
  const days = ['Mon 8', 'Tue 9', 'Wed 10', 'Thu 11', 'Fri 12', 'Sat 13', 'Sun 14']

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col animate-fade-in bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Calendar</h1>
          <p className="text-[#64748B] text-[15px] mt-1">Manage your AI-scheduled appointments.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 shadow-sm h-11">
            <button className="px-4 py-1.5 text-sm font-semibold text-[#0F172A] bg-white rounded-lg shadow-sm">Week</button>
            <button className="px-4 py-1.5 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] rounded-lg transition-colors">Month</button>
          </div>
          <button className="flex items-center justify-center gap-2 bg-[#2eb87a] text-white px-5 rounded-xl text-sm font-semibold hover:bg-[#259b66] transition-all shadow-[0_4px_14px_rgba(46,184,122,0.3)]">
            <Plus size={18} strokeWidth={2.5} /> New Booking
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between border border-[#E2E8F0] p-4 rounded-t-2xl border-b-0 bg-[#F8FAFC]">
        <div className="flex items-center gap-4">
          <button className="px-5 py-2 border border-[#E2E8F0] rounded-xl text-[14px] font-semibold text-[#334155] bg-white hover:bg-[#F1F5F9] transition-colors shadow-sm">
            Today
          </button>
          <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-xl p-1 shadow-sm">
            <button className="p-1.5 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] transition-colors"><ChevronLeft size={18} /></button>
            <div className="w-[1px] h-4 bg-[#E2E8F0] mx-1"></div>
            <button className="p-1.5 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] transition-colors"><ChevronRight size={18} /></button>
          </div>
          <span className="text-[19px] font-bold text-[#0F172A] ml-2">April 2024</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#E2E8F0] rounded-xl font-medium text-[#64748B] text-sm transition-colors cursor-pointer">
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-b-2xl overflow-hidden flex flex-col shadow-sm">
        
        {/* Day Headers */}
        <div className="grid grid-cols-8 border-b border-[#E2E8F0]">
          <div className="col-span-1 border-r border-[#E2E8F0] p-3 text-[11px] font-bold text-[#94A3B8] text-center uppercase tracking-wider flex items-center justify-center bg-[#F8FAFC]">
            GMT-4
          </div>
          {days.map((day, i) => {
            const isToday = i === 2 // Mock today
            const [name, num] = day.split(' ')
            return (
              <div key={day} className={`col-span-1 border-r border-[#E2E8F0] last:border-0 p-3 pt-4 text-center ${isToday ? 'bg-[#F0FDF4]' : 'bg-white'}`}>
                <div className={`text-[13px] font-semibold mb-2 uppercase tracking-wide ${isToday ? 'text-[#2eb87a]' : 'text-[#64748B]'}`}>{name}</div>
                <div className={`text-2xl font-bold mx-auto w-12 h-12 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-[#2eb87a] text-white shadow-md' : 'text-[#0F172A]'}`}>
                  {num}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time Grid with Scroll */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="relative min-h-[1000px]">
            {/* Horizontal Lines */}
            <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
              <div className="col-span-1 border-r border-[#E2E8F0] flex flex-col bg-[#F8FAFC]">
                {hours.map(h => (
                  <div key={h} className="h-24 border-b border-[#E2E8F0] relative">
                    <span className="absolute -top-[10px] right-3 text-[12px] font-semibold text-[#64748B]">
                      {h > 12 ? `${h-12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Vertical Grid Columns */}
              {Array.from({length: 7}).map((_, i) => (
                <div key={i} className={`col-span-1 border-r border-[#E2E8F0] last:border-0 flex flex-col ${i === 2 ? 'bg-[#F0FDF4] bg-opacity-30' : ''}`}>
                  {hours.map(h => (
                    <div key={h} className="h-24 border-b border-[#F1F5F9] relative group">
                       <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-[#F1F5F9]"></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Bookings Overlay */}
            <div className="absolute inset-0 grid grid-cols-8 px-1 pointer-events-none">
              <div className="col-span-1" /> {/* Offset for Time column */}
              
              {Array.from({length: 7}).map((_, colIdx) => (
                <div key={colIdx} className="col-span-1 relative pointer-events-auto h-full">
                  {mockBookings.filter(b => b.day === colIdx).map(booking => {
                    return (
                      <div 
                        key={booking.id}
                        className={`absolute left-1 right-1 rounded-xl border p-3 shadow-sm flex flex-col gap-1 cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md ${booking.color}`}
                        style={{ top: booking.top, height: booking.height, zIndex: 10 }}
                      >
                        <div className="text-[13px] font-bold leading-tight">{booking.title}</div>
                        <div className="text-[11px] font-medium opacity-80 mt-auto">{booking.time}</div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Current Time Line Indicator Map */}
            <div className="absolute left-0 right-0 border-t-2 border-[#ef4444] z-20 pointer-events-none" style={{ top: '35%' }}>
              <div className="absolute left-[12.5%] -top-[5px] w-2.5 h-2.5 bg-[#ef4444] rounded-full" />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
